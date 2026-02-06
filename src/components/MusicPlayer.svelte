<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import {
        Play,
        Pause,
        SkipBack,
        SkipForward,
        Music,
        Radio,
        Volume2,
    } from "@lucide/svelte";

    const dispatch = createEventDispatcher();

    export function playSequence() {
        if (!player) return;

        // Play immediately without delay
        player.unMute();
        player.playVideo();
        dispatch("play");
    }

    let player: any;
    let isPlaying = false;
    let currentTitle = "Initializing...";
    let isReady = false;
    let volume = 50;
    const PLAYLIST_ID = "PL71Q6dgIfRPGO8r-ejlTkKah8nZ0CEoC0";

    onMount(() => {
        // Helper to init player
        const initPlayer = () => {
            // @ts-ignore
            player = new window.YT.Player("youtube-player-hidden-container", {
                height: "0",
                width: "0",
                playerVars: {
                    listType: "playlist",
                    list: PLAYLIST_ID,
                    autoplay: 0,
                    controls: 0,
                    showinfo: 0,
                    modestbranding: 1,
                    loop: 1,
                    playsinline: 1,
                },
                events: {
                    onReady: onPlayerReady,
                    onStateChange: onPlayerStateChange,
                    onError: onPlayerError,
                },
            });
        };

        // Load YouTube API if not already present
        // @ts-ignore
        if (!window.YT) {
            const tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName("script")[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

            // @ts-ignore
            window.onYouTubeIframeAPIReady = () => {
                initPlayer();
            };
        } else {
            initPlayer();
        }
    });

    function onPlayerReady(event: any) {
        isReady = true;
        currentTitle = "Ready to Play";
        player.setVolume(volume);

        // Auto-play removed in favor of explicit start for sync reliability
        // setTimeout(() => {
        //     if (player) {
        //         player.playVideo();
        //         dispatch("play");
        //     }
        // }, 5000);
    }

    function onPlayerStateChange(event: any) {
        // @ts-ignore
        if (event.data === window.YT.PlayerState.PLAYING) {
            isPlaying = true;
            updateTrackInfo();
            // @ts-ignore
        } else if (event.data === window.YT.PlayerState.PAUSED) {
            isPlaying = false;
        }
    }

    function onPlayerError(event: any) {
        console.error("YouTube Player Error:", event.data);
        currentTitle = "Error loading track";
    }

    function updateTrackInfo() {
        if (player && player.getVideoData) {
            const data = player.getVideoData();
            if (data && data.title) {
                currentTitle = data.title;
            }
        }
    }

    function togglePlay() {
        if (!player) return;
        if (isPlaying) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    }

    function nextTrack() {
        if (player) player.nextVideo();
    }

    function prevTrack() {
        if (player) player.previousVideo();
    }

    function updateVolume() {
        if (player) player.setVolume(volume);
    }
</script>

<div
    class="fixed bottom-8 right-8 z-50 flex flex-col gap-3 rounded-2xl border border-surface-700 bg-surface-900/80 p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:bg-surface-900/90 w-[280px]"
>
    <!-- Hidden Player Div (0x0 size) -->
    <div class="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden">
        <div id="youtube-player-hidden-container"></div>
    </div>

    <!-- Header / Info -->
    <div class="flex items-start gap-3">
        <!-- Album Art / Icon Placeholder -->
        <div
            class="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-tertiary-600 shadow-inner"
        >
            {#if isPlaying}
                <div
                    class="absolute inset-0 rounded-xl bg-white opacity-20 animate-pulse"
                ></div>
            {/if}
            <Music size={20} class="text-white drop-shadow-md" />
        </div>

        <div class="flex min-w-0 flex-col justify-center pt-0.5">
            <div class="group relative overflow-hidden">
                <p
                    class="truncate whitespace-nowrap text-sm font-bold text-white transition-all group-hover:whitespace-normal"
                    title={currentTitle}
                >
                    {currentTitle}
                </p>
            </div>
            <div class="flex items-center gap-1 text-xs text-surface-400">
                <Radio size={10} />
                <span>Drift Phonk Playlist</span>
            </div>
        </div>
    </div>

    <!-- Progress Bar (Fake Visual Only currently as YT API polling is expensive for simple implementation) -->
    <!-- <div class="h-1 w-full overflow-hidden rounded-full bg-surface-700">
        <div class="h-full w-1/3 bg-primary-500 rounded-full" class:animate-pulse={isPlaying}></div>
    </div> -->

    <!-- Controls -->
    <div class="flex items-center justify-evenly pt-1">
        <button
            class="rounded-full p-2 text-surface-400 transition-all hover:bg-surface-800 hover:text-white hover:scale-110 active:scale-95 disabled:opacity-50"
            on:click={prevTrack}
            disabled={!isReady}
            aria-label="Previous Track"
        >
            <SkipBack size={22} strokeWidth={2} />
        </button>

        <button
            class="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg shadow-white/10 transition-all hover:scale-110 hover:shadow-white/20 active:scale-95 disabled:opacity-50 disabled:bg-surface-600 disabled:text-surface-400"
            on:click={togglePlay}
            disabled={!isReady}
            aria-label={isPlaying ? "Pause" : "Play"}
        >
            {#if isPlaying}
                <Pause size={24} fill="currentColor" strokeWidth={0} />
            {:else}
                <Play
                    size={24}
                    fill="currentColor"
                    strokeWidth={0}
                    class="ml-1"
                />
            {/if}
        </button>

        <button
            class="rounded-full p-2 text-surface-400 transition-all hover:bg-surface-800 hover:text-white hover:scale-110 active:scale-95 disabled:opacity-50"
            on:click={nextTrack}
            disabled={!isReady}
            aria-label="Next Track"
        >
            <SkipForward size={22} strokeWidth={2} />
        </button>
    </div>

    <!-- Volume Control -->
    <div class="flex items-center gap-2 px-2 pt-2">
        <Volume2 size={16} class="text-surface-400" />
        <input
            type="range"
            min="0"
            max="100"
            bind:value={volume}
            on:input={updateVolume}
            class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-700 accent-primary-500"
        />
    </div>
</div>
