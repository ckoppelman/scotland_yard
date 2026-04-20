import { useLayoutEffect, useRef } from "react";
import type { Ticket } from "../../constants";
import type { CurrentTurn, PlayerState } from "../../game/gameState";

const TICKET_POPUP_UI: Record<Ticket, { icon: string; label: string }> = {
    taxi: { icon: "🚕", label: "Taxi" },
    bus: { icon: "🚌", label: "Bus" },
    underground: { icon: "🚇", label: "Tube" },
    black: { icon: "◼", label: "Black" },
    double: { icon: "⎘", label: "Double" },
};

export function PendingTicketPopup({
    anchor,
    destinationNode,
    tickets,
    ticketBalances,
    doubleMovePart,
    pendingDoubleMove,
    onPick,
    onPlayDoubleMove,
    onCancel,
}: {
    anchor: { x: number; y: number };
    destinationNode: number;
    tickets: Ticket[];
    ticketBalances: PlayerState["tickets"];
    doubleMovePart: CurrentTurn["doubleMovePart"];
    /** App-local: user committed 2x for this drag (mirrors {@link pendingMoveNode}). */
    pendingDoubleMove: boolean;
    onPick: (ticket: Ticket) => void;
    onPlayDoubleMove: () => void;
    onCancel: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const inDoubleMove = pendingDoubleMove || doubleMovePart != null;
    const canStartDouble =
        !pendingDoubleMove && doubleMovePart == null && ticketBalances.double > 0;
    const showDoubleSlot = canStartDouble || doubleMovePart != null;

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        const margin = 8;
        const gap = 12;
        let left = anchor.x - w / 2;
        let top = anchor.y - h - gap;
        if (top < margin) top = anchor.y + gap;
        if (left < margin) left = margin;
        if (left + w > window.innerWidth - margin) left = window.innerWidth - w - margin;
        if (top + h > window.innerHeight - margin) top = window.innerHeight - h - margin;
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
    }, [
        anchor.x,
        anchor.y,
        tickets.length,
        tickets.join(","),
        destinationNode,
        ticketBalances.double,
        doubleMovePart,
        pendingDoubleMove,
        inDoubleMove,
        showDoubleSlot,
    ]);

    return (
        <>
            <div className="pending-ticket-popup__backdrop" role="presentation" onClick={onCancel} />
            <div
                ref={ref}
                className={`pending-ticket-popup${inDoubleMove ? " pending-ticket-popup--double-move" : ""}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="pending-ticket-popup-title"
                style={{ position: "fixed", left: 0, top: 0, zIndex: 4001 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="pending-ticket-popup__header">
                    <p id="pending-ticket-popup-title" className="pending-ticket-popup__title-text">
                        Ticket to station <strong>{destinationNode}</strong>
                    </p>
                    {showDoubleSlot &&
                        (canStartDouble ? (
                            <button
                                type="button"
                                className="pending-ticket-popup__twox pending-ticket-popup__twox--start"
                                aria-label="Start double move — use two tickets this turn"
                                title="Double move"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onPlayDoubleMove();
                                }}
                            >
                                <span className="pending-ticket-popup__icon" aria-hidden>
                                    🔂
                                </span>
                                <span className="pending-ticket-popup__label">2x</span>
                                <span className="pending-ticket-popup__count">{ticketBalances.double}</span>
                            </button>
                        ) : (
                            <div
                                className="pending-ticket-popup__twox pending-ticket-popup__twox--leg"
                                role="status"
                                aria-live="polite"
                                aria-label={doubleMovePart === 1 ? "Double move: part 1" : "Double move: part 2"}
                            >
                                <span className="pending-ticket-popup__icon" aria-hidden>
                                    🔂
                                </span>
                                <span className="pending-ticket-popup__label">
                                    {doubleMovePart === 1 ? "Part 1" : "Part 2"}
                                </span>
                            </div>
                        ))}
                </div>
                <div className="pending-ticket-popup__buttons" role="group" aria-label="Ticket type">
                    {tickets.map((t) => (
                        <button
                            key={t}
                            type="button"
                            className={`pending-ticket-popup__btn pending-ticket-popup__btn--${t}`}
                            onClick={() => onPick(t)}
                        >
                            <span className="pending-ticket-popup__icon" aria-hidden>
                                {TICKET_POPUP_UI[t].icon}
                            </span>
                            <span className="pending-ticket-popup__label">{TICKET_POPUP_UI[t].label}</span>
                            <span className="pending-ticket-popup__count">{ticketBalances[t]}</span>
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    className="pending-ticket-popup__cancel"
                    onClick={onCancel}
                    aria-label={pendingDoubleMove || doubleMovePart === 1 ? "Cancel double move" : "Cancel"}
                >
                    {pendingDoubleMove || doubleMovePart === 1 ? "Cancel Double Move" : "Cancel"}
                </button>
            </div>
        </>
    );
}
