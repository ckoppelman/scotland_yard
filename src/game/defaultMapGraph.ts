import { parse } from "yaml";
import type { Ticket } from "../constants";
import type { MapGraph } from "./scotlandYard";
import demoMapGraphYaml from "../../data/map-graph.yaml?raw";
import interestingMapGraphYaml from "../../data/map-graph-interesting.yaml?raw";

const TICKETS: readonly Ticket[] = [
  "taxi",
  "bus",
  "underground",
  "black",
  "double",
];

function assertTicket(value: string): Ticket {
  if (!TICKETS.includes(value as Ticket)) {
    throw new Error(`Invalid ticket in map graph YAML: ${value}`);
  }
  return value as Ticket;
}

type RawMapGraphYaml = {
  nodes: { id: number; position: { x: number; y: number } }[];
  connections: { between: number[]; ticket: string }[];
};

function hydrateMapGraph(raw: RawMapGraphYaml): MapGraph {
  return {
    nodes: raw.nodes.map((n) => ({
      id: n.id,
      position: n.position,
    })),
    connections: raw.connections.map((c) => {
      if (c.between.length !== 2) {
        throw new Error(
          `Each connection must list exactly two endpoints; got ${JSON.stringify(c.between)}`,
        );
      }
      return {
        nodes: new Set(c.between),
        ticket: assertTicket(c.ticket),
      };
    }),
  };
}

export const demoMapGraph: MapGraph = hydrateMapGraph(
  parse(demoMapGraphYaml) as RawMapGraphYaml,
);

export const interestingMapGraph: MapGraph = hydrateMapGraph(
  parse(interestingMapGraphYaml) as RawMapGraphYaml,
);
