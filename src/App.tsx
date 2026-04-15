import { RandomBot, Step } from "boardgame.io/ai";
import { useEffect, useMemo, useRef } from "react";
import { TicTacToeClient } from "./client";
import { BOT_PLAYER_ID } from "./constants";
import { TicTacToe } from "./game/ticTacToe";

export default function App() {
  const clientRef = useRef<InstanceType<typeof TicTacToeClient>>(null);
  const steppingRef = useRef(false);

  const bot = useMemo(
    () =>
      new RandomBot({
        enumerate: TicTacToe.ai!.enumerate,
      }),
    []
  );

  useEffect(() => {
    const impl = clientRef.current?.client;
    if (!impl) return;

    return impl.subscribe(() => {
      const state = impl.getState();
      if (!state?.ctx) return;
      if (state.ctx.gameover) return;
      if (state.ctx.currentPlayer !== BOT_PLAYER_ID) return;
      if (steppingRef.current) return;

      steppingRef.current = true;
      void Step({ store: impl.store }, bot).finally(() => {
        steppingRef.current = false;
      });
    });
  }, [bot]);

  return (
    <main>
      <h1>Tic-Tac-Toe</h1>
      <p className="status">
        You are <strong>X</strong> (player {0}). The bot is <strong>O</strong> (player{" "}
        {1}).
      </p>
      <TicTacToeClient ref={clientRef} />
    </main>
  );
}
