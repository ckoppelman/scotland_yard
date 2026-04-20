/**
 * After resizing public/map-board.png, scale layout.boardImage and all node positions
 * so stations stay aligned with the artwork. Run when intrinsic PNG size changes.
 *
 * Usage: node scripts/scale-classic-board-coords.mjs <oldW> <oldH> <newW> <newH>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse, stringify } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const yamlPath = path.join(root, "data/map-graph-classic.yaml");

const [oldW, oldH, newW, newH] = process.argv.slice(2).map(Number);
if ([oldW, oldH, newW, newH].some((n) => !Number.isFinite(n) || n <= 0)) {
    console.error("Usage: node scripts/scale-classic-board-coords.mjs <oldW> <oldH> <newW> <newH>");
    process.exit(1);
}

const sx = newW / oldW;
const sy = newH / oldH;

const raw = fs.readFileSync(yamlPath, "utf8");
const doc = parse(raw);

doc.layout.boardImage.width = newW;
doc.layout.boardImage.height = newH;

function round2(n) {
    return Math.round(n * 100) / 100;
}

for (const n of doc.nodes) {
    n.position.x = round2(n.position.x * sx);
    n.position.y = round2(n.position.y * sy);
}

const header = `# Classic Scotland Yard board (199 stations). Source graph: AlexElvers/scotland-yard-data.
# Positions are in the same SVG space as \`layout.boardImage\` (tweak x/y/width/height to align art).
`;

const body = stringify(doc, { lineWidth: 120 });
fs.writeFileSync(yamlPath, header + body);
console.log(`Updated ${yamlPath}: board ${oldW}×${oldH} → ${newW}×${newH} (scale ${sx.toFixed(6)} × ${sy.toFixed(6)})`);
