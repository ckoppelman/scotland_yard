import { Ticket } from "../constants";
import { PlayerDescription, GameState, TurnLogEntry, PlayerState } from "./gameState";

export type PlayOk = { ok: true; state: GameState };
export type PlayFail = { ok: false; message: string };
export type PlayResult = PlayOk | PlayFail;

function ticketLabel(ticket: Ticket): string {
    const labels: Record<Ticket, string> = {
        taxi: "taxi",
        bus: "bus",
        underground: "underground",
        black: "black",
        double: "double",
    };
    return labels[ticket];
}

export function tryPlayTicket(state: GameState, ticket: Ticket): PlayResult {
    if (state.gameover) return { ok: false, message: "The game is over." };
    const player = state.players[state.currentTurn.playerOrdinal];
    if (player.tickets[ticket] === 0) {
        return { ok: false, message: `No ${ticketLabel(ticket)} tickets left.` };
    }
    return { ok: true, state: { ...state, currentTurn: { ...state.currentTurn, ticket } } };
}

function connectionTicketTypes(state: GameState, node1: number | null, node2: number | null): Ticket[] {
    if (node1 === null || node2 === null) return [];
    return state.mapGraph.connections.filter((connection) => connection.nodes.has(node1) && connection.nodes.has(node2)).map((connection) => connection.ticket);
}

/** Ticket types on direct edges between two stations (empty if not adjacent). */
export function getTicketsBetweenNodes(state: GameState, node1: number | null, node2: number | null): Ticket[] {
    return connectionTicketTypes(state, node1, node2);
}

/**
 * Tickets the current player may spend for a move along this edge (includes black as a wildcard when stocked).
 */
export function getPlayableTicketsBetweenNodes(state: GameState, node1: number | null, node2: number | null): Ticket[] {
    const player = state.players[state.currentTurn.playerOrdinal];
    const edgeTickets = connectionTicketTypes(state, node1, node2);
    if (edgeTickets.length === 0) return [];
    const playable = new Set<Ticket>();
    for (const t of edgeTickets) {
        if (player.tickets[t] > 0) playable.add(t);
    }
    if (player.tickets.black > 0) playable.add("black");
    return [...playable];
}

/** Whether spending `played` is legal for an edge that supports `edgeTickets`. Black is a wildcard for any link. */
function ticketAllowsEdge(played: Ticket, edgeTickets: Ticket[]): boolean {
    if (edgeTickets.length === 0) return false;
    if (played === "black") return true;
    return edgeTickets.includes(played);
}

function neighborStationIds(state: GameState, from: number): number[] {
    const out = new Set<number>();
    for (const conn of state.mapGraph.connections) {
        if (!conn.nodes.has(from)) continue;
        for (const n of conn.nodes) {
            if (n !== from) out.add(n);
        }
    }
    return [...out];
}

/**
 * Stations the current player can legally move to using the already-selected ticket (ticket-first flow).
 * Mirrors `tryPlayNode` + occupier rules from `movePlayer`.
 */
export function getReachableNodesForSelectedTicket(state: GameState): number[] {
    if (state.gameover || state.currentTurn.ticket === null) return [];
    const player = state.players[state.currentTurn.playerOrdinal];
    if (player.position === null) return [];
    const from = player.position;
    const t = state.currentTurn.ticket;
    const reachable: number[] = [];
    for (const node of neighborStationIds(state, from)) {
        const validTickets = connectionTicketTypes(state, from, node);
        if (!ticketAllowsEdge(t, validTickets)) continue;
        const occupier = state.players.find((p) => p.description.isDetective && p.position === node);
        if (occupier !== undefined) continue;
        reachable.push(node);
    }
    return reachable;
}

/**
 * Stations the current player could drop onto after a drag, using any ticket they still hold on a valid edge.
 * (Preview while dragging before a ticket is chosen.)
 */
