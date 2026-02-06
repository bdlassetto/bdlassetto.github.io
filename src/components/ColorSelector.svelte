<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { fly } from "svelte/transition";

    export let selectedColor: string;

    const dispatch = createEventDispatcher();

    const colors = [
        { name: "Pearl White", value: "#F0F0F0", hex: 0xffffff },
        { name: "Midnight Black", value: "#0A0A0A", hex: 0x010101 },
        { name: "Racing Red", value: "#D81B1B", hex: 0xcc0000 },
        { name: "Deep Blue", value: "#003366", hex: 0x000088 },
        { name: "Forest Green", value: "#004422", hex: 0x004400 },
        { name: "Sunset Orange", value: "#FF5500", hex: 0xff4400 },
        { name: "Gunmetal Grey", value: "#4A4A4A", hex: 0x333333 },
    ];

    function selectColor(color: any) {
        dispatch("colorSelected", color.hex);
        selectedColor = color.value; // Just for UI tracking if needed, though prop updates from parent usually
    }
</script>

<div
    class="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full border border-surface-700 bg-surface-900/90 p-3 shadow-xl backdrop-blur-md"
    in:fly={{ y: 20, duration: 400 }}
>
    {#each colors as color}
        <button
            class="color-btn group relative h-10 w-10 overflow-hidden rounded-full border-2 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900"
            class:selected={selectedColor === color.value}
            style:background-color={color.value}
            style:border-color={selectedColor === color.value
                ? "white"
                : "transparent"}
            aria-label={`Select ${color.name}`}
            on:click={() => selectColor(color)}
        >
            <!-- Shininess effect -->
            <div
                class="absolute -top-[50%] -left-[50%] h-[200%] w-[50%] rotate-45 transform bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:animate-shine group-hover:opacity-100"
            ></div>
        </button>
    {/each}
</div>

<style>
    @keyframes shine {
        0% {
            left: -100%;
        }
        100% {
            left: 200%;
        }
    }
    .color-btn.selected {
        transform: scale(1.15);
        box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
    }
</style>
