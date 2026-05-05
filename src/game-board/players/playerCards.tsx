import { COLOR_TO_BORDER } from "../../constants";
import type { CurrentTurn, GameState, PlayerState, TurnLogEntry } from "../../game/gameState";
import { TurnPhase } from "../../game/gameState";
import { shouldShowMrX } from "../../game/displayLogic";
import { PlayerCardPawnIcon } from "./PlayerCardPawnIcon";


export function scrollToPlayerMarker(player: PlayerState) {
    const playerMarker = document.getElementById(`player-marker-${player.description.id}`);
    if (playerMarker) {
        playerMarker.scrollIntoView({ behavior: "smooth" });
    }
}

export function PlayerCard({
    player,
    currentTurn,
    variant = "roster",
    onAfterScrollToMarker,
}: {
    player: PlayerState;
    currentTurn: CurrentTurn;
    /** `control` is used when the card also appears in the control panel (separate DOM id). */
    variant?: "roster" | "control";
    /** Called after scrolling the board to this player’s token (e.g. pulse highlight). */
    onAfterScrollToMarker?: (player: PlayerState) => void;
}) {
    const isMyTurn = currentTurn.playerOrdinal === player.description.order;
    const idSuffix = variant === "control" ? "-control" : "";
    return (
        <article
            className={`player-card ${isMyTurn ? "my-turn" : ""}${variant === "control" ? " player-card--control-embed" : ""}`}
            style={{
                borderTop: `3px solid ${COLOR_TO_BORDER[player.description.color]}`,
            }}
            onClick={() => {
                scrollToPlayerMarker(player);
                onAfterScrollToMarker?.(player);
            }}
            id={`player-card-${player.description.id}${idSuffix}`}
        >
            <div className="player-card__head">
                <PlayerCardPawnIcon player={player} />
                <div className="player-card__head-text">
                    <h3 className="player-card__name">{player.description.name}</h3>
                    <p className="player-card__meta">Detective · {player.description.color}</p>
                </div>
            </div>
            <p className="player-card__station">
                Station {player.position === null ? "—" : player.position}
            </p>
            <dl className="player-card__tickets">
                <dt>Taxi</dt>
                <dd>{player.tickets.taxi}</dd>
                <dt>Bus</dt>
                <dd>{player.tickets.bus}</dd>
                <dt>Underground</dt>
                <dd>{player.tickets.underground}</dd>
            </dl>
        </article>
    );
}

export function MrXCard({
    state,
    player,
    variant = "roster",
    onAfterScrollToMarker,
}: {
    state: GameState;
    player: PlayerState;
    variant?: "roster" | "control";
    onAfterScrollToMarker?: (player: PlayerState) => void;
}) {
    const currentTurn = state.currentTurn;
    const showMrX = shouldShowMrX(state);
    const shouldShowPrivacy = state.currentTurn.phase === TurnPhase.PRIVACY_DETECTIVE || state.currentTurn.phase === TurnPhase.PRIVACY_FUGITIVE;
    const isMyTurn = currentTurn.playerOrdinal === player.description.order;

    return (
        <article
            className={`mr-x-card player-card ${isMyTurn ? "my-turn" : ""}${variant === "control" ? " player-card--control-embed" : ""}`}
            style={{
                borderTop: `3px solid ${COLOR_TO_BORDER[player.description.color]}`,
            }}
            onClick={
                (isMyTurn && !shouldShowPrivacy) || showMrX
                    ? () => {
                          scrollToPlayerMarker(player);
                          onAfterScrollToMarker?.(player);
                      }
                    : () => {}
            }
            id={variant === "control" ? `player-card-${player.description.id}-control` : undefined}
        >
            <div className="player-card__head">
                <PlayerCardPawnIcon player={player} />
                <div className="player-card__head-text">
                    <h3 className="player-card__name">{player.description.name}</h3>
                </div>
            </div>
            <p className="mr-x-card-position">
                Last seen: {(isMyTurn && !shouldShowPrivacy) || showMrX ? (player.position ?? "—") : "???"}
            </p>
            <div className="mr-x-card-tickets">
                <div className="mr-x-card-tickets__row">
                    <span>Taxi</span>
                    <span>{player.tickets.taxi}</span>
                </div>
                <div className="mr-x-card-tickets__row">
                    <span>Bus</span>
                    <span>{player.tickets.bus}</span>
                </div>
                <div className="mr-x-card-tickets__row">
                    <span>Underground</span>
                    <span>{player.tickets.underground}</span>
                </div>
                <div className="mr-x-card-tickets__row">
                    <span>Black</span>
                    <span>{player.tickets.black}</span>
                </div>
            </div>
        </article>
    );
}

