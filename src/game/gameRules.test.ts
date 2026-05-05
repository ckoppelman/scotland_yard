import { describe, it, expect } from "vitest";
import type { Color } from "../constants";
import type { Ticket } from "../constants";
import type { CurrentTurn, GameState, MapGraph, PlayerState } from "./gameState";
import { TurnPhase } from "./gameState";
import { DEFAULT_GAME_MAP_ID } from "./mapIds";
import {
    tryPlayTicket,
    getTicketsBetweenNodes,
    getPlayableTicketsBetweenNodes,
    getPlayerCanMove,
    getReachableNodesForSelectedTicket,
    getReachableNodesForDragPreview,
    hasPlayableMoveWithTicket,
    tryPlayDoubleMove,
    tryCancelDoubleMove,
    tryPlayMoveToAdjacent,
    getWinner,
    passTurn,
    tryPlayNode,
    initPlayer,
    clearPrivacy,
} from "./gameRules";

/** Fixed length so `getWinner` round-limit branch matches production `defaultTurns` (24). */
const TURNS_24 = Array.from({ length: 24 }, () => ({ showMrX: false }));

function edge(a: number, b: number, ticket: Ticket) {
    return { nodes: new Set<number>([a, b]), ticket };
}

function triangleGraph(): MapGraph {
    return {
        nodes: [
            { id: 1, position: { x: 0, y: 0 } },
            { id: 2, position: { x: 1, y: 0 } },
            { id: 3, position: { x: 2, y: 0 } },
            { id: 4, position: { x: 3, y: 0 } },
        ],
        connections: [
            edge(1, 2, "taxi"),
            edge(2, 3, "bus"),
            edge(1, 3, "underground"),
            edge(3, 4, "taxi"),
        ],
        startingPositions: [1, 2, 3, 4],
    };
}

// Graph looks like this:
// 1 -taxi- 2
// |
// UND
// |
// 3 -taxi- 4

function detective(
    ordinal: number,
    name: string,
    color: Color,
    position: number | null,
    tickets: Partial<Record<Ticket, number>> = {},
): PlayerState {
    const base: Record<Ticket, number> = { taxi: 10, bus: 8, underground: 4, black: 0, double: 0 };
    return {
        description: {
            id: `det-${ordinal}`,
            name,
            color,
            order: ordinal,
            isDetective: true,
        },
        position,
        tickets: { ...base, ...tickets },
    };
}

function fugitive(ordinal: number, position: number | null, tickets: Partial<Record<Ticket, number>> = {}): PlayerState {
    const base: Record<Ticket, number> = { taxi: 4, bus: 3, underground: 2, black: 5, double: 2 };
    return {
        description: {
            id: `mrx-${ordinal}`,
            name: "Mr X",
            color: "mrX",
            order: ordinal,
            isDetective: false,
        },
        position,
        tickets: { ...base, ...tickets },
    };
}

function initialCurrentTurn(partial: Partial<CurrentTurn>): CurrentTurn {
    return {
        playerOrdinal: 0,
        ticket: null,
        turnNumber: 1,
        isPaused: false,
        detectivesPassing: new Set<number>(),
        phase: TurnPhase.DETECTIVE,
        ...partial,
    } as CurrentTurn;
}

function gameState(partial: Omit<Partial<GameState>, "players"> & { players: PlayerState[] }): GameState {
    const { players, currentTurn: ct, ...rest } = partial;
    return {
        mapId: DEFAULT_GAME_MAP_ID,
        mapGraph: triangleGraph(),
        players,
        currentTurn: {
            playerOrdinal: 0,
            ticket: null,
            turnNumber: 1,
            phase: TurnPhase.DETECTIVE,
            isPaused: false,
            detectivesPassing: new Set<number>(),
            ...ct,
        },
        gameover: null,
        turns: TURNS_24,
        turnLog: [],
        ...rest,
    };
}

describe("tryPlayTicket", () => {
    it("rejects when the game is over", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
            gameover: { winner: "mrX", detectiveLossReason: "test" },
        });
        const r = tryPlayTicket(s, "taxi");
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.message).toMatch(/over/i);
    });

    it("rejects when the player has no tickets of that type", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1, { taxi: 0 }), fugitive(1, 3)],
        });
        const r = tryPlayTicket(s, "taxi");
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.message).toContain("taxi");
    });

    it("sets the selected ticket on success", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
        });
        const r = tryPlayTicket(s, "bus");
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.state.currentTurn.ticket).toBe("bus");
    });
});

