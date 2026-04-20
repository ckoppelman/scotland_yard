import type { Ticket } from "../../constants";
import type { GameState, PlayerState } from "../../game/gameState";
import { MrXBoard, MrXCard, PlayerCard } from "../players/playerCards";
import { ControlPanel } from "./ControlPanel";

type SidePanelId = "control" | "mrx" | "players" | null;

type Props = {
    sidePanel: SidePanelId;
    toggleSidePanel: (id: Exclude<SidePanelId, null>) => void;
    state: GameState;
    status: string;
    activePlayer: PlayerState;
    players: PlayerState[];
    bumpMarkerPulseFromPlayerCard: (player: PlayerState) => void;
    onTicketClick: (ticket: Ticket) => void;
    pendingMoveNode: number | null;
    pendingTicketAnchor: { x: number; y: number } | null;
    pendingValidTickets: Ticket[] | null;
    ticketPlayableFromCurrentNode: Record<Ticket, boolean>;
    onCancelPendingMove: () => void;
};

/** Tabs + sliding sheet: Control (tickets), Mr. X log, player roster. */
export function GameSideDock({
    sidePanel,
    toggleSidePanel,
    state,
    status,
    activePlayer,
    players,
    bumpMarkerPulseFromPlayerCard,
    onTicketClick,
    pendingMoveNode,
    pendingTicketAnchor,
    pendingValidTickets,
    ticketPlayableFromCurrentNode,
    onCancelPendingMove,
}: Props) {
    const { gameover, currentTurn } = state;

    return (
        <div className="side-dock">
            <div
                id="game-side-panel"
                className={`side-dock__sheet${sidePanel ? " side-dock__sheet--open" : ""}`}
                role="tabpanel"
                aria-hidden={sidePanel === null}
                aria-labelledby={sidePanel ? `side-tab-${sidePanel}` : undefined}
            >
                {sidePanel === "control" && (
                    <div className="side-dock__sheet-inner">
                        <p className={`game-status${gameover ? " game-status--over" : ""}`}>{status}</p>
                        <div className="control-panel__player-info">
                            <p className="control-panel__player-info-label">Player info</p>
                            {activePlayer.description.isDetective ? (
                                <PlayerCard
                                    player={activePlayer}
                                    currentTurn={currentTurn}
                                    variant="control"
                                    onAfterScrollToMarker={bumpMarkerPulseFromPlayerCard}
                                />
                            ) : (
                                <MrXCard
                                    state={state}
                                    player={activePlayer}
                                    variant="control"
                                    onAfterScrollToMarker={bumpMarkerPulseFromPlayerCard}
                                />
                            )}
                        </div>
                        <ControlPanel
                            players={players}
                            currentTurn={state.currentTurn}
                            onClick={onTicketClick}
                            gameover={!!gameover}
                            pendingDestinationNode={pendingMoveNode}
                            pendingValidTickets={pendingValidTickets}
                            ticketPlayableFromCurrentNode={ticketPlayableFromCurrentNode}
                            onCancelPendingMove={onCancelPendingMove}
                            ticketSelectionInMapPopup={pendingMoveNode !== null && pendingTicketAnchor !== null}
                        />
                    </div>
                )}
                {sidePanel === "mrx" && (
                    <div className="side-dock__sheet-inner">
                        <p className="mrx-section__label">Mr. X round log</p>
                        {state.players.map((player) =>
                            player.description.isDetective ? null : (
                                <MrXBoard key={player.description.id} state={state} player={player} />
                            ),
                        )}
                    </div>
                )}
                {sidePanel === "players" && (
                    <div className="side-dock__sheet-inner">
                        <div className="player-roster">
                            <p className="player-roster__label">Players</p>
                            <div className="player-roster__grid">
                                {state.players.map((player) =>
                                    player.description.isDetective ? (
                                        <PlayerCard
                                            key={player.description.id}
                                            player={player}
                                            currentTurn={currentTurn}
                                            onAfterScrollToMarker={bumpMarkerPulseFromPlayerCard}
                                        />
                                    ) : (
                                        <MrXCard
                                            key={player.description.id}
                                            state={state}
                                            player={player}
                                            onAfterScrollToMarker={bumpMarkerPulseFromPlayerCard}
                                        />
                                    ),
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <nav className="side-dock__tabs" role="tablist" aria-label="Game panels">
                <button
                    type="button"
                    id="side-tab-control"
                    className={`side-dock__tab${sidePanel === "control" ? " side-dock__tab--active" : ""}`}
                    role="tab"
                    aria-selected={sidePanel === "control"}
                    aria-controls="game-side-panel"
                    tabIndex={sidePanel !== null && sidePanel !== "control" ? -1 : 0}
                    onClick={() => toggleSidePanel("control")}
                >
                    Control
                </button>
                <button
                    type="button"
                    id="side-tab-mrx"
                    className={`side-dock__tab${sidePanel === "mrx" ? " side-dock__tab--active" : ""}`}
                    role="tab"
                    aria-selected={sidePanel === "mrx"}
                    aria-controls="game-side-panel"
                    tabIndex={sidePanel !== null && sidePanel !== "mrx" ? -1 : 0}
                    onClick={() => toggleSidePanel("mrx")}
                >
                    Mr&nbsp;X board
                </button>
                <button
                    type="button"
                    id="side-tab-players"
                    className={`side-dock__tab${sidePanel === "players" ? " side-dock__tab--active" : ""}`}
                    role="tab"
                    aria-selected={sidePanel === "players"}
                    aria-controls="game-side-panel"
                    tabIndex={sidePanel !== null && sidePanel !== "players" ? -1 : 0}
                    onClick={() => toggleSidePanel("players")}
                >
                    Players
                </button>
            </nav>
        </div>
    );
}
