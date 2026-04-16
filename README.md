# Scotland Yard (browser)

A [Scotland Yard](https://en.wikipedia.org/wiki/Scotland_Yard_(board_game))–style chase game for the browser: detectives and Mr. X move on a graph of stations connected by taxi, bus, and underground lines. Built with **React**, **TypeScript**, and **Vite**. Rules and state live in a small immutable **game module**; the UI does not encode move legality.

**Hotseat only:** everyone shares one device and passes the screen when the turn changes.

## Requirements

- **Node.js** (see [`.nvmrc`](.nvmrc); with [nvm](https://github.com/nvm-sh/nvm): `nvm use`)

## Scripts

| Command | Description |
|--------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Run `tsc --noEmit`, then production build |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Vitest in watch mode |

## How to play

1. Run `npm run dev` and open the URL Vite prints (usually [http://localhost:5173](http://localhost:5173)).
2. On your turn, either **choose a transport ticket** (sidebar) and **click a connected station** on the map, or **drag your pawn** to an adjacent station and then **pick the ticket** that matches the edge (sidebar or map popup).
3. Use the map toolbar to **zoom**, **reset view**, or **pan** when zoomed (scroll or drag empty map).
4. **New game** resets the match.

Mr. X’s exact location is hidden from detectives except on reveal rounds (see in-game status and the Mr. X round log).

## Project layout

| Path | Role |
|------|------|
| [`src/game/gameState.ts`](src/game/gameState.ts) | Types and `initialState()` (`GameState`, players, map graph, turn log) |
| [`src/game/gameRules.ts`](src/game/gameRules.ts) | Pure moves: `tryPlayTicket`, `tryPlayNode`, `tryPlayMoveToAdjacent`, adjacency / ticket checks |
| [`src/game/defaultMapGraph.ts`](src/game/defaultMapGraph.ts) | Loads [`data/map-graph-interesting.yaml`](data/map-graph-interesting.yaml) into graph types |
| [`src/game/defaultTurns.ts`](src/game/defaultTurns.ts) | Round metadata (e.g. when Mr. X is shown) |
| [`src/game-board/`](src/game-board/) | Map SVG, pieces, sidebar (see [`index.ts`](src/game-board/index.ts) exports) |
| [`src/App.tsx`](src/App.tsx) | Wires state, toasts, and drag-to-move flow |
| [`src/constants.ts`](src/constants.ts) | Tickets, colors, game-over shape |

## Stack

[Vite](https://vitejs.dev/) · [React](https://react.dev/) · [TypeScript](https://www.typescriptlang.org/) · [YAML](https://github.com/eemeli/yaml) for map data
