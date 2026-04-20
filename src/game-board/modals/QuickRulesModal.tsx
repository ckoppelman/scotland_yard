import type { PrivacyModalFade } from "./usePrivacyModalFade";

type Props = {
    fade: PrivacyModalFade;
};

/** Short in-app rules reference (not the full boxed rulebook). */
export function QuickRulesModal({ fade }: Props) {
    if (!fade.mounted) return null;

    return (
        <div
            className={`privacy-turn-modal privacy-turn-modal--intro${fade.openClass ? " privacy-turn-modal--open" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-rules-title"
            onTransitionEnd={fade.onBackdropTransitionEnd}
        >
            <div className="privacy-turn-modal__panel privacy-turn-modal__panel--intro" onClick={(e) => e.stopPropagation()}>
                <h2 id="game-rules-title" className="privacy-turn-modal__intro-title">
                    Rules
                </h2>
                <p className="privacy-turn-modal__intro-sub">Scotland Yard — quick reference</p>
                <div className="privacy-turn-modal__intro-body privacy-turn-modal__rules-body">
                    <p>
                        <strong>Goal.</strong> Detectives coordinate to land on Mr.&nbsp;X&apos;s station or leave them with no
                        legal move. Mr.&nbsp;X tries to stay hidden and keep moving until the detectives run out of time in this
                        session&apos;s schedule.
                    </p>
                    <p>
                        <strong>Turns.</strong> Pick a transport <strong>ticket</strong> (taxi, bus, Underground), then choose an
                        adjacent station that matches that line type. Mr.&nbsp;X may also use <strong>black</strong> tickets (any
                        link) and occasionally <strong>double</strong> to move twice in one turn where your deal allows it.
                    </p>
                    <p>
                        <strong>Hidden movement.</strong> Mr.&nbsp;X&apos;s destination is usually secret; this app uses{" "}
                        <strong>privacy screens</strong> so the right players look away at the right time. Reveal rounds let
                        detectives narrow the search—watch the turn banner and Mr.&nbsp;X&apos;s round log.
                    </p>
                    <p className="privacy-turn-modal__fineprint">
                        This page summarizes how the digital table behaves; refer to your boxed rules for the full official text,
                        timing, and optional variants.
                    </p>
                </div>
                <button type="button" className="privacy-turn-modal__btn privacy-turn-modal__btn--intro" onClick={fade.requestClose}>
                    Close
                </button>
            </div>
        </div>
    );
}
