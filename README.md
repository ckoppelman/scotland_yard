# Scotland Yard (workspace)

Sample **tic-tac-toe** app built with **[boardgame.io](https://boardgame.io/)** and **React**, with a **random bot** for the second seat. The client uses the **default (single-device) transport** so `AI.Step` can apply the bot’s moves; `Local()` is avoided because it would attribute every action to the human’s `playerID` and stall the bot forever. The repo name is a convenient umbrella for future board-game work (for example Scotland Yard rules later).

## Requirements

- **Node.js** (see [`.nvmrc`](.nvmrc); use [nvm](https://github.com/nvm-sh/nvm) if you like: `nvm use`)

## Scripts

| Command | Description |
|--------|---------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start Vite dev server (play in the browser) |
| `npm run build` | Typecheck (`tsc --noEmit`) and production build |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Vitest in watch mode |

## How to play

1. Run `npm run dev` and open the URL Vite prints (usually `http://localhost:5173`).
2. You are player **0** (shown as **X**). The bot is player **1** (**O**).
3. On the bot’s turn, a `RandomBot` plus `Step` from `boardgame.io/ai` picks a legal move automatically.

## Project layout

- [`src/game/ticTacToe.ts`](src/game/ticTacToe.ts) — Game definition: `setup`, `moves`, `turn`, `endIf`, `ai.enumerate`
- [`src/client.ts`](src/client.ts) — boardgame.io **React** `Client` (default transport, two seats)
- [`src/App.tsx`](src/App.tsx) — Bot stepping (`RandomBot`, `Step`) with a re-entrancy guard
- [`src/TicTacToeBoard.tsx`](src/TicTacToeBoard.tsx) — Board UI and **Reset**
- [`src/game/ticTacToe.test.ts`](src/game/ticTacToe.test.ts) — Vitest rules and enumerate checks

## Stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [boardgame.io](https://boardgame.io/) (game state, turns, AI helpers)

## Notes

- There is **no networked lobby** (no Koa server). Adding real multiplayer would use boardgame.io’s `SocketIO` transport and server separately.
