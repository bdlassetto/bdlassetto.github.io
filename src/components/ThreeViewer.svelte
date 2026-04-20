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
  let isCamExpanded = false;
  let isCamDesktopOpen = false;

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

<div class="viewer-container" bind:this={container} on:click={onMouseClick}>
  {#if isLoading}
    <div class="status">Loading...</div>
  {:else if error}
    <div class="status error">{error}</div>
  {/if}

  <!-- Desktop: camera card + toggle (bottom-right, above music player) -->
  <div class="cam-desktop-wrap">
    {#if isCamDesktopOpen}
      <div class="cam-desktop-panel">
        <div class="cam-desktop-grid">
          {#each cameraViewKeys as view}
            <button
              class="cam-desktop-view-btn"
              on:click={() => { isAutoRotate = false; setCameraView(view); isCamDesktopOpen = false; }}
            >{view}</button>
          {/each}
        </div>
        <div class="cam-desktop-divider"></div>
        <div class="cam-desktop-toggles">
          <button
            class="cam-desktop-toggle-btn"
            class:cam-desktop-toggle-active={isAutoRotate}
            on:click={toggleAutoRotate}
          >AUTO {isAutoRotate ? "ON" : "OFF"}</button>
          <button
            class="cam-desktop-toggle-btn"
            class:cam-desktop-toggle-active={isAutoColor}
            on:click={() => (isAutoColor = !isAutoColor)}
          >COLOR {isAutoColor ? "ON" : "OFF"}</button>
        </div>
      </div>
    {/if}

    <button class="cam-desktop-toggle" on:click={() => (isCamDesktopOpen = !isCamDesktopOpen)}>
      <span class="cam-desktop-icon">📷</span>
      <span class="cam-desktop-label">Camera</span>
      <span class="cam-desktop-arrow">{isCamDesktopOpen ? "▲" : "▼"}</span>
    </button>
  </div>

  <!-- Mobile: dropdown (hidden on desktop via CSS) -->
  <div class="cam-mobile-wrapper">
    <button class="cam-mobile-toggle" on:click={() => (isCamExpanded = !isCamExpanded)}>
      <span class="cam-icon">{isCamExpanded ? "✕" : "📷"}</span>
      <span class="cam-label">{isCamExpanded ? "Close" : "Camera"}</span>
    </button>

    {#if isCamExpanded}
      <div class="cam-mobile-panel">
        <p class="cam-panel-title">Camera View</p>
        <div class="cam-grid">
          {#each cameraViewKeys as view}
            <button
              class="cam-btn-mobile"
              on:click={() => { isAutoRotate = false; setCameraView(view); isCamExpanded = false; }}
            >{view}</button>
          {/each}
        </div>
        <div class="cam-divider"></div>
        <div class="cam-toggles">
          <button
            class="cam-toggle-btn"
            class:cam-toggle-active={isAutoRotate}
            on:click={toggleAutoRotate}
          >
            AUTO {isAutoRotate ? "ON" : "OFF"}
          </button>
          <button
            class="cam-toggle-btn"
            class:cam-toggle-active={isAutoColor}
            on:click={() => (isAutoColor = !isAutoColor)}
          >
            COLOR {isAutoColor ? "ON" : "OFF"}
          </button>
        </div>
      </div>
    {/if}
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

  /* === DESKTOP: camera card at bottom-right === */
  .cam-desktop-wrap {
    position: absolute;
    bottom: 5.5rem;  /* sits above the compact music bar (~3rem tall + 2rem bottom + 0.5rem gap) */
    right: 2rem;
    z-index: 20;
    width: 280px;    /* matches music player width */
  }

  .cam-desktop-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgb(51 65 85);
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 1rem;
    cursor: pointer;
    backdrop-filter: blur(16px);
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    transition: background 0.2s;
  }
  .cam-desktop-toggle:hover { background: rgba(15, 23, 42, 0.95); }

  .cam-desktop-icon { font-size: 1rem; }
  .cam-desktop-label { font-size: 0.875rem; font-weight: 600; flex: 1; text-align: left; }
  .cam-desktop-arrow { font-size: 0.65rem; opacity: 0.6; }

  .cam-desktop-panel {
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgb(51 65 85);
    border-radius: 1rem;
    padding: 1rem;
    margin-bottom: 0.5rem;
    backdrop-filter: blur(16px);
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    animation: slideUp 0.2s ease;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .cam-desktop-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.375rem;
    margin-bottom: 0.75rem;
  }

  .cam-desktop-view-btn {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgb(203 213 225);
    padding: 0.4rem 0.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.75rem;
    text-align: center;
    transition: all 0.15s;
  }
  .cam-desktop-view-btn:hover {
    background: rgba(255, 255, 255, 0.14);
    color: white;
    border-color: rgba(255, 255, 255, 0.25);
  }
  .cam-desktop-view-btn:active { transform: scale(0.96); }

  .cam-desktop-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.08);
    margin-bottom: 0.75rem;
  }

  .cam-desktop-toggles {
    display: flex;
    gap: 0.5rem;
  }

  .cam-desktop-toggle-btn {
    flex: 1;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgb(148 163 184);
    padding: 0.45rem 0.25rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.72rem;
    font-weight: 600;
    text-align: center;
    transition: all 0.15s;
  }
  .cam-desktop-toggle-btn:hover { background: rgba(255, 255, 255, 0.12); color: white; }

  .cam-desktop-toggle-active {
    background: rgba(255, 255, 255, 0.2) !important;
    border-color: rgba(255, 255, 255, 0.4) !important;
    color: white !important;
    font-weight: 700;
  }

  /* Mobile wrapper hidden on desktop */
  .cam-mobile-wrapper { display: none; }

  /* === MOBILE: dropdown === */
  @media (max-width: 768px) {
    .controls-overlay { display: none; }

    .cam-mobile-wrapper {
      display: block;
      position: absolute;
      bottom: 3.75rem;
      right: 1rem;
      z-index: 20;
    }

    .cam-mobile-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(0, 0, 0, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      padding: 0.55rem 0.875rem;
      border-radius: 10px;
      cursor: pointer;
      font-size: 0.8rem;
      backdrop-filter: blur(8px);
      transition: all 0.2s ease;
    }

    .cam-mobile-toggle:hover {
      background: rgba(0, 0, 0, 0.85);
      border-color: rgba(255, 255, 255, 0.4);
    }

    .cam-icon { font-size: 1rem; }
    .cam-label { font-weight: 600; letter-spacing: 0.02em; }

    .cam-mobile-panel {
      position: absolute;
      bottom: calc(100% + 0.75rem);
      right: 0;
      background: rgba(0, 0, 0, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      padding: 1.25rem;
      min-width: 240px;
      backdrop-filter: blur(12px);
      animation: slideUp 0.25s ease;
      z-index: 60;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .cam-panel-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: white;
      margin: 0 0 0.75rem 0;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      opacity: 0.7;
    }

    .cam-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.4rem;
      margin-bottom: 0.875rem;
    }

    .cam-btn-mobile {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: white;
      padding: 0.5rem 0.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.75rem;
      text-align: center;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .cam-btn-mobile:hover {
      background: rgba(255, 255, 255, 0.18);
      border-color: rgba(255, 255, 255, 0.35);
    }

    .cam-btn-mobile:active { transform: scale(0.96); }

    .cam-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.12);
      margin: 0 0 0.75rem 0;
    }

    .cam-toggles {
      display: flex;
      gap: 0.5rem;
    }

    .cam-toggle-btn {
      flex: 1;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: white;
      padding: 0.5rem 0.25rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.72rem;
      font-weight: 600;
      text-align: center;
      transition: all 0.15s ease;
    }

    .cam-toggle-btn:hover { background: rgba(255, 255, 255, 0.15); }

    .cam-toggle-active {
      background: rgba(255, 255, 255, 0.35) !important;
      border-color: rgba(255, 255, 255, 0.6) !important;
      color: #000 !important;
      font-weight: 700;
    }
  }
</style>
