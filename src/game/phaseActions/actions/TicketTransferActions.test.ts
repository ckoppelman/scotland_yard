import { describe, expect, it, vi } from "vitest";
import { TurnPhase } from "../../gameState";
import type { PhaseActionContext, PhaseActionServices } from "../types";
import { TransferTicketsToFugitiveAction } from "./TicketTransferActions";
import { makeGameState, oneFugitiveRoster } from "../../../test/gameFixtures";

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
        playTicketTransferToFugitive: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

describe("TransferTicketsToFugitiveAction", () => {
    it("plays ticket transfer animation after a detective move", async () => {
        const services = mockServices();
        const patchPresentation = vi.fn();
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
                    ticket: "taxi" as const,
                    position: 2,
                },
            ],
        };

        await new TransferTicketsToFugitiveAction().run({
            getState: () => prev,
            setState: vi.fn(),
            getPresentation: () => ({
                musicMode: "detective",
                playerMarkersVisible: true,
                privacyModal: null,
                detectiveTurnIntro: null,
                cutsceneMoveIndex: null,
                interactionLocked: false,
                sidePanel: null,
                ticketTransferFlight: null,
            }),
            patchPresentation,
            services,
            move: { prev, next },
        } as PhaseActionContext);

        expect(services.playTicketTransferToFugitive).toHaveBeenCalledWith({
            ticket: "taxi",
            detectiveId: "det-0",
            fugitiveId: "fug-2",
        });
    });

    it("no-ops without move context", async () => {
        const services = mockServices();
        await new TransferTicketsToFugitiveAction().run({
            getState: () => makeGameState({ players: oneFugitiveRoster() }),
            setState: vi.fn(),
            getPresentation: () => ({
                musicMode: "detective",
                playerMarkersVisible: true,
                privacyModal: null,
                detectiveTurnIntro: null,
                cutsceneMoveIndex: null,
                interactionLocked: false,
                sidePanel: null,
                ticketTransferFlight: null,
            }),
            patchPresentation: vi.fn(),
            services,
        } as PhaseActionContext);

        expect(services.playTicketTransferToFugitive).not.toHaveBeenCalled();
    });
});
