export type Color = "red" | "blue" | "green" | "yellow" | "purple" | "mrX";

export const COLOR_TO_BOARD_DISPLAY: Record<Color, string> = {
  ["red"]: "R",
  ["blue"]: "B",
  ["green"]: "G",
  ["yellow"]: "Y",
  ["purple"]: "P",
  ["mrX"]: "X",
};


export const COLOR_TO_BACKGROUND_COLOR: Record<Color, string> = {
    "red": "rgba(255, 0, 0, 0.5)",
    "blue": "rgba(0, 0, 255, 0.5)",
    "green": "rgba(0, 255, 0, 0.5)",
    "yellow": "rgba(255, 255, 0, 0.5)",
    "purple": "rgba(255, 0, 255, 0.5)",
    "mrX": "white",
};

export type Ticket = "taxi" | "bus" | "underground" | "black" | "double";
export type GameOver = {
  winner: "detective" | "mrX";
};