import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { playDetectivePhaseStartIntro } from "./playDetectivePhaseStartIntro";
import { SfxType } from "./sfxTracks";
import { GAMEPLAY_ANIMATION_MS } from "../game-board/animations/fugitivePoof";
import { makeGameState, oneFugitiveRoster, twoFugitiveRoster } from "../test/gameFixtures";
import { TurnPhase } from "../game/gameState";

const playSfxForAtLeast = vi.fn();
const getAnimationsEnabled = vi.fn();

vi.mock("../displayPreferences", () => ({
    getAnimationsEnabled: () => getAnimationsEnabled(),
}));

vi.mock("./sfx", async (importOriginal) => {
    const actual = await importOriginal<typeof import("./sfx")>();
    return {
        ...actual,
        playSfxForAtLeast: (...args: Parameters<typeof actual.playSfxForAtLeast>) =>
            playSfxForAtLeast(...args),
    };
});

describe("playDetectivePhaseStartIntro", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        getAnimationsEnabled.mockReturnValue(true);
        playSfxForAtLeast.mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    function cutsceneStates() {
        const prev = makeGameState({
            players: twoFugitiveRoster(),
            currentTurn: { phase: TurnPhase.FUGITIVE_CUTSCENE, turnNumber: 2 },
            turnLog: [
                { turnNumber: 1, playerOrdinal: 2, ticket: "taxi", position: 4 },
                { turnNumber: 1, playerOrdinal: 3, ticket: "bus", position: 3 },
            ],
        });
        const preview = makeGameState({
            players: twoFugitiveRoster(),
            currentTurn: { phase: TurnPhase.DETECTIVE, turnNumber: 2 },
        });
        return { prev, preview };
    }

    it("starts intro handlers and fugitive music override", async () => {
        const { prev, preview } = cutsceneStates();
        const started: string[] = [];
        const promise = playDetectivePhaseStartIntro(prev, preview, {
            onDetectiveTurnIntroStart: (intro) => started.push(`${intro.latestMoves.length}-moves`),
            onMusicModeOverride: () => started.push("music"),
        });

        await vi.runAllTimersAsync();
        await promise;

        expect(started).toEqual(["music", "2-moves"]);
    });

    it("plays transport sfx for the last fugitive move with animation duration", async () => {
        const { prev, preview } = cutsceneStates();
        const promise = playDetectivePhaseStartIntro(prev, preview);

        await vi.runAllTimersAsync();
        await promise;

        expect(playSfxForAtLeast).toHaveBeenCalledWith(SfxType.BUS, GAMEPLAY_ANIMATION_MS);
    });

    it("does not play the reveal screech on reveal turns without transport sfx", async () => {
        const revealTurns = Array.from({ length: 24 }, (_, i) => ({ showMrX: i === 0 }));
        const prev = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.FUGITIVE_CUTSCENE, turnNumber: 1 },
            turnLog: [{ turnNumber: 0, playerOrdinal: 2, ticket: "double", position: 3 }],
        });
        const preview = makeGameState({
            players: oneFugitiveRoster(),
            turns: revealTurns,
            currentTurn: { phase: TurnPhase.DETECTIVE, turnNumber: 1 },
        });
        const poofs: Array<"in" | "out"> = [];

        const promise = playDetectivePhaseStartIntro(prev, preview, {
            onFugitivePoof: (mode) => poofs.push(mode),
        });

        await vi.runAllTimersAsync();
        await promise;

        expect(poofs).toEqual(["in"]);
        expect(playSfxForAtLeast).not.toHaveBeenCalledWith(SfxType.FUGITIVE_REVEAL, expect.anything());
    });

    it("plays hide sfx on hide rounds when there is no transport move", async () => {
        const prev = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.FUGITIVE_CUTSCENE, turnNumber: 2 },
            turnLog: [{ turnNumber: 1, playerOrdinal: 2, ticket: "double", position: 3 }],
        });
        const preview = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.DETECTIVE, turnNumber: 2 },
        });

        const promise = playDetectivePhaseStartIntro(prev, preview);
        await vi.runAllTimersAsync();
        await promise;

        expect(playSfxForAtLeast).toHaveBeenCalledWith(SfxType.FUGITIVE_HIDE, GAMEPLAY_ANIMATION_MS);
    });

    it("skips poof animation when animations are disabled", async () => {
        getAnimationsEnabled.mockReturnValue(false);
        const revealTurns = Array.from({ length: 24 }, (_, i) => ({ showMrX: i === 0 }));
        const prev = makeGameState({
            players: oneFugitiveRoster(),
            currentTurn: { phase: TurnPhase.FUGITIVE_CUTSCENE, turnNumber: 1 },
            turnLog: [{ turnNumber: 0, playerOrdinal: 2, ticket: "taxi", position: 4 }],
        });
        const preview = makeGameState({
            players: oneFugitiveRoster(),
            turns: revealTurns,
            currentTurn: { phase: TurnPhase.DETECTIVE, turnNumber: 1 },
        });
        const poofs: Array<"in" | "out"> = [];

        const promise = playDetectivePhaseStartIntro(prev, preview, {
            onFugitivePoof: (mode) => poofs.push(mode),
        });
        await vi.runAllTimersAsync();
        await promise;

        expect(poofs).toEqual([]);
        expect(playSfxForAtLeast).toHaveBeenCalledWith(SfxType.TAXI, expect.any(Number));
    });
});
