import type { Ticket } from "../../constants";
import type { CurrentTurn, PlayerState } from "../../game/gameState";

function ticketAllowedForPending(ticket: Ticket, pendingValidTickets: Ticket[] | null): boolean {
    if (pendingValidTickets === null) return true;
    return pendingValidTickets.includes(ticket);
}

function ticketButtonDisabled(args: {
    ticket: Ticket;
    gameover: boolean;
    pending: boolean;
    pendingValidTickets: Ticket[] | null;
    count: number;
    playableFromNode: Record<Ticket, boolean>;
}): boolean {
    const { ticket, gameover, pending, pendingValidTickets, count, playableFromNode } = args;
    if (gameover) return true;
    if (count <= 0) return true;
    if (pending) {
        return pendingValidTickets === null || !ticketAllowedForPending(ticket, pendingValidTickets);
    }
    return !playableFromNode[ticket];
}

export function ControlPanel({
    players,
    currentTurn,
    onClick,
    gameover,
    pendingDestinationNode,
    pendingValidTickets,
    ticketPlayableFromCurrentNode,
    onCancelPendingMove,
    ticketSelectionInMapPopup,
}: {
    players: PlayerState[];
    currentTurn: CurrentTurn;
    onClick: (ticket: Ticket) => void;
    gameover: boolean;
    pendingDestinationNode: number | null;
    pendingValidTickets: Ticket[] | null;
    /** When not in a pending drag move, each ticket is enabled only if there is a legal connection from the current station. */
    ticketPlayableFromCurrentNode: Record<Ticket, boolean>;
    onCancelPendingMove: () => void;
    /** When true, ticket choice happens in the map popup; hide the sidebar ticket row. */
    ticketSelectionInMapPopup: boolean;
}) {
    const currentPlayer = players[currentTurn.playerOrdinal];
    const pending = pendingDestinationNode !== null;
    const showSidebarTickets = !pending || !ticketSelectionInMapPopup;

    const baseOpts = {
        gameover,
        pending,
        pendingValidTickets,
        playableFromNode: ticketPlayableFromCurrentNode,
    };

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
                        disabled={ticketButtonDisabled({
                            ...baseOpts,
                            ticket: "taxi",
                            count: currentPlayer.tickets.taxi,
                        })}
                        onClick={() => onClick("taxi")}
                        aria-pressed={currentTurn.ticket === "taxi"}
                    >
                        <span className="ticket-btn__icon" aria-hidden>
                            🚕
                        </span>
                        <span className="ticket-btn__name">Taxi</span>
                        <span className="ticket-btn__count">{currentPlayer.tickets.taxi}</span>
                    </button>
                    <button
                        type="button"
                        className="ticket-btn"
                        disabled={ticketButtonDisabled({
                            ...baseOpts,
                            ticket: "bus",
                            count: currentPlayer.tickets.bus,
                        })}
                        onClick={() => onClick("bus")}
                        aria-pressed={currentTurn.ticket === "bus"}
                    >
                        <span className="ticket-btn__icon" aria-hidden>
                            🚌
                        </span>
                        <span className="ticket-btn__name">Bus</span>
                        <span className="ticket-btn__count">{currentPlayer.tickets.bus}</span>
                    </button>
                    <button
                        type="button"
                        className="ticket-btn"
                        disabled={ticketButtonDisabled({
                            ...baseOpts,
                            ticket: "underground",
                            count: currentPlayer.tickets.underground,
                        })}
                        onClick={() => onClick("underground")}
                        aria-pressed={currentTurn.ticket === "underground"}
                    >
                        <span className="ticket-btn__icon" aria-hidden>
                            🚇
                        </span>
                        <span className="ticket-btn__name">Tube</span>
                        <span className="ticket-btn__count">{currentPlayer.tickets.underground}</span>
                    </button>
                    {!currentPlayer.description.isDetective && (
                        <>
                            <button
                                type="button"
                                className="ticket-btn"
                                disabled={ticketButtonDisabled({
                                    ...baseOpts,
                                    ticket: "black",
                                    count: currentPlayer.tickets.black,
                                })}
                                onClick={() => onClick("black")}
                                aria-pressed={currentTurn.ticket === "black"}
                            >
                                <span className="ticket-btn__icon" aria-hidden>
                                    ◼
                                </span>
                                <span className="ticket-btn__name">Black</span>
                                <span className="ticket-btn__count">{currentPlayer.tickets.black}</span>
                            </button>
                            <button
                                type="button"
                                className="ticket-btn"
                                disabled={ticketButtonDisabled({
                                    ...baseOpts,
                                    ticket: "double",
                                    count: currentPlayer.tickets.double,
                                })}
                                onClick={() => onClick("double")}
                                aria-pressed={currentTurn.ticket === "double"}
                            >
                                <span className="ticket-btn__icon" aria-hidden>
                                    ⎘
                                </span>
                                <span className="ticket-btn__name">Double</span>
                                <span className="ticket-btn__count">{currentPlayer.tickets.double}</span>
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
                        Selected: <strong>{currentTurn.ticket}</strong> — click a highlighted station on the map.
                    </>
                ) : (
                    <>Select how you travel this turn, or drag your pawn to an adjacent station.</>
                )}
            </p>
        </div>
    );
}
