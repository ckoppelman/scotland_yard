import { ACKNOWLEDGEMENT_SECTIONS } from "../../content/acknowledgements";
import type { ModalFade } from "./useModalFade";

type Props = {
    fade: ModalFade;
};

/** Credits for the board game, music, SFX, and other assets. */
export function AcknowledgementsModal({ fade }: Props) {
    if (!fade.mounted) return null;

    return (
        <div
            className={`privacy-turn-modal privacy-turn-modal--intro${fade.openClass ? " privacy-turn-modal--open" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="acknowledgements-title"
            onTransitionEnd={fade.onBackdropTransitionEnd}
        >
            <div className="privacy-turn-modal__panel privacy-turn-modal__panel--intro" onClick={(e) => e.stopPropagation()}>
                <h2 id="acknowledgements-title" className="privacy-turn-modal__intro-title">
                    Acknowledgements
                </h2>
                <p className="privacy-turn-modal__intro-sub">Credits &amp; copyrights</p>
                <div className="privacy-turn-modal__intro-body privacy-turn-modal__ack-body">
                    {ACKNOWLEDGEMENT_SECTIONS.map((section) => (
                        <section key={section.id} className="privacy-turn-modal__ack-section" aria-labelledby={`ack-${section.id}`}>
                            <h3 id={`ack-${section.id}`} className="privacy-turn-modal__ack-heading">
                                {section.title}
                            </h3>
                            {section.paragraphs.map((paragraph, paragraphIndex) => (
                                <p key={`${section.id}-p-${paragraphIndex}`} className="privacy-turn-modal__fineprint">
                                    {paragraph}
                                </p>
                            ))}
                            {section.credits.length > 0 && (
                                <ul className="privacy-turn-modal__ack-list">
                                    {section.credits.map((credit) => (
                                        <li key={`${section.id}-${credit.name}`}>
                                            <strong>{credit.name}</strong>
                                            {credit.role ? <> — {credit.role}</> : null}
                                            <br />
                                            <span className="privacy-turn-modal__copyright">{credit.license}</span>
                                            {credit.url ? (
                                                <>
                                                    {" "}
                                                    ·{" "}
                                                    <a
                                                        href={credit.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="privacy-turn-modal__intro-link"
                                                    >
                                                        Source
                                                    </a>
                                                </>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    ))}
                </div>
                <button type="button" className="privacy-turn-modal__btn privacy-turn-modal__btn--intro" onClick={fade.requestClose}>
                    Close
                </button>
            </div>
        </div>
    );
}
