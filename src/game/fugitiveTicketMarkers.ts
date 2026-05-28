import type { Ticket } from "../constants";
import type { GameState } from "./gameState";

export type LatestFugitiveMove = {
    id: string;
    ticket: Ticket;
    playerName: string;
    playerOrdinal: number;
    turnNumber: number;
};

/** Fugitive moves from the round that just ended (for cutscene). */
export function latestFugitiveRoundMoves(state: GameState): LatestFugitiveMove[] {
    const moves: LatestFugitiveMove[] = [];
    for (let i = state.turnLog.length - 1; i >= 0; i--) {
        const entry = state.turnLog[i]!;
        const player = state.players[entry.playerOrdinal];
        if (player?.description.isDetective) break;
        if (entry.ticket === null) continue;
        moves.unshift({
            id: `move-${i}`,
            ticket: entry.ticket,
            playerName: player!.description.name,
            playerOrdinal: entry.playerOrdinal,
            turnNumber: entry.turnNumber,
        });
    }
    return moves;
}
