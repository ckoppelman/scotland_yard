import { APP_COPYRIGHT_YEAR, RAVENSBURGER_HOME_URL } from "../constants";
import type { ModalFade } from "./useModalFade";

type Props = {
    fade: ModalFade;
    /** Opened from hamburger vs first visit */
    introFromMenu: boolean;
    turnLogLength: number;
    onOpenRules: () => void;
    onOpenNewGameSettings: () => void;
};

/** Welcome / attribution panel before (or between) games. */
export function GameIntroModal({
    fade,
    introFromMenu,
    turnLogLength,
    onOpenRules,
    onOpenNewGameSettings,
}: Props) {
    if (!fade.mounted) return null;

    return (
        <div
            className={`privacy-turn-modal privacy-turn-modal--intro${fade.openClass ? " privacy-turn-modal--open" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-intro-title"
            onTransitionEnd={fade.onBackdropTransitionEnd}
        >
            <div className="privacy-turn-modal__panel privacy-turn-modal__panel--intro" onClick={(e) => e.stopPropagation()}>
                <h2 id="game-intro-title" className="privacy-turn-modal__intro-title">
                    Scotland Yard
                </h2>
                <p className="privacy-turn-modal__intro-sub">A hidden-move chase across London</p>
                <div className="privacy-turn-modal__intro-body">
                    <p>
                        Welcome. One player slips away as <strong>Mr.&nbsp;X</strong>; everyone else works as Scotland Yard
                        detectives, riding taxi, bus, and Underground to close the net.
                    </p>
                    <p>
                        The tabletop game you know owes a debt to generations of living-room detectives. In North America,{" "}
                        <strong>Milton Bradley</strong> published the classic boxed edition for years—red rails, tiny plastic
                        pawns, and that deliciously unfair feeling that Mr.&nbsp;X might be one station ahead.
                    </p>
                    <p>
                        Need a refresher?{" "}
                        <button
                            type="button"
                            className="privacy-turn-modal__intro-link privacy-turn-modal__intro-link--button"
                            onClick={onOpenRules}
                        >
                            Read the quick rules
                        </button>
                    </p>
                    <p className="privacy-turn-modal__fineprint">
                        <strong>Scotland Yard</strong> and related marks are trademarks of their respective owners (including{" "}
                        <a
                            href={RAVENSBURGER_HOME_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="privacy-turn-modal__intro-link"
                        >
                            Ravensburger
                        </a>
                        , and for many vintage sets, Milton Bradley / Hasbro). This web adaptation is an independent,
                        non-commercial fan project and is not affiliated with or endorsed by them.
                    </p>
                    <p className="privacy-turn-modal__copyright">
                        Software and layout © {APP_COPYRIGHT_YEAR} — all rights reserved in this implementation; game rules and
                        artwork remain the property of their respective copyright holders.
                    </p>
                </div>
                <div className="privacy-turn-modal__intro-cta">
                    <button type="button" className="privacy-turn-modal__btn privacy-turn-modal__btn--intro" onClick={fade.requestClose}>
                        {introFromMenu && turnLogLength > 0 ? "Close" : "Begin game"}
                    </button>
                    <button
                        type="button"
                        className="privacy-turn-modal__intro-link privacy-turn-modal__intro-link--button"
                        onClick={onOpenNewGameSettings}
                    >
                        New game with settings
                    </button>
                </div>
            </div>
        </div>
    );
}