describe("getTicketsBetweenNodes", () => {
    it("returns ticket types for each edge between adjacent stations", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
        });
        expect(getTicketsBetweenNodes(s, 1, 2)).toEqual(["taxi"]);
        expect(getTicketsBetweenNodes(s, 2, 3)).toEqual(["bus"]);
        const oneThree = getTicketsBetweenNodes(s, 1, 3).slice().sort();
        expect(oneThree).toEqual(["underground"]);
    });

    it("returns empty when nodes are not adjacent or null", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
        });
        expect(getTicketsBetweenNodes(s, 1, 4)).toEqual([]);
        expect(getTicketsBetweenNodes(s, null, 2)).toEqual([]);
    });
});

describe("getPlayableTicketsBetweenNodes", () => {
    it("includes only ticket types the player still holds", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1, { taxi: 0, bus: 1 }), fugitive(1, 3)],
        });
        expect(getPlayableTicketsBetweenNodes(s, 1, 2)).toEqual([]);
        expect(getPlayableTicketsBetweenNodes(s, 2, 3)).toEqual(["bus"]);
    });

    it("includes black as wildcard when the fugitive has black tickets", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 2, { taxi: 0, black: 1 })],
            currentTurn: initialCurrentTurn({ playerOrdinal: 1, phase: TurnPhase.FUGITIVE }),
        });
        const playable = getPlayableTicketsBetweenNodes(s, 2, 3);
        expect(playable).toContain("black");
    });
});

describe("getPlayerCanMove", () => {
    it("is false when position is null", () => {
        const s = gameState({
            players: [detective(0, "A", "red", null), fugitive(1, 3)],
        });
        expect(getPlayerCanMove(s, s.players[0])).toBe(false);
    });

    it("is false when every neighbor is blocked by a detective or no affordable edge exists", () => {
        const s = gameState({
            players: [
                detective(0, "A", "red", 1, { taxi: 0, bus: 0, underground: 0 }),
                detective(1, "B", "blue", 2),
                fugitive(2, 3),
            ],
        });
        expect(getPlayerCanMove(s, s.players[0])).toBe(false);
    });

    it("is true when there is an adjacent empty station and a matching ticket", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1), detective(1, "B", "blue", 4), fugitive(2, 3)],
        });
        expect(getPlayerCanMove(s, s.players[0])).toBe(true);
    });

    it("treats a detective-occupied neighbor as blocked when no other neighbor is usable", () => {
        const s = gameState({
            players: [
                detective(0, "A", "red", 1, { taxi: 1, bus: 0, underground: 0 }),
                detective(1, "B", "blue", 2),
                fugitive(2, 3),
            ],
        });
        expect(getPlayerCanMove(s, s.players[0])).toBe(false);
    });
});

describe("getReachableNodesForSelectedTicket", () => {
    it("returns empty when no ticket is selected", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
        });
        expect(getReachableNodesForSelectedTicket(s)).toEqual([]);
    });

    it("returns adjacent nodes matching the selected ticket", () => {
        let s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
        });
        const t = tryPlayTicket(s, "taxi");
        expect(t.ok).toBe(true);
        if (!t.ok) return;
        s = t.state;
        expect(getReachableNodesForSelectedTicket(s).sort((a, b) => a - b)).toEqual([2]);
    });

    it("allows black on any edge for Mr X when stocked", () => {
        let s = gameState({
            players: [detective(0, "A", "red", 4), fugitive(1, 2, { taxi: 0, bus: 1, black: 1 })],
            currentTurn: initialCurrentTurn({ playerOrdinal: 1, phase: TurnPhase.FUGITIVE }),
        });
        const t = tryPlayTicket(s, "black");
        expect(t.ok).toBe(true);
        if (!t.ok) return;
        s = t.state;
        const nodes = getReachableNodesForSelectedTicket(s).sort((a, b) => a - b);
        expect(nodes).toContain(1);
        expect(nodes).toContain(3);
    });
});

describe("getReachableNodesForDragPreview", () => {
    it("returns empty when the current player has no station yet", () => {
        const s = gameState({
            players: [detective(0, "A", "red", null), fugitive(1, 3)],
        });
        expect(getReachableNodesForDragPreview(s)).toEqual([]);
    });

    it("lists destinations affordable with any ticket before a ticket is chosen", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
        });
        const nodes = getReachableNodesForDragPreview(s).sort((a, b) => a - b);
        expect(nodes).toEqual([2, 3]);
    });

    it("returns empty when game is over", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
            gameover: { winner: "detective", captureBy: "A" },
        });
        expect(getReachableNodesForDragPreview(s)).toEqual([]);
    });
});

