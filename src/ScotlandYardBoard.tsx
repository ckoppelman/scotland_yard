import {
    memo,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type MouseEvent,
    type PointerEvent,
} from "react";
import { Ticket } from "./constants";
import type { MapGraph, ScotlandYardState, PlayerState, CurrentTurn, TurnLogEntry, TurnState } from "./game/scotlandYard";
import { COLOR_TO_BORDER } from "./constants";
import { DetectiveMarkerIcon } from "./DetectiveMarkerIcon";
import { MrXMarkerIcon } from "./MrXMarkerIcon";

export type ScotlandYardBoardProps = {
    state: ScotlandYardState;
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

const STROKE_WIDTH = 4;

const CONNECTION_TO_COLOR_AND_OFFSET: Record<Ticket, { color: string; offset: number }> = {
    taxi: { color: "#f5cc00", offset: -STROKE_WIDTH / 2 },
    bus: { color: "#22a838", offset: STROKE_WIDTH },
    underground: { color: "#e85db0", offset: STROKE_WIDTH * 2 },
    black: { color: "#0a0a0a", offset: STROKE_WIDTH * 3 },
    double: { color: "#c45c26", offset: 0 },
};

const GRID_TO_PX = 90;
const PX_PAD = 15;

/** Space around the map so player tokens (which extend past node centers) are not clipped. */
const MAP_GUTTER = 36;

const MIN_MAP_ZOOM = 0.6;
const MAX_MAP_ZOOM = 3.5;
const MAP_ZOOM_STEP = 1.18;

function clampMapZoom(z: number): number {
    return Math.min(MAX_MAP_ZOOM, Math.max(MIN_MAP_ZOOM, z));
}

/** Map pointer position to SVG user space (respects viewBox / zoom). */
function clientToSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
}

/** Rough radius around a station center for drop hit-testing (SVG units). */
const NODE_DROP_HIT_R = 38;

function clampMapPan(
    pan: { x: number; y: number },
    zoom: number,
    contentW: number,
    contentH: number,
): { x: number; y: number } {
    const vbW = contentW / zoom;
    const vbH = contentH / zoom;
    const maxX = Math.max(0, contentW - vbW);
    const maxY = Math.max(0, contentH - vbH);
    return {
        x: Math.min(maxX, Math.max(0, pan.x)),
        y: Math.min(maxY, Math.max(0, pan.y)),
    };
}

/** Horizontal spread when multiple pieces share a station. */
const TOKEN_STACK_SPREAD = 36;

/** Pawn art on sidebar cards (smaller than map markers; fits 48×48 viewBox). */
const CARD_ICON_DETECTIVE_SCALE = 0.085;
const CARD_ICON_MRX_SCALE = 0.115;

function PlayerCardPawnIcon({ player }: { player: PlayerState }) {
    const fill = COLOR_TO_BORDER[player.description.color];
    return (
        <svg className="player-card__pawn" viewBox="-30 -30 60 60" width={48} height={48} aria-hidden>
            {player.description.isDetective ? (
                <DetectiveMarkerIcon fill={fill} scale={CARD_ICON_DETECTIVE_SCALE} />
            ) : (
                <MrXMarkerIcon fill={fill} scale={CARD_ICON_MRX_SCALE} />
            )}
        </svg>
    );
}

function stackDxForPlayer(players: PlayerState[], player: PlayerState): number {
    if (player.position === null) return 0;
    const group = players.filter((p) => p.position !== null && p.position === player.position);
    if (group.length <= 1) return 0;
    const idx = group.findIndex((p) => p.description.id === player.description.id);
    return (idx - (group.length - 1) / 2) * TOKEN_STACK_SPREAD;
}

/** O(n) once per mapGraph; use Map for O(1) lookups when rendering edges and nodes. */
export function buildNodePixelPositions(mapGraph: MapGraph): ReadonlyMap<number, { x: number; y: number }> {
    const m = new Map<number, { x: number; y: number }>();
    for (const node of mapGraph.nodes) {
        m.set(node.id, {
            x: node.position.x * GRID_TO_PX + PX_PAD,
            y: node.position.y * GRID_TO_PX + PX_PAD,
        });
    }
    return m;
}

function pixelCoords(
    positions: ReadonlyMap<number, { x: number; y: number }>,
    nodeId: number,
): { x: number; y: number } {
    return positions.get(nodeId) ?? { x: -1000, y: -1000 };
}

function sortedConnectionEndpoints(nodes: Set<number>): [number, number] {
    const [a, b] = [...nodes].sort((x, y) => x - y);
    return [a, b];
}

