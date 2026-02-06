<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

  export let modelPath: string = '/g5_dta_ogay.glb';
  export let backgroundColor: string = '#1a1a1a';

  let container: HTMLElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  let model: THREE.Object3D | null = null;
  let isLoading: boolean = true;
  let error: string | null = null;

  onMount(() => {
    initThree();
    animate();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  onDestroy(() => {
    if (renderer) renderer.dispose();
    if (controls) controls.dispose();
    if (scene) disposeScene(scene);
  });

  function initThree() {
    if (!container) return;

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);

    // Camera
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(3, 2, 5); // Adjusted for a nice car view angle

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.target.set(0, 0.5, 0); // Center slightly up

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(-5, 5, -5);
    scene.add(backLight);

    loadModel();
  }

  function loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        model = gltf.scene;
        
        // Auto-center and scale
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3.5 / maxDim; // Slightly larger scale for "native/fast/minimal" feel
        model.scale.set(scale, scale, scale);
        
        model.position.x = -center.x * scale;
        model.position.y = -center.y * scale;
        model.position.z = -center.z * scale;

        scene.add(model);
        isLoading = false;
      },
      undefined,
      (err) => {
        console.error('Error loading model:', err);
        error = 'Failed to load model.';
        isLoading = false;
      }
    );
  }

  function handleResize() {
    if (!container || !camera || !renderer) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  function disposeScene(scene: THREE.Scene) {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose());
            else obj.material.dispose();
        }
      }
    });
  }
</script>

<div class="viewer-container" bind:this={container}>
  {#if isLoading}
    <div class="status">Loading...</div>
  {:else if error}
    <div class="status error">{error}</div>
  {/if}
</div>

<style>
  .viewer-container {
    width: 100%;
    height: 100vh; /* Full screen height for "native" feel */
    position: relative;
    overflow: hidden;
    background: #1a1a1a;
  }
  .status {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-family: sans-serif;
  }
  .error {
    color: #ff4444;
  }
</style>
