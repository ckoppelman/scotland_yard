# Scotland Yard (workspace)

**Tic-tac-toe** in **React** + **TypeScript** with a tiny **immutable game module** (no board engine dependency). **Hotseat only:** two humans share one device; **X** (player 0) and **O** (player 1) alternate; `tryPlayCell` enforces whose turn it is.

The repo name is a convenient umbrella for future board-game work (for example Scotland Yard rules later).

## Requirements

- **Node.js** (see [`.nvmrc`](.nvmrc); use [nvm](https://github.com/nvm-sh/nvm) if you like: `nvm use`)

## Scripts

| Command | Description |
|--------|---------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck (`tsc --noEmit`) and production build |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Vitest in watch mode |

## How to play

1. Run `npm run dev` and open the URL Vite prints (usually `http://localhost:5173`).
2. **Hotseat:** pass the device so the player whose turn it is taps an empty square.
3. **Reset** starts a new game.

## Project layout

- [`src/game/ticTacToe.ts`](src/game/ticTacToe.ts) — Pure rules: `initialState`, `tryPlayCell`, win/draw helpers, `legalCellIndices`
- [`src/App.tsx`](src/App.tsx) — Game state only
- [`src/TicTacToeBoard.tsx`](src/TicTacToeBoard.tsx) — Board UI
- [`src/constants.ts`](src/constants.ts) — `PLAYER_X` / `PLAYER_O` ids
- [`src/game/ticTacToe.test.ts`](src/game/ticTacToe.test.ts) — Vitest rules + legal cells

## Stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
