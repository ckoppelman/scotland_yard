import { parse } from "yaml";
import type { Ticket } from "../constants";
import type { MapConnection, MapGraph } from "./gameState";
import type { MapLayoutYaml } from "./mapLayoutTypes";
import demoMapGraphYaml from "../../data/map-graph.yaml?raw";
import interestingMapGraphYaml from "../../data/map-graph-interesting.yaml?raw";
import mapGraph200Yaml from "../../data/map-graph-200.yaml?raw";
import mapGraphClassicYaml from "../../data/map-graph-classic.yaml?raw";

const TICKETS: readonly Ticket[] = [
  "taxi",
  "bus",
  "underground",
  "black",
  "double",
];

function assertTicket(value: string | string[]): Ticket | Ticket[] {
  if (Array.isArray(value)) {
    return value.map((v) => {
      if (!TICKETS.includes(v as Ticket)) {
        throw new Error(`Invalid ticket in map graph YAML: ${v}`);
      }
      return v as Ticket;
    }) as Ticket[];
  }
  if (!TICKETS.includes(value as Ticket)) {
    throw new Error(`Invalid ticket in map graph YAML: ${value}`);
  }
  return value as Ticket;
}

type RawMapGraphYaml = {
  nodes: { id: number; position: { x: number; y: number } }[];
  connections: { between: number[]; ticket: string | string[] }[];
  startingPositions?: number[];
  layout?: MapLayoutYaml;
  positionsAreBoardPixels?: boolean;
  boardImageHref?: string;
};


function hydrateConnection(c: { between: number[]; ticket: string | string[] }): MapConnection[] {
  if (c.between.length !== 2) {
    throw new Error(
      `Each connection must list exactly two endpoints; got ${JSON.stringify(c.between)}`,
    );
  }
  const ticket = assertTicket(c.ticket);
  if (Array.isArray(ticket)) {
    return ticket.map((t) => hydrateConnection({ between: c.between, ticket: t }) as MapConnection[]).reduce((acc, curr) => acc.concat(curr), []);
  }
  return [{ nodes: new Set(c.between), ticket: ticket }];
}

function hydrateMapGraph(raw: RawMapGraphYaml): MapGraph {
  return {
    nodes: raw.nodes.map((n) => ({
      id: n.id,
      position: n.position,
    })),
    connections: raw.connections.map(hydrateConnection).reduce((acc, curr) => acc.concat(curr), [] as MapConnection[]),
    startingPositions: raw.startingPositions ?? raw.nodes.map((n) => n.id),
    layout: raw.layout,
    positionsAreBoardPixels: raw.positionsAreBoardPixels,
    boardImageHref: raw.boardImageHref,
  };
}

export const demoMapGraph: MapGraph = hydrateMapGraph(
  parse(demoMapGraphYaml) as RawMapGraphYaml,
);

export const interestingMapGraph: MapGraph = hydrateMapGraph(
  parse(interestingMapGraphYaml) as RawMapGraphYaml,
);

/** 200-node procedural “London board” layout (see scripts/generate-map-200.mjs). */
export const mapGraph200: MapGraph = hydrateMapGraph(parse(mapGraph200Yaml) as RawMapGraphYaml);

/** Official 199-station graph + board art (see scripts/build-classic-map-yaml.mjs). */
export const mapGraphClassic: MapGraph = hydrateMapGraph(parse(mapGraphClassicYaml) as RawMapGraphYaml);
