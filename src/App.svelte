<script lang="ts">
  import "./styles/global.css";
  import ThemeToggle from "./components/ThemeToggle.svelte";
  import LanguageSelector from "./components/LanguageSelector.svelte";
  import ThreeViewer from "./components/ThreeViewer.svelte";
  import ColorSelector from "./components/ColorSelector.svelte";
  import { _ } from "./lib/i18n";
  import { i18n } from "./lib/i18n";
  import ShaderPlayground from "./components/ShaderPlayground.svelte";
  import MusicPlayer from "./components/MusicPlayer.svelte";
  import AboutModal from "./components/AboutModal.svelte";
  import { Menu, X } from "@lucide/svelte";

  // Inicializa o suporte a idiomas
  i18n.initialize();

  let showShaderLab = false;
  let showAbout = false;
  let hasStarted = false;
  let isMenuOpen = false;

  let selectedColorHex: number | null = null; // Default 3D value
  let currentPartName: string = "Body"; // Default
  let isAutoRotate = false;
  let isAutoColor = true;

  // Handler for color selection from the specialized component
  function onColorSelected(e: CustomEvent) {
    selectedColorHex = e.detail;
    isAutoColor = false; // Stop auto-color when user picks one
  }

  // Handler for part selection from 3D scene
  function onPartSelected(e: CustomEvent) {
    currentPartName = e.detail.partName;
    selectedColorHex = null; // Reset selection so color doesn't auto-apply without user intent if we wanted safe mode
    // But actually, we usually want to KEEP the selected color or just waiting for new pick.
    // Let's keep the hex null so we don't accidentally color the new part with the old color immediately?
    // No, user flow: Select Part -> Pick Color.
    // If I pick a color, I want it to apply.
  }

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }
</script>

<main class="h-screen w-screen overflow-hidden bg-surface-900">
  <!-- Desktop / Header Controls -->
  <div class="absolute top-4 right-4 z-50 flex items-center gap-2">
    {#if !hasStarted}
      <div
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-700"
        role="button"
        tabindex="0"
        on:click={() => {
          hasStarted = true;
          isAutoRotate = true;
        }}
        on:keydown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            hasStarted = true;
            isAutoRotate = true;
          }
        }}
      >
        <div
          class="flex flex-col items-center gap-4 text-center animate-pulse cursor-pointer"
        >
          <h1 class="text-4xl font-bold tracking-[0.2em] text-white">
            START ENGINE
          </h1>
          <p class="text-sm text-surface-400">Click anywhere to begin</p>
        </div>
      </div>
    {/if}

    <!-- Mobile Menu Toggle -->
    <button
      class="md:hidden btn bg-surface-700/80 p-2 text-white rounded-lg backdrop-blur-sm border border-surface-600"
      on:click={toggleMenu}
    >
      {#if isMenuOpen}
        <X size={24} />
      {:else}
        <Menu size={24} />
      {/if}
    </button>

    <!-- Desktop Buttons -->
    <div class="hidden md:flex gap-2">
      <button
        class="btn bg-surface-700 p-2 text-sm text-white hover:bg-surface-600 rounded"
        on:click={() => (showAbout = true)}
      >
        {$_("about.title")}
      </button>
      <button
        class="btn bg-surface-700 p-2 text-sm text-white hover:bg-surface-600 rounded"
        on:click={() => (showShaderLab = !showShaderLab)}
        title={showShaderLab ? "Back to Car" : "Go to Shader Lab"}
      >
        {showShaderLab ? "🚗 Car Viewer" : "🧪 Shader Lab"}
      </button>
      <LanguageSelector />
      <ThemeToggle />
    </div>
  </div>

  <!-- Mobile Menu Dropdown -->
  {#if isMenuOpen}
    <div
      class="md:hidden fixed inset-0 z-[45] bg-black/40 backdrop-blur-sm"
      on:click={toggleMenu}
    ></div>
    <div
      class="md:hidden absolute top-16 right-4 z-50 flex flex-col gap-2 bg-surface-800/95 p-4 rounded-xl border border-surface-700 shadow-2xl min-w-[200px]"
    >
      <button
        class="btn bg-surface-700 p-3 text-left text-sm text-white hover:bg-surface-600 rounded-lg flex items-center justify-between"
        on:click={() => {
          showAbout = true;
          isMenuOpen = false;
        }}
      >
        <span>{$_("about.title")}</span>
        <span>ℹ️</span>
      </button>
      <button
        class="btn bg-surface-700 p-3 text-left text-sm text-white hover:bg-surface-600 rounded-lg flex items-center justify-between"
        on:click={() => {
          showShaderLab = !showShaderLab;
          isMenuOpen = false;
        }}
      >
        <span>{showShaderLab ? "🚗 Car Viewer" : "🧪 Shader Lab"}</span>
      </button>
      <div class="h-px bg-surface-700 my-1"></div>
      <div class="flex items-center justify-between px-1">
        <span class="text-xs text-surface-400 uppercase font-bold"
          >Settings</span
        >
      </div>
      <div class="flex gap-2 mt-1">
        <div class="flex-1"><LanguageSelector /></div>
        <ThemeToggle />
      </div>
    </div>
  {/if}

  {#if showAbout}
    <AboutModal on:close={() => (showAbout = false)} />
  {/if}

  {#if showShaderLab}
    <ShaderPlayground />
  {:else}
    <div
      class="pointer-events-none absolute top-4 left-4 z-40 text-surface-50 mix-blend-difference"
    >
      <h1 class="h2 font-bold md:text-3xl text-xl">{$_("app.title")}</h1>
      <p class="text-xs md:text-sm opacity-80">{$_("app.subtitle")}</p>

      <!-- Dynamic Selection Feedback -->
      <div class="mt-2 md:mt-4 flex items-center gap-2">
        <span
          class="text-[10px] md:text-xs font-bold uppercase tracking-wider opacity-60"
          >Editing:</span
        >
        <span
          class="rounded bg-surface-800/50 px-2 py-1 text-xs md:text-sm font-mono text-primary-400 backdrop-blur-sm"
        >
          {currentPartName}
        </span>
      </div>
    </div>

    <ThreeViewer
      bind:carColor={selectedColorHex}
      on:partSelected={onPartSelected}
      bind:isAutoRotate
      bind:isAutoColor
    />

    <ColorSelector selectedColor="#F0F0F0" on:colorSelected={onColorSelected} />
  {/if}

  <MusicPlayer on:play={() => (isAutoRotate = true)} />
</main>
