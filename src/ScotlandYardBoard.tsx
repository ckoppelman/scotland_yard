import { memo, useMemo } from "react";
import { Ticket } from "./constants";
import type { MapGraph, ScotlandYardState, PlayerState, CurrentTurn, TurnLogEntry, TurnState } from "./game/scotlandYard";
import { COLOR_TO_BACKGROUND_COLOR } from "./constants";

export type ScotlandYardBoardProps = {
    state: ScotlandYardState;
    onTicketClick: (ticket: Ticket) => void;
    onNodeClick: (node: number) => void;
    onReset: () => void;
};

const STROKE_WIDTH = 4;

const CONNECTION_TO_COLOR_AND_OFFSET: Record<Ticket, { color: string; offset: number }> = {
    taxi: { color: "yellow", offset: -STROKE_WIDTH / 2 },
    bus: { color: "green", offset: STROKE_WIDTH },
    underground: { color: "red", offset: STROKE_WIDTH * 2 },
    black: { color: "black", offset: STROKE_WIDTH * 3 },
    double: { color: "orange", offset: 0 },
};

const GRID_TO_PX = 90;
const PX_PAD = 15;

/** O(n) once per mapGraph; use Map for O(1) lookups when rendering edges and nodes. */
export function buildNodePixelPositions(mapGraph: MapGraph): ReadonlyMap<number, { x: number; y: number }> {
    const m = new Map<number, { x: number; y: number }>();
    for (const node of mapGraph.nodes) {
        m.set(node.id, {
            x: node.position.x * GRID_TO_PX + PX_PAD,
            y: node.position.y * GRID_TO_PX + PX_PAD,
        });
    }
    return m;
}

function pixelCoords(
    positions: ReadonlyMap<number, { x: number; y: number }>,
    nodeId: number,
): { x: number; y: number } {
    return positions.get(nodeId) ?? { x: -1000, y: -1000 };
}

function svgBounds(
    mapGraph: MapGraph,
    positions: ReadonlyMap<number, { x: number; y: number }>,
): { width: number; height: number } {
    let maxX = 0;
    let maxY = 0;
    for (const node of mapGraph.nodes) {
        const c = positions.get(node.id);
        if (c) {
            maxX = Math.max(maxX, c.x);
            maxY = Math.max(maxY, c.y);
        }
    }
    return { width: maxX, height: maxY };
}

function sortedConnectionEndpoints(nodes: Set<number>): [number, number] {
    const [a, b] = [...nodes].sort((x, y) => x - y);
    return [a, b];
}

type BoardNodeProps = {
    nodeId: number;
    coords: { x: number; y: number };
    onNodeClick: (node: number) => void;
};

function BoardNodeInner({ nodeId, coords, onNodeClick }: BoardNodeProps) {
    return (
        <g className="board-node">
            <circle
                cx={coords.x}
                cy={coords.y}
                r={15}
                fill="yellow"
                stroke="black"
                strokeWidth={1}
                onClick={() => onNodeClick(nodeId)}
                className="board-node-circle"
            />
            <text x={coords.x - 10} y={coords.y + 10} pointerEvents="none" className="board-node-text">
                {nodeId}
            </text>
        </g>
    );
}

export const BoardNode = memo(BoardNodeInner);

type ConnectionLineProps = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    stroke: string;
};

function ConnectionLineInner({ x1, y1, x2, y2, stroke }: ConnectionLineProps) {
    return (
        <line
            className="connection-line"
            pointerEvents="none"
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={stroke}
            strokeWidth={STROKE_WIDTH}
            strokeOpacity={1}
        />
    );
}

export const ConnectionLine = memo(ConnectionLineInner);

type PlayerMarkerProps = {
    player: PlayerState;
    coords: { x: number; y: number } | null;
};

