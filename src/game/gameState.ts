import { Color, Ticket, GameOver } from "../constants";
import { defaultTurns } from "./defaultTurns";


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

function getDetectiveProperties(playerOrdinal: number, startingPosition: number): PlayerState {
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
      taxi: 10,
      bus: 8,
      underground: 4,
      black: 0,
      double: 0,
    },
  } as PlayerState;
}

const MR_X_NAMES = ["Mr X", "Mr Y", "Mr Z"];

function getMrXProperties(playerOrdinal: number, startingPosition: number, mrXOrdinal: number): PlayerState {
  return {
    description: {
      id: `mrX-${mrXOrdinal + 1}`,
      name: MR_X_NAMES[mrXOrdinal],
      color: "mrX",
      order: playerOrdinal,
      isDetective: false,
    },
    position: startingPosition,
    tickets: {
      taxi: 4,
      bus: 3,
      underground: 2,
      black: 5,
      double: 2,
    }
  } as PlayerState;
}

export function initialState(mapGraph: MapGraph, numDetectives: number, numMrX: number): GameState {
  const startingPositions = getRandomValues(mapGraph.startingPositions, numDetectives + numMrX);
  const players: PlayerState[] = startingPositions.map((startingPosition, playerOrdinal) => {
    return playerOrdinal < numDetectives ?
      getDetectiveProperties(playerOrdinal, startingPosition) :
      getMrXProperties(playerOrdinal, startingPosition, playerOrdinal - numDetectives);
  });

  return {
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