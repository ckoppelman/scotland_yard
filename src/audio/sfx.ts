import { loadSfxEnabled, loadSfxVolume } from "./appPreferences";
import { getSfxTracks, SfxType } from "./sfxTracks";

export { loadSfxTracks, SfxType, ticketToSfxType } from "./sfxTracks";

export const MIN_SFX_BEFORE_TURN_MS = 2000;

/** In-memory prefs synced from App settings. */
let sfxEnabled = loadSfxEnabled();
let sfxVolume = loadSfxVolume();
let activeSfx: HTMLAudioElement | null = null;

export function getSfxEnabled(): boolean {
    return sfxEnabled;
}

export function getSfxVolume(): number {
    return sfxVolume;
}

export function syncSfxEnabled(enabled: boolean): void {
    sfxEnabled = enabled;
    if (!enabled) stopSfx();
}

export function syncSfxVolume(volume: number): void {
    sfxVolume = volume;
    if (activeSfx) activeSfx.volume = volume;
}

export function stopSfx(): void {
    if (activeSfx === null) return;
    activeSfx.pause();
    activeSfx.currentTime = 0;
    activeSfx = null;
}

function pickTrack(type: SfxType): string | null {
    const tracks = getSfxTracks(type);
    if (tracks.length === 0) return null;
    return tracks[Math.floor(Math.random() * tracks.length)]!;
}

function startSfx(type: SfxType): boolean {
    if (!sfxEnabled) return false;

    const src = pickTrack(type);
    if (src === null) return false;

    stopSfx();

    const audio = new Audio(encodeURI(src));
    activeSfx = audio;
    audio.volume = sfxVolume;
    audio.addEventListener("ended", () => {
        if (activeSfx === audio) activeSfx = null;
    });
    void audio.play().catch(() => {
        if (activeSfx === audio) activeSfx = null;
    });
    return true;
}

/** Play one sound from the folder for this effect type. Stops any sound already playing. */
export function playSfx(type: SfxType): void {
    startSfx(type);
}

/** Start an effect and wait at least `minMs` before resolving (for turn handoffs). */
export function playSfxForAtLeast(type: SfxType, minMs = MIN_SFX_BEFORE_TURN_MS): Promise<void> {
    startSfx(type);
    if (!sfxEnabled) return Promise.resolve();
    return new Promise((resolve) => {
        window.setTimeout(resolve, minMs);
    });
}
