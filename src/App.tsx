import { useState } from "react";
import { ScotlandYardBoard } from "./ScotlandYardBoard";
import { initialState as initialScotlandYardState, ScotlandYardState } from "./game/scotlandYard";
import { Ticket } from "./constants";
import { tryPlayNode, tryPlayTicket } from "./game/scotlandYardRules";
import { useToast } from "./toast";

export default function App() {
  const { showToast } = useToast();
  const [state, setState] = useState<ScotlandYardState>(() => initialScotlandYardState());

  const handleTicketClick = (ticket: Ticket) => {
    const result = tryPlayTicket(state, ticket);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setState(result.state);
  };

  const handleNodeClick = (node: number) => {
    const result = tryPlayNode(state, node);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setState(result.state);
  };

  return (
    <main>
      <h1>Scotland Yard</h1>
      <ScotlandYardBoard
        state={state}
        onTicketClick={handleTicketClick}
        onNodeClick={handleNodeClick}
        onReset={() => setState(initialScotlandYardState())}
      />
    </main>
  );
}
