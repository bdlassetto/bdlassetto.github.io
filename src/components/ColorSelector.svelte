<script lang="ts">
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let selectedColor: string = "#F0F0F0";

    // Preset colors for car customization
    const presetColors = [
        { name: "White", hex: "#FFFFFF" },
        { name: "Black", hex: "#000000" },
        { name: "Red", hex: "#DC2626" },
        { name: "Blue", hex: "#2563EB" },
        { name: "Yellow", hex: "#FACC15" },
        { name: "Green", hex: "#16A34A" },
        { name: "Orange", hex: "#EA580C" },
        { name: "Purple", hex: "#9333EA" },
        { name: "Gray", hex: "#6B7280" },
        { name: "Silver", hex: "#D1D5DB" },
    ];

    let customColor = selectedColor;
    let isExpanded = false;

    function selectPresetColor(hexColor: string) {
        const hexNumber = parseInt(hexColor.replace("#", ""), 16);
        dispatch("colorSelected", hexNumber);
    }

    function selectCustomColor() {
        const hexNumber = parseInt(customColor.replace("#", ""), 16);
        dispatch("colorSelected", hexNumber);
    }

    function toggleExpanded() {
        isExpanded = !isExpanded;
    }
</script>

<div class="color-selector">
    <button class="toggle-btn" on:click={toggleExpanded}>
        <span class="icon">{isExpanded ? "✕" : "🎨"}</span>
        <span class="label">{isExpanded ? "Close" : "Colors"}</span>
    </button>

    {#if isExpanded}
        <div class="color-panel">
            <h3 class="panel-title">Car Colors</h3>

            <!-- Preset Colors -->
            <div class="preset-grid">
                {#each presetColors as color}
                    <button
                        class="color-btn"
                        style="background-color: {color.hex};"
                        on:click={() => selectPresetColor(color.hex)}
                        title={color.name}
                        aria-label={`Select ${color.name}`}
                    >
                        {#if color.hex === "#FFFFFF"}
                            <span class="checkered-bg"></span>
                        {/if}
                    </button>
                {/each}
            </div>

            <!-- Custom Color Picker -->
            <div class="custom-picker">
                <label for="custom-color" class="picker-label"
                    >Custom Color</label
                >
                <div class="picker-row">
                    <input
                        type="color"
                        id="custom-color"
                        bind:value={customColor}
                        class="color-input"
                    />
                    <button class="apply-btn" on:click={selectCustomColor}
                        >Apply</button
                    >
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .color-selector {
        position: absolute;
        bottom: 2rem;
        left: 2rem;
        z-index: 20;
    }

    .toggle-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(0, 0, 0, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 0.75rem 1.25rem;
        border-radius: 12px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.3s ease;
        backdrop-filter: blur(8px);
    }

    .toggle-btn:hover {
        background: rgba(0, 0, 0, 0.85);
        border-color: rgba(255, 255, 255, 0.4);
        transform: translateY(-2px);
    }

    .icon {
        font-size: 1.2rem;
    }

    .label {
        font-weight: 600;
        letter-spacing: 0.02em;
    }

    .color-panel {
        position: absolute;
        bottom: calc(100% + 1rem);
        left: 0;
        background: rgba(0, 0, 0, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        padding: 1.5rem;
        min-width: 280px;
        backdrop-filter: blur(12px);
        animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .panel-title {
        font-size: 1rem;
        font-weight: 700;
        color: white;
        margin: 0 0 1rem 0;
        letter-spacing: 0.05em;
    }

    .preset-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 0.5rem;
        margin-bottom: 1.5rem;
    }

    .color-btn {
        width: 44px;
        height: 44px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
    }

    .color-btn:hover {
        transform: scale(1.1);
        border-color: rgba(255, 255, 255, 0.6);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .color-btn:active {
        transform: scale(0.95);
    }

    /* Checkered background for white color */
    .checkered-bg {
        position: absolute;
        inset: 0;
        background-image: linear-gradient(45deg, #ccc 25%, transparent 25%),
            linear-gradient(-45deg, #ccc 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #ccc 75%),
            linear-gradient(-45deg, transparent 75%, #ccc 75%);
        background-size: 8px 8px;
        background-position:
            0 0,
            0 4px,
            4px -4px,
            -4px 0px;
        z-index: -1;
    }

    .custom-picker {
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 1rem;
    }

    .picker-label {
        display: block;
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.85rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }

    .picker-row {
        display: flex;
        gap: 0.75rem;
        align-items: center;
    }

    .color-input {
        flex: 1;
        height: 44px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        background: transparent;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .color-input:hover {
        border-color: rgba(255, 255, 255, 0.4);
    }

    .apply-btn {
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        padding: 0.6rem 1.2rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.85rem;
        transition: all 0.2s ease;
    }

    .apply-btn:hover {
        background: rgba(255, 255, 255, 0.25);
        border-color: rgba(255, 255, 255, 0.5);
        transform: translateY(-1px);
    }

    .apply-btn:active {
        transform: translateY(0);
    }

    /* Mobile responsive */
    @media (max-width: 640px) {
        .color-selector {
            left: 1rem;
            bottom: 1rem;
        }

        .toggle-btn {
            padding: 0.6rem 1rem;
            font-size: 0.85rem;
        }

        .color-panel {
            min-width: 250px;
            padding: 1.25rem;
        }

        .preset-grid {
            grid-template-columns: repeat(5, 1fr);
            gap: 0.4rem;
        }

        .color-btn {
            width: 38px;
            height: 38px;
        }
    }
</style>
