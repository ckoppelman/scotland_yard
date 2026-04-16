import { memo } from "react";
import {
    STATION_CAP_HALF_W,
    STATION_CAP_SAGITTA,
    STATION_MID_H,
    STATION_MID_W,
} from "./constants";
import type { StationBoardLook } from "./mapLayout";

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
    const topCapD = `M ${cx - a} ${yChordTop} A ${R} ${R} 0 0 1 ${cx + a} ${yChordTop} Z`;
    const bottomCapD = `M ${cx - a} ${yChordBot} A ${R} ${R} 0 0 0 ${cx + a} ${yChordBot} Z`;
    return { yChordTop, yChordBot, midRect, topCapD, bottomCapD };
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
