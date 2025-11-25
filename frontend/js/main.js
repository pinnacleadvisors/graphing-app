// Main application entry point
import { sceneManager } from './scene.js';
import { graphRenderer } from './graph-renderer.js';
import { uiController } from './ui-controller.js';
import { sidebar } from './sidebar.js';
import { nodeManager } from './node-manager.js';
import * as THREE from 'three';

console.log('3D Graphing App initialized');

// Make graphRenderer and uiController available globally for scene.js animation loop
window.graphRenderer = graphRenderer;
window.uiController = uiController;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    
    // Scene is initialized in scene.js module
    // Wait a moment to ensure scene is ready
    setTimeout(() => {
        const scene = sceneManager.getScene();
        const camera = sceneManager.getCamera();
        const renderer = sceneManager.getRenderer();
        
        if (scene && camera && renderer) {
            console.log('3D Scene initialized successfully');
            
            // Initialize UI controller (this will initialize node and edge managers)
            uiController.init();
            
            // Initialize sidebar
            sidebar.init();
            
            // Connect sidebar callbacks
            sidebar.onProjectSelect((project) => {
                uiController.loadProject(project);
            });
            
            sidebar.onProjectCreate((project) => {
                // Project is already loaded by sidebar, just ensure it's displayed
                if (project && project.graph) {
                    uiController.loadProject(project);
                }
            });
            
            console.log('Application ready');
        } else {
            console.error('Failed to initialize 3D scene');
        }
    }, 100);
});

// Export scene manager and graph renderer for other modules
export { sceneManager, graphRenderer };


