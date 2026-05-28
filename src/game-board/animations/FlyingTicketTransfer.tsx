import { useLayoutEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { TicketTransferFlight } from "../../game/phaseActions/types";
import { SIDE_PANEL_OPEN_MS, TICKET_TRANSFER_FLIGHT_MS } from "../../game/cutsceneTiming";
import { MrXTicketFlip } from "./MrXTicketFlip";

type FlightMetrics = {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
};

type Props = {
    flight: TicketTransferFlight;
    /** True once the players drawer is open and roster cards are mounted. */
    playersPanelReady: boolean;
    onComplete: () => void;
};

function measureFlight(flight: TicketTransferFlight): FlightMetrics | null {
    const fromEl = document.getElementById(`player-marker-${flight.detectiveId}`);
    const toEl = document.getElementById(`player-card-${flight.fugitiveId}`);
    if (fromEl === null || toEl === null) return null;

    const from = fromEl.getBoundingClientRect();
    const to = toEl.getBoundingClientRect();
    if (from.width === 0 || to.width === 0) return null;

    return {
        fromX: from.left + from.width / 2,
        fromY: from.top + from.height / 2,
        toX: to.left + to.width / 2,
        toY: to.top + to.height / 2,
    };
}

/** Flies a flipping ticket from a detective map marker to a fugitive roster card. */
export function FlyingTicketTransfer({ flight, playersPanelReady, onComplete }: Props) {
    const [metrics, setMetrics] = useState<FlightMetrics | null>(null);

    useLayoutEffect(() => {
        if (!playersPanelReady) return;

        let cancelled = false;
        let completeTimer: number | undefined;
        let openTimer: number | undefined;

        const finish = () => {
            if (!cancelled) onComplete();
        };

        const tryMeasure = (attempt: number) => {
            if (cancelled) return;
            const next = measureFlight(flight);
            if (next !== null) {
                setMetrics(next);
                completeTimer = window.setTimeout(finish, TICKET_TRANSFER_FLIGHT_MS);
                return;
            }
            if (attempt < 40) {
                window.requestAnimationFrame(() => tryMeasure(attempt + 1));
            } else {
                finish();
            }
        };

        openTimer = window.setTimeout(() => tryMeasure(0), SIDE_PANEL_OPEN_MS);

        return () => {
            cancelled = true;
            if (openTimer !== undefined) window.clearTimeout(openTimer);
            if (completeTimer !== undefined) window.clearTimeout(completeTimer);
        };
    }, [flight, onComplete, playersPanelReady]);

    if (metrics === null) return null;

    const style = {
        "--from-x": `${metrics.fromX}px`,
        "--from-y": `${metrics.fromY}px`,
        "--to-x": `${metrics.toX}px`,
        "--to-y": `${metrics.toY}px`,
        "--flight-ms": `${TICKET_TRANSFER_FLIGHT_MS}ms`,
    } as CSSProperties;

    return createPortal(
        <div className="ticket-transfer-flight" style={style} aria-hidden>
            <span className="ticket-transfer-flight__ticket mr-x-turn-ticket mr-x-turn-ticket--cutscene">
                <MrXTicketFlip ticket={flight.ticket} flipMode="once" />
            </span>
        </div>,
        document.body,
    );
}
