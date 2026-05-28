import type { Ticket } from "../../constants";

export const TRANSPORT_ANIMATION_MS = 2000;

export { GAMEPLAY_ANIMATION_MS } from "./fugitivePoof";

const TICKET_EMOJI: Partial<Record<Ticket, string>> = {
    taxi: "🚕",
    bus: "🚐",
    underground: "🚈",
    black: "🛸",
};

export function transportEmojiForTicket(ticket: Ticket): string | null {
    return TICKET_EMOJI[ticket] ?? null;
}

export function isTransportAnimationTicket(ticket: Ticket): boolean {
    return transportEmojiForTicket(ticket) !== null;
}
