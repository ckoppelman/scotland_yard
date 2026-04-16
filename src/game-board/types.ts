import type { Ticket } from "../constants";
import type { GameState } from "../game/gameState";

export type GameBoardProps = {
    state: GameState;
    onTicketClick: (ticket: Ticket) => void;
    onNodeClick: (node: number) => void;
    onReset: () => void;
    /** After drag-drop onto an adjacent station, user must pick a ticket. */
    pendingMoveNode: number | null;
    onCancelPendingMove: () => void;
    /** Called with station id under pointer at drop, or null if none. Optional pointer position for the ticket popup. */
    /** Screen coordinates for positioning the ticket popup (e.g. pointer at drop). */
    onPlayerDragToStation: (node: number | null, clientDrop?: { x: number; y: number }) => void;
    /** Tickets that can legally finish a pending drag to `pendingMoveNode` (subset for disabling buttons). */
    pendingValidTickets: Ticket[] | null;
    /** Screen position of the drop; when set with a pending move, the map popup is shown. */
    pendingTicketAnchor: { x: number; y: number } | null;
};
