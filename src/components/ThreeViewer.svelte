<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as THREE from "three";
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

  export let modelPath: string = "/g5_dta_ogay.enc";
  export let backgroundColor: string = "#1a1a1a";
  // Check if we are running locally to decide on the file extension if needed,
  // but for now we default to encrypted.

  // Hardcoded key for "Deterrent" architecture.
  // In a real secure app, this would be fetched from a secure endpoint after auth.
  const ENCRYPTION_KEY_HEX =
    "000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f";

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
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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

  async function getCryptoKey() {
    const keyBytes = new Uint8Array(
      ENCRYPTION_KEY_HEX.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
    );
    return await window.crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      false, // extractable
      ["decrypt"],
    );
  }

  async function decryptAndLoad() {
    try {
      const response = await fetch(modelPath);
      if (!response.ok)
        throw new Error(`Failed to fetch model: ${response.statusText}`);
      const fileBuffer = await response.arrayBuffer();

      // Layout: [IV (12)] [AuthTag (16)] [Ciphertext (rest)]
      const iv = fileBuffer.slice(0, 12);
      const authTag = fileBuffer.slice(12, 28);
      const ciphertext = fileBuffer.slice(28);

      // Web Crypto AES-GCM expects [Ciphertext][AuthTag]
      // We need to concat them.
      const dataToDecrypt = new Uint8Array(
        ciphertext.byteLength + authTag.byteLength,
      );
      dataToDecrypt.set(new Uint8Array(ciphertext), 0);
      dataToDecrypt.set(new Uint8Array(authTag), ciphertext.byteLength);

      const key = await getCryptoKey();

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        dataToDecrypt,
      );

      // Now parse with GLTFLoader
      const loader = new GLTFLoader();
      // parse(data, path, onLoad, onError)
      loader.parse(
        decryptedBuffer,
        "/", // Resource path
        (gltf) => {
          model = gltf.scene;
          setupModel(model);
          isLoading = false;
        },
        (err) => {
          console.error("Error parsing GLTF:", err);
          error = "Failed to parse model.";
          isLoading = false;
        },
      );
    } catch (e) {
      console.error("Decryption/Loading error:", e);
      error = "Failed to load secure model.";
      isLoading = false;
    }
  }

  function setupModel(model: THREE.Object3D) {
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
  }

  function loadModel() {
    // If path ends in .enc, decrypt. Else load normally.
    if (modelPath.endsWith(".enc")) {
      decryptAndLoad();
    } else {
      const loader = new GLTFLoader();
      loader.load(
        modelPath,
        (gltf) => {
          model = gltf.scene;
          setupModel(model);
          isLoading = false;
        },
        undefined,
        (err) => {
          console.error("Error loading model:", err);
          error = "Failed to load model.";
          isLoading = false;
        },
      );
    }
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
          if (Array.isArray(obj.material))
            obj.material.forEach((m: any) => m.dispose());
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
