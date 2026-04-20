/**
 * Generates data/map-graph-200.yaml — 200 nodes in a Scotland Yard–style layout
 * (wide city mesh, curved Thames band, mixed transport). Run: node scripts/generate-map-200.mjs
 */
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../data/map-graph-200.yaml");

const N = 200;
const COLS = 20;
const ROWS = 10;

function mulberry32(seed) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const rand = mulberry32(0x736379); // "scy"

function dist2(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
}

function buildPositions() {
    const nodes = [];
    let id = 1;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const jx = (rand() - 0.5) * 2.4;
            const jy = (rand() - 0.5) * 2.4;
            let x = 4 + col * 5.65 + jx;
            let y = 4 + row * 7.1 + jy;
            // Slight “centre” pull (Westminster / City)
            const cx = 9.5;
            const cy = 4;
            const pull = 0.35;
            x += (cx - col) * pull * 0.15;
            y += (cy - row) * pull * 0.12;
            if (row === 8) {
                y = 58 + (rand() - 0.5) * 1.2;
                x += 0.028 * (col - 9.5) ** 2;
            } else if (row === 9) {
                y = 65 + (rand() - 0.5) * 1.2;
                x += 0.028 * (col - 9.5) ** 2;
            }
            nodes.push({
                id: id++,
                x: Math.round(x * 20) / 20,
                y: Math.round(y * 20) / 20,
                row,
                col,
            });
        }
    }
    return nodes;
}

function addEdge(set, a, b, ticket) {
    if (a === b) return;
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    set.add(`${lo}|${hi}|${ticket}`);
}

function edgesFromSet(set) {
    const out = [];
    for (const s of set) {
        const [lo, hi, ticket] = s.split("|");
        out.push({ a: +lo, b: +hi, ticket });
    }
    out.sort((u, v) => u.a - v.a || u.b - v.b || u.ticket.localeCompare(v.ticket));
    return out;
}

function kNearestTaxi(nodes, k) {
    const set = new Set();
    for (const n of nodes) {
        const others = nodes
            .filter((o) => o.id !== n.id)
            .map((o) => ({ o, d2: dist2(n, o) }))
            .sort((a, b) => a.d2 - b.d2)
            .slice(0, k);
        for (const { o } of others) {
            addEdge(set, n.id, o.id, "taxi");
        }
    }
    return set;
}

function busLayer(nodes, taxiSet) {
    const set = new Set();
    const medians = [];
    for (const n of nodes) {
        const others = nodes.filter((o) => o.id !== n.id).map((o) => ({ o, d2: dist2(n, o), d: Math.sqrt(dist2(n, o)) }));
        others.sort((a, b) => a.d2 - b.d2);
        if (others.length >= 6) medians.push(others[5].d);
    }
    medians.sort((a, b) => a - b);
    const dLo = medians[Math.floor(medians.length * 0.45)] ?? 12;
    const dHi = medians[Math.floor(medians.length * 0.82)] ?? 28;

    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i];
            const b = nodes[j];
            const d = Math.sqrt(dist2(a, b));
            if (d < dLo || d > dHi) continue;
            const dx = Math.abs(a.x - b.x);
            const dy = Math.abs(a.y - b.y);
            const axis = dx > dy * 2.2 || dy > dx * 2.2;
            if (!axis) continue;
            const lo = Math.min(a.id, b.id);
            const hi = Math.max(a.id, b.id);
            if (taxiSet.has(`${lo}|hi|taxi`)) continue;
            addEdge(set, lo, hi, "bus");
        }
    }
    return set;
}

function undergroundStations(nodes) {
    const stations = [];
    const picks = new Set();
    const seeds = [1, 20, 41, 60, 81, 100, 121, 140, 161, 180, 200, 51, 91, 131];
    for (const id of seeds) {
        if (id <= N && !picks.has(id)) {
            picks.add(id);
            stations.push(nodes.find((n) => n.id === id));
        }
    }
    while (stations.length < 14) {
        const n = nodes[Math.floor(rand() * nodes.length)];
        if (!picks.has(n.id)) {
            picks.add(n.id);
            stations.push(n);
        }
    }
    return stations.slice(0, 14);
}

