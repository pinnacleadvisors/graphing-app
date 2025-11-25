// UI event handling
import { nodeManager } from './node-manager.js';
import { edgeManager } from './edge-manager.js';
import { graphRenderer } from './graph-renderer.js';
import { apiClient } from './api-client.js';

let currentGraphId = null;
let currentProjectId = null;
let autoSaveTimeout = null;
const AUTO_SAVE_DELAY = 2000; // 2 seconds

/**
 * Initialize UI controller
 */
function init() {
    // Initialize node and edge managers
    nodeManager.init();
    edgeManager.init();

    // Set up button event listeners
    setupButtonListeners();

    // Set up keyboard shortcuts
    setupKeyboardShortcuts();

    console.log('UI controller initialized');
}

/**
 * Set up button event listeners
 */
function setupButtonListeners() {
    // Add Node button
    const addNodeBtn = document.getElementById('add-node-btn');
    if (addNodeBtn) {
        addNodeBtn.addEventListener('click', () => {
            addNodeBtn.classList.toggle('active');
            // Edge mode should be disabled when adding nodes
            if (addNodeBtn.classList.contains('active')) {
                edgeManager.disableEdgeCreationMode();
            }
        });
    }

    // Add Edge button
    const addEdgeBtn = document.getElementById('add-edge-btn');
    if (addEdgeBtn) {
        addEdgeBtn.addEventListener('click', () => {
            edgeManager.toggleEdgeCreationMode();
            // Node mode should be disabled when adding edges
            if (edgeManager.isEdgeCreationMode()) {
                const addNodeBtn = document.getElementById('add-node-btn');
                if (addNodeBtn) {
                    addNodeBtn.classList.remove('active');
                }
            }
        });
    }

    // Save Graph button
    const saveGraphBtn = document.getElementById('save-graph-btn');
    if (saveGraphBtn) {
        saveGraphBtn.addEventListener('click', () => {
            saveGraph();
        });
    }

    // Generate Graph button (for Phase 4)
    const generateGraphBtn = document.getElementById('generate-graph-btn');
    if (generateGraphBtn) {
        generateGraphBtn.addEventListener('click', async () => {
            // Import and show AI generator modal
            const { aiGenerator } = await import('./ai-generator.js');
            aiGenerator.show('description');
        });
    }

    // Modify Graph button (for Phase 4)
    const modifyGraphBtn = document.getElementById('modify-graph-btn');
    if (modifyGraphBtn) {
        modifyGraphBtn.addEventListener('click', async () => {
            if (!currentGraphId) {
                alert('Please load a graph first before modifying it.');
                return;
            }
            // Import and show AI generator modal for modification
            const { aiGenerator } = await import('./ai-generator.js');
            aiGenerator.showModifyDialog();
        });
    }
}

/**
 * Set up keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        // Delete key - delete selected node or edge
        if (event.key === 'Delete' || event.key === 'Backspace') {
            if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
                const selectedNodeId = nodeManager.getSelectedNodeId();
                if (selectedNodeId) {
                    nodeManager.deleteSelectedNode();
                }
            }
        }

        // Escape key - cancel edge creation mode
        if (event.key === 'Escape') {
            edgeManager.disableEdgeCreationMode();
            const addNodeBtn = document.getElementById('add-node-btn');
            if (addNodeBtn) {
                addNodeBtn.classList.remove('active');
            }
        }
    });
}

/**
 * Load a project (which includes its graph)
 */
async function loadProject(project) {
    if (!project) return;

    try {
        currentProjectId = project.id;
        
        // If project has a graph, load it
        if (project.graph && project.graph.id) {
            await loadGraph(project.graph.id);
        } else {
            // Project exists but has no graph yet - clear the scene
            currentGraphId = null;
            nodeManager.setCurrentGraphId(null);
            edgeManager.setCurrentGraphId(null);
            graphRenderer.clearGraph();
        }
        
        console.log(`Loaded project: ${project.name}`);
        return project;
    } catch (error) {
        console.error('Failed to load project:', error);
        throw error;
    }
}

/**
 * Load a graph from the backend
 */
