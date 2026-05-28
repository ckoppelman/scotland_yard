export type MusicMode = "ambient" | "detective" | "fugitive";

export type MusicThemeId = "default";

export type MusicThemeOption = {
    id: MusicThemeId;
    label: string;
};

export const MUSIC_THEME_OPTIONS: MusicThemeOption[] = [{ id: "default", label: "Default" }];

export const DEFAULT_MUSIC_THEME_ID: MusicThemeId = "default";

const MANIFEST_URL = "/audio/music/manifest.json";

type MusicManifest = Partial<Record<MusicThemeId, Partial<Record<MusicMode, string[]>>>>;

let tracksByTheme: MusicManifest = {};
let loaded = false;
let loading: Promise<void> | null = null;
const loadListeners = new Set<() => void>();

function notifyTracksLoaded(): void {
    for (const listener of loadListeners) {
        listener();
    }
}

/** Subscribe to manifest load; fires immediately if tracks are already available. */
export function onMusicTracksLoaded(listener: () => void): () => void {
    loadListeners.add(listener);
    if (loaded) listener();
    return () => {
        loadListeners.delete(listener);
    };
}

/** Fetch theme/mode tracks from the generated manifest (see vite/musicManifestPlugin.ts). */
export function loadMusicTracks(): Promise<void> {
    if (loaded) return Promise.resolve();
    if (loading) return loading;

    loading = fetch(MANIFEST_URL)
        .then((response) => {
            if (!response.ok) throw new Error(`Music manifest missing (${response.status})`);
            return response.json() as Promise<MusicManifest>;
        })
        .then((manifest) => {
            tracksByTheme = manifest;
            loaded = true;
            notifyTracksLoaded();
        })
        .catch(() => {
            tracksByTheme = {};
            loaded = true;
            notifyTracksLoaded();
        });

    return loading;
}

export function isMusicThemeId(value: string): value is MusicThemeId {
    return value in tracksByTheme || value === DEFAULT_MUSIC_THEME_ID;
}

/** First sorted track in the theme/mode folder (see public/audio/music/). */
export function trackForMode(mode: MusicMode, themeId: MusicThemeId = DEFAULT_MUSIC_THEME_ID): string {
    const tracks = tracksByTheme[themeId]?.[mode] ?? [];
    return tracks[0] ?? "";
}
