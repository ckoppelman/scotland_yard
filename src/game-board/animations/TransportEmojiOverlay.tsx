type Props = {
    burst: { emoji: string; id: number } | null;
    onComplete: () => void;
};

/** Full-screen emoji sweep when a player moves by taxi, bus, tube, or black ticket. */
export function TransportEmojiOverlay({ burst, onComplete }: Props) {
    if (burst === null) return null;

    return (
        <div className="transport-emoji-overlay" aria-hidden>
            <span
                key={burst.id}
                className="transport-emoji-overlay__emoji"
                onAnimationEnd={onComplete}
            >
                {burst.emoji}
            </span>
        </div>
    );
}
