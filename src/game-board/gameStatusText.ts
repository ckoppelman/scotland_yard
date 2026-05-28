import type { GameState } from "../game/gameState";
import { TurnPhase } from "../game/gameState";

/**
 * One sentence for the control panel header: who goes now, or who won.
 * Pure function — easy to test and to read without scrolling through JSX.
 */
export function getGameStatusText(state: GameState): string {
    const { winner, players, currentTurn, turns } = state;

    if (winner) {
        if (winner.winner === "detective") {
            return `The city's biggest criminal has been taken to justice!`;
        } else {
            return `Mr. X foils Scotland Yard, launching a city-wide crime spree!`;
        }
    }

    if (currentTurn.phase === TurnPhase.FUGITIVE_CUTSCENE) {
        return "Reviewing fugitive moves…";
    }

    let status = `${players[currentTurn.playerOrdinal].description.name}'s turn.`;
    if (turns[currentTurn.turnNumber]?.showMrX ?? false) {
        status += " Mr. X’s station will be revealed this round.";
    } else if (turns[currentTurn.turnNumber - 1]?.showMrX ?? false) {
        status += " Mr. X’s station is revealed!";
    }
    return status;
}
