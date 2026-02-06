<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import * as THREE from "three";
    import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

    // --- Initial Shader Code (The "Hello World" of Shaders) ---

    // Vertex Shader: Handles geometry (positions of vertices)
    let vertexShader = `
// Uniforms are data sent from Javascript (CPU) to the Shader (GPU)
uniform float uTime;

// Varyings are variables passed from Vertex Shader to Fragment Shader
varying vec2 vUv;
varying float vReflect;

void main() {
  // Pass the UV coordinates to the fragment shader
  vUv = uv;

  // Simple wave effect modifying the position
  vec3 pos = position;
  pos.z += sin(pos.x * 5.0 + uTime) * 0.2;
  pos.y += cos(pos.y * 5.0 + uTime) * 0.2;

  // "gl_Position" is the mandatory output variable for position
  vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * modelViewPosition;
  
  // Just for fun, calculate a "reflection" factor based on normal
  vReflect = dot(normalize(normal), vec3(0.0, 0.0, 1.0));
}
`;

    // Fragment Shader: Handles colors (pixels)
    let fragmentShader = `
uniform float uTime;
varying vec2 vUv;
varying float vReflect;

void main() {
  // Create a time-varying color
  vec3 colorA = vec3(0.5, 0.0, 1.0); // Purple
  vec3 colorB = vec3(0.0, 1.0, 1.0); // Cyan

  // Mix colors based on UV coordinates and time
  float pct = abs(sin(vUv.x * 10.0 + uTime));
  vec3 color = mix(colorA, colorB, pct);

  // Add some brightness based on the vertex reflection
  color += vReflect * 0.5;

  // "gl_FragColor" is the mandatory output for the pixel color
  gl_FragColor = vec4(color, 1.0);
}
`;

    let canvas: HTMLCanvasElement;
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let mesh: THREE.Mesh;
    let material: THREE.ShaderMaterial;
    let frameId: number;
    let time = 0;

    let errorLog = "";

    onMount(() => {
        initThree();
        animate();

        window.addEventListener("resize", handleResize);

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener("resize", handleResize);
            renderer.dispose();
            material.dispose();
        };
    });

    function initThree() {
        // 1. Scene & Camera
        scene = new THREE.Scene();
        scene.background = new THREE.Color("#111");

        camera = new THREE.PerspectiveCamera(
            75,
            canvas.clientWidth / canvas.clientHeight,
            0.1,
            100,
        );
        camera.position.z = 2;

        // 2. Renderer
        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
        });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // 3. Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        // 4. Object (Sphere)
        const geometry = new THREE.SphereGeometry(1, 64, 64);

        // Shader Material
        material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
            },
            // wireframe: true // Uncomment to see the mesh
        });

        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
    }

    let wireframe = false;
    let isLowPoly = false;

    function handleResize() {
        if (!renderer || !camera) return;
        const width = canvas.parentElement?.clientWidth || 300;
        const height = canvas.parentElement?.clientHeight || 300;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    function animate() {
        frameId = requestAnimationFrame(animate);

        time += 0.05;
        if (material && material.uniforms) {
            material.uniforms.uTime.value = time;
        }

        renderer.render(scene, camera);
    }

    function updateGeometry() {
        if (!mesh || !scene) return;

        scene.remove(mesh);
        if (mesh.geometry) mesh.geometry.dispose();

        // High Poly vs Low Poly
        const geometry = isLowPoly
            ? new THREE.IcosahedronGeometry(1, 0) // Very blocky
            : new THREE.SphereGeometry(1, 64, 64); // Smooth

        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
    }

    function updateShaders() {
        if (!material) return;

        try {
            const newMat = new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms: { uTime: { value: time } },
                wireframe: wireframe,
            });

            // Swap material
            mesh.material = newMat;
            material.dispose();
            material = newMat;

            errorLog = "Shaders updated successfully!";
            setTimeout(() => (errorLog = ""), 2000);
        } catch (e: any) {
            errorLog = e.toString();
        }
    }

    // React to toggle changes
    $: if (mesh) {
        updateGeometry();
    } // This is a bit aggressive, checks isLowPoly inside
    $: if (material) {
        updateShaders();
    } // This checks wireframe inside

    // --- Tutorial Content ---
    let showTutorial = false;
    const tutorialContent = [
        {
            title: "O que é um Shader?",
            text: "Um shader é um pequeno programa que roda diretamente na sua placa de vídeo (GPU). Ao contrário do Javascript que roda no processador (CPU), os shaders processam milhões de pixels em paralelo, permitindo efeitos visuais incríveis em tempo real.",
        },
        {
            title: "1. Vertex Shader (Geometria)",
            text: "Este é o primeiro estágio. Ele recebe cada ponto 3D (vértice) do modelo e decide onde ele deve aparecer na tela 2D.\n\nExperimente: No código 'Vertex Shader', mude o número '5.0' dentro de sin() para '20.0' e veja a esfera ficar mais rugosa.",
        },
        {
            title: "2. Fragment Shader (Cor)",
            text: "Este estágio roda para cada pixel que compõe o objeto. Ele decide a cor final.\n\nExperimente: No 'Fragment Shader', mude 'vec3(0.5, 0.0, 1.0)' para outra cor RGB, tipo 'vec3(1.0, 0.0, 0.0)' (Vermelho).",
        },
        {
            title: "Conceitos Chave",
            text: "• Uniforms: Variáveis enviadas do Javascript para o Shader (ex: o tempo 'uTime').\n• Varyings: Variáveis passadas do Vertex para o Fragment Shader (ex: 'vUv' para texturas).\n• gl_Position: A saída obrigatória do Vertex (posição na tela).\n• gl_FragColor: A saída obrigatória do Fragment (cor do pixel).",
        },
    ];
</script>

