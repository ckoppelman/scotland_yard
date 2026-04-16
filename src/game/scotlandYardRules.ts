import { Ticket } from "../constants";
import { PlayerDescription, ScotlandYardState, TurnLogEntry } from "./scotlandYard";

export type PlayOk = { ok: true; state: ScotlandYardState };
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

export function tryPlayTicket(state: ScotlandYardState, ticket: Ticket): PlayResult {
    if (state.gameover) return { ok: false, message: "The game is over." };
    const player = state.players[state.currentTurn.playerOrdinal];
    if (player.tickets[ticket] === 0) {
        return { ok: false, message: `No ${ticketLabel(ticket)} tickets left.` };
    }
    return { ok: true, state: { ...state, currentTurn: { ...state.currentTurn, ticket } } };
}

function connectionTicketTypes(state: ScotlandYardState, node1: number | null, node2: number | null): Ticket[] {
    if (node1 === null || node2 === null) return [];
    return state.mapGraph.connections.filter((connection) => connection.nodes.has(node1) && connection.nodes.has(node2)).map((connection) => connection.ticket);
}

/** Ticket types on direct edges between two stations (empty if not adjacent). */
export function getTicketsBetweenNodes(state: ScotlandYardState, node1: number | null, node2: number | null): Ticket[] {
    return connectionTicketTypes(state, node1, node2);
}

/**
 * Select a ticket and move to an adjacent station in one step (for drag-and-drop flow).
 * Fails atomically if the move is illegal.
 */
export function tryPlayMoveToAdjacent(state: ScotlandYardState, toNode: number, ticket: Ticket): PlayResult {
    if (state.gameover) return { ok: false, message: "The game is over." };
    if (state.currentTurn.ticket !== null) {
        return { ok: false, message: "A ticket is already selected. Cancel or finish that move first." };
    }
    const withTicket = tryPlayTicket(state, ticket);
    if (!withTicket.ok) return withTicket;
    return tryPlayNode(withTicket.state, toNode);
}

export function getWinner(state: ScotlandYardState): PlayerDescription | null {
    const mrX = state.players.find((player) => !player.description.isDetective);
    if (mrX === undefined) return null;
    for (const player of state.players.filter((player) => player.description.isDetective)) {
        if (player.position === mrX.position) return player.description;
    }
    if (state.currentTurn.turnNumber > state.turns.length) return mrX.description;
    return null;
}

export function tryPlayNode(state: ScotlandYardState, node: number): PlayResult {
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
    if (!validTickets.includes(state.currentTurn.ticket)) {
        const need = validTickets.map(ticketLabel).join(" or ");
        return {
            ok: false,
            message: `That connection needs a ${need} ticket, not ${ticketLabel(state.currentTurn.ticket)}.`,
        };
    }

    let result = movePlayer(state, playerOrdinal, node, state.currentTurn.ticket!);
    if (!result.ok) return result;

    const turnNumberIncrement = (playerOrdinal < state.players.length - 1) ? 0 : 1;
    let newState = { ...result.state, currentTurn: { ...result.state.currentTurn, ticket: null, turnNumber: result.state.currentTurn.turnNumber + turnNumberIncrement } };

    const winner = getWinner(newState);
    if (winner !== null) {
        return { ok: true, state: { ...newState, gameover: { winner: winner.isDetective ? "detective" : "mrX" } } as ScotlandYardState };
    }

    return { ok: true, state: { ...newState, gameover: null } as ScotlandYardState };
}


export function initPlayer(state: ScotlandYardState, playerOrdinal: number, node: number): PlayResult {
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

function movePlayer(state: ScotlandYardState, playerOrdinal: number, node: number, ticket: Ticket) : PlayResult {
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
    player.position = node;

    const turnLogEntry = {
        turnNumber: state.currentTurn.turnNumber,
        playerOrdinal: playerOrdinal,
        ticket: ticket,
        position: node,
    } as TurnLogEntry;
    return { ok: true, state: {
        ...state,
        currentTurn: { ...state.currentTurn, ticket: null, playerOrdinal: (playerOrdinal + 1) % state.players.length },
        players: [...state.players.map((p, ix) => ix === playerOrdinal ? player : p)],
        turnLog: [...state.turnLog, turnLogEntry],
    } };
}