describe("hasPlayableMoveWithTicket", () => {
    it("is false when the game has ended", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
            gameover: { winner: "detective", captureBy: "A" },
        });
        expect(hasPlayableMoveWithTicket(s, "taxi")).toBe(false);
    });

    it("is false when the player has no such ticket", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1, { taxi: 0 }), fugitive(1, 3)],
        });
        expect(hasPlayableMoveWithTicket(s, "taxi")).toBe(false);
    });

    it("is true when the ticket matches an open edge", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
        });
        expect(hasPlayableMoveWithTicket(s, "taxi")).toBe(true);
    });
});

describe("double-move integration", () => {
    it("after starting a double, the first leg advances to part 2 without advancing to the next player", () => {
        let s = gameState({
            players: [detective(0, "A", "red", 4), fugitive(1, 2, { double: 2, taxi: 2 })],
            currentTurn: initialCurrentTurn({ playerOrdinal: 1, phase: TurnPhase.FUGITIVE }),
        });
        const d = tryPlayDoubleMove(s);
        expect(d.ok).toBe(true);
        if (!d.ok) return;
        s = d.state;
        const t = tryPlayTicket(s, "taxi");
        expect(t.ok).toBe(true);
        if (!t.ok) return;
        s = t.state;
        const n = tryPlayNode(s, 1);
        expect(n.ok).toBe(true);
        if (!n.ok) return;
        expect(n.state.currentTurn.doubleMovePart).toBe(2);
        expect(n.state.currentTurn.playerOrdinal).toBe(1);
    });
});

describe("tryPlayDoubleMove / tryCancelDoubleMove", () => {
    it("tryPlayDoubleMove rejects when already in double-move part 1", () => {
        const s = gameState({
            players: [fugitive(0, 2, { double: 2 })],
            currentTurn: initialCurrentTurn({
                playerOrdinal: 0,
                phase: TurnPhase.FUGITIVE,
                doubleMovePart: 1,
            }),
        });
        const r = tryPlayDoubleMove(s);
        expect(r.ok).toBe(false);
    });

    it("tryPlayDoubleMove rejects when a ticket is already selected", () => {
        let s = gameState({
            players: [fugitive(0, 2, { double: 1 })],
            currentTurn: initialCurrentTurn({ playerOrdinal: 0, phase: TurnPhase.FUGITIVE, ticket: "taxi" as Ticket }),
        });
        const r = tryPlayDoubleMove(s);
        expect(r.ok).toBe(false);
    });

    it("consumes one double ticket and sets doubleMovePart to 1", () => {
        const s = gameState({
            players: [fugitive(0, 2, { double: 2 })],
            currentTurn: initialCurrentTurn({ playerOrdinal: 0, phase: TurnPhase.FUGITIVE }),
        });
        const r = tryPlayDoubleMove(s);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.state.players[0].tickets.double).toBe(1);
        expect(r.state.currentTurn.doubleMovePart).toBe(1);
    });

    it("tryCancelDoubleMove refunds the double ticket only from part 1", () => {
        let s = gameState({
            players: [fugitive(0, 2, { double: 1 })],
            currentTurn: initialCurrentTurn({
                playerOrdinal: 0,
                phase: TurnPhase.FUGITIVE,
                doubleMovePart: 1,
            }),
        });
        const r = tryCancelDoubleMove(s);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.state.players[0].tickets.double).toBe(2);
        expect(r.state.currentTurn.doubleMovePart).toBeUndefined();
        expect(r.state.currentTurn.ticket).toBeNull();
    });

    it("tryCancelDoubleMove rejects when not in part 1", () => {
        const s = gameState({
            players: [fugitive(0, 2)],
            currentTurn: initialCurrentTurn({
                playerOrdinal: 0,
                phase: TurnPhase.FUGITIVE,
                doubleMovePart: 2,
            }),
        });
        expect(tryCancelDoubleMove(s).ok).toBe(false);
    });
});

describe("tryPlayMoveToAdjacent", () => {
    it("fails when a ticket is already selected", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
            currentTurn: initialCurrentTurn({ ticket: "taxi" as Ticket }),
        });
        const r = tryPlayMoveToAdjacent(s, 2, "taxi");
        expect(r.ok).toBe(false);
    });

    it("applies a legal taxi move in one step", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
        });
        const r = tryPlayMoveToAdjacent(s, 2, "taxi");
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.state.players[0].position).toBe(2);
        expect(r.state.players[0].tickets.taxi).toBe(9);
        expect(r.state.currentTurn.ticket).toBeNull();
    });
});

