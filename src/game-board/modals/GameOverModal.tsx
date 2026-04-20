import type { GameOver } from "../../constants";
import type { PrivacyModalFade } from "./usePrivacyModalFade";

type Props = {
    fade: PrivacyModalFade;
    gameover: GameOver;
    onViewMap: () => void;
    onNewGame: () => void;
    onNewGameWithSettings: () => void;
};

export function GameOverModal({ fade, gameover, onViewMap, onNewGame, onNewGameWithSettings }: Props) {
    if (!fade.mounted) return null;

    const detail =
        gameover.winner === "detective"
            ? gameover.captureBy !== undefined
                ? `${gameover.captureBy} moved onto the fugitive’s station.`
                : "A detective reached the fugitive’s station."
            : gameover.detectiveLossReason ?? "Every round was played without a capture.";

    return (
        <div
            className={`privacy-turn-modal privacy-turn-modal--game-over${fade.openClass ? " privacy-turn-modal--open" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-over-title"
            onTransitionEnd={fade.onBackdropTransitionEnd}
        >
            <div
                className="privacy-turn-modal__panel privacy-turn-modal__panel--game-over"
                onClick={(e) => e.stopPropagation()}
            >
                <p className="game-over-modal__eyebrow">
                    {gameover.winner === "detective" ? "Scotland Yard" : "Fugitive"}
                </p>
                <h2 id="game-over-title" className="game-over-modal__title">
                    You win!
                </h2>
                <p className="game-over-modal__detail">{detail}</p>
                <div className="game-over-modal__actions">
                    <button type="button" className="game-over-modal__btn game-over-modal__btn--primary" onClick={onViewMap}>
                        View map
                    </button>
                    <button type="button" className="game-over-modal__btn game-over-modal__btn--secondary" onClick={onNewGame}>
                        New game
                    </button>
                    <button
                        type="button"
                        className="game-over-modal__btn game-over-modal__btn--link"
                        onClick={onNewGameWithSettings}
                    >
                        New game with settings
                    </button>
                </div>
            </div>
        </div>
    );
}
