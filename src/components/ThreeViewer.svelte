<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import * as THREE from "three";
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

  const dispatch = createEventDispatcher();

  export let modelPath: string = "/g5_dta_ogay.glb";
  export let backgroundColor: string = "#1a1a1a";
  export let carColor: number | null = null;

  // Hardcoded key for "Deterrent" architecture.
  const ENCRYPTION_KEY_HEX =
    "000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f";

  let lastMousePos = { x: 0, y: 0 };
  const MOUSE_MOVE_THRESHOLD = 5;

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

  // Camera animation state
  let isAnimatingCamera = false;
  let targetCameraPos = new THREE.Vector3();
  let targetControlsTarget = new THREE.Vector3();
  const CAMERA_LERP_FACTOR = 0.1;

  // Auto-rotate / Cinematic mode state
  export let isAutoRotate = false;
  export let isAutoColor = true;
  let lastAutoChangeTime = 0;
  const AUTO_CHANGE_INTERVAL = 8000; // Change camera view every 8 seconds
  const IDLE_TIMEOUT = 20000; // 20 seconds inactivity
  let lastInteractionTime = Date.now();
  let wasManuallyEnabled = false; // Track if user explicitly enabled auto-rotate

  let _prevAutoRotate = false;
  $: if (isAutoRotate && !_prevAutoRotate) {
    lastAutoChangeTime = Date.now();
    lastColorChangeTime = Date.now();
  }
  $: _prevAutoRotate = isAutoRotate;

  // Preset positions (approximate, tuned for 3.5 scale centered model)
  const CAMERA_VIEWS = {
    Front: { pos: [0, 0.5, 4.0], target: [0, 0.2, 0] },
    "Front 3/4": { pos: [3.0, 0.8, 3.0], target: [0, 0.3, 0] },
    Side: { pos: [4.5, 0.7, 1.5], target: [0, 0.3, 0] },
    "Rear 3/4": { pos: [-3.0, 1.0, -3.0], target: [0, 0.3, 0] },
    Rear: { pos: [0, 0.8, -4.0], target: [0, 0.2, 0] },
    "Top-Down": { pos: [0, 5.0, 0], target: [0, 0, 0] },
    Interior: { pos: [0.3, 0.15, -0.2], target: [0.3, 0.15, 2.0] },
    Default: { pos: [3, 2, 5], target: [0, 0.5, 0] },
  };

  const cameraViewKeys = Object.keys(
    CAMERA_VIEWS,
  ) as (keyof typeof CAMERA_VIEWS)[];

  onMount(() => {
    initThree();
    animate();
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", resetIdleTimer);
    window.addEventListener("mousemove", resetIdleTimer); // Keep for waking up screensaver
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", resetIdleTimer);
      window.removeEventListener("mousemove", resetIdleTimer);
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

  function resetIdleTimer() {
    lastInteractionTime = Date.now();
  }

  function onControlsInteraction() {
    // If user starts interacting with controls (dragging/zooming), disable auto-rotate
    if (isAutoRotate) {
      isAutoRotate = false;
    }
    resetIdleTimer();
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
    controls.addEventListener("start", onControlsInteraction);

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

  function onMouseClick(event: MouseEvent) {
    // Ignore clicks on UI elements
    if (
      event.target instanceof Element &&
      (event.target.closest(".controls-overlay") ||
        event.target.closest("button"))
    ) {
      return;
    }

    // Don't reset idle timer here, it's handled by controls interaction or generic mousemove
    // resetIdleTimer();

    if (!model || !camera) return;

    // Update mouse position for raycaster from event (just in case)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

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

        // console.log("Selected Material:", selectedMaterialName);

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

    // Set default colors for specific materials
    console.log("=== ALL MATERIALS IN MODEL ===");
    model.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        const materials = Array.isArray(o.material) ? o.material : [o.material];
        materials.forEach((mat) => {
          if (!mat || !mat.name) return;
          console.log(`Material: "${mat.name}"`);
          const lowerName = mat.name.toLowerCase().trim();

          // 03 - default matches (handles 03-default, 03_default, 03 default, etc)
          if (lowerName.includes("03") && lowerName.includes("default")) {
            if (mat.color) mat.color.setHex(0xffffff);
          }
          // roda_int matches (handles roda_int, roda int, roda-int, etc)
          if (lowerName.includes("roda") && lowerName.includes("int")) {
            if (mat.color) mat.color.setHex(0x000000);
          }
        });
      }
    });
    console.log("=== END MATERIALS ===");

    scene.add(model);

    // Default selection to "03 - Default" so customization works immediately for body
    selectedMaterialName = "03 - Default";

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

  // Color animation state
  const COLOR_CHANGE_INTERVAL = 4000;
  let lastColorChangeTime = 0;
  const AUTO_COLORS = [
    0xffffff, // Pearl White
    0x0f172a, // Midnight Blue
    0xdc2626, // Crimson Red
    0x000000, // Matte Black
    0xeab308, // Sport Yellow
    0x16a34a, // Racing Green
    0x7c3aed, // Electric Purple
    0xc0c0c0, // Silver
  ];

  function animate() {
    requestAnimationFrame(animate);

    // Check for inactivity
    if (!isAutoRotate && Date.now() - lastInteractionTime > IDLE_TIMEOUT) {
      isAutoRotate = true;
      lastAutoChangeTime = Date.now();
      lastColorChangeTime = Date.now();
      // Reset selection to body so color changes apply to the car body
      selectedMaterialName = "03 - Default";
    }

    if (controls) {
      if (isAutoRotate && !isAnimatingCamera) {
        if (controls && !controls.autoRotate) {
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.5;
        }

        const now = Date.now();

        // Camera view change
        if (now - lastAutoChangeTime > AUTO_CHANGE_INTERVAL) {
          // Pick a random view (excluding Interior for stability)
          const safeViews = cameraViewKeys.filter((k) => k !== "Interior");
          const randomViewKey =
            safeViews[Math.floor(Math.random() * safeViews.length)];

          // Trigger transition
          setCameraView(randomViewKey);

          // Add slight randomness to the target position to vary the angles
          targetCameraPos.x += (Math.random() - 0.5) * 2;
          targetCameraPos.z += (Math.random() - 0.5) * 2;

          lastAutoChangeTime = now;
        }

        // Color Auto-Change
        if (isAutoColor && now - lastColorChangeTime > COLOR_CHANGE_INTERVAL) {
          const randomColor =
            AUTO_COLORS[Math.floor(Math.random() * AUTO_COLORS.length)];
          carColor = randomColor;
          lastColorChangeTime = now;
        }
      } else {
        if (controls && controls.autoRotate) {
          controls.autoRotate = false;
        }
      }
      controls.update();
    }

    // Smooth camera transition
    if (isAnimatingCamera && camera && controls) {
      camera.position.lerp(targetCameraPos, CAMERA_LERP_FACTOR);
      controls.target.lerp(targetControlsTarget, CAMERA_LERP_FACTOR);

      // Stop animating when close enough
      if (
        camera.position.distanceTo(targetCameraPos) < 0.05 &&
        controls.target.distanceTo(targetControlsTarget) < 0.05
      ) {
        isAnimatingCamera = false;
        controls.enabled = true; // Re-enable user control
      }
    }

    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  function toggleAutoRotate() {
    isAutoRotate = !isAutoRotate;
    if (isAutoRotate) {
      lastColorChangeTime = Date.now();
      // Ensure we target the body
      selectedMaterialName = "03 - Default";
    }
    // Timer reset is handled by reactive statement now
  }

  function setCameraView(viewName: keyof typeof CAMERA_VIEWS) {
    if (!camera || !controls) return;

    const view = CAMERA_VIEWS[viewName];
    targetCameraPos.set(view.pos[0], view.pos[1], view.pos[2]);
    targetControlsTarget.set(view.target[0], view.target[1], view.target[2]);

    isAnimatingCamera = true;
    controls.enabled = false; // Disable user interaction during transition
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
  <div class="controls-overlay">
    {#each cameraViewKeys as view}
      <button
        class="cam-btn"
        on:click={() => {
          isAutoRotate = false;
          setCameraView(view);
        }}
      >
        {view}
      </button>
    {/each}
    <div class="divider"></div>
    <button
      class="cam-btn"
      class:active={isAutoRotate}
      on:click={toggleAutoRotate}
    >
      AUTO {isAutoRotate ? "ON" : "OFF"}
    </button>
    <button
      class="cam-btn"
      class:active={isAutoColor}
      on:click={() => (isAutoColor = !isAutoColor)}
    >
      COLOR {isAutoColor ? "ON" : "OFF"}
    </button>
  </div>
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

  .controls-overlay {
    position: absolute;
    right: 1.5rem;
    top: 55%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background: rgba(0, 0, 0, 0.6);
    padding: 0.6rem;
    border-radius: 1rem;
    backdrop-filter: blur(4px);
    z-index: 10;
  }

  .cam-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 0.4rem 0.8rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
    width: 80px;
    text-align: center;
  }

  .cam-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  .cam-btn:active {
    transform: translateY(0);
  }

  .cam-btn.active {
    background: rgba(255, 255, 255, 0.4);
    border-color: #ffffff;
    font-weight: bold;
    color: #000;
  }

  .divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
    margin: 4px 0;
  }
</style>
