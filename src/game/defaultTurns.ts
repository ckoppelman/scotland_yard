import { parse } from "yaml";
import type { TurnState } from "./scotlandYard";
import turnsYaml from "../../data/turns.yaml?raw";

type RawTurnsYaml = {
  turns: { showMrX: boolean }[];
};

function hydrateTurns(raw: RawTurnsYaml): TurnState[] {
  return raw.turns.map((t) => ({ showMrX: t.showMrX }));
}

export const defaultTurns: TurnState[] = hydrateTurns(
  parse(turnsYaml) as RawTurnsYaml,
);
