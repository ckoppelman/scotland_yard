import { DEFAULT_MUSIC_THEME_ID, isMusicThemeId, type MusicThemeId } from "./musicTracks";

const MUSIC_ENABLED_KEY = "scotland-yard:music-enabled";
const MUSIC_VOLUME_KEY = "scotland-yard:music-volume";
const SFX_ENABLED_KEY = "scotland-yard:sfx-enabled";
const SFX_VOLUME_KEY = "scotland-yard:sfx-volume";
const MUSIC_THEME_KEY = "scotland-yard:music-theme";

export const DEFAULT_MUSIC_VOLUME = 0.35;
export const DEFAULT_SFX_VOLUME = 1;

function clampVolume(value: number, fallback: number): number {
    if (!Number.isFinite(value)) return fallback;
    return Math.min(1, Math.max(0, value));
}

export function loadMusicEnabled(): boolean {
    try {
        const raw = localStorage.getItem(MUSIC_ENABLED_KEY);
        if (raw === null) return true;
        return raw === "true";
    } catch {
        return true;
    }
}

export function saveMusicEnabled(enabled: boolean): void {
    try {
        localStorage.setItem(MUSIC_ENABLED_KEY, String(enabled));
    } catch {
        /* ignore quota / private mode */
    }
}

export function loadMusicVolume(): number {
    try {
        const raw = localStorage.getItem(MUSIC_VOLUME_KEY);
        if (raw === null) return DEFAULT_MUSIC_VOLUME;
        return clampVolume(Number.parseFloat(raw), DEFAULT_MUSIC_VOLUME);
    } catch {
        return DEFAULT_MUSIC_VOLUME;
    }
}

export function saveMusicVolume(volume: number): void {
    try {
        localStorage.setItem(MUSIC_VOLUME_KEY, String(clampVolume(volume, DEFAULT_MUSIC_VOLUME)));
    } catch {
        /* ignore quota / private mode */
    }
}

export function loadSfxEnabled(): boolean {
    try {
        const raw = localStorage.getItem(SFX_ENABLED_KEY);
        if (raw === null) return true;
        return raw === "true";
    } catch {
        return true;
    }
}

export function saveSfxEnabled(enabled: boolean): void {
    try {
        localStorage.setItem(SFX_ENABLED_KEY, String(enabled));
    } catch {
        /* ignore quota / private mode */
    }
}

export function loadSfxVolume(): number {
    try {
        const raw = localStorage.getItem(SFX_VOLUME_KEY);
        if (raw === null) return DEFAULT_SFX_VOLUME;
        return clampVolume(Number.parseFloat(raw), DEFAULT_SFX_VOLUME);
    } catch {
        return DEFAULT_SFX_VOLUME;
    }
}

export function saveSfxVolume(volume: number): void {
    try {
        localStorage.setItem(SFX_VOLUME_KEY, String(clampVolume(volume, DEFAULT_SFX_VOLUME)));
    } catch {
        /* ignore quota / private mode */
    }
}

export function loadMusicThemeId(): MusicThemeId {
    try {
        const raw = localStorage.getItem(MUSIC_THEME_KEY);
        if (raw === null) return DEFAULT_MUSIC_THEME_ID;
        if (isMusicThemeId(raw)) return raw;
        return DEFAULT_MUSIC_THEME_ID;
    } catch {
        return DEFAULT_MUSIC_THEME_ID;
    }
}

export function saveMusicThemeId(themeId: MusicThemeId): void {
    try {
        localStorage.setItem(MUSIC_THEME_KEY, themeId);
    } catch {
        /* ignore quota / private mode */
    }
}