function PlayerMarkerInner({ player, coords }: PlayerMarkerProps) {
    if (coords === null) return null;
    return (
        <g>
            <rect
                x={coords.x}
                y={coords.y}
                height={15}
                width={10}
                fill={COLOR_TO_BACKGROUND_COLOR[player.description.color]}
                opacity={0.8}
                stroke="black"
                strokeWidth={1}
                pointerEvents="none"
                className="player-marker"
            />
        </g>
    );
}

export const PlayerMarker = memo(PlayerMarkerInner);

export function PlayerCard({ player, currentTurn }: { player: PlayerState; currentTurn: CurrentTurn }) {
    const isMyTurn = currentTurn.playerOrdinal === player.description.order;
    return (
        <div
            className={`player-card ${isMyTurn ? "my-turn" : ""}`}
            style={{
                backgroundColor: COLOR_TO_BACKGROUND_COLOR[player.description.color],
            }}
        >
            <div>{player.description.name}</div>
            <div>{player.description.color}</div>
            <div>{player.position === null ? "Not placed" : player.position}</div>
            <div>
                <div>Taxi: {player.tickets.taxi}</div>
                <div>Bus: {player.tickets.bus}</div>
                <div>Underground: {player.tickets.underground}</div>
            </div>
        </div>
    );
}

export function MrXCard({ state, player }: { state: ScotlandYardState, player: PlayerState }) {
    const currentTurn = state.currentTurn;
    const shouldShowMrX = state.turns[currentTurn.turnNumber].showMrX;

    return (
        <div className="mr-x-card player-card">
            <div className="mr-x-card-name">{player.description.name}</div>
            <div className="mr-x-card-position">Position: {shouldShowMrX ? player.position : "???"}</div>
            <div className="mr-x-card-tickets">
                <div>Taxi: {player.tickets.taxi}</div>
                <div>Bus: {player.tickets.bus}</div>
                <div>Underground: {player.tickets.underground}</div>
                <div>Black: {player.tickets.black}</div>
                <div>Double: {player.tickets.double}</div>
            </div>
        </div>
    );
}

export function MrXTurn({ turnNumber, turn, turnLogEntry, isMyTurn }: { turnNumber: number, turn: TurnState, turnLogEntry: TurnLogEntry | null, isMyTurn: boolean }) {
    return (
        <div className={`mr-x-turn ${turn.showMrX ? "show-mr-x" : "hide-mr-x"}`} key={`mr-x-turn-${turnNumber}`}>
            <span className="mr-x-turn-number">{turnNumber}</span>
            <span className={`mr-x-turn-ticket ${turnLogEntry?.ticket ?? "no"}-ticket`}>{turnLogEntry?.ticket?.toUpperCase()}</span>
            <span className="mr-x-turn-position">{
                isMyTurn ? (turnLogEntry?.position ?? "") : "???"
            }</span>
        </div>
    );
}

export function MrXBoard({ state, player }: { state: ScotlandYardState, player: PlayerState }) {
    const { currentTurn, turnLog, turns } = state;
    let myTurnLogMap = new Map<number, TurnLogEntry>();
    for (const turnLogEntry of turnLog.filter((turnLogEntry) => turnLogEntry.ticket !== null && turnLogEntry.playerOrdinal === player.description.order)) {
        myTurnLogMap.set(turnLogEntry.turnNumber, turnLogEntry);
    }
    const isMyTurn = currentTurn.playerOrdinal === player.description.order;
    return (
        <div className="mr-x-board" key={`mr-x-board-${player.description.order}`}>
            {turns.map((turn, turnNumber) => (
                <MrXTurn key={`${turnNumber}-${player.description.order}`} turnNumber={turnNumber} turn={turn} turnLogEntry={myTurnLogMap.get(turnNumber) || null} isMyTurn={isMyTurn} />
            ))}
        </div>
    );
}

