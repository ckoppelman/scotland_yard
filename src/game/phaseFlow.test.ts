import { describe, expect, it } from "vitest";
import { TurnPhase } from "./gameState";
import { MACRO_PHASE_CYCLE, completeCurrentPhase, detectivePhase, fugitivePhase } from "./phases";
import { makeGameState, oneFugitiveRoster, twoFugitiveRoster } from "../test/gameFixtures";

describe("MACRO_PHASE_CYCLE", () => {
    it("lists the macro round in order", () => {
        expect(MACRO_PHASE_CYCLE).toEqual([
            TurnPhase.DETECTIVE,
            TurnPhase.PRIVACY_FUGITIVE,
            TurnPhase.FUGITIVE,
            TurnPhase.PRIVACY_DETECTIVE,
            TurnPhase.FUGITIVE_CUTSCENE,
        ]);
    });
});

describe("player turn phases", () => {
    it("stays on detective while more detectives remain", () => {
        const state = makeGameState({
            players: twoFugitiveRoster(),
            currentTurn: { playerOrdinal: 1, phase: TurnPhase.DETECTIVE },
        });
        const result = detectivePhase.complete(state);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.advanced).toBe(false);
        expect(result.state.currentTurn.phase).toBe(TurnPhase.DETECTIVE);
    });

    it("opens fugitive privacy after the last detective", () => {
        const state = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { playerOrdinal: 2, phase: TurnPhase.DETECTIVE },
        });
        const result = detectivePhase.complete(state);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.advanced).toBe(true);
        expect(result.to).toBe(TurnPhase.PRIVACY_FUGITIVE);
    });

    it("stays on fugitive while more fugitives remain", () => {
        const state = makeGameState({
            players: twoFugitiveRoster(),
            currentTurn: { playerOrdinal: 3, phase: TurnPhase.FUGITIVE },
        });
        const result = fugitivePhase.complete(state);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.advanced).toBe(false);
        expect(result.state.currentTurn.phase).toBe(TurnPhase.FUGITIVE);
    });
});

describe("completeCurrentPhase", () => {
    it("only advances privacy phases when complete is called from that phase", () => {
        const privacy = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.PRIVACY_FUGITIVE },
        });
        const detectives = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.DETECTIVE },
        });

        const privacyResult = completeCurrentPhase(privacy);
        const detectiveResult = completeCurrentPhase(detectives);
        expect(privacyResult.ok).toBe(true);
        expect(detectiveResult.ok).toBe(true);
        if (!detectiveResult.ok) return;
        expect(detectiveResult.advanced).toBe(false);
    });

    it("marks fugitive privacy dismissed when leaving Mr X privacy", () => {
        const state = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.PRIVACY_FUGITIVE },
        });
        const result = completeCurrentPhase(state);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.to).toBe(TurnPhase.FUGITIVE);
        expect(result.state.fugitivePrivacyDismissed).toBe(true);
    });

    it("advances cutscene to detective", () => {
        const state = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.FUGITIVE_CUTSCENE },
        });
        const result = completeCurrentPhase(state);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.state.currentTurn.phase).toBe(TurnPhase.DETECTIVE);
    });

    it("rejects complete when the handler does not match state phase", () => {
        const state = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.FUGITIVE_CUTSCENE },
        });
        const result = detectivePhase.complete(state);
        expect(result.ok).toBe(false);
    });

    it("transitions to game over when winner is set", () => {
        const state = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.DETECTIVE },
            winner: { winner: "detective", detectiveWinReason: "test" },
        });
        const result = completeCurrentPhase(state);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.state.currentTurn.phase).toBe(TurnPhase.GAME_OVER);
    });
});
