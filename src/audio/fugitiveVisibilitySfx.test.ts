import { describe, expect, it } from "vitest";
import { fugitiveVisibilitySfxType, isHandoffToFugitiveRound } from "./fugitiveVisibilitySfx";
import { SfxType } from "./sfxTracks";
import { TurnPhase } from "../game/gameState";
import {
    makeGameState,
    oneFugitiveRoster,
    threeFugitiveRoster,
    transition,
    twoFugitiveRoster,
} from "../test/gameFixtures";

describe("isHandoffToFugitiveRound", () => {
    const roster = twoFugitiveRoster();

    it("detects privacy fugitive clearing into play", () => {
        const prev = makeGameState({
            players: roster,
            currentTurn: { phase: TurnPhase.PRIVACY_FUGITIVE, playerOrdinal: 2 },
        });
        const next = transition(prev, { phase: TurnPhase.FUGITIVE });
        expect(isHandoffToFugitiveRound(prev, next)).toBe(true);
    });

    it("detects detective to fugitive privacy gate", () => {
        const prev = makeGameState({
            players: roster,
            currentTurn: { phase: TurnPhase.DETECTIVE, playerOrdinal: 1 },
        });
        const next = transition(prev, { phase: TurnPhase.PRIVACY_FUGITIVE, playerOrdinal: 2 });
        expect(isHandoffToFugitiveRound(prev, next)).toBe(true);
    });

    it("detects direct detective to fugitive when privacy was dismissed", () => {
        const prev = makeGameState({
            players: roster,
            currentTurn: { phase: TurnPhase.DETECTIVE, playerOrdinal: 1 },
        });
        const next = transition(prev, { phase: TurnPhase.FUGITIVE, playerOrdinal: 2 });
        expect(isHandoffToFugitiveRound(prev, next)).toBe(true);
    });

    it("detects handoff between two fugitives", () => {
        const prev = makeGameState({
            players: roster,
            currentTurn: { phase: TurnPhase.FUGITIVE, playerOrdinal: 2 },
        });
        const next = transition(prev, { phase: TurnPhase.FUGITIVE, playerOrdinal: 3 });
        expect(isHandoffToFugitiveRound(prev, next)).toBe(true);
    });

    it("is false for detective to detective", () => {
        const prev = makeGameState({
            players: roster,
            currentTurn: { phase: TurnPhase.DETECTIVE, playerOrdinal: 0 },
        });
        const next = transition(prev, { phase: TurnPhase.DETECTIVE, playerOrdinal: 1 });
        expect(isHandoffToFugitiveRound(prev, next)).toBe(false);
    });

    it("is false for fugitive round ending at detective privacy", () => {
        const prev = makeGameState({
            players: roster,
            currentTurn: { phase: TurnPhase.FUGITIVE, playerOrdinal: 3 },
        });
        const next = transition(prev, { phase: TurnPhase.PRIVACY_DETECTIVE, playerOrdinal: 0, turnNumber: 2 });
        expect(isHandoffToFugitiveRound(prev, next)).toBe(false);
    });
});

describe("fugitiveVisibilitySfxType — suppressed handoffs", () => {
    const roster = twoFugitiveRoster();

    it.each([
        ["detective to fugitive privacy", TurnPhase.DETECTIVE, 1, TurnPhase.PRIVACY_FUGITIVE, 2],
        ["privacy fugitive to fugitive", TurnPhase.PRIVACY_FUGITIVE, 2, TurnPhase.FUGITIVE, 2],
        ["Mr X to Mr Y", TurnPhase.FUGITIVE, 2, TurnPhase.FUGITIVE, 3],
        ["Mr Y to detective privacy", TurnPhase.FUGITIVE, 3, TurnPhase.PRIVACY_DETECTIVE, 0],
        ["privacy detective to cutscene", TurnPhase.PRIVACY_DETECTIVE, 0, TurnPhase.FUGITIVE_CUTSCENE, 0],
        ["leaving cutscene", TurnPhase.FUGITIVE_CUTSCENE, 0, TurnPhase.DETECTIVE, 0],
    ] as const)(
        "returns null for %s",
        (_label, prevPhase, prevOrdinal, nextPhase, nextOrdinal) => {
            const prev = makeGameState({
                players: roster,
                currentTurn: { phase: prevPhase, playerOrdinal: prevOrdinal, turnNumber: 2 },
            });
            const next = transition(prev, {
                phase: nextPhase,
                playerOrdinal: nextOrdinal,
                turnNumber: nextPhase === TurnPhase.PRIVACY_DETECTIVE ? 2 : prev.currentTurn.turnNumber,
            });
            expect(fugitiveVisibilitySfxType(prev, next)).toBeNull();
        },
    );
});

