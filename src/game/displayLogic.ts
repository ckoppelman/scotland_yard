import { GameState, TurnPhase } from "./gameState";

export function shouldShowMrX(state: GameState): boolean {
    return state.currentTurn.phase === TurnPhase.FUGITIVE || (
        state.currentTurn.phase === TurnPhase.DETECTIVE &&
        (state.turns[state.currentTurn.turnNumber]?.showMrX ?? false)
    );
}

export function shouldShowPrivacy(state: GameState): boolean {
    return state.currentTurn.phase === TurnPhase.PRIVACY_DETECTIVE || (
        state.currentTurn.phase === TurnPhase.PRIVACY_FUGITIVE
    );
}
