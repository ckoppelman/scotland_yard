import type { BoardProps } from "boardgame.io/react";
import type { ReactElement } from "react";
import { HUMAN_PLAYER_ID } from "./constants";
import type { TTTState } from "./game/ticTacToe";

export function TicTacToeBoard({ ctx, G, moves, reset }: BoardProps<TTTState>) {
  const onClick = (id: number) => {
    moves.clickCell(id);
  };

  const over = Boolean(ctx.gameover);
  const current = ctx.currentPlayer;

  let status: string;
  if (over) {
    const go = ctx.gameover as { winner?: string; draw?: boolean };
    if (go?.draw) {
      status = "Draw.";
    } else if (go?.winner != null) {
      const you = go.winner === HUMAN_PLAYER_ID;
      status = `Winner: ${go.winner} (${you ? "you" : "bot"}).`;
    } else {
      status = "Game over.";
    }
  } else {
    status =
      current === HUMAN_PLAYER_ID ? "Your turn (play as X)." : "Bot is thinking…";
  }

  const canHumanClick = !over && current === HUMAN_PLAYER_ID;

  const rows: ReactElement[] = [];
  for (let i = 0; i < 3; i++) {
    const cells: ReactElement[] = [];
    for (let j = 0; j < 3; j++) {
      const id = i * 3 + j;
      const mark = G.cells[id];
      cells.push(
        <td key={id}>
          {mark != null ? (
            <div className="cell-filled" aria-label={`cell ${id}`}>
              {mark === HUMAN_PLAYER_ID ? "X" : "O"}
            </div>
          ) : (
            <button
              type="button"
              className="cell-btn"
              aria-label={`Empty cell ${id}`}
              disabled={!canHumanClick}
              onClick={() => onClick(id)}
            />
          )}
        </td>
      );
    }
    rows.push(<tr key={i}>{cells}</tr>);
  }

  return (
    <div>
      <p className="status">{status}</p>
      <div className="board-wrap">
        <table>
          <tbody>{rows}</tbody>
        </table>
      </div>
      <div className="toolbar">
        <button type="button" onClick={() => reset()}>
          Reset
        </button>
      </div>
    </div>
  );
}
