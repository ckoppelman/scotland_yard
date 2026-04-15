import { Color, Ticket, GameOver } from "../constants";


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
  show_mr_x: boolean;
}

export type ScotlandYardState = {
  players: PlayerState[];
  currentTurn: {
    playerOrdinal: number;
    ticket: Ticket | null;
    turnNumber: number;
  };
  gameover: GameOver | null;
  mapGraph: MapGraph;
  turns: TurnState[];
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

export function initialState(): ScotlandYardState {
  return {
    players: [
    {
      description: {
        id: "1",
        name: "Detective 1",
        color: "red",
        order: 1,
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
          order: 2,
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
          color: "mr_x",
          order: 3,
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
    mapGraph: {
        nodes: [
          {
            id: 1,
            position: { x: 0, y: 0 },
          },
          {
            id: 2,
            position: { x: 0, y: 1 },
          },
          {
            id: 3,
            position: { x: 1, y: 0 },
          }
        ],
        connections: [
          {
            nodes: new Set([1, 2]),
            ticket: "taxi",
          },
          {
            nodes: new Set([2, 3]),
            ticket: "bus",
          },
          {
            nodes: new Set([3, 1]),
            ticket: "underground",
          },
          {
            nodes: new Set([1, 2]),
            ticket: "bus",
          }
        ],
    },
    turns: [
      {
        show_mr_x: false,
      },
      {
        show_mr_x: false,
      },
      {
        show_mr_x: false,
      },
      {
        show_mr_x: true,
      },
    ],
  };
}