/**
 * Public exports for the board UI. Internals are grouped for navigation:
 * - `modals/` — privacy screens, intro, quick rules, new-game settings + fade helper
 * - `map/` — SVG layout math, stations, edges, pawns, ticket popup over the map
 * - `shell/` — hamburger menu, ticket control strip, side-dock tabs + sheets (`GameSideDock`)
 * - `players/` — detective/Mr. X cards beside the map
 * - `GameBoard.tsx` — wires game state to the pieces above
 */
export type { GameBoardProps } from "./types";
export { GameBoard } from "./GameBoard";
export { buildNodePixelPositions, buildNodeStationBoardLook } from "./map/mapLayout";
export type { StationBoardLook } from "./map/mapLayout";
export { resolveMapLayout } from "../game/resolveMapLayout";
export type { MapLayoutYaml, ResolvedMapLayout } from "../game/mapLayoutTypes";
export { CLASSIC_BOARD_IMAGE_DEFAULT, DEFAULT_GRID_MAP_LAYOUT } from "./map/mapLayoutDefaults";
export { BoardNode } from "./map/BoardNode";
export { ConnectionEdge } from "./map/ConnectionEdge";
export { PlayerMarker } from "./map/PlayerMarker";
export { PlayerCard, MrXCard, MrXTurn, MrXBoard } from "./players/playerCards";
export { ControlPanel } from "./shell/ControlPanel";