export function MrXTurn({
    turnNumber,
    isShowMrXTurn,
    turnLogEntry,
    shouldShowMrXPosition,
    hasDoubleMovePart1,
    hasDoubleMovePart2,
}: {
    turnNumber: number;
    isShowMrXTurn: boolean;
    turnLogEntry: TurnLogEntry | null;
    shouldShowMrXPosition: boolean;
    /** From {@link TurnLogEntry.doubleMovePart} for this round (both can be set after a full double). */
    hasDoubleMovePart1: boolean;
    hasDoubleMovePart2: boolean;
}) {
    const showMrXPosition = shouldShowMrXPosition && isShowMrXTurn;

    const ticketClass = turnLogEntry?.ticket ? `${turnLogEntry.ticket}-ticket` : "no-ticket";
    const doubleOutlineClass = [
        hasDoubleMovePart1 ? "double-move-part-1" : "",
        hasDoubleMovePart2 ? "double-move-part-2" : "",
    ]
        .filter(Boolean)
        .join(" ");
    return (
        <div
            className={`mr-x-turn ${isShowMrXTurn ? "show-mr-x" : "hide-mr-x"} ${doubleOutlineClass}`.trim()}
        >
            <span className="mr-x-turn-number">{turnNumber + 1}</span>
            <span className={`mr-x-turn-ticket ${ticketClass}`}>{turnLogEntry?.ticket?.toUpperCase() ?? "—"}</span>
            <span className="mr-x-turn-position">{showMrXPosition ? (turnLogEntry?.position ?? "") : "???"}</span>
        </div>
    );
}

export function MrXBoard({ state, player }: { state: GameState; player: PlayerState }) {
    const { currentTurn, turnLog, turns } = state;
    /** Same round index can have two Mr. X moves (double); keep all legs for outline + last for display. */
    const mrXLogByRound = new Map<number, TurnLogEntry[]>();
    for (const entry of turnLog) {
        if (entry.ticket === null || entry.playerOrdinal !== player.description.order) continue;
        const list = mrXLogByRound.get(entry.turnNumber) ?? [];
        list.push(entry);
        mrXLogByRound.set(entry.turnNumber, list);
    }
    const shouldShowMrXPosition = shouldShowMrX(state);

    return (
        <div
            className="mr-x-board-wrap"
            key={`mr-x-board-${player.description.order}`}
            style={{
                borderTop: `3px solid ${COLOR_TO_BORDER[player.description.color]}`,
            }}
        >
            <div className="mr-x-board__header">
                <div className="mr-x-board__pawn-wrap" aria-hidden>
                    <PlayerCardPawnIcon player={player} />
                </div>
                <span className="mr-x-board__player-name">{player.description.name}</span>
            </div>
            <div className="mr-x-board">
                {turns.map((turn, roundIndex) => {
                    const entries = mrXLogByRound.get(roundIndex) ?? [];
                    const primary = entries[entries.length - 1] ?? null;
                    const hasDoubleMovePart1 = entries.some((e) => e.doubleMovePart === 1);
                    const hasDoubleMovePart2 = entries.some((e) => e.doubleMovePart === 2);
                    const isShowMrXTurn = turn.showMrX ?? false;
                    return (
                        <MrXTurn
                            key={`${roundIndex}-${player.description.order}`}
                            turnNumber={roundIndex}
                            isShowMrXTurn={isShowMrXTurn}
                            turnLogEntry={primary}
                            shouldShowMrXPosition={shouldShowMrXPosition}
                            hasDoubleMovePart1={hasDoubleMovePart1}
                            hasDoubleMovePart2={hasDoubleMovePart2}
                        />
                    );
                })}
            </div>
        </div>
    );
}
