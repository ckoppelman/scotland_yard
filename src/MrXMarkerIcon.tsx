import MrXMarkerSvg from "./assets/mr-x-marker-filled.svg?react";

/** Default: ~same on-screen size as the detective silhouette on the map. */
const DEFAULT_MR_X_SCALE = 0.10;

/**
 * Full Mr. X bust art from `mr-x-marker-filled.svg` (512×512, layered paths).
 * `color` drives `fill="currentColor"` regions; `.background-fill` stays controlled via CSS.
 */
export function MrXMarkerIcon({ fill, scale = DEFAULT_MR_X_SCALE }: { fill: string; scale?: number }) {
    return (
        <g className="mr-x-marker-icon" transform={`scale(${scale}) translate(-256, -256)`}>
            <MrXMarkerSvg width={512} height={512} style={{ color: fill }} aria-hidden />
        </g>
    );
}
