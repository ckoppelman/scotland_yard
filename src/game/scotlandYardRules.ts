import { Ticket } from "../constants";
import { PlayerDescription, ScotlandYardState } from "./scotlandYard";

export function tryPlayTicket(state: ScotlandYardState, ticket: Ticket): ScotlandYardState | null {
    if (state.gameover) return null;
    const player = state.players[state.currentTurn.playerOrdinal];
    if (player.tickets[ticket] === 0) return null;
    return { ...state, currentTurn: { ...state.currentTurn, ticket } };
}

function connectionTicketTypes(state: ScotlandYardState, node1: number | null, node2: number | null): Ticket[] {
    if (node1 === null || node2 === null) return [];
    return state.mapGraph.connections.filter((connection) => connection.nodes.has(node1) && connection.nodes.has(node2)).map((connection) => connection.ticket);
}

function isVictory(state: ScotlandYardState): boolean {
    return getWinner(state) !== null;
}

export function getWinner(state: ScotlandYardState): PlayerDescription | null {
    const mr_x = state.players.find((player) => !player.description.isDetective);
    if (mr_x === undefined) return null;
    for (const player of state.players) {
        if (player.position === mr_x.position) return player.description;
    }
    if (state.currentTurn.turnNumber > state.turns.length) return mr_x.description;
    return null;
}

export function tryPlayNode(state: ScotlandYardState, node: number): ScotlandYardState | null {
    if (state.gameover) return null;
    if (state.currentTurn.ticket === null) return null;
    const player_ordinal = state.currentTurn.playerOrdinal;
    let player = state.players[player_ordinal];
    if (player.position === node) return null;

    const valid_tickets = connectionTicketTypes(state, player.position, node);
    if (valid_tickets.length === 0) return null;
    if (!valid_tickets.includes(state.currentTurn.ticket)) return null;

    let new_state = movePlayer(state, player_ordinal, node, state.currentTurn.ticket!);

    new_state.currentTurn.ticket = null;
    new_state.currentTurn.turnNumber = new_state.currentTurn.turnNumber + (player.description.isDetective ? 0 : 1);

    if (isVictory(new_state)) {
        return { ...new_state, gameover: { winner: player.description.id } } as ScotlandYardState;
    }

    return { ...new_state, gameover: null } as ScotlandYardState;
};

function movePlayer(state: ScotlandYardState, player_ordinal: number, node: number, ticket: Ticket) {
    let player = state.players[player_ordinal];
    if (player.position === node) return state;
    if (player.position === null) return state;
    if (player.tickets[ticket] === 0) return state;
    player.tickets[ticket]--;
    player.position = node;

    return { ...state, players: [...state.players.map((p, ix) => ix === player_ordinal ? player : p)] };
}