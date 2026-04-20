import type { GameState } from "../game/gameState";

/**
 * One sentence for the control panel header: who goes now, or who won.
 * Pure function — easy to test and to read without scrolling through JSX.
 */
export function getGameStatusText(state: Pick<GameState, "gameover" | "players" | "currentTurn" | "turns">): string {
    const { gameover, players, currentTurn, turns } = state;

    if (gameover) {
        return `Case closed — ${gameover.winner === "detective" ? "the detectives" : "Mr. X"} wins.`;
    }

    let status = `${players[currentTurn.playerOrdinal].description.name}'s turn.`;
    if (turns[currentTurn.turnNumber]?.showMrX ?? false) {
        status += " Mr. X’s station will be revealed this round.";
    } else if (turns[currentTurn.turnNumber - 1]?.showMrX ?? false) {
        status += " Mr. X’s station is revealed!";
    }
    return status;
}
