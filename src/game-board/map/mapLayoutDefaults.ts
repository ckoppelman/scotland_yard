import {
    GRID_TO_PX,
    MAP_CONTENT_HALO_X,
    MAP_CONTENT_HALO_Y_BOT,
    MAP_CONTENT_HALO_Y_TOP,
    MAP_GUTTER,
    PX_PAD,
} from "../constants";

/**
 * Default map layout when YAML omits `layout` (grid-unit maps: demo, interesting, map-200).
 * For hand-tuned alignment, override in YAML `layout` or see `CLASSIC_BOARD_IMAGE_DEFAULT`.
 */
export const DEFAULT_GRID_MAP_LAYOUT = {
    positionScale: GRID_TO_PX,
    positionOffset: { x: PX_PAD, y: PX_PAD },
    contentHalo: {
        left: MAP_CONTENT_HALO_X,
        right: MAP_CONTENT_HALO_X,
        top: MAP_CONTENT_HALO_Y_TOP,
        bottom: MAP_CONTENT_HALO_Y_BOT,
    },
    gutter: MAP_GUTTER,
} as const;

/** Intrinsic size of `public/map-board.png` (update if you replace the asset). */
export const CLASSIC_BOARD_IMAGE_DEFAULT = {
    href: "/map-board.png",
    x: 0,
    y: 0,
    width: 1085,
    height: 813,
    /** Stretch raster to width×height so it shares the same box as node coords (avoids meet/slice drift). */
    preserveAspectRatio: "none",
} as const;
