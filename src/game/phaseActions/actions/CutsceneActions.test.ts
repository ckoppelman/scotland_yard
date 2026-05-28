import { describe, expect, it, vi } from "vitest";
import * as fugitiveCutsceneGuard from "../../fugitiveCutsceneGuard";
import { TurnPhase } from "../../gameState";
import { resetFugitiveCutsceneGuardForTest } from "../../fugitiveCutsceneGuard";
import type { PhaseActionContext, PhaseActionServices } from "../types";
import { RunFugitiveCutsceneAction } from "./CutsceneActions";
import { PlayCutsceneMoveBeatAction } from "./PlayCutsceneMoveBeatAction";
import { PlayCutsceneRevealBeatAction } from "./PlayCutsceneRevealBeatAction";

function mockServices(overrides: Partial<PhaseActionServices> = {}): PhaseActionServices {
    return {
        delay: vi.fn().mockResolvedValue(undefined),
        playGameOverSfx: vi.fn(),
        playFugitivePoof: vi.fn(),
        showTransportAnimation: vi.fn(),
        playSfxForAtLeast: vi.fn().mockResolvedValue(undefined),
        playTransportFeedback: vi.fn().mockResolvedValue(undefined),
        playImmediateTransportFeedback: vi.fn(),
        ensureMusicPlaying: vi.fn(),
        ...overrides,
    };
}

function mockContext(
    partial: Partial<PhaseActionContext> & { services: PhaseActionServices },
): PhaseActionContext {
    return {
        getState: () => ({ currentTurn: { phase: TurnPhase.FUGITIVE_CUTSCENE } }) as never,
        setState: vi.fn(),
        getPresentation: () => ({
            musicMode: "fugitive",
            playerMarkersVisible: false,
            privacyModal: null,
            detectiveTurnIntro: null,
            cutsceneMoveIndex: null,
            interactionLocked: false,
        }),
        patchPresentation: vi.fn(),
        ...partial,
    };
}

describe("PlayCutsceneMoveBeatAction", () => {
    it("no-ops when the move index is out of range", async () => {
        const services = mockServices();
        const patchPresentation = vi.fn();
        const intro = { key: 1, isRevealTurn: false, latestMoves: [] };

        const result = await new PlayCutsceneMoveBeatAction(intro, 0).run(
            mockContext({ services, patchPresentation }),
        );

        expect(result.status).toBe("continue");
        expect(patchPresentation).not.toHaveBeenCalled();
        expect(services.delay).not.toHaveBeenCalled();
    });

    it("staggers, animates, and plays transport SFX for a move", async () => {
        const services = mockServices();
        const patchPresentation = vi.fn();
        const intro = {
            key: 1,
            isRevealTurn: false,
            latestMoves: [
                {
                    id: "move-0",
                    ticket: "taxi" as const,
                    playerOrdinal: 2,
                    playerName: "Mr. X",
                    turnNumber: 1,
                },
            ],
        };

        await new PlayCutsceneMoveBeatAction(intro, 0).run(
            mockContext({ services, patchPresentation }),
        );

        expect(patchPresentation).toHaveBeenCalledWith({
            detectiveTurnIntro: intro,
            cutsceneMoveIndex: 0,
        });
        expect(services.delay).toHaveBeenCalled();
        expect(services.showTransportAnimation).not.toHaveBeenCalled();
        expect(services.playSfxForAtLeast).toHaveBeenCalled();
    });

    it("uses cutscene overlay timing only (no full-screen transport overlay)", async () => {
        const services = mockServices();
        const intro = {
            key: 1,
            isRevealTurn: false,
            latestMoves: [
                {
                    id: "move-0",
                    ticket: "bus" as const,
                    playerOrdinal: 2,
                    playerName: "Mr. X",
                    turnNumber: 1,
                },
            ],
        };

        await new PlayCutsceneMoveBeatAction(intro, 0).run(mockContext({ services }));

        expect(services.showTransportAnimation).not.toHaveBeenCalled();
        expect(services.playTransportFeedback).not.toHaveBeenCalled();
    });

    it("waits through gameplay duration for double moves without transport SFX", async () => {
        const services = mockServices();
        const intro = {
            key: 1,
            isRevealTurn: false,
            latestMoves: [
                {
                    id: "move-0",
                    ticket: "double" as const,
                    playerOrdinal: 2,
                    playerName: "Mr. X",
                    turnNumber: 1,
                },
            ],
        };

        await new PlayCutsceneMoveBeatAction(intro, 0).run(mockContext({ services }));

        expect(services.showTransportAnimation).not.toHaveBeenCalled();
        expect(services.playSfxForAtLeast).not.toHaveBeenCalled();
        expect(services.delay).toHaveBeenCalledTimes(2);
    });
});

describe("PlayCutsceneRevealBeatAction", () => {
    it("plays poof when the round is a reveal turn", async () => {
        const services = mockServices();
        const intro = { key: 1, isRevealTurn: true, latestMoves: [] };

        await new PlayCutsceneRevealBeatAction(intro).run(mockContext({ services }));

        expect(services.playFugitivePoof).toHaveBeenCalledWith("in");
        expect(services.delay).toHaveBeenCalled();
    });

    it("skips poof when not a reveal turn", async () => {
        const services = mockServices();
        const intro = { key: 1, isRevealTurn: false, latestMoves: [] };

        await new PlayCutsceneRevealBeatAction(intro).run(mockContext({ services }));

        expect(services.playFugitivePoof).not.toHaveBeenCalled();
    });
});

describe("RunFugitiveCutsceneAction", () => {
    it("no-ops when the cutscene guard rejects a duplicate run", async () => {
        resetFugitiveCutsceneGuardForTest();
        const claim = vi.spyOn(fugitiveCutsceneGuard, "tryClaimFugitiveCutscene").mockReturnValue(false);
        const services = mockServices();
        const setState = vi.fn();
        const patchPresentation = vi.fn();

        await new RunFugitiveCutsceneAction().run(
            mockContext({
                services,
                setState,
                patchPresentation,
                getState: () =>
                    ({
                        currentTurn: { phase: TurnPhase.FUGITIVE_CUTSCENE, turnNumber: 3 },
                        turnLog: [],
                        turns: [],
                        players: [],
                    }) as never,
            }),
        );

        expect(setState).not.toHaveBeenCalled();
        expect(patchPresentation).not.toHaveBeenCalled();
        claim.mockRestore();
    });
});
