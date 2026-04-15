import { Client } from "boardgame.io/react";
import { TicTacToe } from "./game/ticTacToe";
import { TicTacToeBoard } from "./TicTacToeBoard";

export { BOT_PLAYER_ID, HUMAN_PLAYER_ID } from "./constants";

/**
 * Single-device client (default transport). Do not use `Local()` here: the
 * local master always attributes outbound actions to this client’s seat, so
 * `AI.Step` + `RandomBot` moves for player `1` would be rejected while the UI
 * is player `0`, leaving the bot turn stuck forever.
 */
export const TicTacToeClient = Client({
  game: TicTacToe,
  board: TicTacToeBoard,
  numPlayers: 2,
  debug: false,
});
