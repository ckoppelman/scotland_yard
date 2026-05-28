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
        id: "app-author",
        title: "Creator",
        paragraphs: [
            "This web adaptation is an independent fan project created by Charles Koppelman-Milstein.  It is the first game I've built from scratch, and I'm really proud of it.",
        ],
        credits: [
            {
                name: "Charles Koppelman-Milstein",
                role: "Creator",
                license: "MIT License",
                url: "https://github.com/ckoppelman/scotland_yard",
            },
        ],
    },
    {
        id: "thanks",
        title: "Special Thanks",
        paragraphs: [
            "This would not have been possible without the help of the following people:",
        ],
        credits: [
            {
                name: "My children, J and W",
                role: "For spending many hours playing and beating me at the original game, for play-testing and providing really great feedback.  I love you guys and I hope you enjoy board games as much as I do.",
                license: "",
                url: "",
            },
            {
                name: "My wife",
                role: "For tolerating my board game shelf and the time I spend playing them.  Thank you for allowing me to spend so many hours on this when I should have been in bed.  I cannot thank you enough for your constant support and love.  I am so grateful to have you in my life.",
                license: "",
                url: "",
            },
            {
                name: "My father, of blessed memory",
                role: "For introducing me to the original game and giving me a lifelong love of board games.  I sat so many hours in the living room playing this with him and I miss him so much.",
                license: "",
                url: "",
            },
            {
                name: "My brother and sister",
                role: "For playing so many hours of board games, and especially D for teaming up with me to write our own game. I love you both.",
                license: "",
                url: "",
            },
            {
                name: "My mother, of blessed memory",
                role: "Love, encouragement, a childhood of blessings, and dealing with my teenage years.",
                license: "",
                url: "",
            },
        ],
    },
    {
        id: "map-data",
        title: "Map data",
        paragraphs: [
            "The default map is from the original game and is used without permission.",
            "The pixel-perfect positioning of the stations is based on the extremely detailed data from AlexElvers/scotland-yard-data.",
        ],
        credits: [
            {
                name: "Alexander Elvers",
                role: "Map data",
                license: "No license",
                url: "https://github.com/AlexElvers/scotland-yard-data",
            },
            {
                name: "Ravensburger",
                role: "Original board game publisher",
                license: "Trademark — see publisher site",
                url: RAVENSBURGER_HOME_URL,
            }
        ],
    },
    {
        id: "music",
        title: "Background music",
        paragraphs: [
            "Ambient, detective, and fugitive themes are all by [nojisuma](https://pixabay.com/users/nojisuma-23737290/) and hosted on [Pixabay](https://pixabay.com/).",
        ],
        credits: [
            {
                name: "夜露 (Night Dew), by nojisuma",
                role: "Intro, pause, and game-over ambience",
                license: "Pixabay Content License",
                url: "https://pixabay.com/music/modern-classical-%E5%A4%9C%E9%9C%B2-night-dew-429962/",
            },
            {
                name: "夜に探訪 (Explore at Night), by nojisuma",
                role: "Fugitive turns",
                license: "Pixabay Content License",
                url: "https://pixabay.com/music/adventure-%E5%A4%9C%E3%81%AB%E6%8E%A2%E8%A8%AA-explore-at-night-242582/",
            },
            {
                name: "無風 (Windless), by nojisuma",
                role: "Detective turns",
                license: "Pixabay Content License",
                url: "https://pixabay.com/music/beats-%E7%84%A1%E9%A2%A8-windless-160818/",
            },
        ],
    },
    {
        id: "sfx",
        title: "Sound effects",
        paragraphs: [
            "Sound effects are sourced from the websites below. If you think I have violated your copyright, please contact me and I will remove the offending sound effect.",
        ],
        credits: [
            {
                name: "Freesound.org",
                role: "Assorted sound effects",
                license: "No license",
                url: "https://freesound.org/",
            },
            {
                name: "QuickSounds.com",
                role: "Assorted sound effects",
                license: "QuickSounds.com terms (attribution required)",
                url: "https://quicksounds.com/",
            },
            {
                name: "Mixkit",
                role: "Assorted sound effects",
                license: "Mixkit License",
                url: "https://mixkit.co/license/#sfxFree",
            },
            {
                name: "BBC Sound Effects",
                role: "Assorted sound effects, especially London bus and Underground",
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
