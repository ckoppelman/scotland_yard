import type { Ticket } from "../../constants";
import type { CurrentTurn, GameState, PlayerState, TurnState } from "../../game/gameState";
import type { ResolvedMapLayout } from "../../game/mapLayoutTypes";
import {
    type LegacyRef,
    type MouseEvent,
    type PointerEvent,
    type ReactNode,
} from "react";
import { pixelCoords } from "./mapLayout";
import { PlayerMarker } from "./PlayerMarker";
import { PendingTicketPopup } from "./PendingTicketPopup";
import { effectiveTokenStation, stackDxForPlayer } from "./mapLayout";

type BoardBackgroundRect = {
    x: number;
    y: number;
    width: number;
    height: number;
    preserveAspectRatio: string;
};

type MarkerDragBindings = {
    onPointerDown: (e: PointerEvent<SVGGElement>) => void;
    onPointerMove: (e: PointerEvent<SVGGElement>) => void;
    onPointerUp: (e: PointerEvent<SVGGElement>) => void;
    onPointerCancel: (e: PointerEvent<SVGGElement>) => void;
};

type Props = {
    mapAreaRef: LegacyRef<HTMLDivElement>;
    svgRef: LegacyRef<SVGSVGElement>;
    layoutW: number;
    layoutH: number;
    mapLayout: ResolvedMapLayout;
    mapZoom: number;
    viewBox: string;
    frameTx: number;
    frameTy: number;
    boardBackgroundRect: BoardBackgroundRect | null;
    mapConnectionElements: ReactNode;
    mapBoardNodeElements: ReactNode;
    onMapPointerDown: (e: PointerEvent<SVGSVGElement>) => void;
    onMapPointerMove: (e: PointerEvent<SVGSVGElement>) => void;
    onMapPointerUp: (e: PointerEvent<SVGSVGElement>) => void;
    endMapDrag: () => void;
    onMapClickCapture: (e: MouseEvent<SVGSVGElement>) => void;
    zoomOut: () => void;
    zoomIn: () => void;
    resetMapView: () => void;
    /** Players with positions, sorted for draw order */
    markersRenderOrder: PlayerState[];
    state: GameState;
    turns: TurnState[];
    currentTurn: CurrentTurn;
    activePlayer: PlayerState;
    nodePixelPositions: ReadonlyMap<number, { x: number; y: number }>;
    pendingMoveNode: number | null;
    pendingTicketAnchor: { x: number; y: number } | null;
    pendingValidTickets: Ticket[] | null;
    onTicketClick: (ticket: Ticket) => void;
    onCancelPendingMove: () => void;
    activeMarkerDragBindings: MarkerDragBindings | undefined;
    tokenDragging: boolean;
    tokenDragVisual: { x: number; y: number };
    markerBoardPulseKeyById: Record<string, number>;
};

/**
 * Zoom toolbar + SVG map (background, edges, stations, pawns) + ticket popup after drag.
 * All the messy pointer math stays in GameBoard; this file is mostly layout markup.
 */