/** Transport types that define station coloring (black/double are Mr X moves, not station class). */
const STATION_TICKETS: readonly Ticket[] = ["taxi", "bus", "underground"];

/**
 * Physical board rules: top cap green if bus, else yellow; middle red if underground, else yellow; bottom always yellow.
 */
export type StationBoardLook = {
    top: "green" | "yellow";
    middle: "red" | "yellow";
    bottom: "yellow";
};

function buildIncidentTransportSets(mapGraph: MapGraph): Map<number, Set<Ticket>> {
    const incident = new Map<number, Set<Ticket>>();
    for (const conn of mapGraph.connections) {
        if (!STATION_TICKETS.includes(conn.ticket)) continue;
        for (const n of conn.nodes) {
            let set = incident.get(n);
            if (!set) {
                set = new Set();
                incident.set(n, set);
            }
            set.add(conn.ticket);
        }
    }
    return incident;
}

/** Per-node colors for the three-part station token (matches classic board). */
export function buildNodeStationBoardLook(mapGraph: MapGraph): ReadonlyMap<number, StationBoardLook> {
    const incident = buildIncidentTransportSets(mapGraph);
    const out = new Map<number, StationBoardLook>();
    for (const node of mapGraph.nodes) {
        const types = incident.get(node.id);
        out.set(node.id, {
            top: types?.has("bus") ? "green" : "yellow",
            middle: types?.has("underground") ? "red" : "yellow",
            bottom: "yellow",
        });
    }
    return out;
}

/**
 * Classic board: shallow caps + wider middle bar.
 * Caps: circular segment with sagitta ≈ 2/3 of a same-width semicircle’s rise (gentle dome, not a half-circle).
 */
const STATION_CAP_HALF_W = 11;
/** Sagitta / depth of each cap (bulge from chord to apex). ~⅓ of full semicircle height for this half-width. */
const STATION_CAP_SAGITTA = STATION_CAP_HALF_W * 2 / 3;
const STATION_MID_W = 28;
const STATION_MID_H = 18;

/**
 * Straight segment parallel to the station–station chord, shifted along the normal by `offset`.
 * Multiple ticket types between the same pair stay parallel for the full length (unlike a shared-endpoint curve).
 */
function parallelConnectionEndpoints(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    offset: number,
): { x1: number; y1: number; x2: number; y2: number } {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) {
        return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    }
    const nx = -dy / len;
    const ny = dx / len;
    const ox = nx * offset;
    const oy = ny * offset;
    return {
        x1: p1.x + ox,
        y1: p1.y + oy,
        x2: p2.x + ox,
        y2: p2.y + oy,
    };
}

type StationLayout = {
    yChordTop: number;
    yChordBot: number;
    midRect: { x: number; y: number; width: number; height: number };
    topCapD: string;
    bottomCapD: string;
};

/** Radius of the circle for a horizontal chord 2a and sagitta s (same formula as full semicircle when s = a). */
function arcRadiusFromChordAndSagitta(a: number, s: number): number {
    return (a * a + s * s) / (2 * s);
}

function stationLayout(cx: number, cy: number): StationLayout {
    const a = STATION_CAP_HALF_W;
    const s = STATION_CAP_SAGITTA;
    const R = arcRadiusFromChordAndSagitta(a, s);
    const yChordTop = cy - STATION_MID_H / 2;
    const yChordBot = cy + STATION_MID_H / 2;
    const midRect = {
        x: cx - STATION_MID_W / 2,
        y: cy - STATION_MID_H / 2,
        width: STATION_MID_W,
        height: STATION_MID_H,
    };
    // Shallow caps: minor arc (large-arc 0), bulge outward from the middle rect.
    const topCapD = `M ${cx - a} ${yChordTop} A ${R} ${R} 0 0 1 ${cx + a} ${yChordTop} Z`;
    const bottomCapD = `M ${cx - a} ${yChordBot} A ${R} ${R} 0 0 0 ${cx + a} ${yChordBot} Z`;
    return { yChordTop, yChordBot, midRect, topCapD, bottomCapD };
}

/** Furthest a parallel-offset edge sits from its node center. */
const MAP_EDGE_OFFSET_MAX =
    Math.max(...Object.values(CONNECTION_TO_COLOR_AND_OFFSET).map((o) => Math.abs(o.offset))) + STROKE_WIDTH / 2;

/**
 * Padding beyond outermost node centers: station art, edge stack, horizontal pawn spread, pawn art + station label.
 */
