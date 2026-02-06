<script lang="ts">
  import "./styles/global.css";
  import ThemeToggle from "./components/ThemeToggle.svelte";
  import LanguageSelector from "./components/LanguageSelector.svelte";
  import ThreeViewer from "./components/ThreeViewer.svelte";
  import ColorSelector from "./components/ColorSelector.svelte";
  import { _ } from "./lib/i18n";
  import { i18n } from "./lib/i18n";

  // Inicializa o suporte a idiomas
  i18n.initialize();

  let selectedColorHex: number | null = null; // Default 3D value
  let currentPartName: string = "Body"; // Default

  // Handler for color selection from the specialized component
  function onColorSelected(e: CustomEvent) {
    selectedColorHex = e.detail;
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
</script>

<main class="h-screen w-screen overflow-hidden bg-surface-900">
  <div class="absolute top-4 right-4 z-50 flex gap-2">
    <LanguageSelector />
    <ThemeToggle />
  </div>

  <div
    class="pointer-events-none absolute top-4 left-4 z-40 text-surface-50 mix-blend-difference"
  >
    <h1 class="h2 font-bold">{$_("app.title")}</h1>
    <p class="text-sm opacity-80">{$_("app.subtitle")}</p>

    <!-- Dynamic Selection Feedback -->
    <div class="mt-4 flex items-center gap-2">
      <span class="text-xs font-bold uppercase tracking-wider opacity-60"
        >Editing:</span
      >
      <span
        class="rounded bg-surface-800/50 px-2 py-1 font-mono text-primary-400 backdrop-blur-sm"
      >
        {currentPartName}
      </span>
    </div>
  </div>

  <ThreeViewer carColor={selectedColorHex} on:partSelected={onPartSelected} />

  <ColorSelector selectedColor="#F0F0F0" on:colorSelected={onColorSelected} />
</main>