export function GameMapSection({
    mapAreaRef,
    svgRef,
    layoutW,
    layoutH,
    mapLayout,
    mapZoom,
    viewBox,
    frameTx,
    frameTy,
    boardBackgroundRect,
    mapConnectionElements,
    mapBoardNodeElements,
    onMapPointerDown,
    onMapPointerMove,
    onMapPointerUp,
    endMapDrag,
    onMapClickCapture,
    zoomOut,
    zoomIn,
    resetMapView,
    markersRenderOrder,
    state,
    turns,
    currentTurn,
    activePlayer,
    nodePixelPositions,
    pendingMoveNode,
    pendingTicketAnchor,
    pendingValidTickets,
    onTicketClick,
    onCancelPendingMove,
    activeMarkerDragBindings,
    tokenDragging,
    tokenDragVisual,
    markerBoardPulseKeyById,
}: Props) {
    return (
        <div ref={mapAreaRef} className="game-layout__map">
            <section className="panel panel--map" aria-label="Game map">
                <div className="board-map-toolbar" role="toolbar" aria-label="Map zoom">
                    <button type="button" className="board-zoom-btn" onClick={zoomOut} aria-label="Zoom out">
                        −
                    </button>
                    <span className="board-map-toolbar__zoom" aria-live="polite">
                        {Math.round(mapZoom * 100)}%
                    </span>
                    <button type="button" className="board-zoom-btn" onClick={zoomIn} aria-label="Zoom in">
                        +
                    </button>
                    <button type="button" className="board-zoom-btn board-zoom-btn--text" onClick={resetMapView}>
                        Reset
                    </button>
                    <span className="board-map-toolbar__hint">+/− to zoom · scroll to pan map · drag when zoomed</span>
                </div>
                <div
                    className="board-wrap"
                    style={{
                        width: `${layoutW}px`,
                        height: `${layoutH}px`,
                        maxWidth: "100%",
                    }}
                >
                    <svg
                        ref={svgRef}
                        className={`board-svg${mapZoom > 1 ? " board-svg--pannable" : ""}${mapLayout.boardImage === null ? " board-svg--no-board-image" : ""}`}
                        width={layoutW}
                        height={layoutH}
                        viewBox={viewBox}
                        onPointerDown={onMapPointerDown}
                        onPointerMove={onMapPointerMove}
                        onPointerUp={onMapPointerUp}
                        onPointerCancel={onMapPointerUp}
                        onLostPointerCapture={endMapDrag}
                        onClickCapture={onMapClickCapture}
                    >
                        <g transform={`translate(${frameTx}, ${frameTy})`}>
                            {boardBackgroundRect !== null && mapLayout.boardImage !== null && (
                                <image
                                    href={mapLayout.boardImage.href}
                                    x={boardBackgroundRect.x}
                                    y={boardBackgroundRect.y}
                                    width={boardBackgroundRect.width}
                                    height={boardBackgroundRect.height}
                                    preserveAspectRatio={boardBackgroundRect.preserveAspectRatio}
                                    aria-hidden
                                />
                            )}
                            {mapConnectionElements}
                            {mapBoardNodeElements}
                            {markersRenderOrder.map((player) => {
                                const isActive = player.description.order === activePlayer.description.order;
                                const shouldShowMrX = turns[currentTurn.turnNumber - 1]?.showMrX ?? false;
                                if (
                                    state.gameover === null &&
                                    !player.description.isDetective &&
                                    !shouldShowMrX &&
                                    activePlayer.description.isDetective
                                ) {
                                    return null;
                                }
                                const tokenStation =
                                    effectiveTokenStation(player, activePlayer, pendingMoveNode) ?? player.position!;
                                return (
                                    <PlayerMarker
                                        key={player.description.id}
                                        player={player}
                                        stationId={tokenStation}
                                        stackDx={stackDxForPlayer(state.players, player, activePlayer, pendingMoveNode)}
                                        coords={pixelCoords(nodePixelPositions, tokenStation)}
                                        dragBindings={isActive ? activeMarkerDragBindings : undefined}
                                        dragNudge={isActive && tokenDragging ? tokenDragVisual : undefined}
                                        isDragging={isActive && tokenDragging}
                                        isActiveTurn={isActive}
                                        boardPulseKey={markerBoardPulseKeyById[player.description.id] ?? 0}
                                    />
                                );
                            })}
                        </g>
                    </svg>
                </div>
                {pendingMoveNode !== null &&
                    pendingTicketAnchor !== null &&
                    pendingValidTickets !== null &&
                    pendingValidTickets.length > 0 && (
                        <PendingTicketPopup
                            anchor={pendingTicketAnchor}
                            destinationNode={pendingMoveNode}
                            tickets={pendingValidTickets}
                            ticketBalances={activePlayer.tickets}
                            onPick={onTicketClick}
                            onCancel={onCancelPendingMove}
                        />
                    )}
            </section>
        </div>
    );
}
