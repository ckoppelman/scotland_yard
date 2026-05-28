import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { GameSfxAction } from "../audio/playGameSfx";
import { playImmediateGameSfx, playPostTurnChangeSfx, playPreTurnChangeSfx } from "../audio/playGameSfx";
import { playSfxForAtLeast } from "../audio/sfx";
import { ensureBackgroundMusicPlaying } from "../audio/useBackgroundMusic";
import type { MusicMode } from "../audio/musicTracks";
import type { Ticket } from "../constants";
import { GAMEPLAY_ANIMATION_MS, SIDE_PANEL_OPEN_MS, TICKET_TRANSFER_FLIGHT_MS } from "../game/cutsceneTiming";
import {
    INITIAL_PHASE_PRESENTATION,
    PhaseOrchestrator,
    type PhaseActionServices,
    type PhasePresentation,
} from "../game/phaseActions";
import type { GameState } from "../game/gameState";
import type { PlayResult } from "../game/gameRules";
import { createFugitivePoofBurst, type FugitivePoofBurst } from "../game-board/animations/fugitivePoof";
import {
    createTransportAnimationBurst,
    type TransportAnimationBurst,
} from "../game-board/animations/playTransportAnimation";

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });
}

export function usePhaseOrchestrator(
    state: GameState | null,
    setState: React.Dispatch<React.SetStateAction<GameState | null>>,
    onTransportAnimation: (burst: TransportAnimationBurst | null) => void,
    onFugitivePoof: (burst: FugitivePoofBurst | null) => void,
) {
    const [presentation, setPresentation] = useState<PhasePresentation>(INITIAL_PHASE_PRESENTATION);
    const presentationRef = useRef(presentation);
    presentationRef.current = presentation;

    const stateRef = useRef(state);
    stateRef.current = state;

    const moveFeedbackHandlers = useMemo(
        () => ({
            onTransportAnimation: (ticket: Ticket) => {
                const burst = createTransportAnimationBurst(ticket);
                onTransportAnimation(burst);
            },
            onFugitivePoof: (mode: "in" | "out") => {
                const burst = createFugitivePoofBurst(mode);
                if (burst === null) return;
                onFugitivePoof(burst);
                window.setTimeout(() => {
                    onFugitivePoof(null);
                }, GAMEPLAY_ANIMATION_MS);
            },
        }),
        [onTransportAnimation, onFugitivePoof],
    );

    const ticketTransferResolveRef = useRef<(() => void) | null>(null);

    const services = useMemo<PhaseActionServices>(
        () => ({
            delay,
            playGameOverSfx: () => {},
            ensureMusicPlaying: ensureBackgroundMusicPlaying,
            playFugitivePoof: (mode) => moveFeedbackHandlers.onFugitivePoof(mode),
            showTransportAnimation: (ticket) => moveFeedbackHandlers.onTransportAnimation(ticket),
            playSfxForAtLeast,
            playImmediateTransportFeedback: (ticket) => {
                moveFeedbackHandlers.onTransportAnimation(ticket);
                if (stateRef.current !== null) {
                    playImmediateGameSfx(stateRef.current, stateRef.current, { ticket }, moveFeedbackHandlers);
                }
            },
            playTransportFeedback: async (ticket) => {
                if (stateRef.current === null) return;
                await playPreTurnChangeSfx(
                    stateRef.current,
                    stateRef.current,
                    { ticket },
                    moveFeedbackHandlers,
                );
            },
            playTicketTransferToFugitive: (flight) =>
                new Promise<void>((resolve) => {
                    ticketTransferResolveRef.current = resolve;
                    flushSync(() => {
                        setPresentation((p) => {
                            const next = {
                                ...p,
                                sidePanel: "players" as const,
                                ticketTransferFlight: { id: Date.now(), ...flight },
                            };
                            presentationRef.current = next;
                            return next;
                        });
                    });
                    window.setTimeout(() => {
                        if (ticketTransferResolveRef.current === resolve) {
                            ticketTransferResolveRef.current = null;
                            resolve();
                        }
                    }, SIDE_PANEL_OPEN_MS + TICKET_TRANSFER_FLIGHT_MS + 400);
                }),
        }),
        [moveFeedbackHandlers],
    );
    const orchestratorRef = useRef<PhaseOrchestrator | null>(null);

    const completeTicketTransfer = useCallback(() => {
        setPresentation((p) => {
            const next = { ...p, ticketTransferFlight: null, sidePanel: null };
            presentationRef.current = next;
            return next;
        });
        const resolve = ticketTransferResolveRef.current;
        ticketTransferResolveRef.current = null;
        resolve?.();
    }, []);

    useEffect(() => {
        orchestratorRef.current = new PhaseOrchestrator({
            getState: () => stateRef.current!,
            setState: (next) => {
                stateRef.current = next;
                setState(next);
            },
            getPresentation: () => presentationRef.current,
            patchPresentation: (patch) => {
                setPresentation((p) => {
                    const next = { ...p, ...patch };
                    presentationRef.current = next;
                    return next;
                });
            },
            services,
        });
        if (stateRef.current !== null) {
            void orchestratorRef.current.syncToGamePhase();
        }
    }, [services, setState]);

    useEffect(() => {
        if (state === null) return;
        void orchestratorRef.current?.syncToGamePhase();
    }, [state?.currentTurn.phase, state === null]);

    const commitPlayResult = useCallback(
        async (
            prev: GameState,
            result: PlayResult,
            options?: { ticket?: Ticket; action?: GameSfxAction; onApplied?: () => void },
        ): Promise<boolean> => {
            if (!result.ok) return false;

            options?.onApplied?.();
            await orchestratorRef.current?.handlePlayResult(prev, result.state, options);
            playPostTurnChangeSfx(prev, stateRef.current ?? result.state);
            return true;
        },
        [],
    );

    const resetPresentation = useCallback(() => {
        orchestratorRef.current?.reset();
        setPresentation(INITIAL_PHASE_PRESENTATION);
    }, []);

    const musicMode: MusicMode = presentation.musicMode;

    return {
        presentation,
        musicMode,
        commitPlayResult,
        resetPresentation,
        completeTicketTransfer,
        interactionLocked: presentation.interactionLocked,
    };
}
