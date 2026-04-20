<script lang="ts">
    import { onMount, onDestroy, createEventDispatcher } from "svelte";
    import {
        Play,
        Pause,
        SkipBack,
        SkipForward,
        Music,
        Volume2,
    } from "@lucide/svelte";

    const dispatch = createEventDispatcher();

    // ── Playlist ────────────────────────────────────────────────────────────
    // To add tracks: drop an .mp3 in public/music/ and append an entry here.
    const tracks = [
        { title: "Rearview Truth",    file: "/music/Rearview_Truth.mp3" },
        { title: "Tactical Friction", file: "/music/Tactical_Friction.mp3" },
    ];

    // ── State ───────────────────────────────────────────────────────────────
    let audio: HTMLAudioElement;
    let currentIndex = 0;
    let isPlaying = false;
    let volume = 0.5;

    $: currentTrack = tracks[currentIndex];

    onMount(() => {
        audio = new Audio(currentTrack.file);
        audio.volume = volume;
        audio.addEventListener("ended", nextTrack);
    });

    onDestroy(() => {
        if (audio) {
            audio.pause();
            audio.removeEventListener("ended", nextTrack);
        }
    });

    function loadAndPlay(index: number) {
        const wasPlaying = isPlaying;
        audio.pause();
        currentIndex = index;
        audio.src = tracks[index].file;
        audio.load();
        if (wasPlaying) {
            audio.play().then(() => { isPlaying = true; dispatch("play"); });
        } else {
            isPlaying = false;
        }
    }

    function togglePlay() {
        if (isPlaying) {
            audio.pause();
            isPlaying = false;
        } else {
            audio.play().then(() => { isPlaying = true; dispatch("play"); });
        }
    }

    function nextTrack() {
        loadAndPlay((currentIndex + 1) % tracks.length);
    }

    function prevTrack() {
        // Restart track if past 3 s, otherwise go to previous
        if (audio.currentTime > 3) {
            audio.currentTime = 0;
        } else {
            loadAndPlay((currentIndex - 1 + tracks.length) % tracks.length);
        }
    }

    function updateVolume() {
        if (audio) audio.volume = volume;
    }
</script>

