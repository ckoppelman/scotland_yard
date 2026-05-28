import type { ModalFade } from "./useModalFade";
import { MUSIC_THEME_OPTIONS, type MusicThemeId } from "../../audio/musicTracks";

type Props = {
    fade: ModalFade;
    musicThemeId: MusicThemeId;
    musicEnabled: boolean;
    musicVolume: number;
    sfxEnabled: boolean;
    sfxVolume: number;
    onMusicThemeChange: (themeId: MusicThemeId) => void;
    onMusicEnabledChange: (enabled: boolean) => void;
    onMusicVolumeChange: (volume: number) => void;
    onSfxEnabledChange: (enabled: boolean) => void;
    onSfxVolumeChange: (volume: number) => void;
    animationsEnabled: boolean;
    onAnimationsEnabledChange: (enabled: boolean) => void;
};

/** App preferences — audio, accessibility, etc. */
export function SettingsModal({
    fade,
    musicThemeId,
    musicEnabled,
    musicVolume,
    sfxEnabled,
    sfxVolume,
    animationsEnabled,
    onMusicThemeChange,
    onMusicEnabledChange,
    onMusicVolumeChange,
    onSfxEnabledChange,
    onSfxVolumeChange,
    onAnimationsEnabledChange,
}: Props) {
    if (!fade.mounted) return null;

    const musicVolumePercent = Math.round(musicVolume * 100);
    const sfxVolumePercent = Math.round(sfxVolume * 100);

    return (
        <div
            className={`privacy-turn-modal privacy-turn-modal--intro${fade.openClass ? " privacy-turn-modal--open" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-settings-title"
            onTransitionEnd={fade.onBackdropTransitionEnd}
        >
            <div className="privacy-turn-modal__panel privacy-turn-modal__panel--intro" onClick={(e) => e.stopPropagation()}>
                <h2 id="app-settings-title" className="privacy-turn-modal__intro-title">
                    Settings
                </h2>
                <div className="app-settings">
                    <div className="app-settings__row app-settings__row--theme">
                        <label htmlFor="app-settings-music-theme" className="app-settings__row-label">
                            Theme
                        </label>
                        <select
                            id="app-settings-music-theme"
                            className="app-settings__select"
                            value={musicThemeId}
                            disabled={!musicEnabled}
                            onChange={(e) => onMusicThemeChange(e.target.value as MusicThemeId)}
                        >
                            {MUSIC_THEME_OPTIONS.map((theme) => (
                                <option key={theme.id} value={theme.id}>
                                    {theme.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="app-settings__row">
                        <span id="app-settings-music-label" className="app-settings__row-label">
                            Music
                        </span>
                        <input
                            type="range"
                            className="app-settings__volume-slider"
                            min={0}
                            max={100}
                            step={1}
                            value={musicVolumePercent}
                            disabled={!musicEnabled}
                            aria-labelledby="app-settings-music-label"
                            aria-valuetext={`${musicVolumePercent} percent`}
                            onChange={(e) => onMusicVolumeChange(Number(e.target.value) / 100)}
                        />
                        <span className="app-settings__volume-value" aria-hidden>
                            {musicVolumePercent}%
                        </span>
                        <label className="app-settings__toggle-end">
                            <input
                                type="checkbox"
                                className="app-settings__toggle-input"
                                checked={musicEnabled}
                                onChange={(e) => onMusicEnabledChange(e.target.checked)}
                            />
                            <span className="app-settings__toggle-switch" aria-hidden />
                        </label>
                    </div>
                    <div className="app-settings__row">
                        <span id="app-settings-sfx-label" className="app-settings__row-label">
                            Sounds
                        </span>
                        <input
                            type="range"
                            className="app-settings__volume-slider"
                            min={0}
                            max={100}
                            step={1}
                            value={sfxVolumePercent}
                            disabled={!sfxEnabled}
                            aria-labelledby="app-settings-sfx-label"
                            aria-valuetext={`${sfxVolumePercent} percent`}
                            onChange={(e) => onSfxVolumeChange(Number(e.target.value) / 100)}
                        />
                        <span className="app-settings__volume-value" aria-hidden>
                            {sfxVolumePercent}%
                        </span>
                        <label className="app-settings__toggle-end">
                            <input
                                type="checkbox"
                                className="app-settings__toggle-input"
                                checked={sfxEnabled}
                                onChange={(e) => onSfxEnabledChange(e.target.checked)}
                            />
                            <span className="app-settings__toggle-switch" aria-hidden />
                        </label>
                    </div>
                    <div className="app-settings__row app-settings__row--toggle-only">
                        <span id="app-settings-animations-label" className="app-settings__row-label">
                            Animations
                        </span>
                        <label className="app-settings__toggle-end">
                            <input
                                type="checkbox"
                                className="app-settings__toggle-input"
                                checked={animationsEnabled}
                                aria-labelledby="app-settings-animations-label"
                                onChange={(e) => onAnimationsEnabledChange(e.target.checked)}
                            />
                            <span className="app-settings__toggle-switch" aria-hidden />
                        </label>
                    </div>
                </div>
                <button type="button" className="privacy-turn-modal__btn privacy-turn-modal__btn--intro" onClick={fade.requestClose}>
                    Close
                </button>
            </div>
        </div>
    );
}
