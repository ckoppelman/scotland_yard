import { useState } from "react";
import { ScotlandYardBoard } from "./ScotlandYardBoard";
import { initialState as initialScotlandYardState, ScotlandYardState } from "./game/scotlandYard";
import { Ticket } from "./constants";
import { tryPlayNode, tryPlayTicket } from "./game/scotlandYardRules";

export default function App() {
  const [state, setState] = useState<ScotlandYardState>(() => initialScotlandYardState());

  const handleTicketClick = (ticket: Ticket) => {
    setState((s) => tryPlayTicket(s, ticket) ?? s);
  };

  const handleNodeClick = (node: number) => {
    setState((s) => tryPlayNode(s, node) ?? s);
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