<!-- ── Desktop bar (compact single row) ─────────────────────────────── -->
<div class="player-desktop">
    <!-- Icon -->
    <div class="album-icon">
        {#if isPlaying}<div class="album-pulse"></div>{/if}
        <Music size={15} class="text-white" />
    </div>

    <!-- Track title -->
    <p class="track-title" title={currentTrack.title}>{currentTrack.title}</p>

    <!-- Controls -->
    <div class="flex items-center gap-0.5 shrink-0">
        <button class="ctrl-btn" on:click={prevTrack} aria-label="Previous">
            <SkipBack size={16} strokeWidth={2} />
        </button>
        <button class="play-btn" on:click={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
            {#if isPlaying}
                <Pause size={15} fill="currentColor" strokeWidth={0} />
            {:else}
                <Play size={15} fill="currentColor" strokeWidth={0} class="ml-px" />
            {/if}
        </button>
        <button class="ctrl-btn" on:click={nextTrack} aria-label="Next">
            <SkipForward size={16} strokeWidth={2} />
        </button>
    </div>

    <!-- Volume -->
    <div class="flex items-center gap-1.5 shrink-0" style="width: 60px;">
        <Volume2 size={12} class="text-surface-400 shrink-0" />
        <input
            type="range" min="0" max="1" step="0.01"
            bind:value={volume} on:input={updateVolume}
            class="volume-slider"
        />
    </div>
</div>

<!-- ── Mobile bar ───────────────────────────────────────────────────────── -->
<div class="player-mobile">
    <div class="album-icon-sm">
        {#if isPlaying}<div class="album-pulse-sm"></div>{/if}
        <Music size={15} class="text-white" />
    </div>

    <div class="flex min-w-0 flex-1 flex-col">
        <p class="track-title-sm" title={currentTrack.title}>{currentTrack.title}</p>
        <p class="track-sub-sm">BDL Soundtrack</p>
    </div>

    <div class="flex items-center gap-0.5 shrink-0">
        <button class="ctrl-btn-sm" on:click={prevTrack} aria-label="Previous">
            <SkipBack size={17} strokeWidth={2} />
        </button>
        <button class="play-btn-sm" on:click={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
            {#if isPlaying}
                <Pause size={17} fill="currentColor" strokeWidth={0} />
            {:else}
                <Play size={17} fill="currentColor" strokeWidth={0} class="ml-px" />
            {/if}
        </button>
        <button class="ctrl-btn-sm" on:click={nextTrack} aria-label="Next">
            <SkipForward size={17} strokeWidth={2} />
        </button>
    </div>

    <div class="flex items-center gap-1.5 shrink-0" style="width: 72px;">
        <Volume2 size={12} class="text-surface-400 shrink-0" />
        <input
            type="range" min="0" max="1" step="0.01"
            bind:value={volume} on:input={updateVolume}
            class="volume-slider"
        />
    </div>
</div>

<style>
    /* ── Desktop bar (compact horizontal) ────────────────── */
    .player-desktop {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        z-index: 50;
        display: flex;
        align-items: center;
        gap: 0.625rem;
        border-radius: 0.875rem;
        border: 1px solid rgb(51 65 85);
        background: rgba(15, 23, 42, 0.8);
        padding: 0.625rem 0.875rem;
        box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        backdrop-filter: blur(16px);
        width: 280px;
        transition: background 0.2s;
    }
    .player-desktop:hover { background: rgba(15, 23, 42, 0.95); }

    .album-icon {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.875rem;
        height: 1.875rem;
        flex-shrink: 0;
        border-radius: 0.5rem;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
    }
    .album-pulse {
        position: absolute;
        inset: 0;
        border-radius: 0.5rem;
        background: white;
        opacity: 0.2;
        animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;
    }

    .track-title {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.75rem;
        font-weight: 600;
        color: white;
    }

    .ctrl-btn {
        border-radius: 9999px;
        padding: 0.3rem;
        color: rgb(148 163 184);
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.15s;
    }
    .ctrl-btn:hover { color: white; transform: scale(1.1); }
    .ctrl-btn:active { transform: scale(0.92); }

    .play-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.875rem;
        height: 1.875rem;
        border-radius: 9999px;
        background: white;
        color: black;
        border: none;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(255,255,255,0.12);
        transition: all 0.15s;
    }
    .play-btn:hover { transform: scale(1.08); }
    .play-btn:active { transform: scale(0.93); }

    .volume-slider {
        height: 6px;
        width: 100%;
        cursor: pointer;
        appearance: none;
        border-radius: 9999px;
        background: rgb(51 65 85);
        accent-color: #6366f1;
    }

    /* ── Mobile bar ──────────────────────────────────────── */
    .player-mobile { display: none; }

    @media (max-width: 768px) {
        .player-desktop { display: none; }

        .player-mobile {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 40;
            align-items: center;
            gap: 0.625rem;
            padding: 0.5rem 0.875rem;
            background: rgba(10, 15, 30, 0.92);
            border-top: 1px solid rgba(51, 65, 85, 0.8);
            backdrop-filter: blur(16px);
        }

        .album-icon-sm {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 2.125rem;
            height: 2.125rem;
            flex-shrink: 0;
            border-radius: 0.5rem;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
        }
        .album-pulse-sm {
            position: absolute;
            inset: 0;
            border-radius: 0.5rem;
            background: white;
            opacity: 0.2;
            animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;
        }

        .track-title-sm {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 0.7rem;
            font-weight: 700;
            color: white;
            line-height: 1.2;
        }
        .track-sub-sm { font-size: 0.6rem; color: rgb(148 163 184); }

        .ctrl-btn-sm {
            border-radius: 9999px;
            padding: 0.375rem;
            color: rgb(148 163 184);
            background: transparent;
            border: none;
            cursor: pointer;
            transition: all 0.15s;
        }
        .ctrl-btn-sm:hover { color: white; }
        .ctrl-btn-sm:active { transform: scale(0.88); }

        .play-btn-sm {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 2.125rem;
            height: 2.125rem;
            border-radius: 9999px;
            background: white;
            color: black;
            border: none;
            cursor: pointer;
            transition: all 0.15s;
            box-shadow: 0 2px 8px rgba(255,255,255,0.1);
        }
        .play-btn-sm:hover { transform: scale(1.08); }
        .play-btn-sm:active { transform: scale(0.92); }
    }

    @keyframes pulse {
        0%, 100% { opacity: 0.2; }
        50% { opacity: 0.35; }
    }
</style>
