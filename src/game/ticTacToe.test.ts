import { describe, expect, it } from "vitest";
import { PLAYER_O, PLAYER_X } from "../constants";
import {
  initialState,
  legalCellIndices,
  tryPlayCell,
  getWinner,
  isDraw,
  type TTTState,
} from "./ticTacToe";

function play(s: TTTState, player: typeof PLAYER_X | typeof PLAYER_O, cell: number): TTTState {
  const next = tryPlayCell(s, player, cell);
  if (!next) throw new Error(`illegal move ${player}@${cell}`);
  return next;
}

describe("TicTacToe rules", () => {
  it("rejects overwriting a cell", () => {
    let s = initialState();
    s = play(s, PLAYER_X, 0);
    s = play(s, PLAYER_O, 1);
    const bad = tryPlayCell(s, PLAYER_X, 0);
    expect(bad).toBeNull();
    expect(s.cells[0]).toBe(PLAYER_X);
    expect(s.cells[1]).toBe(PLAYER_O);
  });

  it("detects top-row win for player 0", () => {
    let s = initialState();
    s = play(s, PLAYER_X, 0);
    s = play(s, PLAYER_O, 3);
    s = play(s, PLAYER_X, 1);
    s = play(s, PLAYER_O, 4);
    s = play(s, PLAYER_X, 2);
    expect(s.gameover).toEqual({ winner: PLAYER_X });
    expect(getWinner(s.cells)).toBe(PLAYER_X);
  });

  it("detects draw", () => {
    let s = initialState();
    const seq: [typeof PLAYER_X | typeof PLAYER_O, number][] = [
      [PLAYER_X, 0],
      [PLAYER_O, 1],
      [PLAYER_X, 2],
      [PLAYER_O, 4],
      [PLAYER_X, 3],
      [PLAYER_O, 5],
      [PLAYER_X, 7],
      [PLAYER_O, 6],
      [PLAYER_X, 8],
    ];
    for (const [pid, cell] of seq) {
      s = play(s, pid, cell);
    }
    expect(s.gameover).toEqual({ draw: true });
    expect(isDraw(s.cells)).toBe(true);
    expect(getWinner(s.cells)).toBeNull();
  });
});

describe("legalCellIndices", () => {
  it("matches empty cells after a center play", () => {
    let s = initialState();
    s = play(s, PLAYER_X, 4);
    const legal = legalCellIndices(s.cells);
    expect(legal).toHaveLength(8);
    expect(legal).not.toContain(4);
  });
});