export function getReachableNodesForDragPreview(state: GameState): number[] {
    if (state.gameover) return [];
    const player = state.players[state.currentTurn.playerOrdinal];
    if (player.position === null) return [];
    const from = player.position;
    const reachable: number[] = [];
    for (const node of neighborStationIds(state, from)) {
        const validTickets = connectionTicketTypes(state, from, node);
        const canAffordSomeEdge =
            validTickets.some((ticket) => player.tickets[ticket] > 0) ||
            (player.tickets.black > 0 && validTickets.length > 0);
        if (!canAffordSomeEdge) continue;
        const occupier = state.players.find((p) => p.description.isDetective && p.position === node);
        if (occupier !== undefined) continue;
        reachable.push(node);
    }
    return reachable;
}

/** True if the current player can legally start a move using this ticket (has stock, edge exists, target not blocked). */
export function hasPlayableMoveWithTicket(state: GameState, ticket: Ticket): boolean {
    if (state.gameover) return false;
    const player = state.players[state.currentTurn.playerOrdinal];
    if (player.position === null || player.tickets[ticket] <= 0) return false;
    const from = player.position;
    for (const node of neighborStationIds(state, from)) {
        const validTickets = connectionTicketTypes(state, from, node);
        if (!ticketAllowsEdge(ticket, validTickets)) continue;
        const occupier = state.players.find((p) => p.description.isDetective && p.position === node);
        if (occupier !== undefined) continue;
        return true;
    }
    return false;
}

export function tryPlayDoubleMove(state: GameState): PlayResult {
    if (state.gameover) return { ok: false, message: "The game is over." };
    if (state.currentTurn.ticket !== null) return { ok: false, message: "You have already selected a ticket." };
    if (state.currentTurn.doubleMovePart != null) return { ok: false, message: "You are already in a double move." };
    const playerOrdinal = state.currentTurn.playerOrdinal;
    const player = state.players[playerOrdinal];
    if (player === undefined) return { ok: false, message: "Invalid turn." };
    if (player.tickets.double === 0) return { ok: false, message: "You don't have a double ticket." };
    const players = state.players.map((p, i) =>
        i === playerOrdinal ? { ...p, tickets: { ...p.tickets, double: p.tickets.double - 1 } } : p,
    );
    return {
        ok: true,
        state: {
            ...state,
            players,
            currentTurn: { ...state.currentTurn, doubleMovePart: 1 },
        },
    };
}

/** Undoes {@link tryPlayDoubleMove}: refund double ticket and clear part 1 before any leg is completed. */
export function tryCancelDoubleMove(state: GameState): PlayResult {
    if (state.gameover) return { ok: false, message: "The game is over." };
    if (state.currentTurn.doubleMovePart !== 1) {
        return { ok: false, message: "Not in part 1 of a double move." };
    }
    const playerOrdinal = state.currentTurn.playerOrdinal;
    const players = state.players.map((p, i) =>
        i === playerOrdinal ? { ...p, tickets: { ...p.tickets, double: p.tickets.double + 1 } } : p,
    );
    return {
        ok: true,
        state: {
            ...state,
            players,
            currentTurn: {
                ...state.currentTurn,
                ticket: null,
                doubleMovePart: undefined,
            },
        },
    };
}

/**
 * Select a ticket and move to an adjacent station in one step (for drag-and-drop flow).
 * Fails atomically if the move is illegal.
 */
export function tryPlayMoveToAdjacent(state: GameState, toNode: number, ticket: Ticket): PlayResult {
    if (state.gameover) return { ok: false, message: "The game is over." };
    if (state.currentTurn.ticket !== null) {
        return { ok: false, message: "A ticket is already selected. Cancel or finish that move first." };
    }
    const withTicket = tryPlayTicket(state, ticket);
    if (!withTicket.ok) return withTicket;
    return tryPlayNode(withTicket.state, toNode);
}

export function getWinner(state: GameState): PlayerDescription | null {
    const mrX = state.players.find((player) => !player.description.isDetective);
    if (mrX === undefined) return null;
    for (const player of state.players.filter((player) => player.description.isDetective)) {
        if (player.position === mrX.position) return player.description;
    }
    if (state.currentTurn.turnNumber > state.turns.length) return mrX.description;
    return null;
}

