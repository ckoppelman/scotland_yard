import { getAnimationsEnabled } from "../../displayPreferences";

export type FugitivePoofMode = "in" | "out";

export type FugitivePoofBurst = { mode: FugitivePoofMode; key: number };

export function createFugitivePoofBurst(mode: FugitivePoofMode): FugitivePoofBurst | null {
    if (!getAnimationsEnabled()) return null;
    return { mode, key: Date.now() };
}
