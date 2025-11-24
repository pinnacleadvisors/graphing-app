// Graph rendering logic for Three.js
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { sceneManager } from './scene.js';

// Store graph objects for management
const nodeObjects = new Map(); // Map<nodeId, {mesh, label}>
const edgeObjects = new Map(); // Map<edgeId, {mesh, sourceId, targetId, edgeData}>
let labelRenderer = null;
let labelContainer = null;

// Default materials
const defaultNodeMaterial = new THREE.MeshStandardMaterial({
    color: 0x3498db,
    metalness: 0.3,
    roughness: 0.7
});

const defaultEdgeMaterial = new THREE.MeshStandardMaterial({
    color: 0x95a5a6,
    metalness: 0.2,
    roughness: 0.8
});

/**
 * Initialize the label renderer for node labels
 */
function initLabelRenderer() {
    const container = document.getElementById('canvas-container');
    if (!container) {
        console.error('Canvas container not found for label renderer');
        return;
    }

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(container.clientWidth, container.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    labelContainer = container;
    container.appendChild(labelRenderer.domElement);

    // Update label renderer on window resize
    window.addEventListener('resize', () => {
        if (labelRenderer && container) {
            labelRenderer.setSize(container.clientWidth, container.clientHeight);
        }
    });
}

/**
 * Create a 3D node (sphere or cube) at the specified position
 * @param {Object} nodeData - Node data with id, label, x, y, z, color, size
 * @returns {Object} - Object containing mesh and label
 */
function createNode(nodeData) {
    const { id, label, x, y, z, color = '#3498db', size = 1.0 } = nodeData;

    // Create geometry (sphere by default, can be changed to cube)
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    
    // Create material with node color
    const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        metalness: 0.3,
        roughness: 0.7
    });

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.userData.nodeId = id;
    mesh.userData.isNode = true;

    // Create label
    const labelElement = document.createElement('div');
    labelElement.className = 'node-label';
    labelElement.textContent = label || `Node ${id}`;
    labelElement.style.color = '#ffffff';
    labelElement.style.fontSize = '12px';
    labelElement.style.fontFamily = 'Arial, sans-serif';
    labelElement.style.padding = '2px 6px';
    labelElement.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    labelElement.style.borderRadius = '4px';
    labelElement.style.pointerEvents = 'none';
    labelElement.style.whiteSpace = 'nowrap';
    labelElement.style.userSelect = 'none';

    const labelObject = new CSS2DObject(labelElement);
    labelObject.position.set(0, size + 0.5, 0); // Position label above node
    mesh.add(labelObject);

    return { mesh, label: labelObject };
}

/**
 * Create a cylinder edge between two nodes
 * @param {Object} edgeData - Edge data with id, source_id, target_id, color, weight
 * @param {THREE.Mesh} sourceNode - Source node mesh
 * @param {THREE.Mesh} targetNode - Target node mesh
 * @returns {THREE.Mesh} - Edge mesh
 */
function createEdge(edgeData, sourceNode, targetNode) {
    const { id, color = '#95a5a6', weight = 1.0 } = edgeData;

    if (!sourceNode || !targetNode) {
        console.warn('Cannot create edge: source or target node not found');
        return null;
    }

    // Get positions
    const sourcePos = sourceNode.position;
    const targetPos = targetNode.position;

    // Calculate distance and direction
    const direction = new THREE.Vector3().subVectors(targetPos, sourcePos);
    const length = direction.length();

    if (length === 0) {
        console.warn('Cannot create edge: source and target nodes are at same position');
        return null;
    }

    // Create cylinder geometry
    // Use weight to determine thickness (min 0.05, max 0.2)
    const radius = Math.max(0.05, Math.min(0.2, weight * 0.1));
    const geometry = new THREE.CylinderGeometry(radius, radius, length, 8);

    // Create material
    const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        metalness: 0.2,
        roughness: 0.8
    });

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.edgeId = id;
    mesh.userData.isEdge = true;

    // Position and orient the cylinder
    // Center it between the two nodes
    const midPoint = new THREE.Vector3().addVectors(sourcePos, targetPos).multiplyScalar(0.5);
    mesh.position.copy(midPoint);

    // Orient cylinder to point from source to target
    const up = new THREE.Vector3(0, 1, 0);
    mesh.lookAt(targetPos);
    mesh.rotateX(Math.PI / 2); // Rotate to align with Y-axis

    return mesh;
}