const MAP_CONTENT_HALO_X = STATION_MID_W / 2 + MAP_EDGE_OFFSET_MAX + TOKEN_STACK_SPREAD * 1.5;
const MAP_CONTENT_HALO_Y_TOP = STATION_MID_H / 2 + STATION_CAP_SAGITTA + STROKE_WIDTH + 28;
const MAP_CONTENT_HALO_Y_BOT = STATION_MID_H / 2 + STATION_CAP_SAGITTA + STROKE_WIDTH + 52;

/**
 * SVG pixel size and inner `<g>` translate so the canvas hugs the graph (tight crop; no empty left/top band).
 */
function mapSvgFrame(
    mapGraph: MapGraph,
    positions: ReadonlyMap<number, { x: number; y: number }>,
): { width: number; height: number; frameTx: number; frameTy: number } {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const node of mapGraph.nodes) {
        const c = positions.get(node.id);
        if (!c) continue;
        minX = Math.min(minX, c.x);
        minY = Math.min(minY, c.y);
        maxX = Math.max(maxX, c.x);
        maxY = Math.max(maxY, c.y);
    }
    if (!Number.isFinite(minX)) {
        return { width: 120, height: 120, frameTx: MAP_GUTTER, frameTy: MAP_GUTTER };
    }
    const left = minX - MAP_CONTENT_HALO_X;
    const right = maxX + MAP_CONTENT_HALO_X;
    const top = minY - MAP_CONTENT_HALO_Y_TOP;
    const bottom = maxY + MAP_CONTENT_HALO_Y_BOT;
    const innerW = right - left;
    const innerH = bottom - top;
    return {
        width: innerW + MAP_GUTTER * 2,
        height: innerH + MAP_GUTTER * 2,
        frameTx: MAP_GUTTER - left,
        frameTy: MAP_GUTTER - top,
    };
}

function StationPartsColored({ layout, look }: { layout: StationLayout; look: StationBoardLook }) {
    return (
        <>
            <path
                className={`board-node-part board-node-part-top--${look.top}`}
                d={layout.topCapD}
            />
            <rect
                className={`board-node-part board-node-part-mid--${look.middle}`}
                {...layout.midRect}
                rx={2}
                ry={2}
            />
            <path
                className={`board-node-part board-node-part-bot--${look.bottom}`}
                d={layout.bottomCapD}
            />
        </>
    );
}

type BoardNodeProps = {
    nodeId: number;
    coords: { x: number; y: number };
    stationLook: StationBoardLook;
    onNodeClick: (node: number) => void;
};

function BoardNodeInner({ nodeId, coords, stationLook, onNodeClick }: BoardNodeProps) {
    const cx = coords.x;
    const cy = coords.y;
    const layout = stationLayout(cx, cy);

    return (
        <g className="board-node" onClick={() => onNodeClick(nodeId)} role="presentation">
            <StationPartsColored layout={layout} look={stationLook} />
            <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                pointerEvents="none"
                className={`board-node-text${stationLook.middle === "red" ? " board-node-text--on-red" : ""}`}
            >
                {nodeId}
            </text>
        </g>
    );
}

export const BoardNode = memo(BoardNodeInner);

type ConnectionEdgeProps = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    stroke: string;
};

function ConnectionEdgeInner({ x1, y1, x2, y2, stroke }: ConnectionEdgeProps) {
    return (
        <line
            className="connection-line"
            pointerEvents="none"
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={stroke}
            strokeWidth={STROKE_WIDTH}
            strokeOpacity={0.85}
            strokeLinecap="round"
        />
    );
}

export const ConnectionEdge = memo(ConnectionEdgeInner);

type PlayerMarkerProps = {
    player: PlayerState;
    coords: { x: number; y: number };
    stackDx: number;
    stationId: number;
    /** Drag offset in SVG user units while dragging. */
    dragNudge?: { x: number; y: number };
    /** When set, pawn is draggable (active player only). */
    dragBindings?: {
        onPointerDown: (e: PointerEvent<SVGGElement>) => void;
        onPointerMove: (e: PointerEvent<SVGGElement>) => void;
        onPointerUp: (e: PointerEvent<SVGGElement>) => void;
        onPointerCancel: (e: PointerEvent<SVGGElement>) => void;
    };
    isDragging?: boolean;
    /** Current turn — token is visually emphasized on the map. */
    isActiveTurn?: boolean;
};

