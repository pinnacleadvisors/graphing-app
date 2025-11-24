// Three.js scene setup and management
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;

/**
 * Initialize the 3D scene with camera, renderer, lighting, and controls
 */
function initScene() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // Get container dimensions
    const container = document.getElementById('canvas-container');
    if (!container) {
        console.error('Canvas container not found');
        return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create perspective camera
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 10);

    // Create WebGL renderer
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: false
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Add OrbitControls for camera manipulation
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooth camera movement
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.minDistance = 2;
    controls.maxDistance = 100;
    controls.target.set(0, 0, 0);
    controls.update();

    // Add lighting
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    // Directional light for depth and shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    // Additional directional light from opposite side for better visibility
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-10, -10, -5);
    scene.add(directionalLight2);

    // Add a subtle point light for additional depth
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(0, 0, 10);
    scene.add(pointLight);

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Start animation loop
    animate();
}

/**
 * Handle window resize events
 */
function onWindowResize() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

/**
 * Animation loop - updates controls and renders the scene
 */
function animate() {
    requestAnimationFrame(animate);
    
    // Update controls (required when damping is enabled)
    if (controls) {
        controls.update();
    }
    
    renderer.render(scene, camera);
    
    // Update label renderer if graph renderer is loaded
    if (window.graphRenderer) {
        window.graphRenderer.updateLabels();
    }
}

/**
 * Get the Three.js scene object
 */
function getScene() {
    return scene;
}

/**
 * Get the Three.js camera object
 */
function getCamera() {
    return camera;
}

/**
 * Get the Three.js renderer object
 */
function getRenderer() {
    return renderer;
}

/**
 * Get the OrbitControls object
 */
function getControls() {
    return controls;
}

// Export scene manager API
export const sceneManager = {
    scene,
    camera,
    renderer,
    controls,
    getScene,
    getCamera,
    getRenderer,
    getControls,
    initScene
};

// Initialize scene when module is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScene);
} else {
    initScene();
}