/**
 * Render a complete graph with nodes and edges
 * @param {Object} graphData - Graph data with nodes and edges arrays
 */
function renderGraph(graphData) {
    if (!graphData) {
        console.warn('No graph data provided');
        return;
    }

    const scene = sceneManager.getScene();
    if (!scene) {
        console.error('Scene not initialized');
        return;
    }

    // Initialize label renderer if not already done
    if (!labelRenderer) {
        initLabelRenderer();
    }

    // Clear existing graph
    clearGraph();

    const { nodes = [], edges = [] } = graphData;

    // First, create all nodes
    nodes.forEach(nodeData => {
        const nodeObj = createNode(nodeData);
        if (nodeObj && nodeObj.mesh) {
            scene.add(nodeObj.mesh);
            nodeObjects.set(nodeData.id, nodeObj);
        }
    });

    // Then, create all edges
    edges.forEach(edgeData => {
        const sourceNodeObj = nodeObjects.get(edgeData.source_id);
        const targetNodeObj = nodeObjects.get(edgeData.target_id);

        if (sourceNodeObj && targetNodeObj) {
            const edgeMesh = createEdge(edgeData, sourceNodeObj.mesh, targetNodeObj.mesh);
            if (edgeMesh) {
                scene.add(edgeMesh);
                edgeObjects.set(edgeData.id, {
                    mesh: edgeMesh,
                    sourceId: edgeData.source_id,
                    targetId: edgeData.target_id,
                    edgeData: edgeData
                });
            }
        } else {
            console.warn(`Cannot create edge ${edgeData.id}: source or target node not found`);
        }
    });

    console.log(`Rendered graph with ${nodes.length} nodes and ${edges.length} edges`);
}

/**
 * Clear all nodes and edges from the scene
 */
function clearGraph() {
    const scene = sceneManager.getScene();
    if (!scene) return;

    // Remove all node meshes and labels
    nodeObjects.forEach((nodeObj) => {
        if (nodeObj.mesh) {
            scene.remove(nodeObj.mesh);
            // Dispose of geometry and material
            if (nodeObj.mesh.geometry) nodeObj.mesh.geometry.dispose();
            if (nodeObj.mesh.material) nodeObj.mesh.material.dispose();
        }
    });
    nodeObjects.clear();

    // Remove all edge meshes
    edgeObjects.forEach((edgeObj) => {
        const edgeMesh = edgeObj.mesh || edgeObj; // Support both old and new format
        scene.remove(edgeMesh);
        // Dispose of geometry and material
        if (edgeMesh.geometry) edgeMesh.geometry.dispose();
        if (edgeMesh.material) edgeMesh.material.dispose();
    });
    edgeObjects.clear();

    console.log('Graph cleared');
}

/**
 * Update node position
 * @param {number} nodeId - Node ID
 * @param {number} x - New x position
 * @param {number} y - New y position
 * @param {number} z - New z position
 */
function updateNodePosition(nodeId, x, y, z) {
    const nodeObj = nodeObjects.get(nodeId);
    if (nodeObj && nodeObj.mesh) {
        nodeObj.mesh.position.set(x, y, z);
        
        // Update all edges connected to this node
        updateConnectedEdges(nodeId);
    }
}

/**
 * Update edges connected to a node after it moves
 * @param {number} nodeId - Node ID that moved
 */
