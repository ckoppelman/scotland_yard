import type { Ticket } from "../../constants";
import type { CSSProperties } from "react";

const TICKET_LABEL: Record<Ticket, string> = {
    taxi: "TAXI",
    bus: "BUS",
    underground: "UNDERGROUND",
    black: "BLACK",
    double: "2×",
};

type Props = {
    ticket: Ticket;
    delay?: number;
    /** `once` for a single flip during ticket transfer flight. */
    flipMode?: "loop" | "once";
};

/** Double-sided ticket flip for the Mr. X board log during the fugitive cutscene. */
export function MrXTicketFlip({ ticket, delay = 0, flipMode = "loop" }: Props) {
    return (
        <span className="mrx-ticket-flip" aria-hidden>
            <span
                className={`mrx-ticket-flip__card flip${flipMode === "once" ? " mrx-ticket-flip__card--once" : ""}`}
                style={{ animationDelay: `${delay}s` } as CSSProperties}
            >
                <span className={`mrx-ticket-flip__face mrx-ticket-flip__face--front mrx-ticket-flip__face--${ticket}`}>
                    <span className="mrx-ticket-flip__label">{TICKET_LABEL[ticket]}</span>
                </span>
                <span className="mrx-ticket-flip__face mrx-ticket-flip__face--back">
                    <span className="mrx-ticket-flip__back-label">
                        Scotland
                        <br />
                        Yard
                    </span>
                </span>
            </span>
        </span>
    );
}
