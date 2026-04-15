import { Client } from "boardgame.io/client";
import { describe, expect, it } from "vitest";
import { BOT_PLAYER_ID, HUMAN_PLAYER_ID } from "../constants";
import {
  TicTacToe,
  getWinner,
  isDraw,
  legalClickCells,
  type TTTState,
} from "./ticTacToe";

function makeClient(playerID?: typeof HUMAN_PLAYER_ID | typeof BOT_PLAYER_ID) {
  return Client({
    game: TicTacToe,
    numPlayers: 2,
    ...(playerID !== undefined ? { playerID } : {}),
  });
}

function play(client: ReturnType<typeof makeClient>, pid: string, cell: number) {
  client.updatePlayerID(pid);
  client.moves.clickCell(cell);
}

describe("TicTacToe rules", () => {
  it("rejects overwriting a cell", () => {
    const client = makeClient(HUMAN_PLAYER_ID);
    client.start();
    play(client, HUMAN_PLAYER_ID, 0);
    play(client, BOT_PLAYER_ID, 1);
    play(client, HUMAN_PLAYER_ID, 0);
    const s = client.getState()!;
    expect(s.G.cells[0]).toBe(HUMAN_PLAYER_ID);
    expect(s.G.cells[1]).toBe(BOT_PLAYER_ID);
  });

  it("detects top-row win for player 0", () => {
    const client = makeClient(HUMAN_PLAYER_ID);
    client.start();
    play(client, HUMAN_PLAYER_ID, 0);
    play(client, BOT_PLAYER_ID, 3);
    play(client, HUMAN_PLAYER_ID, 1);
    play(client, BOT_PLAYER_ID, 4);
    play(client, HUMAN_PLAYER_ID, 2);
    const s = client.getState()!;
    expect(s.ctx.gameover).toEqual({ winner: HUMAN_PLAYER_ID });
    expect(getWinner(s.G.cells)).toBe(HUMAN_PLAYER_ID);
  });

  it("detects draw", () => {
    const client = makeClient(HUMAN_PLAYER_ID);
    client.start();
    // Cat's game pattern
    const seq: [string, number][] = [
      [HUMAN_PLAYER_ID, 0],
      [BOT_PLAYER_ID, 1],
      [HUMAN_PLAYER_ID, 2],
      [BOT_PLAYER_ID, 4],
      [HUMAN_PLAYER_ID, 3],
      [BOT_PLAYER_ID, 5],
      [HUMAN_PLAYER_ID, 7],
      [BOT_PLAYER_ID, 6],
      [HUMAN_PLAYER_ID, 8],
    ];
    for (const [pid, cell] of seq) {
      play(client, pid, cell);
    }
    const s = client.getState()!;
    expect(s.ctx.gameover).toEqual({ draw: true });
    expect(isDraw(s.G.cells)).toBe(true);
    expect(getWinner(s.G.cells)).toBeNull();
  });
});

describe("ai.enumerate vs legal cells", () => {
  it("lists exactly the empty cells as clickCell moves", () => {
    const client = makeClient(HUMAN_PLAYER_ID);
    client.start();
    play(client, HUMAN_PLAYER_ID, 4);
    const s = client.getState()!;
    const legal = legalClickCells(s.G as TTTState);
    const moves = TicTacToe.ai!.enumerate(s.G as TTTState, s.ctx, s.ctx.currentPlayer);
    expect(moves).toHaveLength(legal.length);
    const targets = moves.map((m) => {
      expect(m).toMatchObject({ move: "clickCell", args: expect.any(Array) });
      if ("move" in m && m.move === "clickCell" && m.args?.length) {
        return m.args[0] as number;
      }
      throw new Error("expected clickCell with args");
    });
    expect(new Set(targets)).toEqual(new Set(legal));
  });
});
