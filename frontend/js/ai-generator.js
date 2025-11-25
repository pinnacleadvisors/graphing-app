// AI Graph Generation UI
import { apiClient } from './api-client.js';
import { uiController } from './ui-controller.js';
import { graphRenderer } from './graph-renderer.js';
import { nodeManager } from './node-manager.js';
import { edgeManager } from './edge-manager.js';

/**
 * AI Generator Modal Controller
 */
class AIGenerator {
    constructor() {
        this.modal = null;
        this.currentTab = 'description'; // 'description' or 'code'
        this.init();
    }

    init() {
        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        // Create modal HTML
        const modalHTML = `
            <div id="ai-generator-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Generate Graph with AI</h2>
                        <button class="modal-close" aria-label="Close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="modal-tabs">
                            <button class="modal-tab active" data-tab="description">From Description</button>
                            <button class="modal-tab" data-tab="code">From Code</button>
                        </div>

                        <!-- Description Tab -->
                        <div class="modal-tab-content active" id="tab-description">
                            <label for="graph-description">Describe the graph you want to create:</label>
                            <textarea id="graph-description" placeholder="e.g., Create a social network graph with 10 nodes arranged in a circle"></textarea>
                            <label for="graph-name-desc" style="margin-top: 1rem;">Graph Name (optional):</label>
                            <input type="text" id="graph-name-desc" placeholder="AI Generated Graph">
                            <div class="modal-info">
                                <strong>Note:</strong> If AI service is not configured, you'll receive a prompt that you can use with ChatGPT or Claude.
                            </div>
                            <div class="modal-footer">
                                <button class="btn" id="cancel-desc-btn">Cancel</button>
                                <button class="btn btn-primary" id="generate-desc-btn">Generate</button>
                            </div>
                        </div>

                        <!-- Code Tab -->
                        <div class="modal-tab-content" id="tab-code">
                            <label for="graph-code">Paste Python code here (from ChatGPT/Claude or write your own):</label>
                            <textarea id="graph-code" placeholder="import networkx as nx&#10;import numpy as np&#10;&#10;result = {&#10;    &quot;nodes&quot;: [...],&#10;    &quot;edges&quot;: [...]&#10;}"></textarea>
                            <label for="graph-name-code" style="margin-top: 1rem;">Graph Name (optional):</label>
                            <input type="text" id="graph-name-code" placeholder="AI Generated Graph">
                            <div class="modal-info">
                                <strong>Tip:</strong> Use the template from <a href="/GRAPH_GENERATION_TEMPLATE.md" target="_blank" style="color: #007bff;">GRAPH_GENERATION_TEMPLATE.md</a> to generate code with ChatGPT.
                                <br><br>
                                <strong>Allowed imports:</strong> networkx, numpy, math, random, json
                            </div>
                            <div class="modal-footer">
                                <button class="btn" id="cancel-code-btn">Cancel</button>
                                <button class="btn btn-primary" id="execute-code-btn">Execute Code</button>
                            </div>
                        </div>

                        <!-- Modify Tab (hidden for now, can be added later) -->
                        <div class="modal-tab-content" id="tab-modify" style="display: none;">
                            <label for="modify-instruction">Describe how to modify the current graph:</label>
                            <textarea id="modify-instruction" placeholder="e.g., Apply a spring layout algorithm"></textarea>
                            <div class="modal-footer">
                                <button class="btn" id="cancel-modify-btn">Cancel</button>
                                <button class="btn btn-primary" id="modify-graph-btn">Modify</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Append to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('ai-generator-modal');
    }

    setupEventListeners() {
        // Tab switching
        const tabs = this.modal.querySelectorAll('.modal-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Close button
        const closeBtn = this.modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.hide());

        // Cancel buttons
        this.modal.querySelector('#cancel-desc-btn').addEventListener('click', () => this.hide());
        this.modal.querySelector('#cancel-code-btn').addEventListener('click', () => this.hide());

        // Generate from description
        this.modal.querySelector('#generate-desc-btn').addEventListener('click', () => this.generateFromDescription());

        // Execute code
        this.modal.querySelector('#execute-code-btn').addEventListener('click', () => this.executeCode());

        // Close on background click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.hide();
            }
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        this.modal.querySelectorAll('.modal-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab content
        this.modal.querySelectorAll('.modal-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });

        this.currentTab = tabName;
    }

    show(tab = 'description') {
        this.switchTab(tab);
        this.modal.classList.add('active');
        // Clear any previous messages
        this.clearMessages();
    }

    hide() {
        this.modal.classList.remove('active');
        this.clearMessages();
    }

    clearMessages() {
        const existing = this.modal.querySelectorAll('.modal-error, .modal-success');
        existing.forEach(el => el.remove());
    }

    showMessage(message, type = 'error') {
        this.clearMessages();
        const messageDiv = document.createElement('div');
        messageDiv.className = `modal-${type}`;
        messageDiv.textContent = message;
        this.modal.querySelector('.modal-body').appendChild(messageDiv);
    }

    showLoading(buttonId, isLoading) {
        const button = this.modal.querySelector(`#${buttonId}`);
        if (isLoading) {
            button.disabled = true;
            if (!button.querySelector('.loading')) {
                const loading = document.createElement('span');
                loading.className = 'loading';
                button.appendChild(loading);
            }
        } else {
            button.disabled = false;
            const loading = button.querySelector('.loading');
            if (loading) {
                loading.remove();
            }
        }
    }

