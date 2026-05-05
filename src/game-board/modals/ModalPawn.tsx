import { COLOR_TO_BORDER } from "../../constants";
import { DetectiveMarkerIcon } from "../../DetectiveMarkerIcon";
import { MrXMarkerIcon } from "../../MrXMarkerIcon";
import type { PlayerState } from "../../game/gameState";

type Props = {
    player: PlayerState;
    size: "md" | "lg";
};

/** Detective / fugitive pawn illustration for modals (not the draggable map token). */
export function ModalPawn({ player, size }: Props) {
    const fill = COLOR_TO_BORDER[player.description.color];
    const spec =
        size === "lg"
            ? { w: 92, h: 92, vb: "-38 -38 76 76" as const, dScale: 0.15 as const, xScale: 0.16 as const }
            : { w: 48, h: 48, vb: "-28 -28 56 56" as const, dScale: 0.1 as const, xScale: 0.11 as const };
    return (
        <svg className="modal-pawn" width={spec.w} height={spec.h} viewBox={spec.vb} aria-hidden>
            {player.description.isDetective ? (
                <DetectiveMarkerIcon fill={fill} scale={spec.dScale} />
            ) : (
                <MrXMarkerIcon fill={fill} scale={spec.xScale} />
            )}
        </svg>
    );
}
