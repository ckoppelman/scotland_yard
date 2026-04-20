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
2. Use the **menu** (and modals such as intro or **new game**) to pick a **board** and start or reset a match.
3. On your turn, either **choose a transport ticket** (sidebar) and **click a connected station** on the map, or **drag your pawn** to an adjacent station and then **pick the ticket** that matches the edge (sidebar or map popup).
4. Use the map toolbar to **zoom**, **reset view**, or **pan** when zoomed (scroll or drag empty map).
5. **New game** opens settings (board, player counts) and starts fresh.

Progress is **saved in the browser**: refreshing the page usually **resumes** the current game. Mr. X’s hidden details are tied to the tab session—in typical use, closing the tab clears that session and affects how Mr. X’s position is restored; see implementation notes in [`src/game/persistGameState.ts`](src/game/persistGameState.ts).

Mr. X’s exact location is hidden from detectives except on reveal rounds (see in-game status and the Mr. X round log).

## Project layout

| Path | Role |
|------|------|
| [`data/map-graph-classic.yaml`](data/map-graph-classic.yaml) | Default board graph (used with map id `classic`) |
| [`data/map-graph.yaml`](data/map-graph.yaml) | Demo / small board (`demo`) |
| [`data/map-graph-interesting.yaml`](data/map-graph-interesting.yaml) | Alternate layout (`interesting`) |
| [`data/map-graph-200.yaml`](data/map-graph-200.yaml) | Procedural 200-node board (`map200`) |
| [`data/turns.yaml`](data/turns.yaml) | Turn schedule (which rounds reveal Mr. X) |
| [`src/game/defaultMapGraph.ts`](src/game/defaultMapGraph.ts) | Parses the YAML graphs above into typed `MapGraph` values |
| [`src/game/defaultTurns.ts`](src/game/defaultTurns.ts) | Loads [`data/turns.yaml`](data/turns.yaml) into turn state |
| [`src/game/mapIds.ts`](src/game/mapIds.ts) | Allowed map ids; default is **`classic`** |
| [`src/game/mapRegistry.ts`](src/game/mapRegistry.ts) | Maps ids to graphs and human-readable labels |
| [`src/game/gameState.ts`](src/game/gameState.ts) | Types and `initialState()` (`GameState`, players, map graph, turn log) |
| [`src/game/gameRules.ts`](src/game/gameRules.ts) | Pure moves: `tryPlayTicket`, `tryPlayNode`, `tryPlayMoveToAdjacent`, adjacency / ticket checks |
| [`src/game/persistGameState.ts`](src/game/persistGameState.ts) | Save/load game + encrypted Mr. X payload (`localStorage` / `sessionStorage`) |
| [`src/game-board/`](src/game-board/) | Board UI: [`GameBoard.tsx`](src/game-board/GameBoard.tsx), [`shell/`](src/game-board/shell/) (menu, side dock), [`map/`](src/game-board/map/) (SVG, markers, ticket popup), [`modals/`](src/game-board/modals/), [`players/`](src/game-board/players/) — see [`index.ts`](src/game-board/index.ts) |
| [`src/App.tsx`](src/App.tsx) | Wires state, persistence, toasts, drag-to-move flow |
| [`src/constants.ts`](src/constants.ts) | Tickets, colors, game-over shape |

## Stack

**Runtime:** [Vite](https://vitejs.dev/) · [React](https://react.dev/) · [TypeScript](https://www.typescriptlang.org/) · [YAML](https://github.com/eemeli/yaml) for data files.

**Tooling:** [Vitest](https://vitest.dev/) for tests · [vite-plugin-svgr](https://react-svgr.com/) / `@svgr/*` for SVG-as-React components.
