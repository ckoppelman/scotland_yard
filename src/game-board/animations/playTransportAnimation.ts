import type { Ticket } from "../../constants";
import { getAnimationsEnabled } from "../../displayPreferences";
import { isTransportAnimationTicket, transportEmojiForTicket } from "./transportEmoji";

export type TransportAnimationBurst = { emoji: string; id: number };

export function createTransportAnimationBurst(ticket: Ticket): TransportAnimationBurst | null {
    if (!getAnimationsEnabled() || !isTransportAnimationTicket(ticket)) return null;
    const emoji = transportEmojiForTicket(ticket);
    if (emoji === null) return null;
    return { emoji, id: Date.now() };
}

export function createFugitivePoofBurst(mode: "in" | "out"): { mode: "in" | "out"; key: number } | null {
    if (!getAnimationsEnabled()) return null;
    return { mode, key: Date.now() };
}
