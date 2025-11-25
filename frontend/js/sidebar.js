// Sidebar project management
import { apiClient } from './api-client.js';

let currentProjectId = null;
let projects = [];
let onProjectSelectCallback = null;
let onProjectCreateCallback = null;

/**
 * Initialize sidebar
 */
function init() {
    setupEventListeners();
    loadProjects();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // New Project button
    const newProjectBtn = document.getElementById('new-project-btn');
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', () => {
            createNewProject();
        });
    }

    // Search/filter input (if we add one)
    // For now, we'll add search functionality later
}

/**
 * Load all projects from the backend
 */
async function loadProjects() {
    try {
        projects = await apiClient.getProjects();
        renderProjects();
    } catch (error) {
        console.error('Failed to load projects:', error);
        showError('Failed to load projects');
    }
}

/**
 * Render projects in the sidebar
 */
function renderProjects() {
    const projectList = document.getElementById('project-list');
    if (!projectList) return;

    if (projects.length === 0) {
        projectList.innerHTML = '<div class="empty-state">No projects yet. Click "New Project" to create one.</div>';
        return;
    }

    projectList.innerHTML = projects.map(project => {
        const createdDate = new Date(project.created_at).toLocaleDateString();
        const updatedDate = new Date(project.updated_at).toLocaleDateString();
        const isActive = currentProjectId === project.id;
        
        // Get metadata if available
        const nodeCount = project.graph?.nodes?.length || 0;
        const edgeCount = project.graph?.edges?.length || 0;

        return `
            <div class="project-item ${isActive ? 'active' : ''}" data-project-id="${project.id}">
                <div class="project-item-header">
                    <div class="project-item-name">${escapeHtml(project.name)}</div>
                    <button class="project-delete-btn" data-project-id="${project.id}" title="Delete project">×</button>
                </div>
                <div class="project-item-meta">
                    <div>${nodeCount} nodes, ${edgeCount} edges</div>
                    <div>Updated: ${updatedDate}</div>
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers
    projectList.querySelectorAll('.project-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // Don't trigger if clicking delete button
            if (e.target.classList.contains('project-delete-btn')) {
                return;
            }
            const projectId = parseInt(item.dataset.projectId);
            selectProject(projectId);
        });
    });

    // Add delete button handlers
    projectList.querySelectorAll('.project-delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const projectId = parseInt(btn.dataset.projectId);
            await deleteProject(projectId);
        });
    });
}

/**
 * Create a new project
 */
async function createNewProject() {
    const name = prompt('Enter project name:');
    if (!name || name.trim() === '') {
        return;
    }

    try {
        const newProject = await apiClient.createProject({
            name: name.trim(),
            description: null
        });

        // Reload projects
        await loadProjects();

        // Select the new project
        if (newProject && newProject.id) {
            selectProject(newProject.id);
        }

        // Call callback if set
        if (onProjectCreateCallback) {
            onProjectCreateCallback(newProject);
        }
    } catch (error) {
        console.error('Failed to create project:', error);
        alert('Failed to create project. Please try again.');
    }
}

/**
 * Select a project
 */
async function selectProject(projectId) {
    if (currentProjectId === projectId) {
        return; // Already selected
    }

    try {
        // Load project with graph data
        const project = await apiClient.getProject(projectId);
        
        if (!project) {
            throw new Error('Project not found');
        }

        currentProjectId = projectId;
        renderProjects(); // Update active state

        // Call callback if set
        if (onProjectSelectCallback) {
            onProjectSelectCallback(project);
        }
    } catch (error) {
        console.error('Failed to load project:', error);
        alert('Failed to load project. Please try again.');
    }
}

/**
 * Delete a project
 */
async function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        return;
    }

    try {
        await apiClient.deleteProject(projectId);

        // If deleted project was current, clear selection
        if (currentProjectId === projectId) {
            currentProjectId = null;
        }

        // Reload projects
        await loadProjects();

        // Clear the scene if we deleted the current project
        if (currentProjectId === null && window.graphRenderer) {
            window.graphRenderer.clearGraph();
        }
    } catch (error) {
        console.error('Failed to delete project:', error);
        alert('Failed to delete project. Please try again.');
    }
}

/**
 * Get current project ID
 */
function getCurrentProjectId() {
    return currentProjectId;
}

/**
 * Set callback for when a project is selected
 */
function onProjectSelect(callback) {
    onProjectSelectCallback = callback;
}

/**
 * Set callback for when a project is created
 */
function onProjectCreate(callback) {
    onProjectCreateCallback = callback;
}

/**
 * Refresh projects list
 */
function refresh() {
    loadProjects();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show error message
 */
function showError(message) {
    const projectList = document.getElementById('project-list');
    if (projectList) {
        projectList.innerHTML = `<div class="error-state">${escapeHtml(message)}</div>`;
    }
}

// Export sidebar API
export const sidebar = {
    init,
    loadProjects,
    createNewProject,
    selectProject,
    deleteProject,
    getCurrentProjectId,
    onProjectSelect,
    onProjectCreate,
    refresh
};


