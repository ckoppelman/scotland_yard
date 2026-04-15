/** Seat ids used on the board. */
export type PlayerId = "0" | "1";

export type TTTCell = PlayerId | null;

export type GameOver = { winner: PlayerId } | { draw: true };

export interface TTTState {
  cells: TTTCell[];
  currentPlayer: PlayerId;
  gameover: GameOver | null;
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

export function getWinner(cells: TTTCell[]): PlayerId | null {
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

/** Indices of empty cells (legal placements). */
export function legalCellIndices(cells: TTTCell[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (cells[i] === null) out.push(i);
  }
  return out;
}

export function initialState(): TTTState {
  return {
    cells: Array(9).fill(null),
    currentPlayer: "0",
    gameover: null,
  };
}

/**
 * If the move is legal for `player` on this `state`, returns the next state.
 * Otherwise returns `null`.
 */
export function tryPlayCell(
  state: TTTState,
  player: PlayerId,
  cell: number
): TTTState | null {
  if (state.gameover) return null;
  if (state.currentPlayer !== player) return null;
  if (typeof cell !== "number" || cell < 0 || cell > 8) return null;
  if (state.cells[cell] !== null) return null;

  const cells = [...state.cells] as TTTCell[];
  cells[cell] = player;

  const winner = getWinner(cells);
  if (winner !== null) {
    return { cells, currentPlayer: player, gameover: { winner } };
  }
  if (isDraw(cells)) {
    return { cells, currentPlayer: player, gameover: { draw: true } };
  }

  const nextPlayer: PlayerId = player === "0" ? "1" : "0";
  return { cells, currentPlayer: nextPlayer, gameover: null };
}
