import { Color, Ticket, GameOver } from "../constants";
import { interestingMapGraph } from "./defaultMapGraph";
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
};

export type TurnLogEntry = {
  turnNumber: number;
  playerOrdinal: number;
  ticket: Ticket | null;
  position: number;
};

export type TurnLog = TurnLogEntry[];

export function initialState(): GameState {
  return {
    players: [
    {
      description: {
        id: "1",
        name: "Detective 1",
        color: "red",
        order: 0,
        isDetective: true,
      },
      position: 1,
      tickets: {
        taxi: 10,
        bus: 8,
        underground: 4,
        black: 0,
        double: 0,
      },
    },
    {
        description: {
          id: "2",
          name: "Detective 2",
          color: "blue",
          order: 1,
          isDetective: true,
        },
        position: 2,
        tickets: {
          taxi: 10,
          bus: 8,
          underground: 4,
          black: 0,
          double: 0,
        },
      },
      {
        description: {
          id: "3",
          name: "Mr X",
          color: "mrX",
          order: 2,
          isDetective: false,
        },
        position: 3,
        tickets: {
          taxi: 4,
          bus: 3,
          underground: 2,
          black: 5,
          double: 2,
        },
      },
    ],
    currentTurn: {
      playerOrdinal: 0,
      ticket: null,
      turnNumber: 0,
    },
    gameover: null,
    mapGraph: interestingMapGraph,
    turns: defaultTurns,
    turnLog: [] as TurnLog,
  };
}