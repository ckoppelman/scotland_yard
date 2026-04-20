import {
  demoMapGraph,
  interestingMapGraph,
  mapGraph200,
  mapGraphClassic,
} from "./defaultMapGraph";
import type { MapGraph } from "./gameState";
import { GAME_MAP_IDS, type GameMapId } from "./mapIds";

export const MAP_REGISTRY: Record<GameMapId, { label: string; graph: MapGraph }> = {
  classic: {
    label: "Classic (199 stations)",
    graph: mapGraphClassic,
  },
  demo: {
    label: "Demo (small)",
    graph: demoMapGraph,
  },
  interesting: {
    label: "Interesting layout",
    graph: interestingMapGraph,
  },
  map200: {
    label: "Procedural 200-node board",
    graph: mapGraph200,
  },
};

export function getMapGraph(mapId: GameMapId): MapGraph {
  return MAP_REGISTRY[mapId].graph;
}

/** Stable order for selects and menus. */
export const MAP_SELECT_OPTIONS: { id: GameMapId; label: string }[] = GAME_MAP_IDS.map((id) => ({
  id,
  label: MAP_REGISTRY[id].label,
}));
