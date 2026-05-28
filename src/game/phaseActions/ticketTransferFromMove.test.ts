import { describe, expect, it } from "vitest";
import { TurnPhase } from "../gameState";
import { ticketTransferTargetsFromMove } from "./ticketTransferFromMove";
import { makeGameState, oneFugitiveRoster } from "../../test/gameFixtures";

describe("ticketTransferTargetsFromMove", () => {
    it("returns detective and fugitive ids with the spent ticket", () => {
        const prev = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { playerOrdinal: 0, phase: TurnPhase.DETECTIVE },
        });
        const next = {
            ...prev,
            turnLog: [
                {
                    turnNumber: 1,
                    playerOrdinal: 0,
                    ticket: "bus" as const,
                    position: 2,
                },
            ],
        };

        expect(ticketTransferTargetsFromMove({ prev, next })).toEqual({
            ticket: "bus",
            detectiveId: "det-0",
            fugitiveId: "fug-2",
        });
    });

    it("returns null when the last log entry has no ticket", () => {
        const prev = makeGameState({ players: oneFugitiveRoster() });
        const next = { ...prev, turnLog: [] };
        expect(ticketTransferTargetsFromMove({ prev, next })).toBeNull();
    });
});
