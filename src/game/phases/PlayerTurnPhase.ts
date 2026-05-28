import { TurnPhase, type GameState, type PlayerState } from "../gameState";
import { Phase } from "./Phase";

/** Shared handoff logic for detective and fugitive move rounds. */
export abstract class PlayerTurnPhase extends Phase {
    protected abstract isRoundPlayer(player: PlayerState): boolean;

    protected abstract roundExitPhase: TurnPhase;

    protected moverOrdinal(state: GameState): number {
        const { playerOrdinal } = state.currentTurn;
        const { length } = state.players;
        return (playerOrdinal - 1 + length) % length;
    }

    protected canComplete(state: GameState): boolean {
        if (state.currentTurn.doubleMovePart === 1) {
            return false;
        }

        const mover = state.players[this.moverOrdinal(state)];
        if (!this.isRoundPlayer(mover)) {
            return false;
        }

        const nextPlayer = state.players[state.currentTurn.playerOrdinal];
        return !this.isRoundPlayer(nextPlayer);
    }

    protected nextPhase(): TurnPhase {
        return this.roundExitPhase;
    }
}