function undergroundEdges(stations) {
    const set = new Set();
    const sorted = [...stations].sort((a, b) => a.x - b.x);
    for (let i = 0; i < sorted.length; i++) {
        const a = sorted[i].id;
        const b = sorted[(i + 1) % sorted.length].id;
        addEdge(set, a, b, "underground");
    }
    const byY = [...stations].sort((a, b) => a.y - b.y);
    addEdge(set, byY[0].id, byY[Math.floor(byY.length / 2)].id, "underground");
    addEdge(set, byY[byY.length - 1].id, byY[Math.floor(byY.length / 3)].id, "underground");
    return set;
}

function ferryBlack(nodes) {
    const set = new Set();
    for (const n of nodes) {
        if (n.row !== 8) continue;
        const pair = nodes.find((m) => m.row === 9 && m.col === n.col);
        if (pair) addEdge(set, n.id, pair.id, "black");
    }
    const extras = [
        [42, 118],
        [63, 145],
        [15, 95],
    ];
    for (const [a, b] of extras) {
        if (a <= N && b <= N) addEdge(set, a, b, "black");
    }
    return set;
}

function connectedUnion(nodes, edgeList) {
    const adj = new Map();
    for (const id of nodes.map((n) => n.id)) adj.set(id, []);
    for (const e of edgeList) {
        adj.get(e.a).push(e.b);
        adj.get(e.b).push(e.a);
    }
    const start = nodes[0].id;
    const seen = new Set([start]);
    const q = [start];
    while (q.length) {
        const u = q.pop();
        for (const v of adj.get(u)) {
            if (!seen.has(v)) {
                seen.add(v);
                q.push(v);
            }
        }
    }
    return seen.size === nodes.length;
}

function main() {
    const nodes = buildPositions();
    const taxiSet = kNearestTaxi(nodes, 4);
    const busSet = busLayer(nodes, taxiSet);
    const ugStations = undergroundStations(nodes);
    const ugSet = undergroundEdges(ugStations);
    const blackSet = ferryBlack(nodes);

    const merged = new Set([...taxiSet, ...busSet, ...ugSet, ...blackSet]);
    let list = edgesFromSet(merged);

    if (!connectedUnion(nodes, list)) {
        const byId = new Map(nodes.map((n) => [n.id, n]));
        for (let attempt = 0; attempt < 80 && !connectedUnion(nodes, list); attempt++) {
            const comps = [];
            const adj = new Map();
            for (const n of nodes) adj.set(n.id, []);
            for (const e of list) {
                adj.get(e.a).push(e.b);
                adj.get(e.b).push(e.a);
            }
            const seen = new Set();
            for (const n of nodes) {
                if (seen.has(n.id)) continue;
                const comp = [];
                const q = [n.id];
                seen.add(n.id);
                while (q.length) {
                    const u = q.pop();
                    comp.push(u);
                    for (const v of adj.get(u)) {
                        if (!seen.has(v)) {
                            seen.add(v);
                            q.push(v);
                        }
                    }
                }
                comps.push(comp);
            }
            if (comps.length < 2) break;
            let best = null;
            let bestD = Infinity;
            for (const a of comps[0]) {
                for (const b of comps[1]) {
                    const d = dist2(byId.get(a), byId.get(b));
                    if (d < bestD) {
                        bestD = d;
                        best = [a, b];
                    }
                }
            }
            if (best) {
                const lo = Math.min(best[0], best[1]);
                const hi = Math.max(best[0], best[1]);
                list.push({ a: lo, b: hi, ticket: "taxi" });
            }
        }
    }

    const yamlNodes = nodes
        .map((n) => `  - id: ${n.id}\n    position: { x: ${n.x}, y: ${n.y} }`)
        .join("\n");

    const yamlConn = list
        .map((e) => `  - between: [${e.a}, ${e.b}]\n    ticket: ${e.ticket}`)
        .join("\n");

    const yaml = `# Auto-generated (scripts/generate-map-200.mjs): 200 nodes, London-style mesh + Thames band.
# Layout: 20×10 stratified grid with jitter; rows 8–9 are north/south river banks.

nodes:
${yamlNodes}

connections:
${yamlConn}

startingPositions: [1, 20, 21, 40, 60, 100, 141]
`;

    writeFileSync(OUT, yaml, "utf8");
    console.log(`Wrote ${OUT} (${nodes.length} nodes, ${list.length} edges)`);
}

main();
