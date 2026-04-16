import type { Ticket } from "../constants";
import type { MapGraph, PlayerState } from "../game/gameState";
import {
    GRID_TO_PX,
    MAP_CONTENT_HALO_X,
    MAP_CONTENT_HALO_Y_BOT,
    MAP_CONTENT_HALO_Y_TOP,
    MAP_GUTTER,
    MAX_MAP_ZOOM,
    MIN_MAP_ZOOM,
    PX_PAD,
    STATION_TICKETS,
    TOKEN_STACK_SPREAD,
} from "./constants";

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

/**
 * SVG pixel size and inner `<g>` translate so the canvas hugs the graph (tight crop; no empty left/top band).
 */
export function mapSvgFrame(
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

export function stackDxForPlayer(players: PlayerState[], player: PlayerState): number {
    if (player.position === null) return 0;
    const group = players.filter((p) => p.position !== null && p.position === player.position);
    if (group.length <= 1) return 0;
    const idx = group.findIndex((p) => p.description.id === player.description.id);
    return (idx - (group.length - 1) / 2) * TOKEN_STACK_SPREAD;
}
