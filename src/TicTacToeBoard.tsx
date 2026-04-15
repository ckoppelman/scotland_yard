import type { ReactElement } from "react";
import { PLAYER_X } from "./constants";
import type { TTTState } from "./game/ticTacToe";

export type TicTacToeBoardProps = {
  state: TTTState;
  onCellClick: (id: number) => void;
  onReset: () => void;
};

export function TicTacToeBoard({ state, onCellClick, onReset }: TicTacToeBoardProps) {
  const { cells, currentPlayer, gameover } = state;

  let status: string;
  if (gameover) {
    if ("draw" in gameover && gameover.draw) {
      status = "Draw.";
    } else if ("winner" in gameover) {
      const w = gameover.winner;
      const side = w === PLAYER_X ? "X" : "O";
      status = `Winner: ${side} (player ${w}).`;
    } else {
      status = "Game over.";
    }
  } else {
    status =
      currentPlayer === PLAYER_X
        ? "Player X's turn — pass the device after your move."
        : "Player O's turn — pass the device after your move.";
  }

  const canClick = !gameover;

  const rows: ReactElement[] = [];
  for (let i = 0; i < 3; i++) {
    const cellsRow: ReactElement[] = [];
    for (let j = 0; j < 3; j++) {
      const id = i * 3 + j;
      const mark = cells[id];
      cellsRow.push(
        <td key={id}>
          {mark != null ? (
            <div className="cell-filled" aria-label={`cell ${id}`}>
              {mark === PLAYER_X ? "X" : "O"}
            </div>
          ) : (
            <button
              type="button"
              className="cell-btn"
              aria-label={`Empty cell ${id}`}
              disabled={!canClick}
              onClick={() => onCellClick(id)}
            />
          )}
        </td>
      );
    }
    rows.push(<tr key={i}>{cellsRow}</tr>);
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
        <button type="button" onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
