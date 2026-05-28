import { APP_COPYRIGHT_YEAR, RAVENSBURGER_HOME_URL } from "../game-board/constants";

export type AcknowledgementCredit = {
    name: string;
    role: string;
    license: string;
    url?: string;
};

export type AcknowledgementSection = {
    id: string;
    title: string;
    paragraphs: string[];
    credits: AcknowledgementCredit[];
};

/** Credits shown in the in-game Acknowledgements modal. Keep in sync with public/audio/ATTRIBUTION.md. */
export const ACKNOWLEDGEMENT_SECTIONS: AcknowledgementSection[] = [
    {
        id: "game",
        title: "Scotland Yard",
        paragraphs: [
            "Scotland Yard and related marks are trademarks of their respective owners (including Ravensburger, and for many vintage sets, Milton Bradley / Hasbro). This web adaptation is an independent fan project and is not affiliated with or endorsed by them.",
            `Software and layout © ${APP_COPYRIGHT_YEAR}. Game rules and classic artwork remain the property of their respective copyright holders.`,
        ],
        credits: [
            {
                name: "Ravensburger",
                role: "Original board game publisher",
                license: "Trademark — see publisher site",
                url: RAVENSBURGER_HOME_URL,
            },
        ],
    },
    {
        id: "music",
        title: "Background music",
        paragraphs: [
            "Ambient, detective, and fugitive themes switch automatically during play. Tracks live under public/audio/music/; all listed below are by nojisuma on Pixabay.",
        ],
        credits: [
            {
                name: "Night Dew",
                role: "Intro, pause, and game-over ambience",
                license: "Pixabay Content License",
                url: "https://pixabay.com/users/nojisuma-23737290/",
            },
            {
                name: "Explore at Night",
                role: "Fugitive turns",
                license: "Pixabay Content License",
                url: "https://pixabay.com/users/nojisuma-23737290/",
            },
            {
                name: "Windless",
                role: "Detective turns",
                license: "Pixabay Content License",
                url: "https://pixabay.com/users/nojisuma-23737290/",
            },
        ],
    },
    {
        id: "sfx",
        title: "Sound effects",
        paragraphs: [
            "Move, UI, and dramatic stingers are chosen at random from curated folders. Sources include the providers below.",
        ],
        credits: [
            {
                name: "QuickSounds.com",
                role: "Transport, fugitive reveal/hide, game-over, cancel, and UI effects",
                license: "QuickSounds.com terms (attribution required)",
                url: "https://quicksounds.com/",
            },
            {
                name: "Mixkit",
                role: "Selected taxi horn and vehicle drive-by effects",
                license: "Mixkit License",
                url: "https://mixkit.co/license/#sfxFree",
            },
            {
                name: "BBC Sound Effects",
                role: "London bus and Underground ambience samples",
                license: "BBC remArc / personal-use terms — attribution required",
                url: "https://sound-effects.bbcrewind.co.uk/",
            },
        ],
    },
    {
        id: "fonts",
        title: "Typography",
        paragraphs: ["Display type used on Mr. X ticket backs."],
        credits: [
            {
                name: "Top Secret Stamp",
                role: "Galdino Otten",
                license: "Free for personal use; commercial use requires author license",
                url: "https://www.1001fonts.com/top-secret-stamp-font.html",
            },
        ],
    },
];
