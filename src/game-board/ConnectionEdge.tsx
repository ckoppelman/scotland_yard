import { memo } from "react";
import { STROKE_WIDTH } from "./constants";

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