    async generateFromDescription() {
        const description = this.modal.querySelector('#graph-description').value.trim();
        const graphName = this.modal.querySelector('#graph-name-desc').value.trim() || 'AI Generated Graph';

        if (!description) {
            this.showMessage('Please enter a description', 'error');
            return;
        }

        this.showLoading('generate-desc-btn', true);
        this.clearMessages();

        try {
            const response = await apiClient.generateGraph(description, graphName);

            if (response.success && response.graph) {
                // Graph was generated successfully
                await this.loadGeneratedGraph(response.graph);
                this.showMessage('Graph generated successfully!', 'success');
                setTimeout(() => {
                    this.hide();
                }, 1500);
            } else if (response.prompt) {
                // AI not configured, show prompt
                this.showPromptDialog(response.prompt, graphName);
            } else {
                this.showMessage(response.error || 'Failed to generate graph', 'error');
            }
        } catch (error) {
            console.error('Error generating graph:', error);
            this.showMessage(`Error: ${error.message}`, 'error');
        } finally {
            this.showLoading('generate-desc-btn', false);
        }
    }

    async executeCode() {
        const code = this.modal.querySelector('#graph-code').value.trim();
        const graphName = this.modal.querySelector('#graph-name-code').value.trim() || 'AI Generated Graph';

        if (!code) {
            this.showMessage('Please enter Python code', 'error');
            return;
        }

        this.showLoading('execute-code-btn', true);
        this.clearMessages();

        try {
            const response = await apiClient.executeCode(code, graphName);

            if (response.success && response.graph) {
                // Graph was generated successfully
                await this.loadGeneratedGraph(response.graph);
                this.showMessage('Code executed successfully!', 'success');
                setTimeout(() => {
                    this.hide();
                }, 1500);
            } else {
                this.showMessage(response.error || 'Failed to execute code', 'error');
            }
        } catch (error) {
            console.error('Error executing code:', error);
            this.showMessage(`Error: ${error.message}`, 'error');
        } finally {
            this.showLoading('execute-code-btn', false);
        }
    }

