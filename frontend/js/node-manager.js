// Node creation and editing functionality
import * as THREE from 'three';
import { sceneManager } from './scene.js';
import { graphRenderer } from './graph-renderer.js';
import { apiClient } from './api-client.js';
import { edgeManager } from './edge-manager.js';

let selectedNodeId = null;
let isDragging = false;
let dragStartPos = null;
let currentGraphId = null;
let nodeIdCounter = 1; // Temporary ID counter for new nodes before they're saved

// Raycaster for mouse picking
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

/**
 * Initialize node manager
 */
function init() {
    const renderer = sceneManager.getRenderer();
    const camera = sceneManager.getCamera();
    const scene = sceneManager.getScene();
    
    if (!renderer || !camera || !scene) {
        console.error('Scene not initialized');
        return;
    }

    // Mouse events for node interaction
    const canvas = renderer.domElement;
    
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('click', onCanvasClick);
    
    // Prevent context menu on right click
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
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
 * Handle mouse down event
 */
function onMouseDown(event) {
    const renderer = sceneManager.getRenderer();
    const camera = sceneManager.getCamera();
    const scene = sceneManager.getScene();
    
    if (!renderer || !camera || !scene) return;

    // Calculate mouse position in normalized device coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update raycaster
    raycaster.setFromCamera(mouse, camera);

    // Get all nodes
    const nodeObjects = graphRenderer.getAllNodes();
    const intersects = [];

    // Check intersection with all nodes
    nodeObjects.forEach((nodeObj) => {
        if (nodeObj.mesh) {
            const intersect = raycaster.intersectObject(nodeObj.mesh);
            if (intersect.length > 0) {
                intersects.push({
                    object: nodeObj.mesh,
                    nodeId: nodeObj.mesh.userData.nodeId
                });
            }
        }
    });

    if (intersects.length > 0) {
        // Select the first intersected node
        const nodeId = intersects[0].nodeId;
        
        // If in edge creation mode, handle edge creation instead of selection
        if (edgeManager.isEdgeCreationMode()) {
            edgeManager.handleNodeSelectionForEdge(nodeId);
            return;
        }
        
        selectNode(nodeId);
        
        // Start dragging if left mouse button
        if (event.button === 0) {
            isDragging = true;
            dragStartPos = new THREE.Vector3().copy(intersects[0].object.position);
        }
    } else {
        // Deselect if clicking on empty space
        deselectNode();
    }
}

/**
 * Handle mouse move event
 */
function onMouseMove(event) {
    if (!isDragging || !selectedNodeId) return;

    const renderer = sceneManager.getRenderer();
    const camera = sceneManager.getCamera();
    const scene = sceneManager.getScene();
    const controls = sceneManager.getControls();
    
    if (!renderer || !camera || !scene || !controls) return;

    // Disable controls while dragging
    controls.enabled = false;

    // Calculate mouse position
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Create a plane at the node's current Z position
    const nodeObj = graphRenderer.getNode(selectedNodeId);
    if (!nodeObj || !nodeObj.mesh) return;

    const planeZ = nodeObj.mesh.position.z;
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -planeZ);
    
    // Raycast to the plane
    raycaster.setFromCamera(mouse, camera);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);

    // Update node position
    if (intersection) {
        graphRenderer.updateNodePosition(selectedNodeId, intersection.x, intersection.y, intersection.z);
    }
}

/**
 * Handle mouse up event
 */
function onMouseUp(event) {
    if (isDragging && selectedNodeId) {
        isDragging = false;
        
        // Re-enable controls
        const controls = sceneManager.getControls();
        if (controls) {
            controls.enabled = true;
        }

        // Save node position to backend
        saveNodePosition(selectedNodeId);
        
        // Trigger auto-save
        if (window.uiController) {
            window.uiController.scheduleAutoSave();
        }
    }
}

/**
 * Handle canvas click (for adding nodes)
 */
function onCanvasClick(event) {
    // Only handle if not dragging and not clicking on a node
    if (isDragging) return;
    
    // Check if we're in "add node" mode
    const addNodeBtn = document.getElementById('add-node-btn');
    if (!addNodeBtn || !addNodeBtn.classList.contains('active')) {
        return;
    }

    // Don't add node if clicking on existing node (handled by mousedown)
    const renderer = sceneManager.getRenderer();
    const camera = sceneManager.getCamera();
    
    if (!renderer || !camera) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    
    const nodeObjects = graphRenderer.getAllNodes();
    let clickedNode = false;
    
    nodeObjects.forEach((nodeObj) => {
        if (nodeObj.mesh) {
            const intersect = raycaster.intersectObject(nodeObj.mesh);
            if (intersect.length > 0) {
                clickedNode = true;
            }
        }
    });

    if (clickedNode) return;

    // Add node at clicked position
    addNodeAtPosition(mouse, camera);
}

/**
 * Add a node at the specified screen position
 */
