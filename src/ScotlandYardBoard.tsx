import { Ticket } from "./constants";
import type { MapConnection, MapGraph, ScotlandYardState, PlayerState } from "./game/scotlandYard";
import { COLOR_TO_BACKGROUND_COLOR } from "./constants";

export type ScotlandYardBoardProps = {
    state: ScotlandYardState;
    onTicketClick: (ticket: Ticket) => void;
    onNodeClick: (node: number) => void;
    onReset: () => void;
};

function getNodeCoordinates(node_id: number, mapGraph: MapGraph) {
    const node = mapGraph.nodes.find((node) => node.id === node_id);
    if (!node) {
        return { x: -1000, y: -1000 };
    }
    return { x: node.position.x * 90 + 15, y: node.position.y * 90 + 15 };
}

export function BoardNode({ node_id, mapGraph }: { node_id: number, mapGraph: MapGraph }) {
    const nodeCoordinates = getNodeCoordinates(node_id, mapGraph);
    return (
        <g>
            <circle
                cx={nodeCoordinates.x}
                cy={nodeCoordinates.y}
                r={15}
                fill="yellow"
                stroke="black"
                strokeWidth={1}
            />
            <text x={nodeCoordinates.x - 10} y={nodeCoordinates.y + 10}>{node_id}</text>
        </g>
    );
}

export function ConnectionLine({ mapGraph, connection, connection_to_color_and_offset }: {
    mapGraph: MapGraph,
    connection: MapConnection,
    connection_to_color_and_offset: Record<Ticket, { color: string, offset: number }>
}) {
    const node1 = getNodeCoordinates(Array.from(connection.nodes)[0], mapGraph);
    const node2 = getNodeCoordinates(Array.from(connection.nodes)[1], mapGraph);

    return (
        <line
            x1={node1.x + connection_to_color_and_offset[connection.ticket].offset}
            y1={node1.y + connection_to_color_and_offset[connection.ticket].offset}
            x2={node2.x + connection_to_color_and_offset[connection.ticket].offset}
            y2={node2.y + connection_to_color_and_offset[connection.ticket].offset}
            stroke={connection_to_color_and_offset[connection.ticket].color}
            strokeWidth={2}
            strokeOpacity={0.5}
        />
    );
}

export function PlayerMarker({ player, mapGraph }: { player: PlayerState, mapGraph: MapGraph }) {
    if (player.position === null) return null;
    const nodeCoordinates = getNodeCoordinates(player.position, mapGraph);
    return (
        <g>
            <rect
                x={nodeCoordinates.x}
                y={nodeCoordinates.y}
                height={15}
                width={10}
                fill={COLOR_TO_BACKGROUND_COLOR[player.description.color]}
                opacity={0.8}
                stroke="black"
                strokeWidth={1}
            />
        </g>
    );
}

export function PlayerCard({ player }: { player: PlayerState }) {
    return (
        <div style={{ border: "1px solid black", padding: "10px", margin: "10px", backgroundColor: COLOR_TO_BACKGROUND_COLOR[player.description.color] }}>
            <div>{player.description.name}</div>
            <div>{player.description.color.toString()}</div>
            <div>{player.position?.toString()}</div>
            <div>
                <div>Taxi: {player.tickets.taxi}</div>
                <div>Bus: {player.tickets.bus}</div>
                <div>Underground: {player.tickets.underground}</div>
                {!player.description.isDetective && <>
                    <div>Black: {player.tickets.black}</div>
                    <div>Double: {player.tickets.double}</div>
                </>}
            </div>
        </div>
    );
}

export function ScotlandYardBoard({ state, onNodeClick, onReset }: ScotlandYardBoardProps) {
    const { players, mapGraph, gameover, currentTurn, turns } = state;

    const connection_to_color_and_offset: Record<Ticket, { color: string, offset: number }> = {
        "taxi": { color: "yellow", offset: 0 },
        "bus": { color: "green", offset: 2 },
        "underground": { color: "red", offset: 4 },
        "black": { color: "black", offset: 8 },
        "double": { color: "orange", offset: 0 },
    };


    let status: string;
    if (gameover) {
        status = `Game over. Winner: ${gameover.winner === "detective" ? "Detectives" : "Mr X"}.`;
    } else {
        status = `Player ${players[state.currentTurn.playerOrdinal].description.name}'s turn.`;
        if (turns[currentTurn.turnNumber].show_mr_x) {
            status += " (Mr X is revealed).";
        }
    }

    return (
    <div>
      <p className="status">{status}</p>
      <div className="board-wrap">
        <svg>
          {mapGraph.nodes.map((node) => (
            <BoardNode key={node.id} node_id={node.id} mapGraph={mapGraph} />
          ))}
          {mapGraph.connections.map((connection, index) => (
            <ConnectionLine key={index} mapGraph={mapGraph} connection={connection} connection_to_color_and_offset={connection_to_color_and_offset} />
          ))}
          {state.players.map((player) => (
            <PlayerMarker key={player.description.id} player={player} mapGraph={mapGraph} />
          ))}
        </svg>
      </div>
      <div style={{ display: "flex", flexDirection: "row" }}>
        {state.players.map((player) => (
            <PlayerCard key={player.description.id} player={player} />
        ))}
      </div>
      <div className="toolbar">
        <button type="button" onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
};