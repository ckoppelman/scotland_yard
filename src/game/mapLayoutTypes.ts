/**
 * Optional YAML `layout` for a map graph. All coordinates are in the same space after
 * `positionScale` / `positionOffset` are applied to node positions from YAML.
 */
export type MapLayoutYaml = {
    /** Multiply each node’s YAML `position.x` / `position.y` (default: GRID_TO_PX, or 1 for “already SVG”). */
    positionScale?: number;
    /** When set, overrides `positionScale` for X only (calibration vs board art). */
    positionScaleX?: number;
    /** When set, overrides `positionScale` for Y only. */
    positionScaleY?: number;
    positionOffset?: { x: number; y: number };
    /** Extra space around content for tokens and edges (per side). */
    contentHalo?: { left?: number; right?: number; top?: number; bottom?: number };
    /** Space between the cropped map and the SVG viewBox edge. */
    gutter?: number;
    /**
     * Board artwork. Placed in the same coordinate system as scaled node positions.
     * Tweak `x`, `y`, `width`, `height` by hand until stations line up with the illustration.
     */
    boardImage?: MapLayoutBoardImageYaml | null;
};

export type MapLayoutBoardImageYaml = {
    href: string;
    x: number;
    y: number;
    width: number;
    height: number;
    /** SVG `preserveAspectRatio` (e.g. `xMidYMid meet`, `none`). */
    preserveAspectRatio?: string;
};

/** Fully merged layout used at render time. */
export type ResolvedMapLayout = {
    positionScale: number;
    positionScaleX: number;
    positionScaleY: number;
    positionOffset: { x: number; y: number };
    contentHalo: { left: number; right: number; top: number; bottom: number };
    gutter: number;
    boardImage: null | {
        href: string;
        x: number;
        y: number;
        width: number;
        height: number;
        preserveAspectRatio: string;
    };
};