describe("getWinner", () => {
    it("returns a detective when every detective shares Mr X station", () => {
        const s = gameState({
            players: [
                detective(0, "Amy", "red", 5),
                detective(1, "Bob", "blue", 5),
                fugitive(2, 5),
            ],
        });
        const w = getWinner(s);
        expect(w).not.toBeNull();
        expect(w!.isDetective).toBe(true);
    });

    it("returns Mr X when the round counter is past the configured rounds", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 4)],
            currentTurn: initialCurrentTurn({ turnNumber: 25 }),
        });
        const w = getWinner(s);
        expect(w).not.toBeNull();
        expect(w!.isDetective).toBe(false);
    });

    it("returns Mr X when all detectives are passing", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1), detective(1, "B", "blue", 2), fugitive(2, 4)],
            currentTurn: initialCurrentTurn({
                detectivesPassing: new Set([0, 1]),
            }),
        });
        const w = getWinner(s);
        expect(w).not.toBeNull();
        expect(w!.isDetective).toBe(false);
    });

    it("returns null mid-game with no capture or exhaustion condition", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 4)],
        });
        expect(getWinner(s)).toBeNull();
    });
});

describe("passTurn", () => {
    it("rejects when the player can still move", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
        });
        const r = passTurn(s);
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.message).toMatch(/must move/i);
    });

    it("rejects in the middle of double-move part 1", () => {
        const s = gameState({
            players: [fugitive(0, 2, { taxi: 0, bus: 0, underground: 0, black: 0 })],
            currentTurn: initialCurrentTurn({
                playerOrdinal: 0,
                phase: TurnPhase.FUGITIVE,
                doubleMovePart: 1,
            }),
        });
        expect(passTurn(s).ok).toBe(false);
    });

    it("ends the game when Mr X must pass in fugitive phase", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 2, { taxi: 0, bus: 0, underground: 0, black: 0 })],
            currentTurn: initialCurrentTurn({ playerOrdinal: 1, phase: TurnPhase.FUGITIVE }),
        });
        const r = passTurn(s);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.state.gameover?.winner).toBe("detective");
        expect(r.state.gameover?.mrXLossReason).toBeDefined();
    });

    it("advances turn when a detective passes with no moves", () => {
        const s = gameState({
            players: [
                detective(0, "A", "red", 1, { taxi: 0, bus: 0, underground: 0 }),
                detective(1, "B", "blue", 99),
                fugitive(2, 3),
            ],
        });
        const r = passTurn(s);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.state.currentTurn.playerOrdinal).toBe(1);
        expect(r.state.currentTurn.detectivesPassing.has(0)).toBe(true);
    });

    it("sets Mr. X as winner when all detectives are passing", () => {
        const s = gameState({
            players: [
                detective(0, "A", "red", 1, { taxi: 0, bus: 0, underground: 0 }),
                detective(1, "B", "blue", 2, { taxi: 0, bus: 0, underground: 0 }),
                fugitive(2, 3),
            ],
            currentTurn: initialCurrentTurn({
                detectivesPassing: new Set([0]),
                playerOrdinal: 1,
                phase: TurnPhase.DETECTIVE,
            }),
        });
        const r = passTurn(s);

        console.log(r);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.state.gameover?.winner).toBe("mrX");
    });

    it("sets no winner when only one detective is passing", () => {
        const s = gameState({
            players: [
                detective(0, "A", "red", 1, { taxi: 0, bus: 0, underground: 0 }),
                detective(1, "B", "blue", 2, { taxi: 0, bus: 0, underground: 0 }),
                fugitive(2, 3),
            ],
            currentTurn: initialCurrentTurn({
                detectivesPassing: new Set(),
                playerOrdinal: 0,
                phase: TurnPhase.DETECTIVE,
            }),
        });
        const r = passTurn(s);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.state.gameover).toBeNull();
    });

});

