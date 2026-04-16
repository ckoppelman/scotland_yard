import detectiveSvg from "./assets/detective-marker.svg?raw";
import { extractSvgPathDs } from "./svgPathDs";

const DETECTIVE_PATHS: readonly string[] = (() => {
    const paths = extractSvgPathDs(detectiveSvg);
    if (paths.length === 0) {
        console.error("detective-marker.svg: no <path> elements found");
    }
    return paths;
})();

const DEFAULT_DETECTIVE_SCALE = 0.11;

/** In viewBox units (~420); layered rim + halo so pawns read on red/green/yellow station art. */
const DETECTIVE_RIM_W = 18;
const DETECTIVE_RIM = "rgba(10, 8, 6, 0.88)";
const DETECTIVE_RIM_LIGHT = "rgba(255, 252, 246, 0.98)";
const DETECTIVE_RIM_BLOOM = "rgba(255, 255, 255, 0.45)";

/** Scaled detective silhouette from `detective-marker.svg` (viewBox 0 0 420 420), centered on the marker origin. */
export function DetectiveMarkerIcon({ fill, scale = DEFAULT_DETECTIVE_SCALE }: { fill: string; scale?: number }) {
    if (DETECTIVE_PATHS.length === 0) {
        return (
            <circle
                className="detective-marker-fallback"
                r={20}
                cx={0}
                cy={0}
                fill={fill}
                stroke={DETECTIVE_RIM_LIGHT}
                strokeWidth={3}
                paintOrder="stroke fill"
            />
        );
    }
    return (
        <g className="detective-marker-icon" transform={`scale(${scale}) translate(-210, -210)`} fill={fill}>
            {DETECTIVE_PATHS.map((d, i) => (
                <g key={i}>
                    <path
                        d={d}
                        fill="none"
                        stroke={DETECTIVE_RIM_BLOOM}
                        strokeWidth={DETECTIVE_RIM_W + 22}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />
                    <path
                        d={d}
                        fill="none"
                        stroke={DETECTIVE_RIM_LIGHT}
                        strokeWidth={DETECTIVE_RIM_W + 12}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />
                    <path
                        d={d}
                        fill="none"
                        stroke={DETECTIVE_RIM}
                        strokeWidth={DETECTIVE_RIM_W}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />
                    <path d={d} />
                </g>
            ))}
        </g>
    );
}
