import { COLOR_TO_BORDER } from "../../constants";
import type { PlayerState } from "../../game/gameState";
import { ModalPawn } from "./ModalPawn";
import type { ModalFade } from "./useModalFade";

type Props = {
    fade: ModalFade;
    currentPlayer: PlayerState;
};

/** Full-screen privacy-style overlay so everyone can look away during a break. */
export function PauseModal({ fade, currentPlayer }: Props) {
    if (!fade.mounted) return null;

    return (
        <div
            className={`privacy-turn-modal privacy-turn-modal--pause${fade.openClass ? " privacy-turn-modal--open" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-modal-title"
            onTransitionEnd={fade.onBackdropTransitionEnd}
        >
            <div
                className="privacy-turn-modal__panel privacy-turn-modal__panel--pause"
                style={{
                    outline: `2px solid color-mix(in srgb, ${COLOR_TO_BORDER[currentPlayer.description.color]} 72%, transparent)`,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <p className="pause-modal__eyebrow">Paused</p>
                <h2 id="pause-modal-title" className="pause-modal__title">
                    Look away from the board
                </h2>
                <p className="pause-modal__body">
                    Take a break — we'll keep positions and tickets private until everyone is ready to continue.
                </p>
                <div className="privacy-turn-modal__icon-row" aria-hidden>
                    <div className="privacy-turn-modal__pawn-cell pause-modal__player-icon">
                        <ModalPawn player={currentPlayer} size="lg" />
                    </div>
                    <div className="pause-modal__player-name privacy-turn-modal__pawn-cell">
                        It is {currentPlayer.description.name}'s turn.
                    </div>
                </div>
                <button type="button" className="pause-modal__btn" onClick={fade.requestClose}>
                    Resume game
                </button>
            </div>
        </div>
    );
}
