// Edge creation and editing functionality
import * as THREE from 'three';
import { sceneManager } from './scene.js';
import { graphRenderer } from './graph-renderer.js';
import { apiClient } from './api-client.js';
import { nodeManager } from './node-manager.js';

let edgeCreationMode = false;
let firstSelectedNodeId = null;
let currentGraphId = null;
let edgeIdCounter = 1;

/**
 * Initialize edge manager
 */
function init() {
    // Edge creation is handled through node selection
}

/**
 * Set the current graph ID for API calls
 */
function setCurrentGraphId(graphId) {
    currentGraphId = graphId;
}

/**
 * Get the current graph ID
 */
function getCurrentGraphId() {
    return currentGraphId;
}

/**
 * Enable edge creation mode
 */
function enableEdgeCreationMode() {
    edgeCreationMode = true;
    firstSelectedNodeId = null;
    
    const canvas = sceneManager.getRenderer()?.domElement;
    if (canvas) {
        canvas.style.cursor = 'crosshair';
    }
    
    const addEdgeBtn = document.getElementById('add-edge-btn');
    if (addEdgeBtn) {
        addEdgeBtn.classList.add('active');
    }
}

/**
 * Disable edge creation mode
 */
function disableEdgeCreationMode() {
    edgeCreationMode = false;
    firstSelectedNodeId = null;
    
    const canvas = sceneManager.getRenderer()?.domElement;
    if (canvas) {
        canvas.style.cursor = 'grab';
    }
    
    const addEdgeBtn = document.getElementById('add-edge-btn');
    if (addEdgeBtn) {
        addEdgeBtn.classList.remove('active');
    }
}

/**
 * Toggle edge creation mode
 */
function toggleEdgeCreationMode() {
    if (edgeCreationMode) {
        disableEdgeCreationMode();
    } else {
        enableEdgeCreationMode();
    }
}

/**
 * Handle node selection for edge creation
 */
async function handleNodeSelectionForEdge(nodeId) {
    if (!edgeCreationMode) return;

    if (!firstSelectedNodeId) {
        firstSelectedNodeId = nodeId;
        const nodeObj = graphRenderer.getNode(nodeId);
        if (nodeObj && nodeObj.mesh) {
            nodeObj.mesh.material.emissive = new THREE.Color(0x00ff00);
        }
    } else {
        if (firstSelectedNodeId === nodeId) {
            resetFirstNode();
            return;
        }
        await createEdge(firstSelectedNodeId, nodeId);
        resetFirstNode();
    }
}

/**
 * Reset first selected node
 */
function resetFirstNode() {
    if (firstSelectedNodeId) {
        const nodeObj = graphRenderer.getNode(firstSelectedNodeId);
        if (nodeObj && nodeObj.mesh) {
            const selectedId = nodeManager.getSelectedNodeId();
            if (selectedId !== firstSelectedNodeId) {
                nodeObj.mesh.material.emissive = new THREE.Color(0x000000);
            }
        }
    }
    firstSelectedNodeId = null;
}

/**
 * Create an edge between two nodes
 */
async function createEdge(sourceId, targetId) {
    const edges = graphRenderer.getAllEdges();
    for (const [edgeId, edgeObj] of edges.entries()) {
        if ((edgeObj.sourceId === sourceId && edgeObj.targetId === targetId) ||
            (edgeObj.sourceId === targetId && edgeObj.targetId === sourceId && !edgeObj.edgeData?.directed)) {
            return;
        }
    }

    const tempId = `temp_edge_${edgeIdCounter++}`;
    const edgeData = {
        id: tempId,
        source_id: sourceId,
        target_id: targetId,
        weight: 1.0,
        directed: false,
        color: '#95a5a6'
    };

    graphRenderer.addEdge(edgeData);

    if (currentGraphId) {
        try {
            const savedEdge = await apiClient.addEdge(currentGraphId, {
                source_id: sourceId,
                target_id: targetId,
                weight: edgeData.weight,
                directed: edgeData.directed,
                color: edgeData.color
            });

            if (savedEdge && savedEdge.id) {
                const edgeObj = graphRenderer.getAllEdges().get(tempId);
                if (edgeObj && edgeObj.mesh) {
                    edgeObj.mesh.userData.edgeId = savedEdge.id;
                    graphRenderer.getAllEdges().delete(tempId);
                    graphRenderer.getAllEdges().set(savedEdge.id, {
                        mesh: edgeObj.mesh,
                        sourceId: savedEdge.source_id,
                        targetId: savedEdge.target_id,
                        edgeData: savedEdge
                    });
                }
            }
            
            // Trigger auto-save
            if (window.uiController) {
                window.uiController.scheduleAutoSave();
            }
        } catch (error) {
            console.error('Failed to save edge:', error);
        }
    }
}

/**
 * Delete an edge
 */
async function deleteEdge(edgeId) {
    if (typeof edgeId === 'string' && edgeId.startsWith('temp_edge_')) {
        graphRenderer.removeEdge(edgeId);
        return;
    }

    if (currentGraphId) {
        try {
            await apiClient.deleteEdge(edgeId);
        } catch (error) {
            console.error('Failed to delete edge:', error);
        }
    }

    graphRenderer.removeEdge(edgeId);
}

/**
 * Get edge creation mode status
 */
function isEdgeCreationMode() {
    return edgeCreationMode;
}

// Export edge manager API
export const edgeManager = {
    init,
    setCurrentGraphId,
    getCurrentGraphId,
    enableEdgeCreationMode,
    disableEdgeCreationMode,
    toggleEdgeCreationMode,
    handleNodeSelectionForEdge,
    createEdge,
    deleteEdge,
    isEdgeCreationMode
};


