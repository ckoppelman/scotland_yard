import type { Ticket } from "../constants";

export const STROKE_WIDTH = 2;

export const CONNECTION_TO_COLOR_AND_OFFSET: Record<Ticket, { color: string; offset: number }> = {
    taxi: { color: "#f5cc00", offset: -STROKE_WIDTH / 2 },
    bus: { color: "#22a838", offset: STROKE_WIDTH },
    underground: { color: "#e85db0", offset: STROKE_WIDTH * 2 },
    black: { color: "#0a0a0a", offset: STROKE_WIDTH * 3 },
    double: { color: "#c45c26", offset: 0 },
};

export const GRID_TO_PX = 30;
export const PX_PAD = 5;

/** Space around the map so player tokens (which extend past node centers) are not clipped. */
export const MAP_GUTTER = 0;

export const MIN_MAP_ZOOM = 0.6;
export const MAX_MAP_ZOOM = 3.5;
export const MAP_ZOOM_STEP = 1.18;

/** Neutral map view before privacy modals so pan/zoom doesn’t leak between teams. */
export const PRIVACY_MODAL_MAP_ZOOM = 1;
export const PRIVACY_MODAL_MAP_PAN: { x: number; y: number } = { x: 0, y: 0 };

/** Intro modal: official publisher site (Scotland Yard and related games). */
export const RAVENSBURGER_HOME_URL = "https://www.ravensburger.com/en-US";

/** Copyright year in the intro footer. */
export const APP_COPYRIGHT_YEAR = 2026;

/** Rough radius around a station center for drop hit-testing (SVG units). */
export const NODE_DROP_HIT_R = 15;

/** Horizontal spread when multiple pieces share a station. */
export const TOKEN_STACK_SPREAD = 15;

/** Pawn art on sidebar cards (smaller than map markers; fits 48×48 viewBox). */
export const CARD_ICON_DETECTIVE_SCALE = 0.085;
export const CARD_ICON_MRX_SCALE = 0.115;

/** Transport types that define station coloring (black/double are Mr X moves, not station class). */
export const STATION_TICKETS: readonly Ticket[] = ["taxi", "bus", "underground"];

/**
 * Classic board: shallow caps + wider middle bar.
 * Caps: circular segment with sagitta ≈ 2/3 of a same-width semicircle’s rise (gentle dome, not a half-circle).
 */
export const STATION_CAP_HALF_W = 11;
/** Sagitta / depth of each cap (bulge from chord to apex). ~⅓ of full semicircle height for this half-width. */
export const STATION_CAP_SAGITTA = STATION_CAP_HALF_W * 2 / 3;
export const STATION_MID_W = 28;
export const STATION_MID_H = 18;

/** Furthest a parallel-offset edge sits from its node center. */
export const MAP_EDGE_OFFSET_MAX =
    Math.max(...Object.values(CONNECTION_TO_COLOR_AND_OFFSET).map((o) => Math.abs(o.offset))) + STROKE_WIDTH / 2;

/**
 * Padding beyond outermost node centers: station art, edge stack, horizontal pawn spread, pawn art + station label.
 */
export const MAP_CONTENT_HALO_X = STATION_MID_W / 2 + MAP_EDGE_OFFSET_MAX + TOKEN_STACK_SPREAD * 1.5;
export const MAP_CONTENT_HALO_Y_TOP = STATION_MID_H / 2 + STATION_CAP_SAGITTA + STROKE_WIDTH + 28;
export const MAP_CONTENT_HALO_Y_BOT = STATION_MID_H / 2 + STATION_CAP_SAGITTA + STROKE_WIDTH + 52;
