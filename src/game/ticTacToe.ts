import { INVALID_MOVE } from "boardgame.io/core";
import type { Ctx, Game, PlayerID } from "boardgame.io";

/** Board cell: player id who claimed it, or empty. */
export type TTTCell = PlayerID | null;

export interface TTTState {
  cells: TTTCell[];
}

const WIN_LINES: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

/** Returns the winning player id, or null if no winner yet. */
export function getWinner(cells: TTTCell[]): PlayerID | null {
  for (const [a, b, c] of WIN_LINES) {
    const s = cells[a];
    if (s !== null && s === cells[b] && s === cells[c]) {
      return s;
    }
  }
  return null;
}

export function isDraw(cells: TTTCell[]): boolean {
  return cells.every((c) => c !== null);
}

export function isVictory(cells: TTTCell[]): boolean {
  return getWinner(cells) !== null;
}

/** Legal cell indices for the current player (same targets as `ai.enumerate`). */
export function legalClickCells(G: TTTState): number[] {
  const out: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (G.cells[i] === null) out.push(i);
  }
  return out;
}

export const TicTacToe: Game<TTTState> = {
  setup: () => ({ cells: Array(9).fill(null) }),

  turn: {
    minMoves: 1,
    maxMoves: 1,
  },

  moves: {
    clickCell: ({ G, playerID }, id: number) => {
      if (typeof id !== "number" || id < 0 || id > 8) {
        return INVALID_MOVE;
      }
      if (G.cells[id] !== null) {
        return INVALID_MOVE;
      }
      G.cells[id] = playerID;
    },
  },

  endIf: ({ G }) => {
    const winner = getWinner(G.cells);
    if (winner !== null) {
      return { winner };
    }
    if (isDraw(G.cells)) {
      return { draw: true };
    }
    return;
  },

  ai: {
    enumerate: (G: TTTState, _ctx: Ctx, _playerID: PlayerID) => {
      const moves: { move: "clickCell"; args: [number] }[] = [];
      for (let i = 0; i < 9; i++) {
        if (G.cells[i] === null) {
          moves.push({ move: "clickCell", args: [i] });
        }
      }
      return moves;
    },
  },
};
