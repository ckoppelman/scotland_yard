import DetectiveMarkerSvg from "./assets/detective-marker.svg?react";

const DEFAULT_DETECTIVE_SCALE = 0.09;

/** Scaled detective silhouette from `detective-marker.svg` (viewBox 0 0 420 420), centered on the marker origin. */
export function DetectiveMarkerIcon({ fill, scale = DEFAULT_DETECTIVE_SCALE }: { fill: string; scale?: number }) {
    return (
        <g className="detective-marker-icon" transform={`scale(${scale}) translate(-210, -210)`}>
            <DetectiveMarkerSvg width={420} height={420} style={{ color: fill }} aria-hidden />
        </g>
    );
}
