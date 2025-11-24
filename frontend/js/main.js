// Main application entry point
import { sceneManager } from './scene.js';
import { graphRenderer } from './graph-renderer.js';
import * as THREE from 'three';

console.log('3D Graphing App initialized');

// Make graphRenderer available globally for scene.js animation loop
window.graphRenderer = graphRenderer;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    
    // Scene is initialized in scene.js module
    // Wait a moment to ensure scene is ready
    setTimeout(() => {
        const scene = sceneManager.getScene();
        const camera = sceneManager.getCamera();
        const renderer = sceneManager.getRenderer();
        const controls = sceneManager.getControls();
        
        if (scene && camera && renderer) {
            console.log('3D Scene initialized successfully');
            console.log('Scene:', scene);
            console.log('Camera position:', camera.position);
            const size = new THREE.Vector2();
            renderer.getSize(size);
            console.log('Renderer size:', size);
            
            // Test graph rendering with sample data
            testGraphRendering();
        } else {
            console.error('Failed to initialize 3D scene');
        }
    }, 100);
});

/**
 * Test graph rendering with sample data
 */
function testGraphRendering() {
    // Sample graph data for testing
    const sampleGraph = {
        name: 'Test Graph',
        nodes: [
            { id: 1, label: 'Node 1', x: 0, y: 0, z: 0, color: '#3498db', size: 1.0 },
            { id: 2, label: 'Node 2', x: 3, y: 0, z: 0, color: '#e74c3c', size: 1.0 },
            { id: 3, label: 'Node 3', x: 0, y: 3, z: 0, color: '#2ecc71', size: 1.0 },
            { id: 4, label: 'Node 4', x: 0, y: 0, z: 3, color: '#f39c12', size: 1.0 },
            { id: 5, label: 'Node 5', x: -3, y: 0, z: 0, color: '#9b59b6', size: 1.0 }
        ],
        edges: [
            { id: 1, source_id: 1, target_id: 2, color: '#95a5a6', weight: 1.0 },
            { id: 2, source_id: 1, target_id: 3, color: '#95a5a6', weight: 1.0 },
            { id: 3, source_id: 1, target_id: 4, color: '#95a5a6', weight: 1.0 },
            { id: 4, source_id: 2, target_id: 3, color: '#95a5a6', weight: 1.0 },
            { id: 5, source_id: 4, target_id: 5, color: '#95a5a6', weight: 1.0 }
        ]
    };
    
    console.log('Rendering test graph...');
    graphRenderer.renderGraph(sampleGraph);
}

// Export scene manager and graph renderer for other modules
export { sceneManager, graphRenderer };


