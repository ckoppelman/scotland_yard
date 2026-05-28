import fs from "node:fs";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";

const AUDIO_EXT = /\.(mp3|wav|ogg)$/i;
const MANIFEST_NAME = "manifest.json";

function scanSfxFolders(sfxRoot: string): Record<string, string[]> {
    const manifest: Record<string, string[]> = {};
    if (!fs.existsSync(sfxRoot)) return manifest;

    for (const entry of fs.readdirSync(sfxRoot, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;

        const files = fs
            .readdirSync(path.join(sfxRoot, entry.name))
            .filter((file) => AUDIO_EXT.test(file))
            .sort()
            .map((file) => `/audio/sfx/${entry.name}/${file}`);

        if (files.length > 0) {
            manifest[entry.name] = files;
        }
    }

    return manifest;
}

function writeManifest(sfxRoot: string): void {
    const manifest = scanSfxFolders(sfxRoot);
    fs.writeFileSync(path.join(sfxRoot, MANIFEST_NAME), `${JSON.stringify(manifest, null, 2)}\n`);
}

function watchSfxFolders(server: ViteDevServer, sfxRoot: string): void {
    server.watcher.add(sfxRoot);
    server.watcher.on("all", (event, filePath) => {
        if (!filePath.startsWith(sfxRoot) || filePath.endsWith(MANIFEST_NAME)) return;
        if (event !== "add" && event !== "unlink" && event !== "change") return;
        writeManifest(sfxRoot);
    });
}

/** Scan `public/audio/sfx/*` and write `manifest.json` for runtime loading. */
export function sfxManifestPlugin(): Plugin {
    let sfxRoot = "";

    return {
        name: "sfx-manifest",
        configResolved(config) {
            sfxRoot = path.resolve(config.publicDir, "audio/sfx");
        },
        buildStart() {
            writeManifest(sfxRoot);
        },
        configureServer(server) {
            writeManifest(sfxRoot);
            watchSfxFolders(server, sfxRoot);
        },
    };
}
