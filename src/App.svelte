<script lang="ts">
  import "./styles/global.css";
  import ThemeToggle from "./components/ThemeToggle.svelte";
  import LanguageSelector from "./components/LanguageSelector.svelte";
  import ThreeViewer from "./components/ThreeViewer.svelte"; // Import Viewer
  import { _ } from "./lib/i18n";

  // Inicializa o suporte a idiomas
  import { i18n } from "./lib/i18n";
  i18n.initialize();
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
  </div>
  <ThreeViewer />
</main>
