import { useMemo, useState } from "react";
import { ScotlandYardBoard } from "./ScotlandYardBoard";
import { initialState as initialScotlandYardState, ScotlandYardState } from "./game/scotlandYard";
import { Ticket } from "./constants";
import { getTicketsBetweenNodes, tryPlayMoveToAdjacent, tryPlayNode, tryPlayTicket } from "./game/scotlandYardRules";
import { useToast } from "./toast";

export default function App() {
  const { showToast } = useToast();
  const [state, setState] = useState<ScotlandYardState>(() => initialScotlandYardState());
  const [pendingMoveNode, setPendingMoveNode] = useState<number | null>(null);
  /** Screen coords for the “which ticket?” popup after a drag-drop. */
  const [pendingTicketAnchor, setPendingTicketAnchor] = useState<{ x: number; y: number } | null>(null);

  const pendingValidTickets = useMemo(() => {
    if (pendingMoveNode === null) return null;
    const p = state.players[state.currentTurn.playerOrdinal];
    if (p.position === null) return [];
    return getTicketsBetweenNodes(state, p.position, pendingMoveNode).filter((t) => p.tickets[t] > 0);
  }, [pendingMoveNode, state]);

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
    const playable = getTicketsBetweenNodes(state, p.position, node).filter((t) => p.tickets[t] > 0);
    if (playable.length === 0) {
      showToast("Drop on an adjacent station you can reach with a ticket you still have.", "error");
      return;
    }
    setPendingMoveNode(node);
    if (clientDrop) setPendingTicketAnchor({ x: clientDrop.x, y: clientDrop.y });
  };

  return (
    <main className="app-shell">
      <h1 className="app-title">Scotland Yard</h1>
      <p className="app-tagline">
        Drag your pawn to an adjacent station, then pick a ticket — or choose a ticket and click the map.
      </p>
      <ScotlandYardBoard
        state={state}
        onTicketClick={handleTicketClick}
        onNodeClick={handleNodeClick}
        onReset={() => {
          setPendingMoveNode(null);
          setPendingTicketAnchor(null);
          setState(initialScotlandYardState());
        }}
        pendingMoveNode={pendingMoveNode}
        pendingTicketAnchor={pendingTicketAnchor}
        onCancelPendingMove={() => {
          setPendingMoveNode(null);
          setPendingTicketAnchor(null);
        }}
        onPlayerDragToStation={handlePlayerDragToStation}
        pendingValidTickets={pendingValidTickets}
      />
    </main>
  );
}
