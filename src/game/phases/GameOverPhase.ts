import { TurnPhase, type GameState } from "../gameState";
import { Phase } from "./Phase";

export class GameOverPhase extends Phase {
    readonly turnPhase = TurnPhase.GAME_OVER;

    protected canComplete(_state: GameState): boolean {
        return false;
    }

    protected nextPhase(): TurnPhase {
        return TurnPhase.GAME_OVER;
    }
}

export const gameOverPhase = new GameOverPhase();
