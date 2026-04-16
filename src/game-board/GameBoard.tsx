import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type MouseEvent,
    type PointerEvent,
} from "react";
import { CONNECTION_TO_COLOR_AND_OFFSET, MAP_ZOOM_STEP, NODE_DROP_HIT_R } from "./constants";
import { BoardNode } from "./BoardNode";
import { ConnectionEdge } from "./ConnectionEdge";
import { ControlPanel } from "./ControlPanel";
import {
    buildNodePixelPositions,
    buildNodeStationBoardLook,
    clampMapPan,
    clampMapZoom,
    clientToSvgPoint,
    mapSvgFrame,
    parallelConnectionEndpoints,
    pixelCoords,
    sortedConnectionEndpoints,
    stackDxForPlayer,
} from "./mapLayout";
import { MrXBoard, MrXCard, PlayerCard } from "./playerCards";
import { PendingTicketPopup } from "./PendingTicketPopup";
import { PlayerMarker } from "./PlayerMarker";
import type { GameBoardProps } from "./types";

export function GameBoard({
    state,
    onTicketClick,
    onNodeClick,
    onReset,
    pendingMoveNode,
    pendingTicketAnchor,
    onCancelPendingMove,
    onPlayerDragToStation,
    pendingValidTickets,
}: GameBoardProps) {
    const { players, mapGraph, gameover, currentTurn, turns } = state;

    const nodePixelPositions = useMemo(() => buildNodePixelPositions(mapGraph), [mapGraph]);
    const nodeStationLook = useMemo(() => buildNodeStationBoardLook(mapGraph), [mapGraph]);

    const { width: contentW, height: contentH, frameTx, frameTy } = useMemo(
        () => mapSvgFrame(mapGraph, nodePixelPositions),
        [mapGraph, nodePixelPositions],
    );

    const [mapZoom, setMapZoom] = useState(1);
    const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
    const svgRef = useRef<SVGSVGElement | null>(null);
    const suppressClickRef = useRef(false);
    const dragRef = useRef<null | { startClient: { x: number; y: number }; startPan: { x: number; y: number } }>(
        null,
    );
    const panGestureRef = useRef(false);

    useEffect(() => {
        setMapZoom(1);
        setMapPan({ x: 0, y: 0 });
    }, [contentW, contentH]);

    const zoomAroundCenter = useCallback(
        (oldZoom: number, newZoom: number) => {
            const oldVbW = contentW / oldZoom;
            const oldVbH = contentH / oldZoom;
            const cx = mapPan.x + oldVbW / 2;
            const cy = mapPan.y + oldVbH / 2;
            const newVbW = contentW / newZoom;
            const newVbH = contentH / newZoom;
            return clampMapPan(
                { x: cx - newVbW / 2, y: cy - newVbH / 2 },
                newZoom,
                contentW,
                contentH,
            );
        },
        [contentW, contentH, mapPan.x, mapPan.y],
    );

    const zoomIn = useCallback(() => {
        setMapZoom((z) => {
            const newZ = clampMapZoom(z * MAP_ZOOM_STEP);
            if (newZ === z) return z;
            setMapPan(() => zoomAroundCenter(z, newZ));
            return newZ;
        });
    }, [zoomAroundCenter]);

    const zoomOut = useCallback(() => {
        setMapZoom((z) => {
            const newZ = clampMapZoom(z / MAP_ZOOM_STEP);
            if (newZ === z) return z;
            setMapPan(() => zoomAroundCenter(z, newZ));
            return newZ;
        });
    }, [zoomAroundCenter]);

    const resetMapView = useCallback(() => {
        setMapZoom(1);
        setMapPan({ x: 0, y: 0 });
    }, []);

    const findNodeAtSvgPoint = useCallback(
        (sx: number, sy: number): number | null => {
            let best: { id: number; d2: number } | null = null;
            for (const node of mapGraph.nodes) {
                const c = pixelCoords(nodePixelPositions, node.id);
                const nx = frameTx + c.x;
                const ny = frameTy + c.y;
                const dx = sx - nx;
                const dy = sy - ny;
                const d2 = dx * dx + dy * dy;
                if (d2 <= NODE_DROP_HIT_R * NODE_DROP_HIT_R && (!best || d2 < best.d2)) {
                    best = { id: node.id, d2 };
                }
            }
            return best?.id ?? null;
        },
        [mapGraph.nodes, nodePixelPositions, frameTx, frameTy],
    );

    const tokenDragRef = useRef<null | { startClient: { x: number; y: number } }>(null);
    const [tokenDragVisual, setTokenDragVisual] = useState({ x: 0, y: 0 });
    const [tokenDragging, setTokenDragging] = useState(false);

    const activeMarkerDragBindings = useMemo(() => {
        if (gameover || pendingMoveNode !== null || state.currentTurn.ticket !== null) return undefined;
        return {
            onPointerDown(e: PointerEvent<SVGGElement>) {
                e.stopPropagation();
                e.preventDefault();
                tokenDragRef.current = { startClient: { x: e.clientX, y: e.clientY } };
                setTokenDragging(true);
                setTokenDragVisual({ x: 0, y: 0 });
                try {
                    e.currentTarget.setPointerCapture(e.pointerId);
                } catch {
                    /* ignore */
                }
            },
            onPointerMove(e: PointerEvent<SVGGElement>) {
                if (!tokenDragRef.current) return;
                const svg = svgRef.current;
                if (!svg) return;
                const vbW = contentW / mapZoom;
                const scale = vbW / svg.clientWidth;
                const { startClient } = tokenDragRef.current;
                setTokenDragVisual({
                    x: (e.clientX - startClient.x) * scale,
                    y: (e.clientY - startClient.y) * scale,
                });
            },
            onPointerUp(e: PointerEvent<SVGGElement>) {
                const start = tokenDragRef.current?.startClient;
                tokenDragRef.current = null;
                setTokenDragging(false);
                setTokenDragVisual({ x: 0, y: 0 });
                try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                } catch {
                    /* ignore */
                }
                const svg = svgRef.current;
                if (!start || !svg) return;
                const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6;
                if (moved) suppressClickRef.current = true;
                if (!moved) return;
                const pt = clientToSvgPoint(svg, e.clientX, e.clientY);
                onPlayerDragToStation(findNodeAtSvgPoint(pt.x, pt.y), { x: e.clientX, y: e.clientY });
            },
            onPointerCancel(e: PointerEvent<SVGGElement>) {
                tokenDragRef.current = null;
                setTokenDragging(false);
                setTokenDragVisual({ x: 0, y: 0 });
                try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                } catch {
                    /* ignore */
                }
            },
        };
    }, [
        gameover,
        pendingMoveNode,
        state.currentTurn.ticket,
        contentW,
        mapZoom,
        findNodeAtSvgPoint,
        onPlayerDragToStation,
    ]);

    const markersRenderOrder = useMemo(() => {
        const ord = state.currentTurn.playerOrdinal;
        return [...state.players]
            .filter((p) => p.position !== null)
            .sort((a, b) => (a.description.order === ord ? 1 : 0) - (b.description.order === ord ? 1 : 0));
    }, [state.players, state.currentTurn.playerOrdinal]);

    const onMapPointerDown = useCallback(
        (e: PointerEvent<SVGSVGElement>) => {
            const panButton = e.button === 1;
            const leftPan = e.button === 0 && mapZoom > 1;
            if (!panButton && !leftPan) return;
            e.preventDefault();
            panGestureRef.current = false;
            dragRef.current = {
                startClient: { x: e.clientX, y: e.clientY },
                startPan: { ...mapPan },
            };
            try {
                e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
                /* ignore */
            }
        },
        [mapPan, mapZoom],
    );

    const onMapPointerMove = useCallback(
        (e: PointerEvent<SVGSVGElement>) => {
            const d = dragRef.current;
            if (!d) return;
            const dx = e.clientX - d.startClient.x;
            const dy = e.clientY - d.startClient.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 4) panGestureRef.current = true;
            if (!panGestureRef.current) return;
            const svg = svgRef.current;
            if (!svg) return;
            const vbW = contentW / mapZoom;
            const scale = vbW / svg.clientWidth;
            setMapPan(
                clampMapPan(
                    {
                        x: d.startPan.x - dx * scale,
                        y: d.startPan.y - dy * scale,
                    },
                    mapZoom,
                    contentW,
                    contentH,
                ),
            );
        },
        [contentW, contentH, mapZoom],
    );

    const endMapDrag = useCallback(() => {
        if (panGestureRef.current) suppressClickRef.current = true;
        dragRef.current = null;
        panGestureRef.current = false;
    }, []);

    const onMapPointerUp = useCallback(
        (e: PointerEvent<SVGSVGElement>) => {
            endMapDrag();
            try {
                e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
                /* ignore */
            }
        },
        [endMapDrag],
    );

    const onMapClickCapture = useCallback((e: MouseEvent<SVGSVGElement>) => {
        if (suppressClickRef.current) {
            suppressClickRef.current = false;
            e.preventDefault();
            e.stopPropagation();
        }
    }, []);

    const viewBoxW = contentW / mapZoom;
    const viewBoxH = contentH / mapZoom;
    const viewBox = `${mapPan.x} ${mapPan.y} ${viewBoxW} ${viewBoxH}`;

    let status: string;
    if (gameover) {
        status = `Case closed — ${gameover.winner === "detective" ? "the detectives" : "Mr. X"} wins.`;
    } else {
        status = `${players[state.currentTurn.playerOrdinal].description.name}'s turn.`;
        if (turns[currentTurn.turnNumber]?.showMrX ?? false) {
            status += " Mr. X’s station will be revealed this round.";
        } else if (turns[currentTurn.turnNumber - 1]?.showMrX ?? false) {
            status += " Mr. X’s station is revealed!";
        }
    }

    return (
        <div className="game-layout">
            <p className={`game-status ${gameover ? "game-status--over" : ""}`}>{status}</p>

            <div className="game-panels">
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
                            width: `${contentW}px`,
                            height: `${contentH}px`,
                        }}
                    >
                        <svg
                            ref={svgRef}
                            className={`board-svg${mapZoom > 1 ? " board-svg--pannable" : ""}`}
                            width={contentW}
                            height={contentH}
                            viewBox={viewBox}
                            style={{ minWidth: "100%" }}
                            onPointerDown={onMapPointerDown}
                            onPointerMove={onMapPointerMove}
                            onPointerUp={onMapPointerUp}
                            onPointerCancel={onMapPointerUp}
                            onLostPointerCapture={endMapDrag}
                            onClickCapture={onMapClickCapture}
                        >
                            <g transform={`translate(${frameTx}, ${frameTy})`}>
                                {mapGraph.connections.map((connection) => {
                                    const [a, b] = sortedConnectionEndpoints(connection.nodes);
                                    const style = CONNECTION_TO_COLOR_AND_OFFSET[connection.ticket];
                                    const p1 = pixelCoords(nodePixelPositions, a);
                                    const p2 = pixelCoords(nodePixelPositions, b);
                                    const line = parallelConnectionEndpoints(p1, p2, style.offset);
                                    return (
                                        <ConnectionEdge
                                            key={`${a}-${b}-${connection.ticket}`}
                                            x1={line.x1}
                                            y1={line.y1}
                                            x2={line.x2}
                                            y2={line.y2}
                                            stroke={style.color}
                                        />
                                    );
                                })}
                                {mapGraph.nodes.map((node) => (
                                    <BoardNode
                                        key={`node-${node.id}`}
                                        nodeId={node.id}
                                        coords={pixelCoords(nodePixelPositions, node.id)}
                                        stationLook={nodeStationLook.get(node.id)!}
                                        onNodeClick={onNodeClick}
                                    />
                                ))}
                                {markersRenderOrder.map((player) => {
                                    const activePlayer = state.players[state.currentTurn.playerOrdinal];
                                    const isActive = player.description.order === activePlayer.description.order;
                                    const shouldShowMrX = turns[currentTurn.turnNumber - 1]?.showMrX ?? false;
                                    if (state.gameover === null &&
                                        !player.description.isDetective &&
                                        !shouldShowMrX &&
                                        activePlayer.description.isDetective) {
                                        return null;
                                    }
                                    return (
                                        <PlayerMarker
                                            key={player.description.id}
                                            player={player}
                                            stationId={player.position!}
                                            stackDx={stackDxForPlayer(state.players, player)}
                                            coords={pixelCoords(nodePixelPositions, player.position!)}
                                            dragBindings={isActive ? activeMarkerDragBindings : undefined}
                                            dragNudge={isActive && tokenDragging ? tokenDragVisual : undefined}
                                            isDragging={isActive && tokenDragging}
                                            isActiveTurn={isActive}
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
                                onPick={onTicketClick}
                                onCancel={onCancelPendingMove}
                            />
                        )}
                </section>

                <aside className="panel panel--sidebar">
                    <ControlPanel
                        players={players}
                        currentTurn={state.currentTurn}
                        onClick={onTicketClick}
                        gameover={!!gameover}
                        pendingDestinationNode={pendingMoveNode}
                        pendingValidTickets={pendingValidTickets}
                        onCancelPendingMove={onCancelPendingMove}
                        ticketSelectionInMapPopup={pendingMoveNode !== null && pendingTicketAnchor !== null}
                    />

                    <div>
                        <p className="mrx-section__label">Mr. X round log</p>
                        {state.players.map((player) =>
                            player.description.isDetective ? null : (
                                <MrXBoard key={player.description.id} state={state} player={player} />
                            ),
                        )}
                    </div>

                    <div className="player-roster">
                        <p className="player-roster__label">Players</p>
                        <div className="player-roster__grid">
                            {state.players.map((player) =>
                                player.description.isDetective ? (
                                    <PlayerCard
                                        key={player.description.id}
                                        player={player}
                                        currentTurn={currentTurn}
                                    />
                                ) : (
                                    <MrXCard key={player.description.id} state={state} player={player} />
                                ),
                            )}
                        </div>
                    </div>

                    <div className="toolbar">
                        <button type="button" className="btn-secondary" onClick={onReset}>
                            New game
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
}