    showPromptDialog(prompt, graphName) {
        // Create a dialog to show the prompt
        const promptModal = document.createElement('div');
        promptModal.className = 'modal active';
        promptModal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2>AI Service Not Configured</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p>AI service is not configured. Copy the prompt below and use it with ChatGPT or Claude:</p>
                    <textarea readonly style="min-height: 200px; font-family: monospace; font-size: 0.85rem;">${prompt}</textarea>
                    <p style="margin-top: 1rem;">After getting the code, switch to the "From Code" tab and paste it there.</p>
                    <div class="modal-footer">
                        <button class="btn" onclick="this.closest('.modal').remove()">Close</button>
                        <button class="btn btn-primary" onclick="
                            navigator.clipboard.writeText(\`${prompt.replace(/`/g, '\\`')}\`);
                            alert('Prompt copied to clipboard!');
                        ">Copy Prompt</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(promptModal);

        // Close on background click
        promptModal.addEventListener('click', (e) => {
            if (e.target === promptModal) {
                promptModal.remove();
            }
        });
    }

    async loadGeneratedGraph(graphData) {
        // Create a new project for the generated graph
        try {
            // First, create a graph in the backend
            const createdGraph = await apiClient.createGraph({
                name: graphData.name,
                nodes: graphData.nodes,
                edges: graphData.edges
            });

            // Create a project for this graph
            const project = await apiClient.createProject({
                name: graphData.name,
                description: 'AI Generated Graph',
                graph_id: createdGraph.id
            });

            // Load the graph
            await uiController.loadProject(project);

            // Refresh sidebar to show new project
            if (window.sidebar && window.sidebar.refresh) {
                window.sidebar.refresh();
            }
        } catch (error) {
            console.error('Error loading generated graph:', error);
            throw error;
        }
    }

    showModifyDialog() {
        const currentGraphId = uiController.getCurrentGraphId();
        if (!currentGraphId) {
            alert('Please load a graph first before modifying it.');
            return;
        }

        // Create a modify dialog
        const modifyModal = document.createElement('div');
        modifyModal.className = 'modal active';
        modifyModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Modify Graph with AI</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <label for="modify-instruction">Describe how to modify the current graph:</label>
                    <textarea id="modify-instruction" placeholder="e.g., Apply a spring layout algorithm, or add clustering"></textarea>
                    <div class="modal-info">
                        <strong>Note:</strong> If AI service is not configured, you'll receive a prompt that you can use with ChatGPT or Claude.
                    </div>
                    <div class="modal-footer">
                        <button class="btn" id="cancel-modify-btn">Cancel</button>
                        <button class="btn btn-primary" id="execute-modify-btn">Modify</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modifyModal);

        // Setup event listeners
        modifyModal.querySelector('#cancel-modify-btn').addEventListener('click', () => {
            modifyModal.remove();
        });

        modifyModal.querySelector('#execute-modify-btn').addEventListener('click', async () => {
            const instruction = modifyModal.querySelector('#modify-instruction').value.trim();
            if (!instruction) {
                alert('Please enter an instruction');
                return;
            }

            const button = modifyModal.querySelector('#execute-modify-btn');
            button.disabled = true;
            button.textContent = 'Modifying...';

            try {
                const response = await apiClient.modifyGraph(currentGraphId, instruction);

                if (response.success && response.graph) {
                    // Graph was modified successfully
                    await uiController.loadGraph(response.graph.id);
                    modifyModal.remove();
                    alert('Graph modified successfully!');
                } else if (response.prompt) {
                    // AI not configured, show prompt
                    modifyModal.remove();
                    this.showPromptDialog(response.prompt, 'Modified Graph');
                } else {
                    alert(response.error || 'Failed to modify graph');
                    button.disabled = false;
                    button.textContent = 'Modify';
                }
            } catch (error) {
                console.error('Error modifying graph:', error);
                alert(`Error: ${error.message}`);
                button.disabled = false;
                button.textContent = 'Modify';
            }
        });

        // Close on background click
        modifyModal.addEventListener('click', (e) => {
            if (e.target === modifyModal) {
                modifyModal.remove();
            }
        });

        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape' && modifyModal.parentNode) {
                modifyModal.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }
}

// Export singleton instance
export const aiGenerator = new AIGenerator();

