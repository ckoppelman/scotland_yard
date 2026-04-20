import { CLASSIC_BOARD_IMAGE_DEFAULT, DEFAULT_GRID_MAP_LAYOUT } from "../game-board/map/mapLayoutDefaults";
import type { MapGraph } from "./gameState";
import type { MapLayoutYaml, ResolvedMapLayout } from "./mapLayoutTypes";

function mergeHalo(override?: MapLayoutYaml["contentHalo"]): ResolvedMapLayout["contentHalo"] {
    const d = DEFAULT_GRID_MAP_LAYOUT.contentHalo;
    return {
        left: override?.left ?? d.left,
        right: override?.right ?? d.right,
        top: override?.top ?? d.top,
        bottom: override?.bottom ?? d.bottom,
    };
}

/**
 * Single place that turns YAML + legacy flags into one layout object.
 * Adjust classic alignment by editing `layout` in `map-graph-classic.yaml` or `CLASSIC_BOARD_IMAGE_DEFAULT`.
 */
export function resolveMapLayout(mapGraph: MapGraph): ResolvedMapLayout {
    const yaml = mapGraph.layout;

    let baseScale = yaml?.positionScale ?? DEFAULT_GRID_MAP_LAYOUT.positionScale;
    let positionOffset = yaml?.positionOffset ?? { ...DEFAULT_GRID_MAP_LAYOUT.positionOffset };

    if (yaml?.positionScale === undefined && mapGraph.positionsAreBoardPixels === true) {
        baseScale = 1;
        positionOffset = { x: 0, y: 0 };
    }

    const positionScaleX = yaml?.positionScaleX ?? baseScale;
    const positionScaleY = yaml?.positionScaleY ?? baseScale;

    const gutter = yaml?.gutter ?? DEFAULT_GRID_MAP_LAYOUT.gutter;
    const contentHalo = mergeHalo(yaml?.contentHalo);

    let boardImage: ResolvedMapLayout["boardImage"] = null;

    if (yaml?.boardImage !== undefined) {
        if (yaml.boardImage === null) {
            boardImage = null;
        } else {
            const b = yaml.boardImage;
            boardImage = {
                href: b.href,
                x: b.x,
                y: b.y,
                width: b.width,
                height: b.height,
                preserveAspectRatio: b.preserveAspectRatio ?? "xMidYMid meet",
            };
        }
    } else if (mapGraph.boardImageHref !== undefined) {
        boardImage = {
            href: mapGraph.boardImageHref,
            x: CLASSIC_BOARD_IMAGE_DEFAULT.x,
            y: CLASSIC_BOARD_IMAGE_DEFAULT.y,
            width: CLASSIC_BOARD_IMAGE_DEFAULT.width,
            height: CLASSIC_BOARD_IMAGE_DEFAULT.height,
            preserveAspectRatio: CLASSIC_BOARD_IMAGE_DEFAULT.preserveAspectRatio,
        };
    }

    return {
        positionScale: baseScale,
        positionScaleX,
        positionScaleY,
        positionOffset,
        contentHalo,
        gutter,
        boardImage,
    };
}
