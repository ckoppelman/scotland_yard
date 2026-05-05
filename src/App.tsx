import { useEffect, useMemo, useState } from "react";
import { GameBoard } from "./game-board";
import { initialState, type GameState, type NewGameSettings } from "./game/gameState";
import { Ticket } from "./constants";
import {
  getPlayableTicketsBetweenNodes,
  passTurn,
  tryCancelDoubleMove,
  tryPlayDoubleMove,
  tryPlayMoveToAdjacent,
  tryPlayNode,
  tryPlayTicket,
  clearPrivacy,
} from "./game/gameRules";
import { DEFAULT_GAME_MAP_ID } from "./game/mapIds";
import { getMapGraph } from "./game/mapRegistry";
import { useToast } from "./toast";
import {
  clearPersistedGameState,
  loadPersistedGameState,
  saveGameState,
} from "./game/persistGameState";

export default function App() {
  const { showToast } = useToast();
  const [state, setState] = useState<GameState | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadPersistedGameState().then((loaded) => {
      if (cancelled) return;
      setState(loaded ?? initialState(DEFAULT_GAME_MAP_ID, getMapGraph(DEFAULT_GAME_MAP_ID), 2, 1));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state === null) return;
    void saveGameState(state);
  }, [state]);
  const [pendingMoveNode, setPendingMoveNode] = useState<number | null>(null);
  /** Screen coords for the “which ticket?” popup after a drag-drop. */
  const [pendingTicketAnchor, setPendingTicketAnchor] = useState<{ x: number; y: number } | null>(null);
  /** Mirrors game double-move intent for this drag popup (set when user commits 2x; cleared with pending move). */
  const [pendingDoubleMove, setPendingDoubleMove] = useState(false);

  const pendingValidTickets = useMemo(() => {
    if (state === null || pendingMoveNode === null) return null;
    const p = state.players[state.currentTurn.playerOrdinal];
    if (p.position === null) return [];
    return getPlayableTicketsBetweenNodes(state, p.position, pendingMoveNode);
  }, [pendingMoveNode, state]);

  if (state === null) {
    return <main className="app-shell app-shell--boot" aria-busy="true" />;
  }

  const handlePendingDoubleMove = () => {
    if (pendingMoveNode === null) return;
    const result = tryPlayDoubleMove(state);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setState(result.state);
    setPendingDoubleMove(true);
  };

  const handleTicketClick = (ticket: Ticket) => {
    if (pendingMoveNode !== null) {
      const result = tryPlayMoveToAdjacent(state, pendingMoveNode, ticket);
      if (!result.ok) {
        showToast(result.message, "error");
        return;
      }
      setState(result.state);
      setPendingMoveNode(null);
      setPendingTicketAnchor(null);
      setPendingDoubleMove(false);
      return;
    }
    const result = tryPlayTicket(state, ticket);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setState(result.state);
  };

  const handleNodeClick = (node: number) => {
    if (pendingMoveNode !== null) {
      showToast("Choose a ticket for your move, or cancel.", "error");
      return;
    }
    const result = tryPlayNode(state, node);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setState(result.state);
  };

  const handleDismissPrivacyModal = () => {
    const result = clearPrivacy(state);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setState(result.state);
  };

  const handlePassTurn = () => {
    const result = passTurn(state);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setState(result.state);
  };

  const handlePlayerDragToStation = (node: number | null, clientDrop?: { x: number; y: number }) => {
    if (node === null) return;
    const p = state.players[state.currentTurn.playerOrdinal];
    if (p.position === null) return;
    if (p.position === node) {
      showToast("That’s where you already are.", "error");
      return;
    }
    if (state.currentTurn.ticket !== null) {
      showToast("Finish or change your ticket selection first.", "error");
      return;
    }
    const playable = getPlayableTicketsBetweenNodes(state, p.position, node);
    if (playable.length === 0) {
      showToast("Drop on an adjacent station you can reach with a ticket you still have.", "error");
      return;
    }
    setPendingMoveNode(node);
    if (clientDrop) setPendingTicketAnchor({ x: clientDrop.x, y: clientDrop.y });
    if (state.currentTurn.doubleMovePart == null) {
      setPendingDoubleMove(false);
    }
  };

  return (
    <main className="app-shell">
      <GameBoard
        state={state}
        onTicketClick={handleTicketClick}
        onNodeClick={handleNodeClick}
        onReset={(settings?: NewGameSettings) => {
          setPendingMoveNode(null);
          setPendingTicketAnchor(null);
          setPendingDoubleMove(false);
          clearPersistedGameState();
          setState(
            settings !== undefined
              ? initialState(settings.mapId, getMapGraph(settings.mapId), settings.numDetectives, settings.numFugitives, {
                  detective: settings.detectiveTickets,
                  fugitive: settings.fugitiveTickets,
                })
              : initialState(DEFAULT_GAME_MAP_ID, getMapGraph(DEFAULT_GAME_MAP_ID), 2, 1),
          );
        }}
        pendingMoveNode={pendingMoveNode}
        pendingTicketAnchor={pendingTicketAnchor}
        pendingDoubleMove={pendingDoubleMove}
        onCancelPendingMove={() => {
          if (state.currentTurn.doubleMovePart === 1) {
            const undone = tryCancelDoubleMove(state);
            if (undone.ok) {
              setState(undone.state);
            }
          }
          setPendingMoveNode(null);
          setPendingTicketAnchor(null);
          setPendingDoubleMove(false);
        }}
        onPlayerDragToStation={handlePlayerDragToStation}
        pendingValidTickets={pendingValidTickets}
        onPendingDoubleMove={handlePendingDoubleMove}
        onDismissPrivacyModal={handleDismissPrivacyModal}
        onPassTurn={handlePassTurn}
      />
    </main>
  );
}
