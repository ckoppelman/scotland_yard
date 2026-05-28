import type { DetectiveTurnIntro } from "../../game/detectiveTurnIntro";
import { fugitiveAnimationDelaySeconds } from "../../game/cutsceneTiming";

const EMOJI_TOP_BASE_PERCENT = 28;
const EMOJI_TOP_STEP_PERCENT = 14;
import { transportEmojiForTicket } from "./transportEmoji";

type Props = {
    intro: DetectiveTurnIntro;
};

export function FugitiveCutsceneMapOverlay({ intro }: Props) {
    const { latestMoves } = intro;

    return (
        <div className="fugitive-cutscene-overlay" aria-live="polite">
            <div className="fugitive-cutscene-overlay__backdrop" />
            <div className="fugitive-cutscene-overlay__content">
                {latestMoves.map((move, index) => (
                    <p
                        key={move.id}
                        className="fugitive-cutscene-overlay__headline"
                        style={{ animationDelay: `${fugitiveAnimationDelaySeconds(index)}s` }}
                    >
                        {move.playerName} has moved
                    </p>
                ))}
            </div>
            <div className="fugitive-cutscene-overlay__emoji-layer" aria-hidden>
                {latestMoves.map((move, index) => {
                    const emoji = transportEmojiForTicket(move.ticket);
                    if (emoji === null) return null;

                    return (
                        <span
                            key={move.id}
                            className="fugitive-cutscene-overlay__emoji"
                            style={{
                                animationDelay: `${fugitiveAnimationDelaySeconds(index)}s`,
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