export function tryPlayNode(state: GameState, node: number): PlayResult {
    if (state.gameover) return { ok: false, message: "The game is over." };
    if (state.currentTurn.ticket === null) {
        return { ok: false, message: "Choose a ticket before selecting a station." };
    }
    const playerOrdinal = state.currentTurn.playerOrdinal;
    let player = state.players[playerOrdinal];
    if (player.position === node) {
        return { ok: false, message: "You are already on that station." };
    }

    const validTickets = connectionTicketTypes(state, player.position, node);
    if (validTickets.length === 0) {
        return { ok: false, message: "There is no direct route to that station." };
    }
    if (!ticketAllowsEdge(state.currentTurn.ticket, validTickets)) {
        const need = validTickets.map(ticketLabel).join(" or ");
        return {
            ok: false,
            message: `That connection needs a ${need} ticket (or black as a wildcard), not ${ticketLabel(state.currentTurn.ticket)}.`,
        };
    }

    let result = movePlayer(state, playerOrdinal, node, state.currentTurn.ticket!);
    if (!result.ok) return result;

    const turnNumberIncrement = (playerOrdinal < state.players.length - 1) ? 0 : 1;
    let newState = { ...result.state, currentTurn: { ...result.state.currentTurn, ticket: null, turnNumber: result.state.currentTurn.turnNumber + turnNumberIncrement } };

    const winner = getWinner(newState);
    if (winner !== null) {
        const gameover =
            winner.isDetective
                ? { winner: "detective" as const, captureBy: winner.name }
                : {
                      winner: "mrX" as const,
                      detectiveLossReason: `All ${newState.turns.length} rounds are played without a capture — ${winner.name} gets away.`,
                  };
        return { ok: true, state: { ...newState, gameover } as GameState };
    }

    return { ok: true, state: { ...newState, gameover: null } as GameState };
}


export function initPlayer(state: GameState, playerOrdinal: number, node: number): PlayResult {
    let player = state.players[playerOrdinal];
    player.position = node;

    const turnLogEntry = {
        turnNumber: state.currentTurn.turnNumber,
        playerOrdinal: playerOrdinal,
        ticket: null,
        position: node,
    } as TurnLogEntry;
    return { ok: true, state: { ...state, players: [...state.players.map((p, ix) => ix === playerOrdinal ? player : p)], turnLog: [...state.turnLog, turnLogEntry] } };
}

function getPlayerOrdinalAfterMove(state: GameState): number {
    const playerOrdinal = state.currentTurn.playerOrdinal;
    if (state.currentTurn.doubleMovePart === 1) {
        return playerOrdinal;
    } else {
        return (playerOrdinal + 1) % state.players.length;
    }
}

function movePlayer(state: GameState, playerOrdinal: number, node: number, ticket: Ticket) : PlayResult {
    let player = state.players[playerOrdinal];
    if (player.position === node) return { ok: false, message: "You are already on that station." };
    if (player.position === null) return { ok: false, message: "You are not on any station." };
    if (player.tickets[ticket] === 0) return { ok: false, message: "You don't have that ticket." };
    const occupier = state.players.find((p) => p.description.isDetective && p.position === node);
    if (occupier !== undefined) {
        return {
            ok: false,
            message: `That station is occupied by ${occupier.description.name}.`,
        };
    }
    player.tickets[ticket]--;
    if (state.currentTurn.doubleMovePart === 1) {
        player.tickets.double--;
    }
    player.position = node;

    const newPlayers: PlayerState[] = state.players.map((p, ix): PlayerState => {
        if (player.description.isDetective && !p.description.isDetective) {
            return { ...p, tickets: { ...p.tickets, [ticket]: p.tickets[ticket] + 1 } };
        } else if (ix === playerOrdinal) {
            return player;
        } else {
            return p;
        }
    });

    const turnLogEntry = {
        turnNumber: state.currentTurn.turnNumber,
        playerOrdinal: playerOrdinal,
        ticket: ticket,
        position: node,
        doubleMovePart: state.currentTurn.doubleMovePart,
    } as TurnLogEntry;

    return { ok: true, state: {
        ...state,
        currentTurn: {
            ...state.currentTurn,
            ticket: null,
            playerOrdinal: getPlayerOrdinalAfterMove(state),
            doubleMovePart: state.currentTurn.doubleMovePart === 1 ? 2 : undefined,
        },
        players: newPlayers,
        turnLog: [...state.turnLog, turnLogEntry],
    } };
}