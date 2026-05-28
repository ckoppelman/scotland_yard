import { useEffect, useRef } from "react";
import { DEFAULT_MUSIC_VOLUME } from "./appPreferences";
import { stopSfx } from "./sfx";
import { type MusicMode, type MusicThemeId, trackForMode } from "./musicTracks";

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
    const unlockedRef = useRef(false);
    const modeRef = useRef(mode);
    const enabledRef = useRef(enabled);
    const volumeRef = useRef(volume);
    const themeIdRef = useRef(themeId);

    modeRef.current = mode;
    enabledRef.current = enabled;
    volumeRef.current = volume;
    themeIdRef.current = themeId;

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

        const src = trackForMode(mode, themeId);
        const playCurrent = async () => {
            if (currentSrcRef.current !== src) {
                stopSfx();
                audio.pause();
                audio.src = src;
                currentSrcRef.current = src;
            }
            if (!audio.paused && currentSrcRef.current === src) return;
            try {
                await audio.play();
                unlockedRef.current = true;
            } catch {
                /* autoplay policy — unlock listener will retry */
            }
        };

        void playCurrent();
    }, [mode, enabled, themeId]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = volume;
    }, [volume]);

    useEffect(() => {
        const unlock = () => {
            if (!enabledRef.current || unlockedRef.current) return;
            const audio = audioRef.current;
            if (!audio) return;
            const src = trackForMode(modeRef.current, themeIdRef.current);
            if (currentSrcRef.current !== src) {
                stopSfx();
                audio.src = src;
                currentSrcRef.current = src;
            }
            void audio.play().then(() => {
                unlockedRef.current = true;
            }).catch(() => {
                /* still blocked */
            });
        };

        window.addEventListener("pointerdown", unlock);
        return () => window.removeEventListener("pointerdown", unlock);
    }, []);
}