async function addNodeAtPosition(mouse, camera) {
    // Create a plane at Z=0 for placing nodes
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    raycaster.setFromCamera(mouse, camera);
    
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);

    if (!intersection) {
        // Fallback: place at a default position
        intersection.set(0, 0, 0);
    }

    // Create temporary node data
    const tempId = `temp_${nodeIdCounter++}`;
    const nodeData = {
        id: tempId,
        label: `Node ${nodeIdCounter - 1}`,
        x: intersection.x,
        y: intersection.y,
        z: intersection.z,
        color: '#3498db',
        size: 1.0
    };

    // Add node to scene immediately
    graphRenderer.addNode(nodeData);
    selectNode(tempId);

    // Save to backend if we have a graph ID
    if (currentGraphId) {
        try {
            const savedNode = await apiClient.addNode(currentGraphId, {
                label: nodeData.label,
                x: nodeData.x,
                y: nodeData.y,
                z: nodeData.z,
                color: nodeData.color,
                size: nodeData.size
            });

            // Update the node with the real ID from backend
            if (savedNode && savedNode.id) {
                const nodeObj = graphRenderer.getNode(tempId);
                if (nodeObj && nodeObj.mesh) {
                    nodeObj.mesh.userData.nodeId = savedNode.id;
                    graphRenderer.getAllNodes().delete(tempId);
                    graphRenderer.getAllNodes().set(savedNode.id, nodeObj);
                }
                selectedNodeId = savedNode.id;
            }
        } catch (error) {
            console.error('Failed to save node:', error);
            // Keep the temporary node for now
        }
    }
}

/**
 * Select a node
 */
function selectNode(nodeId) {
    // Deselect previous node
    if (selectedNodeId && selectedNodeId !== nodeId) {
        deselectNode();
    }

    selectedNodeId = nodeId;
    const nodeObj = graphRenderer.getNode(nodeId);
    
    if (nodeObj && nodeObj.mesh) {
        // Highlight selected node (make it slightly larger and brighter)
        nodeObj.mesh.scale.set(1.2, 1.2, 1.2);
        nodeObj.mesh.material.emissive = new THREE.Color(0x444444);
        
        // Show properties panel
        showNodeProperties(nodeId, nodeObj);
    }
}

/**
 * Deselect current node
 */
function deselectNode() {
    if (selectedNodeId) {
        const nodeObj = graphRenderer.getNode(selectedNodeId);
        if (nodeObj && nodeObj.mesh) {
            // Reset node appearance
            nodeObj.mesh.scale.set(1, 1, 1);
            nodeObj.mesh.material.emissive = new THREE.Color(0x000000);
        }
    }

    selectedNodeId = null;
    hideNodeProperties();
}

/**
 * Delete the selected node
 */
async function deleteSelectedNode() {
    if (!selectedNodeId) return;

    const nodeId = selectedNodeId;
    const nodeObj = graphRenderer.getNode(nodeId);
    
    if (!nodeObj) return;

    // Check if it's a temporary node (not saved yet)
    if (typeof nodeId === 'string' && nodeId.startsWith('temp_')) {
        // Just remove from scene
        graphRenderer.removeNode(nodeId);
        deselectNode();
        return;
    }

    // Delete from backend
    if (currentGraphId) {
        try {
            await apiClient.deleteNode(nodeId);
        } catch (error) {
            console.error('Failed to delete node:', error);
        }
    }

    // Remove from scene (this will also remove connected edges)
    graphRenderer.removeNode(nodeId);
    
    // Also remove edges connected to this node
    const edges = graphRenderer.getAllEdges();
    const edgesToRemove = [];
    
    edges.forEach((edgeObj, edgeId) => {
        if (edgeObj.sourceId === nodeId || edgeObj.targetId === nodeId) {
            edgesToRemove.push(edgeId);
        }
    });

    edgesToRemove.forEach(edgeId => {
        graphRenderer.removeEdge(edgeId);
    });

    deselectNode();
}

/**
 * Save node position to backend
 */
async function saveNodePosition(nodeId) {
    if (!currentGraphId || !nodeId) return;
    
    // Skip temporary nodes
    if (typeof nodeId === 'string' && nodeId.startsWith('temp_')) return;

    const nodeObj = graphRenderer.getNode(nodeId);
    if (!nodeObj || !nodeObj.mesh) return;

    const position = nodeObj.mesh.position;
    
    try {
        // Get current node data
        // Get color as hex string
        const colorHex = '#' + nodeObj.mesh.material.color.getHexString();
        
        const nodeData = {
            label: nodeObj.mesh.userData.label || `Node ${nodeId}`,
            x: position.x,
            y: position.y,
            z: position.z,
            color: colorHex,
            size: nodeObj.mesh.geometry.parameters.radius || 1.0
        };

        await apiClient.updateNode(nodeId, nodeData);
    } catch (error) {
        console.error('Failed to save node position:', error);
    }
}

/**
 * Show node properties panel
 */
