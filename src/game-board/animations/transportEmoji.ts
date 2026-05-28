import type { Ticket } from "../../constants";

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
