import type { GameOver } from "../../constants";
import type { PlayerState } from "../../game/gameState";
import { ModalPawn } from "./ModalPawn";
import type { ModalFade } from "./useModalFade";

type Props = {
    fade: ModalFade;
    gameover: GameOver;
    players: PlayerState[];
    onViewMap: () => void;
    onNewGame: () => void;
    onNewGameWithSettings: () => void;
};

export function GameOverModal({
    fade,
    gameover,
    players,
    onViewMap,
    onNewGame,
    onNewGameWithSettings,
}: Props) {
    if (!fade.mounted) return null;

    const winningPlayers =
        gameover.winner === "detective"
            ? players.filter((p) => p.description.isDetective)
            : players.filter((p) => !p.description.isDetective);
    const pawnSize = winningPlayers.length <= 1 ? "lg" : "md";

    const detail =
        gameover.winner === "detective"
            ? gameover.captureBy !== undefined
                ? `${gameover.captureBy} moved onto the fugitive’s station.`
                : "A detective reached the fugitive’s station."
            : gameover.detectiveLossReason ?? gameover.mrXLossReason ?? "Every round was played without a capture.";

    const title =
        gameover.winner === "detective"
            ? "Scotland Yard"
            : "Fugitive";

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
                    {title}
                </p>
                <div className="privacy-turn-modal__icon-row game-over-modal__pawn-row" aria-hidden>
                    {winningPlayers.map((p) => (
                        <div key={p.description.id} className="privacy-turn-modal__pawn-cell">
                            <ModalPawn player={p} size={pawnSize} />
                        </div>
                    ))}
                </div>
                <h2 id="game-over-title" className="game-over-modal__title">
                    {title} wins!
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
