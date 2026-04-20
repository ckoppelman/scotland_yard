export type Color =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "mrX"
  | "mrY"
  | "mrZ";

export const COLOR_TO_BOARD_DISPLAY: Record<Color, string> = {
  ["red"]: "R",
  ["blue"]: "B",
  ["green"]: "G",
  ["yellow"]: "Y",
  ["purple"]: "P",
  ["mrX"]: "X",
  ["mrY"]: "y",
  ["mrZ"]: "z",
};


export const COLOR_TO_BACKGROUND_COLOR: Record<Color, string> = {
    "red": "rgba(255, 0, 0, 0.5)",
    "blue": "rgba(0, 0, 255, 0.5)",
    "green": "rgba(5, 150, 105, 0.45)",
    "yellow": "rgba(245, 158, 11, 0.5)",
    "purple": "rgba(255, 0, 255, 0.5)",
    "mrX": "rgba(23, 23, 23, 0.45)",
    "mrY": "rgba(120, 53, 15, 0.45)",
    "mrZ": "rgba(219, 39, 119, 0.4)",
};

/** Solid accent for player card borders and emphasis. */
export const COLOR_TO_BORDER: Record<Color, string> = {
    red: "#b91c1c",
    blue: "#1d4ed8",
    /** Brighter emerald so pawns don’t sink into the green/yellow station bands. */
    green: "#059669",
    /** Strong amber-gold (was muddy brown) for contrast on cream / sepia maps. */
    yellow: "#d97706",
    purple: "#a21caf",
    mrX: "#171717",
    mrY: "#78350f",
    mrZ: "#db2777",
};

export type Ticket = "taxi" | "bus" | "underground" | "black" | "double";
export type GameOver = {
  winner: "detective" | "mrX";
};