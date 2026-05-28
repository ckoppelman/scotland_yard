import type { Color, Ticket } from "../constants";
import { DEFAULT_GAME_RULES, TurnPhase, type CurrentTurn, type GameState, type MapGraph, type PlayerState } from "../game/gameState";
import { DEFAULT_GAME_MAP_ID } from "../game/mapIds";

export const TURNS_24 = Array.from({ length: 24 }, (_, i) => ({ showMrX: i % 3 === 0 }));

export const LINE_GRAPH: MapGraph = {
    nodes: [
        { id: 1, position: { x: 0, y: 0 } },
        { id: 2, position: { x: 1, y: 0 } },
        { id: 3, position: { x: 2, y: 0 } },
        { id: 4, position: { x: 3, y: 0 } },
    ],
    connections: [
        { nodes: new Set([1, 2]), ticket: "taxi" as Ticket },
        { nodes: new Set([2, 3]), ticket: "taxi" as Ticket },
        { nodes: new Set([3, 4]), ticket: "taxi" as Ticket },
    ],
    startingPositions: [1, 2, 3, 4],
};

export function makePlayer(
    ordinal: number,
    isDetective: boolean,
    color: Color,
    position: number | null,
    name?: string,
): PlayerState {
    return {
        description: {
            id: `${isDetective ? "det" : "fug"}-${ordinal}`,
            name: name ?? (isDetective ? `Detective ${ordinal + 1}` : `Fugitive ${ordinal}`),
            color,
            order: ordinal,
            isDetective,
        },
        position,
        tickets: { taxi: 4, bus: 3, underground: 2, black: 5, double: 2 },
    };
}

export function makeCurrentTurn(partial: Partial<CurrentTurn> = {}): CurrentTurn {
    return {
        playerOrdinal: 0,
        ticket: null,
        turnNumber: 1,
        phase: TurnPhase.DETECTIVE,
        isPaused: false,
        detectivesPassing: [],
        fugitivesPassing: [],
        ...partial,
    };
}

export function makeGameState(
    partial: Partial<Omit<GameState, "players" | "currentTurn">> & {
        players: PlayerState[];
        currentTurn?: Partial<CurrentTurn>;
    },
): GameState {
    const { players, currentTurn, mapGraph, turns, ...rest } = partial;
    return {
        mapId: DEFAULT_GAME_MAP_ID,
        mapGraph: mapGraph ?? LINE_GRAPH,
        players,
        currentTurn: makeCurrentTurn(currentTurn),
        winner: null,
        turns: turns ?? TURNS_24,
        turnLog: [],
        gameRules: DEFAULT_GAME_RULES,
        fugitivePrivacyDismissed: false,
        ...rest,
    };
}

/** 2 detectives + 1 fugitive (classic). */
export function oneFugitiveRoster(): PlayerState[] {
    return [
        makePlayer(0, true, "red", 1),
        makePlayer(1, true, "blue", 2),
        makePlayer(2, false, "mrX", 3, "Mr X"),
    ];
}

/** 2 detectives + 2 fugitives. */
export function twoFugitiveRoster(): PlayerState[] {
    return [
        makePlayer(0, true, "red", 1),
        makePlayer(1, true, "blue", 2),
        makePlayer(2, false, "mrX", 3, "Mr X"),
        makePlayer(3, false, "mrY", 4, "Mr Y"),
    ];
}

/** 2 detectives + 3 fugitives. */
export function threeFugitiveRoster(): PlayerState[] {
    return [
        makePlayer(0, true, "red", 1),
        makePlayer(1, true, "blue", 2),
        makePlayer(2, false, "mrX", 3, "Mr X"),
        makePlayer(3, false, "mrY", 4, "Mr Y"),
        makePlayer(4, false, "mrZ", 2, "Mr Z"),
    ];
}

export function withPhase(
    state: GameState,
    phase: TurnPhase,
    playerOrdinal = state.currentTurn.playerOrdinal,
    turnNumber = state.currentTurn.turnNumber,
): GameState {
    return {
        ...state,
        currentTurn: { ...state.currentTurn, phase, playerOrdinal, turnNumber },
    };
}

export function transition(
    state: GameState,
    nextPartial: Partial<CurrentTurn>,
): GameState {
    return {
        ...state,
        currentTurn: { ...state.currentTurn, ...nextPartial },
    };
}
