<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { fade, scale } from "svelte/transition";
    import { _ } from "../lib/i18n";

    const dispatch = createEventDispatcher();

    function close() {
        dispatch("close");
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape") {
            close();
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

<div
    class="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
    role="dialog"
    aria-modal="true"
>
    <!-- Backdrop -->
    <div
        class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        on:click={close}
        role="button"
        tabindex="-1"
        transition:fade={{ duration: 200 }}
    ></div>

    <!-- Modal Content -->
    <div
        class="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-surface-900/90 p-6 text-left align-middle shadow-2xl transition-all border border-surface-700 backdrop-blur-md"
        transition:scale={{ duration: 250, start: 0.95 }}
    >
        <div class="absolute top-4 right-4">
            <button
                type="button"
                class="rounded-full p-2 text-surface-400 hover:bg-surface-800 hover:text-white transition-colors"
                on:click={close}
            >
                <span class="sr-only">Close</span>
                <svg
                    class="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>
        </div>

        <div class="mt-2">
            <h3
                class="text-2xl font-bold leading-6 text-primary-400 mb-6 tracking-wide uppercase border-b border-surface-700 pb-2"
            >
                {$_("about.title")}
            </h3>

            <div
                class="space-y-6 text-surface-200 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar"
            >
                <!-- History / Intro -->
                <div>
                    <h4
                        class="text-lg font-semibold text-white mb-2 flex items-center gap-2"
                    >
                        <!-- Icon placeholder -->
                        <span>🏁</span>
                        {$_("about.history_title")}
                    </h4>
                    <p class="text-sm leading-relaxed text-surface-300">
                        {$_("about.history")}
                    </p>
                </div>

                <!-- Mission -->
                <div>
                    <h4
                        class="text-lg font-semibold text-white mb-2 flex items-center gap-2"
                    >
                        <span>🎯</span>
                        {$_("about.mission_title")}
                    </h4>
                    <p class="text-sm leading-relaxed text-surface-300">
                        {$_("about.mission")}
                    </p>
                </div>

                <!-- Pillars -->
                <div
                    class="bg-surface-800/50 rounded-lg p-4 border border-surface-700/50"
                >
                    <h4
                        class="text-lg font-semibold text-white mb-3 flex items-center gap-2"
                    >
                        <span>🏛️</span>
                        {$_("about.pillars_title")}
                    </h4>
                    <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <li
                            class="flex items-center gap-2 text-sm text-surface-300"
                        >
                            <span class="w-2 h-2 rounded-full bg-primary-500"
                            ></span>
                            {$_("about.pillar_physics")}
                        </li>
                        <li
                            class="flex items-center gap-2 text-sm text-surface-300"
                        >
                            <span class="w-2 h-2 rounded-full bg-primary-500"
                            ></span>
                            {$_("about.pillar_3d")}
                        </li>
                        <li
                            class="flex items-center gap-2 text-sm text-surface-300"
                        >
                            <span class="w-2 h-2 rounded-full bg-primary-500"
                            ></span>
                            {$_("about.pillar_optimization")}
                        </li>
                        <li
                            class="flex items-center gap-2 text-sm text-surface-300"
                        >
                            <span class="w-2 h-2 rounded-full bg-primary-500"
                            ></span>
                            {$_("about.pillar_rules")}
                        </li>
                    </ul>
                </div>
            </div>

            <div class="mt-8 text-center border-t border-surface-800 pt-4">
                <p class="text-xs text-surface-500 italic">
                    "{$_("about.tagline")}"
                </p>
            </div>
        </div>
    </div>
</div>

<style>
    /* Custom Scrollbar for this modal */
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
    }
</style>