function PlayerMarkerInner({
    player,
    coords,
    stackDx,
    stationId,
    dragNudge,
    dragBindings,
    isDragging,
    isActiveTurn = false,
}: PlayerMarkerProps) {
    const fill = COLOR_TO_BORDER[player.description.color];
    const stationY = 44;
    const nx = coords.x + stackDx + (dragNudge?.x ?? 0);
    const ny = coords.y + (dragNudge?.y ?? 0);
    const interactive = !!dragBindings;

    return (
        <g
            className={`player-marker ${player.description.isDetective ? "player-marker--detective" : "player-marker--mrx"}${interactive ? " player-marker--interactive" : ""}${isDragging ? " player-marker--dragging" : ""}${isActiveTurn ? " player-marker--active-turn" : ""}`}
            transform={`translate(${nx}, ${ny})`}
            pointerEvents={interactive ? "auto" : "none"}
            aria-hidden={!interactive}
            aria-grabbed={interactive ? isDragging : undefined}
            onPointerDown={dragBindings?.onPointerDown}
            onPointerMove={dragBindings?.onPointerMove}
            onPointerUp={dragBindings?.onPointerUp}
            onPointerCancel={dragBindings?.onPointerCancel}
        >
            {player.description.isDetective ? (
                <DetectiveMarkerIcon fill={fill} />
            ) : (
                <MrXMarkerIcon fill={fill} />
            )}
            <text
                className={`player-marker-station${isActiveTurn ? " player-marker-station--active-turn" : ""}`}
                textAnchor="middle"
                y={stationY}
                fontSize={17}
                fontWeight={800}
                fill="#1c1915"
                stroke="#fff"
                strokeWidth={1.8}
                paintOrder="stroke fill"
            >
                {stationId}
            </text>
        </g>
    );
}

export const PlayerMarker = memo(PlayerMarkerInner);

export function PlayerCard({ player, currentTurn }: { player: PlayerState; currentTurn: CurrentTurn }) {
    const isMyTurn = currentTurn.playerOrdinal === player.description.order;
    return (
        <article
            className={`player-card ${isMyTurn ? "my-turn" : ""}`}
            style={{
                borderTop: `3px solid ${COLOR_TO_BORDER[player.description.color]}`,
            }}
        >
            <div className="player-card__head">
                <PlayerCardPawnIcon player={player} />
                <div className="player-card__head-text">
                    <h3 className="player-card__name">{player.description.name}</h3>
                    <p className="player-card__meta">Detective · {player.description.color}</p>
                </div>
            </div>
            <p className="player-card__station">
                Station {player.position === null ? "—" : player.position}
            </p>
            <dl className="player-card__tickets">
                <dt>Taxi</dt>
                <dd>{player.tickets.taxi}</dd>
                <dt>Bus</dt>
                <dd>{player.tickets.bus}</dd>
                <dt>Underground</dt>
                <dd>{player.tickets.underground}</dd>
            </dl>
        </article>
    );
}

export function MrXCard({ state, player }: { state: ScotlandYardState; player: PlayerState }) {
    const currentTurn = state.currentTurn;
    const shouldShowMrX = state.turns[currentTurn.turnNumber - 1]?.showMrX ?? false;
    const isMyTurn = currentTurn.playerOrdinal === player.description.order;

    return (
        <article
            className={`mr-x-card player-card ${isMyTurn ? "my-turn" : ""}`}
            style={{
                borderTop: `3px solid ${COLOR_TO_BORDER[player.description.color]}`,
            }}
        >
            <div className="player-card__head">
                <PlayerCardPawnIcon player={player} />
                <div className="player-card__head-text">
                    <h3 className="player-card__name">{player.description.name}</h3>
                </div>
            </div>
            <p className="mr-x-card-position">
                Last seen: {isMyTurn || shouldShowMrX ? (player.position ?? "—") : "???"}
            </p>
            <div className="mr-x-card-tickets">
                <div className="mr-x-card-tickets__row">
                    <span>Taxi</span>
                    <span>{player.tickets.taxi}</span>
                </div>
                <div className="mr-x-card-tickets__row">
                    <span>Bus</span>
                    <span>{player.tickets.bus}</span>
                </div>
                <div className="mr-x-card-tickets__row">
                    <span>Underground</span>
                    <span>{player.tickets.underground}</span>
                </div>
                <div className="mr-x-card-tickets__row">
                    <span>Black</span>
                    <span>{player.tickets.black}</span>
                </div>
                <div className="mr-x-card-tickets__row">
                    <span>Double</span>
                    <span>{player.tickets.double}</span>
                </div>
            </div>
        </article>
    );
}

