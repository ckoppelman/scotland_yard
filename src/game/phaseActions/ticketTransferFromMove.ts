import type { Ticket } from "../../constants";
import type { GameState } from "../gameState";
import type { MoveActionContext } from "./types";

export type TicketTransferTargets = {
    ticket: Ticket;
    detectiveId: string;
    fugitiveId: string;
};

/** Resolve detective → fugitive transfer animation targets from a completed move. */
export function ticketTransferTargetsFromMove(move: MoveActionContext): TicketTransferTargets | null {
    const last = move.next.turnLog.at(-1);
    if (last?.ticket === null || last?.ticket === undefined) return null;

    const moverOrdinal = move.prev.currentTurn.playerOrdinal;
    const mover = move.prev.players[moverOrdinal];
    if (mover === undefined || !mover.description.isDetective) return null;

    const fugitive = move.next.players.find((p) => !p.description.isDetective);
    if (fugitive === undefined) return null;

    return {
        ticket: last.ticket,
        detectiveId: mover.description.id,
        fugitiveId: fugitive.description.id,
    };
}

export function ticketTransferTargetsFromState(state: GameState): TicketTransferTargets | null {
    const last = state.turnLog.at(-1);
    if (last?.ticket === null || last?.ticket === undefined) return null;
    const mover = state.players[last.playerOrdinal];
    if (mover === undefined || !mover.description.isDetective) return null;
    const fugitive = state.players.find((p) => !p.description.isDetective);
    if (fugitive === undefined) return null;
    return {
        ticket: last.ticket,
        detectiveId: mover.description.id,
        fugitiveId: fugitive.description.id,
    };
}
