import type { DetectiveTurnIntro } from "../../game/detectiveTurnIntro";
import { transportEmojiForTicket } from "./transportEmoji";

const EMOJI_TOP_BASE_PERCENT = 28;
const EMOJI_TOP_STEP_PERCENT = 14;

type Props = {
    intro: DetectiveTurnIntro;
    /** When set, only moves up to this index are shown (sequential cutscene beats). */
    activeMoveIndex: number | null;
};

export function FugitiveCutsceneMapOverlay({ intro, activeMoveIndex }: Props) {
    const visibleMoves =
        activeMoveIndex === null
            ? []
            : intro.latestMoves.slice(0, activeMoveIndex + 1);

    return (
        <div className="fugitive-cutscene-overlay" aria-live="polite">
            <div className="fugitive-cutscene-overlay__backdrop" />
            <div className="fugitive-cutscene-overlay__content">
                {visibleMoves.map((move) => (
                    <p key={move.id} className="fugitive-cutscene-overlay__headline fugitive-cutscene-overlay__headline--active">
                        {move.playerName} has moved
                    </p>
                ))}
            </div>
            <div className="fugitive-cutscene-overlay__emoji-layer" aria-hidden>
                {visibleMoves.map((move, index) => {
                    const emoji = transportEmojiForTicket(move.ticket);
                    if (emoji === null) return null;

                    return (
                        <span
                            key={move.id}
                            className="fugitive-cutscene-overlay__emoji fugitive-cutscene-overlay__emoji--active"
                            style={{
                                top: `${EMOJI_TOP_BASE_PERCENT + index * EMOJI_TOP_STEP_PERCENT}%`,
                            }}
                        >
                            {emoji}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
