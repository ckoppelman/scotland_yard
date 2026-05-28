export type MusicMode = "ambient" | "detective" | "fugitive";

export type MusicThemeId = "default";

export type MusicThemeTracks = Record<MusicMode, string>;

export type MusicThemeOption = {
    id: MusicThemeId;
    label: string;
    tracks: MusicThemeTracks;
};

export const MUSIC_THEME_OPTIONS: MusicThemeOption[] = [
    {
        id: "default",
        label: "Default",
        tracks: {
            ambient: "/audio/nojisuma-night_dew-429962.mp3",
            detective: "/audio/nojisuma-windless-160818.mp3",
            fugitive: "/audio/nojisuma-explore_at_night-242582.mp3",
        },
    },
];

export const DEFAULT_MUSIC_THEME_ID: MusicThemeId = "default";

const themesById = Object.fromEntries(MUSIC_THEME_OPTIONS.map((theme) => [theme.id, theme.tracks])) as Record<
    MusicThemeId,
    MusicThemeTracks
>;

export function isMusicThemeId(value: string): value is MusicThemeId {
    return value in themesById;
}

export function trackForMode(mode: MusicMode, themeId: MusicThemeId = DEFAULT_MUSIC_THEME_ID): string {
    return themesById[themeId][mode];
}
