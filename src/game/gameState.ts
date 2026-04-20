import { Color, Ticket, GameOver } from "../constants";
import { defaultTurns } from "./defaultTurns";
import { DEFAULT_GAME_MAP_ID, type GameMapId } from "./mapIds";
import type { MapLayoutYaml } from "./mapLayoutTypes";

export type { GameMapId } from "./mapIds";


export type PlayerDescription = {
  id: string;
  name: string;
  color: Color;
  order: number;
  isDetective: boolean;
};

export type PlayerState = {
  description: PlayerDescription;
  position: number | null;
  tickets: Record<Ticket, number>;
};

export type TurnState = {
  showMrX: boolean;
}

export type CurrentTurn = {
  playerOrdinal: number;
  ticket: Ticket | null;
  turnNumber: number;
};

export type GameState = {
  /** Which board graph and art config is active; kept for persistence and new-game defaults. */
  mapId: GameMapId;
  players: PlayerState[];
  currentTurn: CurrentTurn;
  gameover: GameOver | null;
  mapGraph: MapGraph;
  turns: TurnState[];
  turnLog: TurnLog;
};

export type MapConnection = {
  nodes: Set<number>;
  ticket: Ticket;
};

export type MapNode = {
  id: number;
  position: { x: number; y: number };
};

export type MapGraph = {
  nodes: MapNode[];
  connections: MapConnection[];
  startingPositions: number[];
  /**
   * Declarative layout: scale/offset for YAML positions, halo, gutter, board image placement.
   * Prefer this over legacy `positionsAreBoardPixels` / `boardImageHref`.
   */
  layout?: MapLayoutYaml;
  /** @deprecated Use `layout.positionScale: 1` and `layout.positionOffset: { x: 0, y: 0 }` */
  positionsAreBoardPixels?: boolean;
  /** @deprecated Use `layout.boardImage` */
  boardImageHref?: string;
};

export type TurnLogEntry = {
  turnNumber: number;
  playerOrdinal: number;
  ticket: Ticket | null;
  position: number;
};

export type TurnLog = TurnLogEntry[];

function getRandomValue(values: number[]): number {
  return values[Math.floor(Math.random() * values.length)];
}

function getRandomValues(values: number[], k: number): number[] {
  const result: Set<number> = new Set();
  while (result.size < k) {
    result.add(getRandomValue(values));
  }
  return Array.from(result);
}

const COLORS_FOR_DETECTIVES: Color[] = ["red", "blue", "green", "yellow", "purple"];

export type DetectiveTicketCounts = {
  taxi: number;
  bus: number;
  underground: number;
};

export type FugitiveTicketCounts = {
  taxi: number;
  bus: number;
  underground: number;
  black: number;
  double: number;
};

const DEFAULT_DETECTIVE_TICKET_COUNTS: DetectiveTicketCounts = {
  taxi: 10,
  bus: 8,
  underground: 4,
};

const DEFAULT_FUGITIVE_TICKET_COUNTS: FugitiveTicketCounts = {
  taxi: 4,
  bus: 3,
  underground: 2,
  black: 5,
  double: 2,
};

export type NewGameSettings = {
  mapId: GameMapId;
  numDetectives: number;
  numFugitives: number;
  detectiveTickets: DetectiveTicketCounts;
  fugitiveTickets: FugitiveTicketCounts;
};

export const DEFAULT_NEW_GAME_SETTINGS: NewGameSettings = {
  mapId: DEFAULT_GAME_MAP_ID,
  numDetectives: 2,
  numFugitives: 1,
  detectiveTickets: { ...DEFAULT_DETECTIVE_TICKET_COUNTS },
  fugitiveTickets: { ...DEFAULT_FUGITIVE_TICKET_COUNTS },
};

function getDetectiveProperties(
  playerOrdinal: number,
  startingPosition: number,
  ticketCounts?: DetectiveTicketCounts,
): PlayerState {
  const t = ticketCounts ?? DEFAULT_DETECTIVE_TICKET_COUNTS;
  return {
    description: {
      id: `detective-${playerOrdinal + 1}`,
      name: `Detective ${playerOrdinal + 1}`,
      color: COLORS_FOR_DETECTIVES[playerOrdinal],
      order: playerOrdinal,
      isDetective: true,
    },
    position: startingPosition,
    tickets: {
      taxi: t.taxi,
      bus: t.bus,
      underground: t.underground,
      black: 0,
      double: 0,
    },
  } as PlayerState;
}

const MR_X_NAMES = ["Mr X", "Mr Y", "Mr Z"];

const FUGITIVE_COLORS: Color[] = ["mrX", "mrY", "mrZ"];

function getMrXProperties(
  playerOrdinal: number,
  startingPosition: number,
  mrXOrdinal: number,
  ticketCounts?: FugitiveTicketCounts,
): PlayerState {
  const t = ticketCounts ?? DEFAULT_FUGITIVE_TICKET_COUNTS;
  return {
    description: {
      id: `mrX-${mrXOrdinal + 1}`,
      name: MR_X_NAMES[mrXOrdinal],
      color: FUGITIVE_COLORS[mrXOrdinal]!,
      order: playerOrdinal,
      isDetective: false,
    },
    position: startingPosition,
    tickets: {
      taxi: t.taxi,
      bus: t.bus,
      underground: t.underground,
      black: t.black,
      double: t.double,
    },
  } as PlayerState;
}

export function initialState(
  mapId: GameMapId,
  mapGraph: MapGraph,
  numDetectives: number,
  numMrX: number,
  ticketSettings?: { detective: DetectiveTicketCounts; fugitive: FugitiveTicketCounts },
): GameState {
  const startingPositions = getRandomValues(mapGraph.startingPositions, numDetectives + numMrX);
  const detTickets = ticketSettings?.detective;
  const fugTickets = ticketSettings?.fugitive;
  const players: PlayerState[] = startingPositions.map((startingPosition, playerOrdinal) => {
    return playerOrdinal < numDetectives
      ? getDetectiveProperties(playerOrdinal, startingPosition, detTickets)
      : getMrXProperties(playerOrdinal, startingPosition, playerOrdinal - numDetectives, fugTickets);
  });

  return {
    mapId,
    players: players,
    currentTurn: {
      playerOrdinal: 0,
      ticket: null,
      turnNumber: 0,
    },
    gameover: null,
    mapGraph: mapGraph,
    turns: defaultTurns,
    turnLog: [] as TurnLog,
  };
}