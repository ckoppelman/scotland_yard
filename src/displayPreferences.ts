const ANIMATIONS_ENABLED_KEY = "scotland-yard:animations-enabled";

export function loadAnimationsEnabled(): boolean {
    try {
        const raw = localStorage.getItem(ANIMATIONS_ENABLED_KEY);
        if (raw === null) return true;
        return raw === "true";
    } catch {
        return true;
    }
}

export function saveAnimationsEnabled(enabled: boolean): void {
    try {
        localStorage.setItem(ANIMATIONS_ENABLED_KEY, String(enabled));
    } catch {
        /* ignore quota / private mode */
    }
}

/** In-memory flag for future gameplay animations; synced from App settings. */
let animationsEnabled = loadAnimationsEnabled();

export function getAnimationsEnabled(): boolean {
    return animationsEnabled;
}

export function syncAnimationsEnabled(enabled: boolean): void {
    animationsEnabled = enabled;
    saveAnimationsEnabled(enabled);
}
