<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import * as THREE from "three";
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

  const dispatch = createEventDispatcher();

  export let modelPath: string = "/g5_dta_ogay.enc";
  export let backgroundColor: string = "#1a1a1a";
  export let carColor: number | null = null;

  // Hardcoded key for "Deterrent" architecture.
  const ENCRYPTION_KEY_HEX =
    "000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f";

  let container: HTMLElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  let model: THREE.Object3D | null = null;
  let raycaster: THREE.Raycaster;
  let mouse: THREE.Vector2;
  let isLoading: boolean = true;
  let error: string | null = null;

  let selectedMaterialName: string | null = null;

  onMount(() => {
    initThree();
    animate();
    window.addEventListener("resize", handleResize);
    window.addEventListener("click", onMouseClick);
    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("click", onMouseClick);
      window.removeEventListener("mousemove", onMouseMove);
    };
  });

  onDestroy(() => {
    if (renderer) renderer.dispose();
    if (controls) controls.dispose();
    if (scene) disposeScene(scene);
  });

  $: if (carColor !== null && selectedMaterialName) {
    updateSelectedMaterialColor();
  }

  function initThree() {
    if (!container) return;

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);

    // Raycaster
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

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
    controls.target.set(0, 0.5, 0);

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

  function onMouseMove(event: MouseEvent) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  function onMouseClick(event: MouseEvent) {
    if (!model || !camera) return;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(model, true);

    if (intersects.length > 0) {
      const firstHit = intersects[0];
      const object = firstHit.object;

      if (object instanceof THREE.Mesh) {
        const material = Array.isArray(object.material)
          ? object.material[0]
          : object.material;
        selectedMaterialName = material.name;

        console.log("Selected Material:", selectedMaterialName);

        dispatch("partSelected", {
          partName: selectedMaterialName,
        });
      }
    }
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

      const iv = fileBuffer.slice(0, 12);
      const authTag = fileBuffer.slice(12, 28);
      const ciphertext = fileBuffer.slice(28);

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

      const loader = new GLTFLoader();
      loader.parse(
        decryptedBuffer,
        "/",
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
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 3.5 / maxDim;
    model.scale.set(scale, scale, scale);

    model.position.x = -center.x * scale;
    model.position.y = -center.y * scale;
    model.position.z = -center.z * scale;

    scene.add(model);

    // Default selection to "monobloco" so customization works immediately for body
    selectedMaterialName = "monobloco";

    if (carColor !== null) {
      updateSelectedMaterialColor();
    }
  }

  function loadModel() {
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

  function updateSelectedMaterialColor() {
    if (!model || carColor === null || !selectedMaterialName) return;

    model.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material) {
        const materials = Array.isArray(o.material) ? o.material : [o.material];

        materials.forEach((mat) => {
          if (mat.name === selectedMaterialName) {
            if (mat.color) {
              mat.color.setHex(carColor);
            }
          }
        });
      }
    });
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
