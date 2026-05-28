import { TurnPhase, type GameState } from "../gameState";
import { detectivePhase } from "./DetectivePhase";
import { detectivePrivacyPhase } from "./DetectivePrivacyPhase";
import { fugitiveCutscenePhase } from "./FugitiveCutscenePhase";
import { fugitivePhase } from "./FugitivePhase";
import { fugitivePrivacyPhase } from "./FugitivePrivacyPhase";
import { gameOverPhase } from "./GameOverPhase";
import type { Phase, PhaseCompleteResult } from "./Phase";

const PHASES: Partial<Record<TurnPhase, Phase>> = {
    [TurnPhase.DETECTIVE]: detectivePhase,
    [TurnPhase.PRIVACY_FUGITIVE]: fugitivePrivacyPhase,
    [TurnPhase.FUGITIVE]: fugitivePhase,
    [TurnPhase.PRIVACY_DETECTIVE]: detectivePrivacyPhase,
    [TurnPhase.FUGITIVE_CUTSCENE]: fugitiveCutscenePhase,
    [TurnPhase.GAME_OVER]: gameOverPhase,
};

export function getPhase(turnPhase: TurnPhase): Phase | undefined {
    return PHASES[turnPhase];
}

/** The only entry point for macro-phase advancement. */
export function completeCurrentPhase(state: GameState): PhaseCompleteResult {
    if (state.winner !== null) {
        return {
            ok: true,
            advanced: state.currentTurn.phase !== TurnPhase.GAME_OVER,
            from: state.currentTurn.phase,
            to: TurnPhase.GAME_OVER,
            state: {
                ...state,
                currentTurn: { ...state.currentTurn, phase: TurnPhase.GAME_OVER },
            },
        };
    }

    const phase = getPhase(state.currentTurn.phase);
    if (phase === undefined) {
        return { ok: false, message: `No phase handler for ${state.currentTurn.phase}.` };
    }

    return phase.complete(state);
}
