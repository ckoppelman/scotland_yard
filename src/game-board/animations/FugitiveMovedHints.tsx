import type { ReactNode } from "react";

type Hint = {
    id: string;
    name: string;
    stationId: number;
};

type Props = {
    hints: Hint[];
    variant: "reveal" | "hide";
    nodePixelPositions?: ReadonlyMap<number, { x: number; y: number }>;
    /** Map-space center for hide-turn overlay (no station positions leaked). */
    overlayCenter?: { x: number; y: number };
};

const LINE_HEIGHT = 18;
const PADDING_X = 16;
const PADDING_Y = 12;
const CHAR_WIDTH = 7.2;

function hideOverlaySize(lines: string[]): { width: number; height: number } {
    const longest = Math.max(...lines.map((line) => line.length));
    const width = Math.max(148, longest * CHAR_WIDTH + PADDING_X * 2);
    const height = lines.length * LINE_HEIGHT + PADDING_Y * 2;
    return { width, height };
}

function HideTurnOverlay({ hints, center }: { hints: Hint[]; center: { x: number; y: number } }) {
    const lines = hints.map((hint) => `${hint.name} has moved`);
    const { width, height } = hideOverlaySize(lines);
    const textStartY = -height / 2 + PADDING_Y + 11;

    return (
        <g
            className="fugitive-moved-hint fugitive-moved-hint--overlay"
            transform={`translate(${center.x}, ${center.y})`}
            pointerEvents="none"
        >
            <rect
                className="fugitive-moved-hint__bubble"
                x={-width / 2}
                y={-height / 2}
                width={width}
                height={height}
                rx={12}
            />
            <text className="fugitive-moved-hint__text" textAnchor="middle">
                {lines.map((line, index) => (
                    <tspan key={hints[index]!.id} x={0} y={textStartY + index * LINE_HEIGHT}>
                        {line}
                    </tspan>
                ))}
            </text>
        </g>
    );
}

export function FugitiveMovedHints({ hints, variant, nodePixelPositions, overlayCenter }: Props) {
    if (hints.length === 0) return null;

    if (variant === "hide") {
        if (overlayCenter === undefined) return null;
        return <HideTurnOverlay hints={hints} center={overlayCenter} />;
    }

    if (nodePixelPositions === undefined) return null;

    return (
        <>
            {hints.map((hint): ReactNode => {
                const coords = nodePixelPositions.get(hint.stationId);
                if (coords === undefined) return null;

                const label = `${hint.name} has moved`;
                const width = Math.max(108, label.length * CHAR_WIDTH + 24);

                return (
                    <g
                        key={hint.id}
                        className="fugitive-moved-hint fugitive-moved-hint--station"
                        transform={`translate(${coords.x}, ${coords.y - 62})`}
                        pointerEvents="none"
                    >
                        <rect
                            className="fugitive-moved-hint__bubble"
                            x={-width / 2}
                            y={-22}
                            width={width}
                            height={28}
                            rx={10}
                        />
                        <text className="fugitive-moved-hint__text" textAnchor="middle" y={-4}>
                            {label}
                        </text>
                    </g>
                );
            })}
        </>
    );
}