async function loadGraph(graphId) {
    if (!graphId) return;

    try {
        const graphData = await apiClient.getGraph(graphId);
        
        if (graphData) {
            // Set current graph ID
            currentGraphId = graphId;
            nodeManager.setCurrentGraphId(graphId);
            edgeManager.setCurrentGraphId(graphId);

            // Render the graph
            graphRenderer.renderGraph(graphData);
            
            console.log(`Loaded graph: ${graphData.name}`);
            return graphData;
        }
    } catch (error) {
        console.error('Failed to load graph:', error);
        throw error;
    }
}

/**
 * Save the current graph
 */
async function saveGraph() {
    if (!currentGraphId) {
        console.log('No graph loaded. Create a new graph first.');
        return;
    }

    try {
        // Collect current graph state
        const nodes = [];
        const edges = [];

        // Get all nodes
        const nodeObjects = graphRenderer.getAllNodes();
        nodeObjects.forEach((nodeObj, nodeId) => {
            if (nodeObj.mesh) {
                const pos = nodeObj.mesh.position;
                let label = `Node ${nodeId}`;
                if (nodeObj.label && nodeObj.label.element) {
                    label = nodeObj.label.element.textContent || label;
                }

                nodes.push({
                    id: nodeId,
                    label: label,
                    x: pos.x,
                    y: pos.y,
                    z: pos.z,
                    color: `#${nodeObj.mesh.material.color.getHexString()}`,
                    size: nodeObj.mesh.geometry.parameters.radius || 1.0
                });
            }
        });

        // Get all edges
        const edgeObjects = graphRenderer.getAllEdges();
        edgeObjects.forEach((edgeObj, edgeId) => {
            edges.push({
                id: edgeId,
                source_id: edgeObj.sourceId,
                target_id: edgeObj.targetId,
                weight: edgeObj.edgeData?.weight || 1.0,
                directed: edgeObj.edgeData?.directed || false,
                color: edgeObj.edgeData?.color || '#95a5a6'
            });
        });

        // Update graph in backend
        const graphData = {
            name: `Graph ${currentGraphId}`, // You might want to get this from somewhere
            nodes: nodes,
            edges: edges
        };

        await apiClient.updateGraph(currentGraphId, graphData);
        console.log('Graph saved successfully');
    } catch (error) {
        console.error('Failed to save graph:', error);
        throw error;
    }
}

/**
 * Create a new project (which will create a graph automatically)
 */
async function createNewProject(projectData) {
    try {
        // Projects are created via the sidebar, so this is mainly for internal use
        // The sidebar handles project creation
        console.log('Project creation handled by sidebar');
    } catch (error) {
        console.error('Failed to create project:', error);
        throw error;
    }
}

/**
 * Create a new graph (legacy - now projects handle this)
 */
async function createNewGraph(name = 'New Graph') {
    try {
        const graphData = {
            name: name,
            nodes: [],
            edges: []
        };

        const newGraph = await apiClient.createGraph(graphData);
        
        if (newGraph && newGraph.id) {
            currentGraphId = newGraph.id;
            nodeManager.setCurrentGraphId(newGraph.id);
            edgeManager.setCurrentGraphId(newGraph.id);
            
            // Clear current scene
            graphRenderer.clearGraph();
            
            console.log(`Created new graph: ${newGraph.name}`);
            return newGraph;
        }
    } catch (error) {
        console.error('Failed to create graph:', error);
        throw error;
    }
}

/**
 * Auto-save the graph after a delay
 */
function scheduleAutoSave() {
    // Clear existing timeout
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }

    // Schedule new save
    autoSaveTimeout = setTimeout(() => {
        if (currentGraphId) {
            saveGraph().catch(error => {
                console.error('Auto-save failed:', error);
            });
        }
    }, AUTO_SAVE_DELAY);
}

/**
 * Handle node selection (called from node manager)
 */
function onNodeSelected(nodeId) {
    // If in edge creation mode, handle edge creation
    if (edgeManager.isEdgeCreationMode()) {
        edgeManager.handleNodeSelectionForEdge(nodeId);
    }
}

/**
 * Get current graph ID
 */
function getCurrentGraphId() {
    return currentGraphId;
}

/**
 * Get current project ID
 */
function getCurrentProjectId() {
    return currentProjectId;
}

// Export UI controller API
export const uiController = {
    init,
    loadProject,
    loadGraph,
    saveGraph,
    createNewProject,
    createNewGraph,
    scheduleAutoSave,
    onNodeSelected,
    getCurrentGraphId,
    getCurrentProjectId
};


