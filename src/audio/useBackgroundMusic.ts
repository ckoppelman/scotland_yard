import { useCallback, useEffect, useRef } from "react";
import { DEFAULT_MUSIC_VOLUME } from "./appPreferences";
import { stopSfx } from "./sfx";
import { onMusicTracksLoaded, type MusicMode, type MusicThemeId, trackForMode } from "./musicTracks";

let ensurePlayingCallback: (() => void) | null = null;

/** Resume the current background track when enabled and paused (e.g. after toggling music on). */
export function ensureBackgroundMusicPlaying(): void {
    ensurePlayingCallback?.();
}

/**
 * Loops background music for the given mode. Browsers may block autoplay until
 * the first pointer interaction; we retry on pointerdown when that happens.
 */
export function useBackgroundMusic(
    mode: MusicMode,
    enabled: boolean,
    volume: number = DEFAULT_MUSIC_VOLUME,
    themeId: MusicThemeId,
) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const currentSrcRef = useRef<string | null>(null);
    const modeRef = useRef(mode);
    const enabledRef = useRef(enabled);
    const volumeRef = useRef(volume);
    const themeIdRef = useRef(themeId);

    modeRef.current = mode;
    enabledRef.current = enabled;
    volumeRef.current = volume;
    themeIdRef.current = themeId;

    const ensurePlaying = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || !enabledRef.current) return;

        const src = trackForMode(modeRef.current, themeIdRef.current);
        if (src === "") return;

        if (currentSrcRef.current !== src) {
            stopSfx();
            audio.src = src;
            currentSrcRef.current = src;
        }

        if (audio.paused) {
            void audio.play().catch(() => {
                /* autoplay policy — pointer/visibility listeners will retry */
            });
        }
    }, []);

    useEffect(() => {
        ensurePlayingCallback = ensurePlaying;
        return () => {
            if (ensurePlayingCallback === ensurePlaying) {
                ensurePlayingCallback = null;
            }
        };
    }, [ensurePlaying]);

    useEffect(() => {
        const audio = new Audio();
        audio.loop = true;
        audio.volume = volumeRef.current;
        audioRef.current = audio;

        return () => {
            audio.pause();
            audioRef.current = null;
            currentSrcRef.current = null;
        };
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (!enabled) {
            stopSfx();
            audio.pause();
            return;
        }

        ensurePlaying();
    }, [mode, enabled, themeId, ensurePlaying]);

    useEffect(() => {
        return onMusicTracksLoaded(ensurePlaying);
    }, [ensurePlaying]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = volume;
    }, [volume]);

    useEffect(() => {
        const resumeIfNeeded = () => ensurePlaying();

        window.addEventListener("pointerdown", resumeIfNeeded);
        document.addEventListener("visibilitychange", resumeIfNeeded);
        return () => {
            window.removeEventListener("pointerdown", resumeIfNeeded);
            document.removeEventListener("visibilitychange", resumeIfNeeded);
        };
    }, [ensurePlaying]);
}
