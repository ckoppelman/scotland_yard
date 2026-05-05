import type { PlayerState } from "../../game/gameState";
import { ModalPawn } from "./ModalPawn";

type Props = {
    activePlayer: PlayerState;
    onPass: () => void;
};

/** Shown when the current player has no legal move; only action is to pass the turn. */
export function MustPassModal({ activePlayer, onPass }: Props) {
    const label = activePlayer.description.name;

    return (
        <div
            className="privacy-turn-modal privacy-turn-modal--must-pass privacy-turn-modal--open"
            role="dialog"
            aria-modal="true"
            aria-labelledby="must-pass-title"
        >
            <div className="privacy-turn-modal__panel privacy-turn-modal__panel--must-pass" onClick={(e) => e.stopPropagation()}>
                <p className="must-pass-modal__eyebrow">No legal moves</p>
                <div className="privacy-turn-modal__icon-row must-pass-modal__pawn-row" aria-hidden>
                    <div className="privacy-turn-modal__pawn-cell">
                        <ModalPawn player={activePlayer} size="lg" />
                    </div>
                </div>
                <h2 id="must-pass-title" className="must-pass-modal__title">
                    {label} is stuck
                </h2>
                <p className="must-pass-modal__body">
                    There is no adjacent station you can reach with a ticket you still have (or every route is blocked by a
                    detective). You cannot move — press <strong>Pass</strong> to continue the game.
                </p>
                <button type="button" className="must-pass-modal__btn" onClick={onPass}>
                    Pass
                </button>
            </div>
        </div>
    );
}
