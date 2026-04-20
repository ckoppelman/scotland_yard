import type { Ticket } from "../../constants";
import type { MapGraph, PlayerState } from "../../game/gameState";
import type { ResolvedMapLayout } from "../../game/mapLayoutTypes";
import { MAX_MAP_ZOOM, MIN_MAP_ZOOM, STATION_TICKETS, TOKEN_STACK_SPREAD } from "../constants";

/** Physical board rules: top cap green if bus, else yellow; middle red if underground, else yellow; bottom always yellow. */
export type StationBoardLook = {
    top: "green" | "yellow";
    middle: "red" | "yellow";
    bottom: "yellow";
};

export function clampMapZoom(z: number): number {
    return Math.min(MAX_MAP_ZOOM, Math.max(MIN_MAP_ZOOM, z));
}

/** Map pointer position to SVG user space (respects viewBox / zoom). */
export function clientToSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
}

export function clampMapPan(
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

/** O(n) once per mapGraph; use Map for O(1) lookups when rendering edges and nodes. */
export function buildNodePixelPositions(
    mapGraph: MapGraph,
    layout: ResolvedMapLayout,
): ReadonlyMap<number, { x: number; y: number }> {
    const { positionScaleX, positionScaleY, positionOffset } = layout;
    const m = new Map<number, { x: number; y: number }>();
    for (const node of mapGraph.nodes) {
        m.set(node.id, {
            x: node.position.x * positionScaleX + positionOffset.x,
            y: node.position.y * positionScaleY + positionOffset.y,
        });
    }
    return m;
}

export function pixelCoords(
    positions: ReadonlyMap<number, { x: number; y: number }>,
    nodeId: number,
): { x: number; y: number } {
    return positions.get(nodeId) ?? { x: -1000, y: -1000 };
}

export function sortedConnectionEndpoints(nodes: Set<number>): [number, number] {
    const [a, b] = [...nodes].sort((x, y) => x - y);
    return [a, b];
}

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
 * Straight segment parallel to the station–station chord, shifted along the normal by `offset`.
 * Multiple ticket types between the same pair stay parallel for the full length (unlike a shared-endpoint curve).
 */
export function parallelConnectionEndpoints(
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

/** Inner bounds in the same coordinate system as `buildNodePixelPositions` (before `<g>` translate). */
export function mapContentBounds(
    mapGraph: MapGraph,
    positions: ReadonlyMap<number, { x: number; y: number }>,
    layout: ResolvedMapLayout,
): { left: number; top: number; innerW: number; innerH: number } | null {
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
        return null;
    }
    const h = layout.contentHalo;
    let left = minX - h.left;
    let right = maxX + h.right;
    let top = minY - h.top;
    let bottom = maxY + h.bottom;

    if (layout.boardImage) {
        const b = layout.boardImage;
        left = Math.min(left, b.x);
        top = Math.min(top, b.y);
        right = Math.max(right, b.x + b.width);
        bottom = Math.max(bottom, b.y + b.height);
    }

    return { left, top, innerW: right - left, innerH: bottom - top };
}

/** Board artwork placement (same coordinates as nodes). */
export function mapBoardBackgroundRect(layout: ResolvedMapLayout): {
    x: number;
    y: number;
    width: number;
    height: number;
    preserveAspectRatio: string;
} | null {
    if (!layout.boardImage) return null;
    const b = layout.boardImage;
    return {
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        preserveAspectRatio: b.preserveAspectRatio,
    };
}

/**
 * SVG pixel size and inner `<g>` translate so the canvas hugs the graph (tight crop; no empty left/top band).
 */
export function mapSvgFrame(
    mapGraph: MapGraph,
    positions: ReadonlyMap<number, { x: number; y: number }>,
    layout: ResolvedMapLayout,
): { width: number; height: number; frameTx: number; frameTy: number } {
    const b = mapContentBounds(mapGraph, positions, layout);
    const g = layout.gutter;
    if (b === null) {
        return { width: 120, height: 120, frameTx: g, frameTy: g };
    }
    const { left, top, innerW, innerH } = b;
    return {
        width: innerW + g * 2,
        height: innerH + g * 2,
        frameTx: g - left,
        frameTy: g - top,
    };
}

/**
 * Station shown for a map token — while a drag move awaits a ticket, the active pawn stays on the
 * chosen destination (`pendingMoveNode`) even though game state still has the previous position.
 */
export function effectiveTokenStation(
    player: PlayerState,
    activePlayer: PlayerState | null,
    pendingMoveNode: number | null,
): number | null {
    if (player.position === null) return null;
    if (
        pendingMoveNode !== null &&
        activePlayer !== null &&
        player.description.id === activePlayer.description.id
    ) {
        return pendingMoveNode;
    }
    return player.position;
}

export function stackDxForPlayer(
    players: PlayerState[],
    player: PlayerState,
    activePlayer: PlayerState | null,
    pendingMoveNode: number | null,
): number {
    const pos = effectiveTokenStation(player, activePlayer, pendingMoveNode);
    if (pos === null) return 0;
    const group = players.filter((p) => {
        const ep = effectiveTokenStation(p, activePlayer, pendingMoveNode);
        return ep !== null && ep === pos;
    });
    if (group.length <= 1) return 0;
    const idx = group.findIndex((p) => p.description.id === player.description.id);
    return (idx - (group.length - 1) / 2) * TOKEN_STACK_SPREAD;
}