function showNodeProperties(nodeId, nodeObj) {
    const panel = document.getElementById('properties-panel');
    if (!panel) return;

    const mesh = nodeObj.mesh;
    const position = mesh.position;
    const color = mesh.material.color;
    const size = mesh.geometry.parameters.radius || 1.0;
    
    // Get label from the label object if available
    let label = `Node ${nodeId}`;
    if (nodeObj.label && nodeObj.label.element) {
        label = nodeObj.label.element.textContent || label;
    }

    // Update panel content
    panel.innerHTML = `
        <h3>Node Properties</h3>
        <div class="property-group">
            <label>Label:</label>
            <input type="text" id="node-label-input" value="${label}" />
        </div>
        <div class="property-group">
            <label>Color:</label>
            <input type="color" id="node-color-input" value="#${color.getHexString()}" />
        </div>
        <div class="property-group">
            <label>Size:</label>
            <input type="number" id="node-size-input" value="${size}" min="0.1" max="5" step="0.1" />
        </div>
        <div class="property-group">
            <label>Position:</label>
            <div class="position-inputs">
                <input type="number" id="node-x-input" value="${position.x.toFixed(2)}" step="0.1" />
                <input type="number" id="node-y-input" value="${position.y.toFixed(2)}" step="0.1" />
                <input type="number" id="node-z-input" value="${position.z.toFixed(2)}" step="0.1" />
            </div>
        </div>
        <button id="delete-node-btn" class="btn btn-danger">Delete Node</button>
    `;

    // Show panel
    panel.style.display = 'block';

    // Add event listeners
    document.getElementById('node-label-input').addEventListener('input', (e) => {
        updateNodeProperty(nodeId, 'label', e.target.value);
    });

    document.getElementById('node-color-input').addEventListener('input', (e) => {
        updateNodeProperty(nodeId, 'color', e.target.value);
    });

    document.getElementById('node-size-input').addEventListener('input', (e) => {
        updateNodeProperty(nodeId, 'size', parseFloat(e.target.value));
    });

    document.getElementById('node-x-input').addEventListener('change', (e) => {
        updateNodeProperty(nodeId, 'x', parseFloat(e.target.value));
    });

    document.getElementById('node-y-input').addEventListener('change', (e) => {
        updateNodeProperty(nodeId, 'y', parseFloat(e.target.value));
    });

    document.getElementById('node-z-input').addEventListener('change', (e) => {
        updateNodeProperty(nodeId, 'z', parseFloat(e.target.value));
    });

    document.getElementById('delete-node-btn').addEventListener('click', () => {
        deleteSelectedNode();
    });
}

/**
 * Hide node properties panel
 */
function hideNodeProperties() {
    const panel = document.getElementById('properties-panel');
    if (panel) {
        panel.style.display = 'none';
        panel.innerHTML = '';
    }
}

/**
 * Update a node property
 */
async function updateNodeProperty(nodeId, property, value) {
    const nodeObj = graphRenderer.getNode(nodeId);
    if (!nodeObj || !nodeObj.mesh) return;

    switch (property) {
        case 'label':
            if (nodeObj.label && nodeObj.label.element) {
                nodeObj.label.element.textContent = value;
            }
            nodeObj.mesh.userData.label = value;
            break;
        case 'color':
            // Handle hex color string (with or without #)
            const hexColor = value.startsWith('#') ? value : `#${value}`;
            nodeObj.mesh.material.color.set(hexColor);
            break;
        case 'size':
            // Recreate geometry with new size
            const oldPos = nodeObj.mesh.position.clone();
            const oldGeometry = nodeObj.mesh.geometry;
            nodeObj.mesh.geometry = new THREE.SphereGeometry(value, 32, 32);
            oldGeometry.dispose();
            nodeObj.mesh.position.copy(oldPos);
            break;
        case 'x':
        case 'y':
        case 'z':
            const pos = nodeObj.mesh.position;
            pos[property] = value;
            graphRenderer.updateNodePosition(nodeId, pos.x, pos.y, pos.z);
            break;
    }

    // Save to backend
    if (currentGraphId && !(typeof nodeId === 'string' && nodeId.startsWith('temp_'))) {
        try {
            const nodeData = {
                label: nodeObj.mesh.userData.label || `Node ${nodeId}`,
                x: nodeObj.mesh.position.x,
                y: nodeObj.mesh.position.y,
                z: nodeObj.mesh.position.z,
                color: `#${nodeObj.mesh.material.color.getHexString()}`,
                size: nodeObj.mesh.geometry.parameters.radius || 1.0
            };
            await apiClient.updateNode(nodeId, nodeData);
            
            // Trigger auto-save
            if (window.uiController) {
                window.uiController.scheduleAutoSave();
            }
        } catch (error) {
            console.error('Failed to update node:', error);
        }
    }
}

/**
 * Get selected node ID
 */
function getSelectedNodeId() {
    return selectedNodeId;
}

// Export node manager API
export const nodeManager = {
    init,
    setCurrentGraphId,
    getCurrentGraphId,
    selectNode,
    deselectNode,
    deleteSelectedNode,
    getSelectedNodeId,
    addNodeAtPosition
};