export function ControlPanel({
    players,
    currentTurn,
    onClick,
}: {
    players: PlayerState[];
    currentTurn: CurrentTurn;
    onClick: (ticket: Ticket) => void;
}) {
    const currentPlayer = players[currentTurn.playerOrdinal];

    return (
        <div>
            <button type="button" className="ticket-button" onClick={() => onClick("taxi")}>
                🚕 Use TAXI
            </button>
            <button type="button" className="ticket-button" onClick={() => onClick("bus")}>
                🚌 Use BUS
            </button>
            <button type="button" className="ticket-button" onClick={() => onClick("underground")}>
                🚇 Use UNDERGROUND
            </button>
            {!currentPlayer.description.isDetective && (
                <>
                    <button type="button" className="ticket-button" onClick={() => onClick("black")}>
                        ❓ Use BLACK TICKET
                    </button>
                    <button type="button" className="ticket-button" onClick={() => onClick("double")}>
                        🔄 Use DOUBLE
                    </button>
                </>
            )}

            {currentTurn.ticket && <div>Using {currentTurn.ticket}</div>}
        </div>
    );
}

export function ScotlandYardBoard({ state, onTicketClick, onNodeClick, onReset }: ScotlandYardBoardProps) {
    const { players, mapGraph, gameover, currentTurn, turns } = state;

    const nodePixelPositions = useMemo(() => buildNodePixelPositions(mapGraph), [mapGraph]);

    const { width, height } = useMemo(
        () => svgBounds(mapGraph, nodePixelPositions),
        [mapGraph, nodePixelPositions],
    );

    let status: string;
    if (gameover) {
        status = `Game over. Winner: ${gameover.winner === "detective" ? "Detectives" : "Mr. X"}.`;
    } else {
        status = `Player ${players[state.currentTurn.playerOrdinal].description.name}'s turn.`;
        if (turns[currentTurn.turnNumber].showMrX) {
            status += " (Mr. X is revealed).";
        }
    }

    return (
        <div>
            <p className="status">{status}</p>
            <ControlPanel players={players} currentTurn={state.currentTurn} onClick={onTicketClick} />
            {state.players.map((player) => player.description.isDetective ? null : <MrXBoard key={player.description.id} state={state} player={player} />)}
            <div className="board-wrap" style={{ width: `${width + 100}px`, height: `${height + 100}px` }}>
                <svg style={{ width: `${width + 100}px`, height: `${height + 100}px` }}>
                    {mapGraph.connections.map((connection) => {
                        const [a, b] = sortedConnectionEndpoints(connection.nodes);
                        const style = CONNECTION_TO_COLOR_AND_OFFSET[connection.ticket];
                        const p1 = pixelCoords(nodePixelPositions, a);
                        const p2 = pixelCoords(nodePixelPositions, b);
                        return (
                            <ConnectionLine
                                key={`${a}-${b}-${connection.ticket}`}
                                x1={p1.x + style.offset}
                                y1={p1.y + style.offset}
                                x2={p2.x + style.offset}
                                y2={p2.y + style.offset}
                                stroke={style.color}
                            />
                        );
                    })}
                    {mapGraph.nodes.map((node) => (
                        <BoardNode
                            key={`node-${node.id}`}
                            nodeId={node.id}
                            coords={pixelCoords(nodePixelPositions, node.id)}
                            onNodeClick={onNodeClick}
                        />
                    ))}
                    {state.players.map((player) => (
                        <PlayerMarker
                            key={player.description.id}
                            player={player}
                            coords={
                                player.position === null
                                    ? null
                                    : pixelCoords(nodePixelPositions, player.position)
                            }
                        />
                    ))}
                </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "row" }}>
                {state.players.map((player) => player.description.isDetective ? (
                    <PlayerCard key={player.description.id} player={player} currentTurn={currentTurn} />
                ) : (
                    <MrXCard key={player.description.id} state={state} player={player} />
                ))}
            </div>
            <div className="toolbar">
                <button type="button" onClick={onReset}>
                    Reset
                </button>
            </div>
        </div>
    );
}
