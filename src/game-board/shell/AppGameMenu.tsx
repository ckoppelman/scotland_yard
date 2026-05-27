import type { LegacyRef } from "react";

type Props = {
    menuRef: LegacyRef<HTMLDivElement>;
    menuOpen: boolean;
    setMenuOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
    onNewGame: () => void;
    onOpenNewGameSettings: () => void;
    onOpenIntro: () => void;
    onOpenRules: () => void;
    /** Grey out Pause when the game has ended or is already paused. */
    pauseDisabled: boolean;
    /** Grey out Resume when not paused or game has ended. */
    resumeDisabled: boolean;
    onPause: () => void;
    onResumePause: () => void;
};

/** Top-left hamburger: new game, intro, pause/resume, rules. */
export function AppGameMenu({
    menuRef,
    menuOpen,
    setMenuOpen,
    onNewGame,
    onOpenNewGameSettings,
    onOpenIntro,
    onOpenRules,
    pauseDisabled,
    resumeDisabled,
    onPause,
    onResumePause,
}: Props) {
    return (
        <div className="app-menu" ref={menuRef}>
            <button
                type="button"
                className="app-menu__trigger"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-controls="app-menu-dropdown"
                id="app-menu-trigger"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen((o) => !o)}
            >
                <span className="app-menu__bars" aria-hidden>
                    <span className="app-menu__bar" />
                    <span className="app-menu__bar" />
                    <span className="app-menu__bar" />
                </span>
            </button>
            {menuOpen && (
                <div className="app-menu__dropdown" id="app-menu-dropdown" role="menu" aria-labelledby="app-menu-trigger">
                    <button
                        type="button"
                        className="app-menu__item"
                        role="menuitem"
                        onClick={() => {
                            onNewGame();
                            setMenuOpen(false);
                        }}
                    >
                        New game
                    </button>
                    <button
                        type="button"
                        className="app-menu__item"
                        role="menuitem"
                        onClick={() => {
                            onOpenNewGameSettings();
                            setMenuOpen(false);
                        }}
                    >
                        New game with settings
                    </button>
                    <button
                        type="button"
                        className="app-menu__item"
                        role="menuitem"
                        onClick={() => {
                            onOpenIntro();
                            setMenuOpen(false);
                        }}
                    >
                        Introduction
                    </button>
                    <button
                        type="button"
                        className="app-menu__item"
                        role="menuitem"
                        disabled={pauseDisabled}
                        aria-disabled={pauseDisabled}
                        onClick={() => {
                            onPause();
                            setMenuOpen(false);
                        }}
                    >
                        Pause
                    </button>
                    <button
                        type="button"
                        className="app-menu__item"
                        role="menuitem"
                        disabled={resumeDisabled}
                        aria-disabled={resumeDisabled}
                        onClick={() => {
                            onResumePause();
                            setMenuOpen(false);
                        }}
                    >
                        Resume
                    </button>
                    <button
                        type="button"
                        className="app-menu__item"
                        role="menuitem"
                        onClick={() => {
                            onOpenRules();
                            setMenuOpen(false);
                        }}
                    >
                        Rules
                    </button>
                </div>
            )}
        </div>
    );
}
