import mrXSvg from "./assets/mr-x-marker.svg?raw";
import { extractSvgPathDs } from "./svgPathDs";

const MR_X_PATHS: readonly string[] = (() => {
    const paths = extractSvgPathDs(mrXSvg);
    if (paths.length === 0) {
        console.error("mr-x-marker.svg: no <path> elements found");
    }
    return paths;
})();

/** Default: ~same on-screen size as the detective silhouette on the map. */
const DEFAULT_MR_X_SCALE = 0.15;

/** Scaled face / bust icon for Mr. X (center of viewBox at origin). */
export function MrXMarkerIcon({ fill, scale = DEFAULT_MR_X_SCALE }: { fill: string; scale?: number }) {
    if (MR_X_PATHS.length === 0) {
        return <circle className="mr-x-marker-fallback" r={20} cx={0} cy={0} fill={fill} stroke="#fff" strokeWidth={2} />;
    }
    return (
        <g className="mr-x-marker-icon" transform={`scale(${scale}) translate(-256, -256)`} fill={fill}>
            {MR_X_PATHS.map((d, i) => (
                <path key={i} d={d} />
            ))}
        </g>
    );
}
