import { describe, expect, it } from "vitest";
import { latestFugitiveRoundMoves } from "./fugitiveTicketMarkers";
import { makeGameState, oneFugitiveRoster, twoFugitiveRoster } from "../test/gameFixtures";
import { TurnPhase } from "./gameState";

describe("latestFugitiveRoundMoves", () => {
    it("returns empty when no fugitive moves exist", () => {
        const s = makeGameState({ players: oneFugitiveRoster() });
        expect(latestFugitiveRoundMoves(s)).toEqual([]);
    });

    it("returns the last fugitive move for a single fugitive", () => {
        const s = makeGameState({
            players: oneFugitiveRoster(),
            turnLog: [{ turnNumber: 1, playerOrdinal: 2, ticket: "taxi", position: 4 }],
        });
        expect(latestFugitiveRoundMoves(s)).toEqual([
            {
                id: "move-0",
                ticket: "taxi",
                playerName: "Mr X",
                playerOrdinal: 2,
                turnNumber: 1,
            },
        ]);
    });

    it("collects both fugitive moves from the same round in order", () => {
        const s = makeGameState({
            players: twoFugitiveRoster(),
            turnLog: [
                { turnNumber: 1, playerOrdinal: 2, ticket: "taxi", position: 4 },
                { turnNumber: 1, playerOrdinal: 3, ticket: "bus", position: 3 },
            ],
        });
        const moves = latestFugitiveRoundMoves(s);
        expect(moves).toHaveLength(2);
        expect(moves[0]?.playerName).toBe("Mr X");
        expect(moves[1]?.playerName).toBe("Mr Y");
    });

    it("stops collecting when a detective log entry is reached", () => {
        const s = makeGameState({
            players: twoFugitiveRoster(),
            turnLog: [
                { turnNumber: 0, playerOrdinal: 0, ticket: "taxi", position: 2 },
                { turnNumber: 1, playerOrdinal: 2, ticket: "taxi", position: 4 },
            ],
        });
        expect(latestFugitiveRoundMoves(s)).toHaveLength(1);
        expect(latestFugitiveRoundMoves(s)[0]?.playerOrdinal).toBe(2);
    });

    it("skips entries without a ticket", () => {
        const s = makeGameState({
            players: oneFugitiveRoster(),
            turnLog: [
                { turnNumber: 1, playerOrdinal: 2, ticket: null, position: 3 },
                { turnNumber: 1, playerOrdinal: 2, ticket: "black", position: 4 },
            ],
        });
        expect(latestFugitiveRoundMoves(s)).toHaveLength(1);
        expect(latestFugitiveRoundMoves(s)[0]?.ticket).toBe("black");
    });

    it("includes double-move legs from the same fugitive", () => {
        const s = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.FUGITIVE, playerOrdinal: 2 },
            turnLog: [
                { turnNumber: 1, playerOrdinal: 2, ticket: "taxi", position: 2, doubleMovePart: 1 },
                { turnNumber: 1, playerOrdinal: 2, ticket: "bus", position: 3, doubleMovePart: 2 },
            ],
        });
        expect(latestFugitiveRoundMoves(s)).toHaveLength(2);
    });
});