export function MrXTurn({
    turnNumber,
    turn,
    turnLogEntry,
    isMyTurn,
}: {
    turnNumber: number;
    turn: TurnState;
    turnLogEntry: TurnLogEntry | null;
    isMyTurn: boolean;
}) {
    const ticketClass = turnLogEntry?.ticket ? `${turnLogEntry.ticket}-ticket` : "no-ticket";
    return (
        <div className={`mr-x-turn ${turn.showMrX ? "show-mr-x" : "hide-mr-x"}`} key={`mr-x-turn-${turnNumber}`}>
            <span className="mr-x-turn-number">{turnNumber}</span>
            <span className={`mr-x-turn-ticket ${ticketClass}`}>{turnLogEntry?.ticket?.toUpperCase() ?? "—"}</span>
            <span className="mr-x-turn-position">{isMyTurn ? (turnLogEntry?.position ?? "") : "???"}</span>
        </div>
    );
}

export function MrXBoard({ state, player }: { state: ScotlandYardState; player: PlayerState }) {
    const { currentTurn, turnLog, turns } = state;
    const myTurnLogMap = new Map<number, TurnLogEntry>();
    for (const turnLogEntry of turnLog.filter(
        (entry) => entry.ticket !== null && entry.playerOrdinal === player.description.order,
    )) {
        myTurnLogMap.set(turnLogEntry.turnNumber, turnLogEntry);
    }
    const isMyTurn = currentTurn.playerOrdinal === player.description.order;
    return (
        <div className="mr-x-board" key={`mr-x-board-${player.description.order}`}>
            {turns.map((turn, turnNumber) => (
                <MrXTurn
                    key={`${turnNumber}-${player.description.order}`}
                    turnNumber={turnNumber}
                    turn={turn}
                    turnLogEntry={myTurnLogMap.get(turnNumber) ?? null}
                    isMyTurn={isMyTurn}
                />
            ))}
        </div>
    );
}

function ticketAllowedForPending(ticket: Ticket, pendingValidTickets: Ticket[] | null): boolean {
    if (pendingValidTickets === null) return true;
    return pendingValidTickets.includes(ticket);
}

const TICKET_POPUP_UI: Record<Ticket, { icon: string; label: string }> = {
    taxi: { icon: "🚕", label: "Taxi" },
    bus: { icon: "🚌", label: "Bus" },
    underground: { icon: "🚇", label: "Tube" },
    black: { icon: "◼", label: "Black" },
    double: { icon: "⎘", label: "Double" },
};

function PendingTicketPopup({
    anchor,
    destinationNode,
    tickets,
    onPick,
    onCancel,
}: {
    anchor: { x: number; y: number };
    destinationNode: number;
    tickets: Ticket[];
    onPick: (ticket: Ticket) => void;
    onCancel: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);

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
    }, [anchor.x, anchor.y, tickets.length, tickets.join(","), destinationNode]);

    return (
        <>
            <div className="pending-ticket-popup__backdrop" role="presentation" onClick={onCancel} />
            <div
                ref={ref}
                className="pending-ticket-popup"
                role="dialog"
                aria-modal="true"
                aria-labelledby="pending-ticket-popup-title"
                style={{ position: "fixed", left: 0, top: 0, zIndex: 4001 }}
                onClick={(e) => e.stopPropagation()}
            >
                <p id="pending-ticket-popup-title" className="pending-ticket-popup__title">
                    Ticket to station <strong>{destinationNode}</strong>
                </p>
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
                            {TICKET_POPUP_UI[t].label}
                        </button>
                    ))}
                </div>
                <button type="button" className="pending-ticket-popup__cancel" onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </>
    );
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