<div class="playground-container">
    <div class="editor-panel">
        <div class="header">
            <div
                style="display: flex; justify-content: space-between; align-items: center;"
            >
                <div>
                    <h2>Yamandu's Shader Lab</h2>
                    <p>
                        Brique com o código para entender como os pixels ganham
                        vida.
                    </p>
                </div>
                <button
                    class="tutorial-btn"
                    on:click={() => (showTutorial = true)}
                    >📚 Como Funciona?</button
                >
            </div>
        </div>

        <div class="code-block">
            <div class="label-row">
                <label>Vertex Shader (Geometria)</label>
                <span class="hint">Controla a posição dos vértices</span>
            </div>
            <textarea
                bind:value={vertexShader}
                on:input={updateShaders}
                spellcheck="false"
            ></textarea>
        </div>

        <div class="code-block" style="flex-grow: 1;">
            <!-- Give Fragment shader more space generally -->
            <div class="label-row">
                <label>Fragment Shader (Cor)</label>
                <span class="hint">Controla a cor de cada pixel</span>
            </div>
            <textarea
                bind:value={fragmentShader}
                on:input={updateShaders}
                spellcheck="false"
            ></textarea>
        </div>

        {#if errorLog}
            <div class="status-log">{errorLog}</div>
        {/if}
    </div>

    <div class="preview-panel">
        <canvas bind:this={canvas}></canvas>

        <!-- Toolbar -->
        <div class="toolbar">
            <label class="toggle">
                <input
                    type="checkbox"
                    bind:checked={isLowPoly}
                    on:change={updateGeometry}
                />
                <span>Low Poly (Sharp)</span>
            </label>
            <label class="toggle">
                <input
                    type="checkbox"
                    bind:checked={wireframe}
                    on:change={updateShaders}
                />
                <span>Wireframe</span>
            </label>
        </div>

        <div class="controls-overlay">
            <p>Arraste para girar • Scroll para zoom</p>
        </div>
    </div>

    {#if showTutorial}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
            class="modal-backdrop"
            role="button"
            tabindex="0"
            on:click|self={() => (showTutorial = false)}
        >
            <div class="modal">
                <h3>Guia Rápido de Shaders</h3>
                <div class="modal-content">
                    {#each tutorialContent as item}
                        <div class="tutorial-item">
                            <h4>{item.title}</h4>
                            <p>{item.text}</p>
                        </div>
                    {/each}
                </div>
                <button
                    class="close-btn"
                    on:click={() => (showTutorial = false)}>Fechar</button
                >
            </div>
        </div>
    {/if}
</div>

<style>
    .playground-container {
        display: flex;
        width: 100vw;
        height: 100vh;
        background: #0d0d0d;
        color: #eee;
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    }

    .editor-panel {
        width: 40%;
        display: flex;
        flex-direction: column;
        padding: 20px;
        background: #1a1a1a;
        border-right: 1px solid #333;
        gap: 15px;
        overflow-y: auto;
    }

    .preview-panel {
        flex: 1;
        position: relative;
        background: #000;
    }

    canvas {
        width: 100%;
        height: 100%;
        display: block;
    }

    .header h2 {
        margin: 0 0 5px 0;
        color: #4caf50;
    }

    .header p {
        margin: 0;
        font-size: 0.9em;
        opacity: 0.7;
    }

    .code-block {
        display: flex;
        flex-direction: column;
        min-height: 200px;
    }

    .label-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
    }

    label {
        font-weight: bold;
        color: #64b5f6;
    }

    .hint {
        font-size: 0.8em;
        color: #888;
    }

    textarea {
        flex: 1;
        background: #111;
        color: #e0e0e0;
        border: 1px solid #333;
        border-radius: 4px;
        padding: 10px;
        font-family: "Consolas", "Monaco", monospace;
        font-size: 13px;
        line-height: 1.4;
        resize: none;
        outline: none;
    }

    textarea:focus {
        border-color: #4caf50;
    }

    .status-log {
        margin-top: 10px;
        padding: 10px;
        background: #222;
        border-left: 3px solid #4caf50;
        font-size: 0.9em;
    }

    .toolbar {
        position: absolute;
        top: 20px;
        right: 20px;
        display: flex;
        gap: 15px;
        background: rgba(0, 0, 0, 0.6);
        padding: 8px 15px;
        border-radius: 20px;
        backdrop-filter: blur(4px);
    }

    .toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 0.9em;
        color: white;
    }

    .toggle input {
        cursor: pointer;
    }

    .controls-overlay {
        position: absolute;
        bottom: 20px;
        right: 20px;
        color: white;
        opacity: 0.5;
        pointer-events: none;
        font-size: 0.8em;
    }

    /* Modal Styles */
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 200;
    }

    .modal {
        background: #222;
        padding: 25px;
        border-radius: 8px;
        width: 600px;
        max-width: 90%;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        border: 1px solid #444;
    }

    .modal h3 {
        margin-top: 0;
        color: #4caf50;
        border-bottom: 1px solid #444;
        padding-bottom: 10px;
    }

    .modal-content {
        overflow-y: auto;
        flex: 1;
        margin-bottom: 20px;
    }

    .tutorial-item {
        margin-bottom: 20px;
    }

    .tutorial-item h4 {
        margin-bottom: 5px;
        color: #64b5f6;
    }

    .tutorial-item p {
        line-height: 1.5;
        white-space: pre-wrap;
    }

    .close-btn {
        align-self: flex-end;
        padding: 8px 16px;
        background: #4caf50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
    }

    .close-btn:hover {
        background: #45a049;
    }

    .tutorial-btn {
        background: #333;
        color: #fff;
        border: 1px solid #555;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9em;
    }

    .tutorial-btn:hover {
        background: #444;
    }
</style>
