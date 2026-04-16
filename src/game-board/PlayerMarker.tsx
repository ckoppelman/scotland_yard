import { memo, type PointerEvent } from "react";
import { COLOR_TO_BORDER } from "../constants";
import type { PlayerState } from "../game/gameState";
import { DetectiveMarkerIcon } from "../DetectiveMarkerIcon";
import { MrXMarkerIcon } from "../MrXMarkerIcon";

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
