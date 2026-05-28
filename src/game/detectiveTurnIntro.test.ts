import { describe, expect, it, vi } from "vitest";
import {
    buildDetectiveTurnIntro,
    fugitiveCutsceneToken,
    isEnteringFugitiveCutscene,
    isFugitiveCutscenePhase,
    isRevealTurn,
} from "./detectiveTurnIntro";
import { TurnPhase } from "./gameState";
import { makeGameState, oneFugitiveRoster, twoFugitiveRoster, TURNS_24 } from "../test/gameFixtures";

describe("isFugitiveCutscenePhase", () => {
    it("is true only in fugitive cutscene phase", () => {
        const s = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.FUGITIVE_CUTSCENE },
        });
        expect(isFugitiveCutscenePhase(s)).toBe(true);
    });

    it("is false during detective play", () => {
        const s = makeGameState({ players: oneFugitiveRoster() });
        expect(isFugitiveCutscenePhase(s)).toBe(false);
    });
});

describe("isEnteringFugitiveCutscene", () => {
    it("detects privacy detective to cutscene", () => {
        const prev = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.PRIVACY_DETECTIVE },
        });
        const next = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.FUGITIVE_CUTSCENE },
        });
        expect(isEnteringFugitiveCutscene(prev, next)).toBe(true);
    });

    it("is false for privacy fugitive to fugitive", () => {
        const prev = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.PRIVACY_FUGITIVE },
        });
        const next = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.FUGITIVE, playerOrdinal: 2 },
        });
        expect(isEnteringFugitiveCutscene(prev, next)).toBe(false);
    });

    it("is false for cutscene to detective", () => {
        const prev = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.FUGITIVE_CUTSCENE },
        });
        const next = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.DETECTIVE },
        });
        expect(isEnteringFugitiveCutscene(prev, next)).toBe(false);
    });
});

describe("isRevealTurn", () => {
    it("reads showMrX from the prior round index", () => {
        const revealTurns = TURNS_24.map((_t, i) => ({ showMrX: i === 0 }));
        const s = makeGameState({
            players: oneFugitiveRoster(),
            turns: revealTurns,
            currentTurn: { turnNumber: 1, phase: TurnPhase.DETECTIVE },
        });
        expect(isRevealTurn(s)).toBe(true);
    });

    it("returns false on hide rounds", () => {
        const s = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { turnNumber: 2, phase: TurnPhase.DETECTIVE },
        });
        expect(isRevealTurn(s)).toBe(false);
    });
});

describe("fugitiveCutsceneToken", () => {
    it("combines turn number and turn log length", () => {
        const s = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { turnNumber: 5 },
            turnLog: [
                {
                    turnNumber: 4,
                    playerOrdinal: 2,
                    ticket: "taxi",
                    position: 3,
                },
            ],
        });
        expect(fugitiveCutsceneToken(s)).toBe("5-1");
    });
});

describe("buildDetectiveTurnIntro", () => {
    it("includes all fugitive moves from the ending round", () => {
        const prev = makeGameState({
            players: twoFugitiveRoster(),
            currentTurn: { turnNumber: 2, phase: TurnPhase.FUGITIVE_CUTSCENE },
            turnLog: [
                { turnNumber: 1, playerOrdinal: 2, ticket: "taxi", position: 4 },
                { turnNumber: 1, playerOrdinal: 3, ticket: "bus", position: 3 },
            ],
        });
        const preview = makeGameState({
            players: twoFugitiveRoster(),
            currentTurn: { turnNumber: 2, phase: TurnPhase.DETECTIVE },
        });

        const intro = buildDetectiveTurnIntro(prev, preview);
        expect(intro.latestMoves).toHaveLength(2);
        expect(intro.latestMoves[0]?.ticket).toBe("taxi");
        expect(intro.latestMoves[1]?.ticket).toBe("bus");
    });

    it("marks reveal turns from preview detective state", () => {
        const revealTurns = TURNS_24.map((_t, i) => ({ showMrX: i === 0 }));
        const prev = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { turnNumber: 1, phase: TurnPhase.FUGITIVE_CUTSCENE },
        });
        const preview = makeGameState({
            players: oneFugitiveRoster(),
            turns: revealTurns,
            currentTurn: { turnNumber: 1, phase: TurnPhase.DETECTIVE },
        });

        expect(buildDetectiveTurnIntro(prev, preview).isRevealTurn).toBe(true);
    });

    it("assigns a unique key per build", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-05-26T12:00:00Z"));
        const prev = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.FUGITIVE_CUTSCENE },
        });
        const preview = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.DETECTIVE },
        });

        const first = buildDetectiveTurnIntro(prev, preview);
        vi.setSystemTime(new Date("2026-05-26T12:00:01Z"));
        const second = buildDetectiveTurnIntro(prev, preview);

        expect(first.key).not.toBe(second.key);
        vi.useRealTimers();
    });
});
