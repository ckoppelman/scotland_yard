import type { DetectiveTurnIntro } from "../../game/detectiveTurnIntro";
import { transportEmojiForTicket } from "./transportEmoji";

type Props = {
    intro: DetectiveTurnIntro;
};

export function FugitiveCutsceneMapOverlay({ intro }: Props) {
    const lines = intro.fugitives.map((f) => `${f.name} has moved`);
    const emojis = intro.latestMoves
        .map((move) => transportEmojiForTicket(move.ticket))
        .filter((emoji): emoji is string => emoji !== null);

    return (
        <div className="fugitive-cutscene-overlay" aria-live="polite" aria-hidden>
            <div className="fugitive-cutscene-overlay__backdrop" />
            <div className="fugitive-cutscene-overlay__content">
                {lines.map((line, index) => (
                    <p
                        key={intro.fugitives[index]!.id}
                        className="fugitive-cutscene-overlay__headline"
                        style={{ animationDelay: `${index * 0.12}s` }}
                    >
                        {line}
                    </p>
                ))}
            </div>
            <div className="fugitive-cutscene-overlay__emoji-layer" aria-hidden>
                {emojis.map((emoji, index) => (
                    <span
                        key={`${intro.key}-${emoji}-${index}`}
                        className="fugitive-cutscene-overlay__emoji"
                        style={{ animationDelay: `${index * 0.35}s`, top: `${28 + index * 14}%` }}
                    >
                        {emoji}
                    </span>
                ))}
            </div>
        </div>
    );
}
