import type { PhaseAction } from "../phaseActions/PhaseAction";
import { TurnPhase, type GameState } from "../gameState";

export type PhaseCompleteOk = {
    ok: true;
    state: GameState;
    advanced: boolean;
    from: TurnPhase;
    to: TurnPhase;
};

export type PhaseCompleteFail = { ok: false; message: string };

export type PhaseCompleteResult = PhaseCompleteOk | PhaseCompleteFail;

/** One macro round in order. Detectives and fugitives may repeat within their step. */
export const MACRO_PHASE_CYCLE: readonly TurnPhase[] = [
    TurnPhase.DETECTIVE,
    TurnPhase.PRIVACY_FUGITIVE,
    TurnPhase.FUGITIVE,
    TurnPhase.PRIVACY_DETECTIVE,
    TurnPhase.FUGITIVE_CUTSCENE,
] as const;

/**
 * A macro game phase. Advancement happens only through {@link Phase.complete},
 * which checks whether exit conditions are met before changing phase.
 */
export abstract class Phase {
    abstract readonly turnPhase: TurnPhase;

    entryActions(): PhaseAction[] {
        return [];
    }

    postMoveActions(): PhaseAction[] {
        return [];
    }

    immediateActions(): PhaseAction[] {
        return [];
    }

    /** Attempt to leave this phase; stays put when {@link canComplete} is false. */
    complete(state: GameState): PhaseCompleteResult {
        if (state.currentTurn.phase !== this.turnPhase) {
            return { ok: false, message: `Not in ${this.turnPhase} phase.` };
        }

        if (!this.canComplete(state)) {
            return {
                ok: true,
                advanced: false,
                from: this.turnPhase,
                to: this.turnPhase,
                state,
            };
        }

        const to = this.nextPhase(state);
        let nextState: GameState = {
            ...state,
            currentTurn: { ...state.currentTurn, phase: to },
        };
        nextState = this.onExit(nextState);

        return {
            ok: true,
            advanced: true,
            from: this.turnPhase,
            to,
            state: nextState,
        };
    }

    protected abstract canComplete(state: GameState): boolean;

    protected abstract nextPhase(state: GameState): TurnPhase;

    protected onExit(state: GameState): GameState {
        return state;
    }
}