function updateConnectedEdges(nodeId) {
    const scene = sceneManager.getScene();
    if (!scene) return;

    // Find all edges connected to this node and update them
    edgeObjects.forEach((edgeObj, edgeId) => {
        const { mesh, sourceId, targetId, edgeData } = edgeObj;
        
        // Check if this edge is connected to the moved node
        if (sourceId === nodeId || targetId === nodeId) {
            const sourceNodeObj = nodeObjects.get(sourceId);
            const targetNodeObj = nodeObjects.get(targetId);
            
            if (sourceNodeObj && targetNodeObj) {
                // Remove old edge
                scene.remove(mesh);
                if (mesh.geometry) mesh.geometry.dispose();
                if (mesh.material) mesh.material.dispose();
                
                // Create new edge with updated positions
                const newEdgeMesh = createEdge(edgeData, sourceNodeObj.mesh, targetNodeObj.mesh);
                if (newEdgeMesh) {
                    scene.add(newEdgeMesh);
                    edgeObj.mesh = newEdgeMesh;
                }
            }
        }
    });
}

/**
 * Add a single node to the graph
 * @param {Object} nodeData - Node data
 */
function addNode(nodeData) {
    const scene = sceneManager.getScene();
    if (!scene) {
        console.error('Scene not initialized');
        return;
    }

    if (!labelRenderer) {
        initLabelRenderer();
    }

    const nodeObj = createNode(nodeData);
    if (nodeObj && nodeObj.mesh) {
        scene.add(nodeObj.mesh);
        nodeObjects.set(nodeData.id, nodeObj);
    }
}

/**
 * Remove a node from the graph
 * @param {number} nodeId - Node ID to remove
 */
function removeNode(nodeId) {
    const scene = sceneManager.getScene();
    if (!scene) return;

    const nodeObj = nodeObjects.get(nodeId);
    if (nodeObj && nodeObj.mesh) {
        scene.remove(nodeObj.mesh);
        if (nodeObj.mesh.geometry) nodeObj.mesh.geometry.dispose();
        if (nodeObj.mesh.material) nodeObj.mesh.material.dispose();
        nodeObjects.delete(nodeId);
    }
}

/**
 * Add an edge to the graph
 * @param {Object} edgeData - Edge data
 */
function addEdge(edgeData) {
    const scene = sceneManager.getScene();
    if (!scene) {
        console.error('Scene not initialized');
        return;
    }

    const sourceNodeObj = nodeObjects.get(edgeData.source_id);
    const targetNodeObj = nodeObjects.get(edgeData.target_id);

    if (sourceNodeObj && targetNodeObj) {
        const edgeMesh = createEdge(edgeData, sourceNodeObj.mesh, targetNodeObj.mesh);
        if (edgeMesh) {
            scene.add(edgeMesh);
            edgeObjects.set(edgeData.id, {
                mesh: edgeMesh,
                sourceId: edgeData.source_id,
                targetId: edgeData.target_id,
                edgeData: edgeData
            });
        }
    }
}

/**
 * Remove an edge from the graph
 * @param {number} edgeId - Edge ID to remove
 */
function removeEdge(edgeId) {
    const scene = sceneManager.getScene();
    if (!scene) return;

    const edgeObj = edgeObjects.get(edgeId);
    if (edgeObj) {
        const edgeMesh = edgeObj.mesh || edgeObj; // Support both old and new format
        scene.remove(edgeMesh);
        if (edgeMesh.geometry) edgeMesh.geometry.dispose();
        if (edgeMesh.material) edgeMesh.material.dispose();
        edgeObjects.delete(edgeId);
    }
}

/**
 * Update label renderer (call in animation loop)
 */
function updateLabels() {
    if (labelRenderer && sceneManager.getCamera()) {
        labelRenderer.render(sceneManager.getScene(), sceneManager.getCamera());
    }
}

/**
 * Get node object by ID
 * @param {number} nodeId - Node ID
 * @returns {Object|null} - Node object or null
 */
function getNode(nodeId) {
    return nodeObjects.get(nodeId) || null;
}

/**
 * Get all node objects
 * @returns {Map} - Map of node objects
 */
function getAllNodes() {
    return nodeObjects;
}

/**
 * Get all edge objects
 * @returns {Map} - Map of edge objects
 */
function getAllEdges() {
    return edgeObjects;
}

// Export graph renderer API
export const graphRenderer = {
    renderGraph,
    clearGraph,
    updateNodePosition,
    addNode,
    removeNode,
    addEdge,
    removeEdge,
    updateLabels,
    getNode,
    getAllNodes,
    getAllEdges
};
