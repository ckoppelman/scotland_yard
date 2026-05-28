import { describe, expect, it } from "vitest";
import { TurnPhase } from "../gameState";
import { makeGameState, oneFugitiveRoster, twoFugitiveRoster } from "../../test/gameFixtures";
import {
    completeCurrentPhase,
    detectivePhase,
    detectivePrivacyPhase,
    fugitiveCutscenePhase,
    fugitivePhase,
    fugitivePrivacyPhase,
    gameOverPhase,
    getPhase,
} from "./index";

describe("getPhase", () => {
    it.each([
        [TurnPhase.DETECTIVE, detectivePhase],
        [TurnPhase.PRIVACY_FUGITIVE, fugitivePrivacyPhase],
        [TurnPhase.FUGITIVE, fugitivePhase],
        [TurnPhase.PRIVACY_DETECTIVE, detectivePrivacyPhase],
        [TurnPhase.FUGITIVE_CUTSCENE, fugitiveCutscenePhase],
        [TurnPhase.GAME_OVER, gameOverPhase],
    ] as const)("maps %s to its phase class", (turnPhase, expected) => {
        expect(getPhase(turnPhase)).toBe(expected);
    });
});

describe("DetectivePhase.complete", () => {
    it("does not advance during the first leg of a double move", () => {
        const state = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: {
                playerOrdinal: 2,
                phase: TurnPhase.DETECTIVE,
                doubleMovePart: 1,
            },
        });
        const result = detectivePhase.complete(state);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.advanced).toBe(false);
        expect(result.state.currentTurn.phase).toBe(TurnPhase.DETECTIVE);
    });

    it("does not advance when the next player is still a detective", () => {
        const state = makeGameState({
            players: twoFugitiveRoster(),
            currentTurn: { playerOrdinal: 1, phase: TurnPhase.DETECTIVE },
        });
        const result = detectivePhase.complete(state);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.advanced).toBe(false);
    });

    it("advances to fugitive privacy after the last detective moves", () => {
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
});

describe("FugitivePhase.complete", () => {
    it("does not advance during the first leg of a double move", () => {
        const state = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: {
                playerOrdinal: 2,
                phase: TurnPhase.FUGITIVE,
                doubleMovePart: 1,
            },
        });
        const result = fugitivePhase.complete(state);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.advanced).toBe(false);
    });

    it("does not advance when another fugitive is still to move", () => {
        const state = makeGameState({
            players: twoFugitiveRoster(),
            currentTurn: { playerOrdinal: 3, phase: TurnPhase.FUGITIVE },
        });
        const result = fugitivePhase.complete(state);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.advanced).toBe(false);
    });

    it("advances to detective privacy after the last fugitive moves", () => {
        const state = makeGameState({
            players: twoFugitiveRoster(),
            currentTurn: { playerOrdinal: 0, phase: TurnPhase.FUGITIVE },
        });
        const result = fugitivePhase.complete(state);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.advanced).toBe(true);
        expect(result.to).toBe(TurnPhase.PRIVACY_DETECTIVE);
    });
});

describe("privacy and cutscene phases", () => {
    it("fugitive privacy advances to fugitive play and marks dismissed", () => {
        const state = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.PRIVACY_FUGITIVE, playerOrdinal: 2 },
        });
        const result = fugitivePrivacyPhase.complete(state);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.advanced).toBe(true);
        expect(result.to).toBe(TurnPhase.FUGITIVE);
        expect(result.state.fugitivePrivacyDismissed).toBe(true);
    });

    it("detective privacy advances to the fugitive cutscene", () => {
        const state = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.PRIVACY_DETECTIVE, playerOrdinal: 0 },
        });
        const result = detectivePrivacyPhase.complete(state);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.advanced).toBe(true);
        expect(result.to).toBe(TurnPhase.FUGITIVE_CUTSCENE);
    });

    it("cutscene advances back to detective play", () => {
        const state = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.FUGITIVE_CUTSCENE, playerOrdinal: 0 },
        });
        const result = fugitiveCutscenePhase.complete(state);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.advanced).toBe(true);
        expect(result.to).toBe(TurnPhase.DETECTIVE);
    });
});

describe("GameOverPhase.complete", () => {
    it("never advances from game over", () => {
        const state = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.GAME_OVER },
            winner: { winner: "mrX", fugitiveWinReason: "escaped" },
        });
        const result = gameOverPhase.complete(state);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.advanced).toBe(false);
        expect(result.state.currentTurn.phase).toBe(TurnPhase.GAME_OVER);
    });
});

describe("completeCurrentPhase macro cycle", () => {
    function advance(state: ReturnType<typeof makeGameState>) {
        const result = completeCurrentPhase(state);
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error(result.message);
        return result;
    }

    it("walks the locked macro round in order", () => {
        let state = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { playerOrdinal: 2, phase: TurnPhase.DETECTIVE },
        });

        state = advance(state).state;
        expect(state.currentTurn.phase).toBe(TurnPhase.PRIVACY_FUGITIVE);

        state = advance(state).state;
        expect(state.currentTurn.phase).toBe(TurnPhase.FUGITIVE);

        // Mr X finished; next player is the first detective.
        state = {
            ...state,
            currentTurn: { ...state.currentTurn, playerOrdinal: 0 },
        };
        state = advance(state).state;
        expect(state.currentTurn.phase).toBe(TurnPhase.PRIVACY_DETECTIVE);

        state = advance(state).state;
        expect(state.currentTurn.phase).toBe(TurnPhase.FUGITIVE_CUTSCENE);

        state = advance(state).state;
        expect(state.currentTurn.phase).toBe(TurnPhase.DETECTIVE);
    });

    it("does not advance gameplay phases until handoff conditions are met", () => {
        const midDetectiveRound = makeGameState({
            players: twoFugitiveRoster(),
            currentTurn: { playerOrdinal: 1, phase: TurnPhase.DETECTIVE },
        });
        const result = completeCurrentPhase(midDetectiveRound);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.advanced).toBe(false);
        expect(result.state.currentTurn.phase).toBe(TurnPhase.DETECTIVE);
    });
});

describe("phase presentation actions", () => {
    it("exposes entry actions for each playable macro phase", () => {
        expect(detectivePhase.entryActions().length).toBeGreaterThan(0);
        expect(fugitivePrivacyPhase.entryActions().length).toBeGreaterThan(0);
        expect(fugitivePhase.entryActions().length).toBeGreaterThan(0);
        expect(detectivePrivacyPhase.entryActions().length).toBeGreaterThan(0);
        expect(fugitiveCutscenePhase.entryActions().length).toBeGreaterThan(0);
        expect(gameOverPhase.entryActions()).toHaveLength(0);
    });

    it("exposes post-move actions only for detective and fugitive rounds", () => {
        expect(detectivePhase.postMoveActions().length).toBeGreaterThan(0);
        expect(fugitivePhase.postMoveActions().length).toBeGreaterThan(0);
        expect(fugitivePrivacyPhase.postMoveActions()).toHaveLength(0);
        expect(fugitiveCutscenePhase.postMoveActions()).toHaveLength(0);
    });
});