describe("tryPlayNode", () => {
    it("increments turnNumber after the last player in seating order moves", () => {
        const s0 = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
            currentTurn: initialCurrentTurn({ playerOrdinal: 1, turnNumber: 2, phase: TurnPhase.FUGITIVE }),
        });
        const t = tryPlayTicket(s0, "taxi");
        expect(t.ok).toBe(true);
        if (!t.ok) return;
        let s = t.state;
        const r = tryPlayNode(s, 4);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.state.currentTurn.turnNumber).toBe(3);
    });

    it("does not increment turnNumber when more players remain in the same round", () => {
        const s0 = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
            currentTurn: initialCurrentTurn({ playerOrdinal: 0, turnNumber: 5, phase: TurnPhase.DETECTIVE }),
        });
        const t = tryPlayTicket(s0, "taxi");
        expect(t.ok).toBe(true);
        if (!t.ok) return;
        let s = t.state;
        const r = tryPlayNode(s, 2);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.state.currentTurn.turnNumber).toBe(5);
    });

    it("rejects when game is already over", () => {
        let s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
            gameover: { winner: "mrX", detectiveLossReason: "time" },
            currentTurn: initialCurrentTurn({ ticket: "taxi" as Ticket }),
        });
        const r = tryPlayNode(s, 2);
        expect(r.ok).toBe(false);
    });

    it("requires a ticket to be chosen first", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
        });
        const r = tryPlayNode(s, 2);
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.message).toMatch(/Choose a ticket/i);
    });

    it("rejects moving to the same station", () => {
        let s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
        });
        const t = tryPlayTicket(s, "taxi");
        expect(t.ok).toBe(true);
        if (!t.ok) return;
        s = t.state;
        const r = tryPlayNode(s, 1);
        expect(r.ok).toBe(false);
    });

    it("rejects when there is no direct route", () => {
        let s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
        });
        const t = tryPlayTicket(s, "taxi");
        expect(t.ok).toBe(true);
        if (!t.ok) return;
        s = t.state;
        const r = tryPlayNode(s, 4);
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.message).toMatch(/direct route/i);
    });

    it("rejects wrong ticket type for the edge", () => {
        let s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
        });
        const t = tryPlayTicket(s, "bus");
        expect(t.ok).toBe(true);
        if (!t.ok) return;
        s = t.state;
        const r = tryPlayNode(s, 2);
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.message).toMatch(/needs/i);
    });

    it("rejects moving onto a station occupied by another detective", () => {
        let s = gameState({
            players: [detective(0, "A", "red", 1), detective(1, "B", "blue", 2), fugitive(2, 3)],
        });
        const t = tryPlayTicket(s, "taxi");
        expect(t.ok).toBe(true);
        if (!t.ok) return;
        s = t.state;
        const r = tryPlayNode(s, 2);
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.message).toMatch(/occupied/i);
    });

    it("transfers the spent ticket to Mr X when a detective moves", () => {
        let s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
        });
        const t = tryPlayTicket(s, "taxi");
        expect(t.ok).toBe(true);
        if (!t.ok) return;
        s = t.state;
        const before = s.players[1].tickets.taxi;
        const r = tryPlayNode(s, 2);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.state.players[1].tickets.taxi).toBe(before + 1);
    });

    it("declares detective win on capture", () => {
        let s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 2)],
        });
        const t = tryPlayTicket(s, "taxi");
        expect(t.ok).toBe(true);
        if (!t.ok) return;
        s = t.state;
        const r = tryPlayNode(s, 2);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.state.gameover?.winner).toBe("detective");
        expect(r.state.gameover?.captureBy).toBe("A");
    });
});

describe("initPlayer", () => {
    it("sets position and appends a turn-log entry", () => {
        const s = gameState({
            players: [detective(0, "A", "red", null), fugitive(1, null)],
        });
        const r = initPlayer(s, 0, 3);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.state.players[0].position).toBe(3);
        expect(r.state.turnLog).toHaveLength(1);
        expect(r.state.turnLog[0]).toMatchObject({
            playerOrdinal: 0,
            position: 3,
            ticket: null,
        });
    });
});

describe("clearPrivacy", () => {
    it("when already in detective phase and the next player is also a detective, stays on detective turn flow", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1), detective(1, "B", "blue", 2), fugitive(2, 3)],
            currentTurn: initialCurrentTurn({ phase: TurnPhase.DETECTIVE, playerOrdinal: 0 }),
        });
        const r = clearPrivacy(s);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.state.currentTurn.phase).toBe(TurnPhase.DETECTIVE);
    });

    it("moves from privacy detective to detective when clearing", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
            currentTurn: initialCurrentTurn({ phase: TurnPhase.PRIVACY_DETECTIVE }),
        });
        const r = clearPrivacy(s);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.state.currentTurn.phase).toBe(TurnPhase.DETECTIVE);
    });

    it("moves from privacy fugitive to fugitive when clearing", () => {
        const s = gameState({
            players: [detective(0, "A", "red", 1), fugitive(1, 3)],
            currentTurn: initialCurrentTurn({ phase: TurnPhase.PRIVACY_FUGITIVE }),
        });
        const r = clearPrivacy(s);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.state.currentTurn.phase).toBe(TurnPhase.FUGITIVE);
    });
});