describe("fugitiveVisibilitySfxType — single fugitive", () => {
    const roster = oneFugitiveRoster();

    it("suppresses reveal when detectives hand off to Mr X", () => {
        const prev = makeGameState({
            players: roster,
            currentTurn: { phase: TurnPhase.DETECTIVE, playerOrdinal: 1 },
        });
        const next = transition(prev, { phase: TurnPhase.FUGITIVE, playerOrdinal: 2 });
        expect(fugitiveVisibilitySfxType(prev, next)).toBeNull();
    });

    it("suppresses when Mr X finishes and detective privacy begins", () => {
        const prev = makeGameState({
            players: roster,
            currentTurn: { phase: TurnPhase.FUGITIVE, playerOrdinal: 2, turnNumber: 1 },
        });
        const next = transition(prev, {
            phase: TurnPhase.PRIVACY_DETECTIVE,
            playerOrdinal: 0,
            turnNumber: 2,
        });
        expect(fugitiveVisibilitySfxType(prev, next)).toBeNull();
    });
});

describe("fugitiveVisibilitySfxType — three fugitives", () => {
    const roster = threeFugitiveRoster();

    it.each([
        [2, 3],
        [3, 4],
    ] as const)("suppresses handoff from ordinal %i to %i", (from, to) => {
        const prev = makeGameState({
            players: roster,
            currentTurn: { phase: TurnPhase.FUGITIVE, playerOrdinal: from },
        });
        const next = transition(prev, { phase: TurnPhase.FUGITIVE, playerOrdinal: to });
        expect(fugitiveVisibilitySfxType(prev, next)).toBeNull();
    });

    it("suppresses only after the last fugitive moves", () => {
        const prev = makeGameState({
            players: roster,
            currentTurn: { phase: TurnPhase.FUGITIVE, playerOrdinal: 4 },
        });
        const next = transition(prev, {
            phase: TurnPhase.PRIVACY_DETECTIVE,
            playerOrdinal: 0,
            turnNumber: 2,
        });
        expect(fugitiveVisibilitySfxType(prev, next)).toBeNull();
    });
});

describe("fugitiveVisibilitySfxType — allowed visibility changes", () => {
    it("plays reveal when a new detective round becomes a reveal round", () => {
        const turns = Array.from({ length: 24 }, (_, i) => ({ showMrX: i === 2 }));
        const roster = oneFugitiveRoster();
        const prev = makeGameState({
            players: roster,
            turns,
            currentTurn: { phase: TurnPhase.DETECTIVE, playerOrdinal: 0, turnNumber: 2 },
        });
        const next = transition(prev, { phase: TurnPhase.DETECTIVE, playerOrdinal: 1, turnNumber: 3 });
        expect(fugitiveVisibilitySfxType(prev, next)).toBe(SfxType.FUGITIVE_REVEAL);
    });

    it("plays hide when a new detective round becomes a hide round", () => {
        const turns = Array.from({ length: 24 }, (_, i) => ({ showMrX: i === 1 }));
        const roster = oneFugitiveRoster();
        const prev = makeGameState({
            players: roster,
            turns,
            currentTurn: { phase: TurnPhase.DETECTIVE, playerOrdinal: 0, turnNumber: 2 },
        });
        const next = transition(prev, { phase: TurnPhase.DETECTIVE, playerOrdinal: 1, turnNumber: 3 });
        expect(fugitiveVisibilitySfxType(prev, next)).toBe(SfxType.FUGITIVE_HIDE);
    });

    it("returns null when visibility does not change", () => {
        const prev = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.DETECTIVE, playerOrdinal: 0, turnNumber: 1 },
        });
        const next = transition(prev, { phase: TurnPhase.DETECTIVE, playerOrdinal: 1, turnNumber: 1 });
        expect(fugitiveVisibilitySfxType(prev, next)).toBeNull();
    });
});