export function ScotlandYardBoard({
    state,
    onTicketClick,
    onNodeClick,
    onReset,
    pendingMoveNode,
    pendingTicketAnchor,
    onCancelPendingMove,
    onPlayerDragToStation,
    pendingValidTickets,
}: ScotlandYardBoardProps) {
    const { players, mapGraph, gameover, currentTurn, turns } = state;

    const nodePixelPositions = useMemo(() => buildNodePixelPositions(mapGraph), [mapGraph]);
    const nodeStationLook = useMemo(() => buildNodeStationBoardLook(mapGraph), [mapGraph]);

    const { width: contentW, height: contentH, frameTx, frameTy } = useMemo(
        () => mapSvgFrame(mapGraph, nodePixelPositions),
        [mapGraph, nodePixelPositions],
    );

    const [mapZoom, setMapZoom] = useState(1);
    const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
    const svgRef = useRef<SVGSVGElement | null>(null);
    const suppressClickRef = useRef(false);
    const dragRef = useRef<null | { startClient: { x: number; y: number }; startPan: { x: number; y: number } }>(
        null,
    );
    const panGestureRef = useRef(false);

    useEffect(() => {
        setMapZoom(1);
        setMapPan({ x: 0, y: 0 });
    }, [contentW, contentH]);

    const zoomAroundCenter = useCallback(
        (oldZoom: number, newZoom: number) => {
            const oldVbW = contentW / oldZoom;
            const oldVbH = contentH / oldZoom;
            const cx = mapPan.x + oldVbW / 2;
            const cy = mapPan.y + oldVbH / 2;
            const newVbW = contentW / newZoom;
            const newVbH = contentH / newZoom;
            return clampMapPan(
                { x: cx - newVbW / 2, y: cy - newVbH / 2 },
                newZoom,
                contentW,
                contentH,
            );
        },
        [contentW, contentH, mapPan.x, mapPan.y],
    );

    const zoomIn = useCallback(() => {
        setMapZoom((z) => {
            const newZ = clampMapZoom(z * MAP_ZOOM_STEP);
            if (newZ === z) return z;
            setMapPan(() => zoomAroundCenter(z, newZ));
            return newZ;
        });
    }, [zoomAroundCenter]);

    const zoomOut = useCallback(() => {
        setMapZoom((z) => {
            const newZ = clampMapZoom(z / MAP_ZOOM_STEP);
            if (newZ === z) return z;
            setMapPan(() => zoomAroundCenter(z, newZ));
            return newZ;
        });
    }, [zoomAroundCenter]);

    const resetMapView = useCallback(() => {
        setMapZoom(1);
        setMapPan({ x: 0, y: 0 });
    }, []);

    const findNodeAtSvgPoint = useCallback(
        (sx: number, sy: number): number | null => {
            let best: { id: number; d2: number } | null = null;
            for (const node of mapGraph.nodes) {
                const c = pixelCoords(nodePixelPositions, node.id);
                const nx = frameTx + c.x;
                const ny = frameTy + c.y;
                const dx = sx - nx;
                const dy = sy - ny;
                const d2 = dx * dx + dy * dy;
                if (d2 <= NODE_DROP_HIT_R * NODE_DROP_HIT_R && (!best || d2 < best.d2)) {
                    best = { id: node.id, d2 };
                }
            }
            return best?.id ?? null;
        },
        [mapGraph.nodes, nodePixelPositions, frameTx, frameTy],
    );

    const tokenDragRef = useRef<null | { startClient: { x: number; y: number } }>(null);
    const [tokenDragVisual, setTokenDragVisual] = useState({ x: 0, y: 0 });
    const [tokenDragging, setTokenDragging] = useState(false);

    const activeMarkerDragBindings = useMemo(() => {
        if (gameover || pendingMoveNode !== null || state.currentTurn.ticket !== null) return undefined;
        return {
            onPointerDown(e: PointerEvent<SVGGElement>) {
                e.stopPropagation();
                e.preventDefault();
                tokenDragRef.current = { startClient: { x: e.clientX, y: e.clientY } };
                setTokenDragging(true);
                setTokenDragVisual({ x: 0, y: 0 });
                try {
                    e.currentTarget.setPointerCapture(e.pointerId);
                } catch {
                    /* ignore */
                }
            },
            onPointerMove(e: PointerEvent<SVGGElement>) {
                if (!tokenDragRef.current) return;
                const svg = svgRef.current;
                if (!svg) return;
                const vbW = contentW / mapZoom;
                const scale = vbW / svg.clientWidth;
                const { startClient } = tokenDragRef.current;
                setTokenDragVisual({
                    x: (e.clientX - startClient.x) * scale,
                    y: (e.clientY - startClient.y) * scale,
                });
            },
            onPointerUp(e: PointerEvent<SVGGElement>) {
                const start = tokenDragRef.current?.startClient;
                tokenDragRef.current = null;
                setTokenDragging(false);
                setTokenDragVisual({ x: 0, y: 0 });
                try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                } catch {
                    /* ignore */
                }
                const svg = svgRef.current;
                if (!start || !svg) return;
                const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6;
                if (moved) suppressClickRef.current = true;
                if (!moved) return;
                const pt = clientToSvgPoint(svg, e.clientX, e.clientY);
                onPlayerDragToStation(findNodeAtSvgPoint(pt.x, pt.y), { x: e.clientX, y: e.clientY });
            },
            onPointerCancel(e: PointerEvent<SVGGElement>) {
                tokenDragRef.current = null;
                setTokenDragging(false);
                setTokenDragVisual({ x: 0, y: 0 });
                try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                } catch {
                    /* ignore */
                }
            },
        };
    }, [
        gameover,
        pendingMoveNode,
        state.currentTurn.ticket,
        contentW,
        mapZoom,
        findNodeAtSvgPoint,
        onPlayerDragToStation,
    ]);

    const markersRenderOrder = useMemo(() => {
        const ord = state.currentTurn.playerOrdinal;
        return [...state.players]
            .filter((p) => p.position !== null)
            .sort((a, b) => (a.description.order === ord ? 1 : 0) - (b.description.order === ord ? 1 : 0));
    }, [state.players, state.currentTurn.playerOrdinal]);

    const onMapPointerDown = useCallback(
        (e: PointerEvent<SVGSVGElement>) => {
            const panButton = e.button === 1;
            const leftPan = e.button === 0 && mapZoom > 1;
            if (!panButton && !leftPan) return;
            e.preventDefault();
            panGestureRef.current = false;
            dragRef.current = {
                startClient: { x: e.clientX, y: e.clientY },
                startPan: { ...mapPan },
            };
            try {
                e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
                /* ignore */
            }
        },
        [mapPan, mapZoom],
    );

    const onMapPointerMove = useCallback(
        (e: PointerEvent<SVGSVGElement>) => {
            const d = dragRef.current;
            if (!d) return;
            const dx = e.clientX - d.startClient.x;
            const dy = e.clientY - d.startClient.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 4) panGestureRef.current = true;
            if (!panGestureRef.current) return;
            const svg = svgRef.current;
            if (!svg) return;
            const vbW = contentW / mapZoom;
            const scale = vbW / svg.clientWidth;
            setMapPan(
                clampMapPan(
                    {
                        x: d.startPan.x - dx * scale,
                        y: d.startPan.y - dy * scale,
                    },
                    mapZoom,
                    contentW,
                    contentH,
                ),
            );
        },
        [contentW, contentH, mapZoom],
    );

    const endMapDrag = useCallback(() => {
        if (panGestureRef.current) suppressClickRef.current = true;
        dragRef.current = null;
        panGestureRef.current = false;
    }, []);

    const onMapPointerUp = useCallback(
        (e: PointerEvent<SVGSVGElement>) => {
            endMapDrag();
            try {
                e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
                /* ignore */
            }
        },
        [endMapDrag],
    );

    const onMapClickCapture = useCallback((e: MouseEvent<SVGSVGElement>) => {
        if (suppressClickRef.current) {
            suppressClickRef.current = false;
            e.preventDefault();
            e.stopPropagation();
        }
    }, []);

    const viewBoxW = contentW / mapZoom;
    const viewBoxH = contentH / mapZoom;
    const viewBox = `${mapPan.x} ${mapPan.y} ${viewBoxW} ${viewBoxH}`;

    let status: string;
    if (gameover) {
        status = `Case closed — ${gameover.winner === "detective" ? "the detectives" : "Mr. X"} wins.`;
    } else {
        status = `${players[state.currentTurn.playerOrdinal].description.name}'s turn.`;
        if (turns[currentTurn.turnNumber]?.showMrX ?? false) {
            status += " Mr. X’s station will be revealed this round.";
        } else if (turns[currentTurn.turnNumber - 1]?.showMrX ?? false) {
            status += " Mr. X’s station is revealed!";
        }
    }

    return (
        <div className="game-layout">
            <p className={`game-status ${gameover ? "game-status--over" : ""}`}>{status}</p>

            <div className="game-panels">
                <section className="panel panel--map" aria-label="Game map">
                    <div className="board-map-toolbar" role="toolbar" aria-label="Map zoom">
                        <button type="button" className="board-zoom-btn" onClick={zoomOut} aria-label="Zoom out">
                            −
                        </button>
                        <span className="board-map-toolbar__zoom" aria-live="polite">
                            {Math.round(mapZoom * 100)}%
                        </span>
                        <button type="button" className="board-zoom-btn" onClick={zoomIn} aria-label="Zoom in">
                            +
                        </button>
                        <button type="button" className="board-zoom-btn board-zoom-btn--text" onClick={resetMapView}>
                            Reset
                        </button>
                        <span className="board-map-toolbar__hint">+/− to zoom · scroll to pan map · drag when zoomed</span>
                    </div>
                    <div
                        className="board-wrap"
                        style={{
                            width: `${contentW}px`,
                            height: `${contentH}px`,
                        }}
                    >
                        <svg
                            ref={svgRef}
                            className={`board-svg${mapZoom > 1 ? " board-svg--pannable" : ""}`}
                            width={contentW}
                            height={contentH}
                            viewBox={viewBox}
                            style={{ minWidth: "100%" }}
                            onPointerDown={onMapPointerDown}
                            onPointerMove={onMapPointerMove}
                            onPointerUp={onMapPointerUp}
                            onPointerCancel={onMapPointerUp}
                            onLostPointerCapture={endMapDrag}
                            onClickCapture={onMapClickCapture}
                        >
                            <g transform={`translate(${frameTx}, ${frameTy})`}>
                                {mapGraph.connections.map((connection) => {
                                    const [a, b] = sortedConnectionEndpoints(connection.nodes);
                                    const style = CONNECTION_TO_COLOR_AND_OFFSET[connection.ticket];
                                    const p1 = pixelCoords(nodePixelPositions, a);
                                    const p2 = pixelCoords(nodePixelPositions, b);
                                    const line = parallelConnectionEndpoints(p1, p2, style.offset);
                                    return (
                                        <ConnectionEdge
                                            key={`${a}-${b}-${connection.ticket}`}
                                            x1={line.x1}
                                            y1={line.y1}
                                            x2={line.x2}
                                            y2={line.y2}
                                            stroke={style.color}
                                        />
                                    );
                                })}
                                {mapGraph.nodes.map((node) => (
                                    <BoardNode
                                        key={`node-${node.id}`}
                                        nodeId={node.id}
                                        coords={pixelCoords(nodePixelPositions, node.id)}
                                        stationLook={nodeStationLook.get(node.id)!}
                                        onNodeClick={onNodeClick}
                                    />
                                ))}
                                {markersRenderOrder.map((player) => {
                                    const activePlayer = state.players[state.currentTurn.playerOrdinal];
                                    const isActive = player.description.order === activePlayer.description.order;
                                    const shouldShowMrX = turns[currentTurn.turnNumber - 1]?.showMrX ?? false;
                                    if (state.gameover === null &&
                                        !player.description.isDetective &&
                                        !shouldShowMrX &&
                                        activePlayer.description.isDetective) {
                                        return null;
                                    }
                                    return (
                                        <PlayerMarker
                                            key={player.description.id}
                                            player={player}
                                            stationId={player.position!}
                                            stackDx={stackDxForPlayer(state.players, player)}
                                            coords={pixelCoords(nodePixelPositions, player.position!)}
                                            dragBindings={isActive ? activeMarkerDragBindings : undefined}
                                            dragNudge={isActive && tokenDragging ? tokenDragVisual : undefined}
                                            isDragging={isActive && tokenDragging}
                                            isActiveTurn={isActive}
                                        />
                                    );
                                })}
                            </g>
                        </svg>
                    </div>
                    {pendingMoveNode !== null &&
                        pendingTicketAnchor !== null &&
                        pendingValidTickets !== null &&
                        pendingValidTickets.length > 0 && (
                            <PendingTicketPopup
                                anchor={pendingTicketAnchor}
                                destinationNode={pendingMoveNode}
                                tickets={pendingValidTickets}
                                onPick={onTicketClick}
                                onCancel={onCancelPendingMove}
                            />
                        )}
                </section>

                <aside className="panel panel--sidebar">
                    <ControlPanel
                        players={players}
                        currentTurn={state.currentTurn}
                        onClick={onTicketClick}
                        gameover={!!gameover}
                        pendingDestinationNode={pendingMoveNode}
                        pendingValidTickets={pendingValidTickets}
                        onCancelPendingMove={onCancelPendingMove}
                        ticketSelectionInMapPopup={pendingMoveNode !== null && pendingTicketAnchor !== null}
                    />

                    <div>
                        <p className="mrx-section__label">Mr. X round log</p>
                        {state.players.map((player) =>
                            player.description.isDetective ? null : (
                                <MrXBoard key={player.description.id} state={state} player={player} />
                            ),
                        )}
                    </div>

                    <div className="player-roster">
                        <p className="player-roster__label">Players</p>
                        <div className="player-roster__grid">
                            {state.players.map((player) =>
                                player.description.isDetective ? (
                                    <PlayerCard
                                        key={player.description.id}
                                        player={player}
                                        currentTurn={currentTurn}
                                    />
                                ) : (
                                    <MrXCard key={player.description.id} state={state} player={player} />
                                ),
                            )}
                        </div>
                    </div>

                    <div className="toolbar">
                        <button type="button" className="btn-secondary" onClick={onReset}>
                            New game
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
}
