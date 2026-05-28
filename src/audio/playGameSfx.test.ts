import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { playImmediateGameSfx, playPreTurnChangeSfx, turnWillChange } from "./playGameSfx";
import { SfxType } from "./sfxTracks";
import { TurnPhase } from "../game/gameState";
import { makeGameState, oneFugitiveRoster, transition, twoFugitiveRoster } from "../test/gameFixtures";

const playSfxForAtLeast = vi.fn();
const playSfx = vi.fn();

vi.mock("./sfx", async (importOriginal) => {
    const actual = await importOriginal<typeof import("./sfx")>();
    return {
        ...actual,
        playSfx: (...args: Parameters<typeof actual.playSfx>) => playSfx(...args),
        playSfxForAtLeast: (...args: Parameters<typeof actual.playSfxForAtLeast>) =>
            playSfxForAtLeast(...args),
    };
});

describe("turnWillChange", () => {
    const roster = oneFugitiveRoster();

    it("is true when the active player advances", () => {
        const prev = makeGameState({ players: roster, currentTurn: { playerOrdinal: 0 } });
        const next = transition(prev, { playerOrdinal: 1 });
        expect(turnWillChange(prev, next)).toBe(true);
    });

    it("is false when only the ticket changes on the same player", () => {
        const prev = makeGameState({ players: roster, currentTurn: { playerOrdinal: 0, ticket: null } });
        const next = transition(prev, { ticket: "taxi" });
        expect(turnWillChange(prev, next)).toBe(false);
    });

    it("is true when privacy is cleared", () => {
        const prev = makeGameState({
            players: roster,
            currentTurn: { phase: TurnPhase.PRIVACY_FUGITIVE, playerOrdinal: 2 },
        });
        const next = transition(prev, { phase: TurnPhase.FUGITIVE });
        expect(turnWillChange(prev, next)).toBe(true);
    });

    it("is true for pass actions even when the player stays the same", () => {
        const prev = makeGameState({ players: roster, currentTurn: { playerOrdinal: 0 } });
        const next = transition(prev, { playerOrdinal: 1 });
        expect(turnWillChange(prev, next, { action: "pass" })).toBe(true);
    });

    it("is false during the second leg of a double move", () => {
        const prev = makeGameState({
            players: roster,
            currentTurn: { playerOrdinal: 2, doubleMovePart: 1, phase: TurnPhase.FUGITIVE },
        });
        const next = transition(prev, { playerOrdinal: 2, doubleMovePart: 2 });
        expect(turnWillChange(prev, next)).toBe(false);
    });
});

describe("playPreTurnChangeSfx", () => {
    beforeEach(() => {
        playSfxForAtLeast.mockResolvedValue(undefined);
        playSfx.mockReset();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("plays transport sfx for ticket moves instead of reveal stingers", async () => {
        const prev = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.FUGITIVE, playerOrdinal: 2 },
        });
        const next = transition(prev, { playerOrdinal: 0, phase: TurnPhase.PRIVACY_DETECTIVE, turnNumber: 2 });

        await playPreTurnChangeSfx(prev, next, { ticket: "taxi" });

        expect(playSfxForAtLeast).toHaveBeenCalledWith(SfxType.TAXI);
    });

    it("does not play reveal when detectives hand off to Mr X", async () => {
        const prev = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.DETECTIVE, playerOrdinal: 1 },
        });
        const next = transition(prev, { phase: TurnPhase.FUGITIVE, playerOrdinal: 2 });

        await playPreTurnChangeSfx(prev, next);

        expect(playSfxForAtLeast).not.toHaveBeenCalled();
    });

    it("does not play reveal when clearing fugitive privacy", async () => {
        const prev = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.PRIVACY_FUGITIVE, playerOrdinal: 2 },
        });
        const next = transition(prev, { phase: TurnPhase.FUGITIVE });

        await playPreTurnChangeSfx(prev, next);

        expect(playSfxForAtLeast).not.toHaveBeenCalled();
    });

    it("does not play reveal when handing off between two fugitives", async () => {
        const prev = makeGameState({
            players: twoFugitiveRoster(),
            currentTurn: { phase: TurnPhase.FUGITIVE, playerOrdinal: 2 },
        });
        const next = transition(prev, { phase: TurnPhase.FUGITIVE, playerOrdinal: 3 });

        await playPreTurnChangeSfx(prev, next);

        expect(playSfxForAtLeast).not.toHaveBeenCalled();
    });

    it("does not play sfx when fugitive round ends", async () => {
        const prev = makeGameState({
            players: twoFugitiveRoster(),
            currentTurn: { phase: TurnPhase.FUGITIVE, playerOrdinal: 3, turnNumber: 1 },
        });
        const next = transition(prev, {
            phase: TurnPhase.PRIVACY_DETECTIVE,
            playerOrdinal: 0,
            turnNumber: 2,
        });

        await playPreTurnChangeSfx(prev, next);

        expect(playSfxForAtLeast).not.toHaveBeenCalled();
    });

    it("fires poof handlers only when visibility sfx would have played", async () => {
        const turns = Array.from({ length: 24 }, (_, i) => ({ showMrX: i === 2 }));
        const prev = makeGameState({
            players: oneFugitiveRoster(),
            turns,
            currentTurn: { phase: TurnPhase.DETECTIVE, playerOrdinal: 0, turnNumber: 2 },
        });
        const next = transition(prev, { phase: TurnPhase.DETECTIVE, playerOrdinal: 1, turnNumber: 3 });
        const poofs: Array<"in" | "out"> = [];

        await playPreTurnChangeSfx(prev, next, undefined, {
            onFugitivePoof: (mode) => poofs.push(mode),
        });

        expect(poofs).toEqual(["in"]);
        expect(playSfxForAtLeast).toHaveBeenCalledWith(SfxType.FUGITIVE_REVEAL);
    });
});

describe("playImmediateGameSfx", () => {
    beforeEach(() => {
        playSfx.mockReset();
    });

    it("plays double and cancel actions", () => {
        const s = makeGameState({ players: oneFugitiveRoster() });
        playImmediateGameSfx(s, s, { action: "double-start" });
        playImmediateGameSfx(s, s, { action: "cancel-double" });
        expect(playSfx).toHaveBeenCalledWith(SfxType.DOUBLE);
        expect(playSfx).toHaveBeenCalledWith(SfxType.CANCEL);
    });

    it("plays ticket sfx immediately during in-turn moves", () => {
        const s = makeGameState({ players: oneFugitiveRoster() });
        playImmediateGameSfx(s, s, { ticket: "bus" });
        expect(playSfx).toHaveBeenCalledWith(SfxType.BUS);
    });
});
