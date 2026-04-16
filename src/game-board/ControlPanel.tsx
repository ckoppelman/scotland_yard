import type { Ticket } from "../constants";
import type { CurrentTurn, PlayerState } from "../game/gameState";

function ticketAllowedForPending(ticket: Ticket, pendingValidTickets: Ticket[] | null): boolean {
    if (pendingValidTickets === null) return true;
    return pendingValidTickets.includes(ticket);
}

export function ControlPanel({
    players,
    currentTurn,
    onClick,
    gameover,
    pendingDestinationNode,
    pendingValidTickets,
    onCancelPendingMove,
    ticketSelectionInMapPopup,
}: {
    players: PlayerState[];
    currentTurn: CurrentTurn;
    onClick: (ticket: Ticket) => void;
    gameover: boolean;
    pendingDestinationNode: number | null;
    pendingValidTickets: Ticket[] | null;
    onCancelPendingMove: () => void;
    /** When true, ticket choice happens in the map popup; hide the sidebar ticket row. */
    ticketSelectionInMapPopup: boolean;
}) {
    const currentPlayer = players[currentTurn.playerOrdinal];
    const disabled = gameover;
    const pending = pendingDestinationNode !== null;
    const showSidebarTickets = !pending || !ticketSelectionInMapPopup;

    return (
        <div className="control-panel">
            <p className="control-panel__label">
                {pending && ticketSelectionInMapPopup
                    ? "Move in progress"
                    : pending
                      ? `Ticket for move to station ${pendingDestinationNode}`
                      : "Choose a ticket"}
            </p>
            {pending && (
                <p className="control-panel__pending-hint">
                    <button type="button" className="control-panel__cancel-move" onClick={onCancelPendingMove}>
                        Cancel move
                    </button>
                </p>
            )}
            {showSidebarTickets && (
            <div className="ticket-toolbar" role="toolbar" aria-label="Transport tickets">
                <button
                    type="button"
                    className="ticket-btn"
                    disabled={disabled || !ticketAllowedForPending("taxi", pendingValidTickets)}
                    onClick={() => onClick("taxi")}
                    aria-pressed={currentTurn.ticket === "taxi"}
                >
                    <span className="ticket-btn__icon" aria-hidden>
                        🚕
                    </span>
                    Taxi
                </button>
                <button
                    type="button"
                    className="ticket-btn"
                    disabled={disabled || !ticketAllowedForPending("bus", pendingValidTickets)}
                    onClick={() => onClick("bus")}
                    aria-pressed={currentTurn.ticket === "bus"}
                >
                    <span className="ticket-btn__icon" aria-hidden>
                        🚌
                    </span>
                    Bus
                </button>
                <button
                    type="button"
                    className="ticket-btn"
                    disabled={disabled || !ticketAllowedForPending("underground", pendingValidTickets)}
                    onClick={() => onClick("underground")}
                    aria-pressed={currentTurn.ticket === "underground"}
                >
                    <span className="ticket-btn__icon" aria-hidden>
                        🚇
                    </span>
                    Tube
                </button>
                {!currentPlayer.description.isDetective && (
                    <>
                        <button
                            type="button"
                            className="ticket-btn"
                            disabled={disabled || !ticketAllowedForPending("black", pendingValidTickets)}
                            onClick={() => onClick("black")}
                            aria-pressed={currentTurn.ticket === "black"}
                        >
                            <span className="ticket-btn__icon" aria-hidden>
                                ◼
                            </span>
                            Black
                        </button>
                        <button
                            type="button"
                            className="ticket-btn"
                            disabled={disabled || !ticketAllowedForPending("double", pendingValidTickets)}
                            onClick={() => onClick("double")}
                            aria-pressed={currentTurn.ticket === "double"}
                        >
                            <span className="ticket-btn__icon" aria-hidden>
                                ⎘
                            </span>
                            Double
                        </button>
                    </>
                )}
            </div>
            )}
            <p className="ticket-hint" role="status">
                {pending && ticketSelectionInMapPopup ? (
                    <>Choose a ticket in the popup on the map.</>
                ) : pending ? (
                    <>Pick one of the highlighted tickets to complete your move.</>
                ) : currentTurn.ticket ? (
                    <>
                        Selected: <strong>{currentTurn.ticket}</strong> — click a station on the map.
                    </>
                ) : (
                    <>Select how you travel this turn, or drag your pawn to an adjacent station.</>
                )}
            </p>
        </div>
    );
}
