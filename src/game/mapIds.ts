export const GAME_MAP_IDS = ["classic", "demo", "interesting", "map200"] as const;

export type GameMapId = (typeof GAME_MAP_IDS)[number];

export const DEFAULT_GAME_MAP_ID: GameMapId = "classic";
