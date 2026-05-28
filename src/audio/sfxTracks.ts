import type { Ticket } from "../constants";

/** One folder under `public/audio/sfx/` per effect type. */
export enum SfxType {
    TAXI = "taxi",
    BUS = "bus",
    UNDERGROUND = "underground",
    BLACK = "black",
    DOUBLE = "double",
    NEXT_TURN = "next-turn",
    CANCEL = "cancel",
    GAME_OVER = "game-over",
    FUGITIVE_REVEAL = "fugitive-reveal",
    FUGITIVE_HIDE = "fugitive-hide",
}

const MANIFEST_URL = "/audio/sfx/manifest.json";

let tracksByFolder: Record<string, string[]> = {};
let loaded = false;
let loading: Promise<void> | null = null;

/** Fetch folder contents from the generated manifest (see vite/sfxManifestPlugin.ts). */
export function loadSfxTracks(): Promise<void> {
    if (loaded) return Promise.resolve();
    if (loading) return loading;

    loading = fetch(MANIFEST_URL)
        .then((response) => {
            if (!response.ok) throw new Error(`SFX manifest missing (${response.status})`);
            return response.json() as Promise<Record<string, string[]>>;
        })
        .then((manifest) => {
            tracksByFolder = manifest;
            loaded = true;
        })
        .catch(() => {
            tracksByFolder = {};
            loaded = true;
        });

    return loading;
}

export function getSfxTracks(type: SfxType): readonly string[] {
    return tracksByFolder[type] ?? [];
}

export function ticketToSfxType(ticket: Ticket): SfxType | null {
    switch (ticket) {
        case "taxi":
            return SfxType.TAXI;
        case "bus":
            return SfxType.BUS;
        case "underground":
            return SfxType.UNDERGROUND;
        case "black":
            return SfxType.BLACK;
        case "double":
            return null;
    }
}
