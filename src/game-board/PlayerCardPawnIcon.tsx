import { COLOR_TO_BORDER } from "../constants";
import type { PlayerState } from "../game/gameState";
import { DetectiveMarkerIcon } from "../DetectiveMarkerIcon";
import { MrXMarkerIcon } from "../MrXMarkerIcon";
import { CARD_ICON_DETECTIVE_SCALE, CARD_ICON_MRX_SCALE } from "./constants";

export function PlayerCardPawnIcon({ player }: { player: PlayerState }) {
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
