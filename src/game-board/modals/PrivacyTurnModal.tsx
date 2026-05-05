import type { PlayerState } from "../../game/gameState";
import { ModalPawn } from "./ModalPawn";
import type { ModalFade } from "./useModalFade";

export type PrivacyTurnVariant = "mrx" | "detectives";

type Props = {
    variant: PrivacyTurnVariant;
    fade: ModalFade;
    criminalLabel: string;
    mrXPlayers: PlayerState[];
    detectives: PlayerState[];
};

/** Asks one side to look away while the other plans or enters hidden moves. */
export function PrivacyTurnModal({ variant, fade, criminalLabel, mrXPlayers, detectives }: Props) {
    if (!fade.mounted) return null;

    const isMrX = variant === "mrx";
    const modalMod = isMrX ? "mrx" : "detectives";
    const titleId = isMrX ? "mrx-privacy-modal-title" : "detective-privacy-modal-title";

    return (
        <div
            className={`privacy-turn-modal privacy-turn-modal--${modalMod}${fade.openClass ? " privacy-turn-modal--open" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onTransitionEnd={fade.onBackdropTransitionEnd}
        >
            <div
                className={`privacy-turn-modal__panel privacy-turn-modal__panel--${modalMod}`}
                onClick={(e) => e.stopPropagation()}
            >
                {isMrX ? (
                    <>
                        <p className="privacy-turn-modal__eyebrow privacy-turn-modal__eyebrow--mrx">
                            Look away — detectives on this device
                        </p>
                        <div className="privacy-turn-modal__icon-row" aria-hidden>
                            {detectives.map((p: PlayerState) => (
                                <div key={p.description.id} className="privacy-turn-modal__pawn-cell">
                                    <ModalPawn player={p} size="md" />
                                </div>
                            ))}
                        </div>
                        <section className="privacy-turn-modal__hero privacy-turn-modal__hero--mrx">
                            <div className="privacy-turn-modal__icon-row" aria-hidden>
                                {mrXPlayers.map((p: PlayerState) => (
                                    <div key={p.description.id} className="privacy-turn-modal__pawn-cell">
                                        <ModalPawn player={p} size="lg" />
                                    </div>
                                ))}
                            </div>
                        </section>
                        <p id={titleId} className="privacy-turn-modal__text">
                            Thank you, detectives. Now it&apos;s time for the {criminalLabel} to take their turn. Please
                            turn away and let them enter their {criminalLabel === "fugitive" ? "move" : "moves"}.
                        </p>
                        <button
                            type="button"
                            className="privacy-turn-modal__btn privacy-turn-modal__btn--mrx"
                            onClick={fade.requestClose}
                        >
                            Ok, {criminalLabel === "fugitive" ? "Fugitive" : "Fugitives"} are ready.
                        </button>
                    </>
                ) : (
                    <>
                        <div className="privacy-turn-modal__two-groups">
                            <div>
                                <p className="privacy-turn-modal__eyebrow privacy-turn-modal__eyebrow--detectives">
                                    {criminalLabel === "fugitive" ? "Fugitive" : "Fugitives"}
                                </p>
                                <div className="privacy-turn-modal__icon-row" aria-hidden>
                                    {mrXPlayers.map((p) => (
                                        <div key={p.description.id} className="privacy-turn-modal__pawn-cell">
                                            <ModalPawn player={p} size="md" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="privacy-turn-modal__eyebrow privacy-turn-modal__eyebrow--detectives">
                                    Detectives
                                </p>
                                <div className="privacy-turn-modal__icon-row" aria-hidden>
                                    {detectives.map((p) => (
                                        <div key={p.description.id} className="privacy-turn-modal__pawn-cell">
                                            <ModalPawn player={p} size="lg" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <p id={titleId} className="privacy-turn-modal__text">
                            Thank you, {criminalLabel}. Now it&apos;s time for the detectives to take their turn.
                        </p>
                        <button
                            type="button"
                            className="privacy-turn-modal__btn privacy-turn-modal__btn--detectives"
                            onClick={fade.requestClose}
                        >
                            Ok. Detectives are ready.
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
