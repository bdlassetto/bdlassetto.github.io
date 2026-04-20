<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { Github, X, ExternalLink } from "@lucide/svelte";

    const dispatch = createEventDispatcher();
    const GITHUB_URL = "https://github.com/bdlassetto/bdlassetto.github.io";

    function close() {
        dispatch("close");
    }

    const features = [
        { icon: "🎨", title: "Real-time Customization", desc: "Click any part of the 3D model to select it and paint with preset or custom colors." },
        { icon: "🎥", title: "Cinematic Mode", desc: "Auto-rotate with smooth camera transitions between curated angles (Front, Side, Interior, Top-Down)." },
        { icon: "🔒", title: "Encrypted Assets", desc: "3D models are protected with AES-256-GCM encryption and decrypted on the fly in the browser." },
        { icon: "🧪", title: "Shader Lab", desc: "Integrated GLSL playground to experiment with custom vertex and fragment shaders." },
        { icon: "🎵", title: "Immersive Audio", desc: "Built-in music player with local MP3 tracks synchronized to the experience." },
        { icon: "🌍", title: "i18n", desc: "Full support for English, Portuguese and Spanish." },
    ];

    const stack = [
        "Svelte 5", "Three.js", "TypeScript", "Tailwind CSS v4",
        "Skeleton UI v3", "Vite", "Vitest", "GitHub Actions",
    ];
</script>

<!-- Backdrop -->
<div
    class="fixed inset-0 z-[200] flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-label="About this app"
>
    <div
        class="absolute inset-0 bg-black/70 backdrop-blur-sm"
        on:click={close}
        role="presentation"
    ></div>

    <div class="modal-card">
        <!-- Header -->
        <div class="modal-header">
            <div class="flex items-center gap-3">
                <span class="text-2xl">🏎️</span>
                <div>
                    <h2 class="modal-title">BDL Car Viewer</h2>
                    <p class="modal-subtitle">Interactive 3D Customizer</p>
                </div>
            </div>
            <button class="close-btn" on:click={close} aria-label="Close">
                <X size={18} />
            </button>
        </div>

        <!-- Description -->
        <p class="description">
            An interactive 3D vehicle visualization platform built with <strong>Svelte 5</strong> and <strong>Three.js</strong>.
            Combines reactive UI with real-time 3D graphics for an immersive, browser-native experience.
        </p>

        <!-- Features -->
        <h3 class="section-title">Features</h3>
        <div class="features-grid">
            {#each features as f}
                <div class="feature-item">
                    <span class="feature-icon">{f.icon}</span>
                    <div>
                        <p class="feature-title">{f.title}</p>
                        <p class="feature-desc">{f.desc}</p>
                    </div>
                </div>
            {/each}
        </div>

        <!-- Stack -->
        <h3 class="section-title">Tech Stack</h3>
        <div class="stack-chips">
            {#each stack as tech}
                <span class="chip">{tech}</span>
            {/each}
        </div>

        <!-- Footer -->
        <div class="modal-footer">
            <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                class="github-link"
            >
                <Github size={16} />
                <span>View on GitHub</span>
                <ExternalLink size={13} class="opacity-60" />
            </a>
            <span class="footer-note">Developed with ❤️ by BDL</span>
        </div>
    </div>
</div>

<style>
    .modal-card {
        position: relative;
        z-index: 1;
        background: rgba(10, 15, 28, 0.97);
        border: 1px solid rgba(99, 102, 241, 0.25);
        border-radius: 1.25rem;
        padding: 1.75rem;
        width: 100%;
        max-width: 560px;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.8),
                    0 0 0 1px rgba(99, 102, 241, 0.1);
        scrollbar-width: thin;
        scrollbar-color: rgba(99, 102, 241, 0.3) transparent;
    }

    .modal-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 1.25rem;
    }

    .modal-title {
        font-size: 1.25rem;
        font-weight: 800;
        color: white;
        letter-spacing: 0.02em;
        line-height: 1.2;
    }

    .modal-subtitle {
        font-size: 0.75rem;
        color: rgb(99, 102, 241);
        font-weight: 500;
        margin-top: 2px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
    }

    .close-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border-radius: 0.5rem;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: rgb(148, 163, 184);
        cursor: pointer;
        transition: all 0.15s;
        flex-shrink: 0;
    }
    .close-btn:hover { background: rgba(255, 255, 255, 0.12); color: white; }

    .description {
        font-size: 0.85rem;
        line-height: 1.65;
        color: rgb(148, 163, 184);
        margin-bottom: 1.5rem;
    }
    .description strong { color: rgb(199, 210, 254); font-weight: 600; }

    .section-title {
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgb(99, 102, 241);
        margin-bottom: 0.875rem;
    }

    .features-grid {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
    }

    .feature-item {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.625rem 0.75rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 0.625rem;
    }

    .feature-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }

    .feature-title {
        font-size: 0.8rem;
        font-weight: 600;
        color: white;
        margin-bottom: 2px;
    }

    .feature-desc {
        font-size: 0.72rem;
        color: rgb(100, 116, 139);
        line-height: 1.5;
    }

    .stack-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin-bottom: 1.75rem;
    }

    .chip {
        font-size: 0.7rem;
        font-weight: 600;
        padding: 0.25rem 0.625rem;
        border-radius: 9999px;
        background: rgba(99, 102, 241, 0.12);
        border: 1px solid rgba(99, 102, 241, 0.25);
        color: rgb(165, 180, 252);
        letter-spacing: 0.02em;
    }

    .modal-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 1.25rem;
        border-top: 1px solid rgba(255, 255, 255, 0.07);
    }

    .github-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 0.625rem;
        background: rgba(99, 102, 241, 0.15);
        border: 1px solid rgba(99, 102, 241, 0.3);
        color: rgb(165, 180, 252);
        font-size: 0.8rem;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.15s;
    }
    .github-link:hover {
        background: rgba(99, 102, 241, 0.25);
        border-color: rgba(99, 102, 241, 0.5);
        color: white;
    }

    .footer-note {
        font-size: 0.72rem;
        color: rgb(71, 85, 105);
    }
</style>
