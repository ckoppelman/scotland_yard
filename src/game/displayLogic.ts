import { GameState, TurnPhase } from "./gameState";

export function shouldShowMrX(state: GameState): boolean {

    if (state.winner !== null) return true;

    return state.currentTurn.phase === TurnPhase.FUGITIVE ||
        state.currentTurn.phase === TurnPhase.GAME_OVER || (
            state.currentTurn.phase === TurnPhase.DETECTIVE &&
            (state.turns[state.currentTurn.turnNumber - 1]?.showMrX ?? false)
        );
}

export function shouldShowPrivacy(state: GameState): boolean {
    if (state.winner !== null) return false;
    return (
        state.currentTurn.phase === TurnPhase.PRIVACY_DETECTIVE ||
        state.currentTurn.phase === TurnPhase.PRIVACY_FUGITIVE
    );
}
