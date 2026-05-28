import fs from "node:fs";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";

const AUDIO_EXT = /\.(mp3|wav|ogg)$/i;
const MANIFEST_NAME = "manifest.json";

function shouldSkipFolder(name: string): boolean {
    return name.startsWith("_") || name.startsWith(".");
}

function scanMusicThemes(musicRoot: string): Record<string, Record<string, string[]>> {
    const manifest: Record<string, Record<string, string[]>> = {};
    if (!fs.existsSync(musicRoot)) return manifest;

    for (const themeEntry of fs.readdirSync(musicRoot, { withFileTypes: true })) {
        if (!themeEntry.isDirectory() || shouldSkipFolder(themeEntry.name)) continue;

        const themeId = themeEntry.name;
        const themePath = path.join(musicRoot, themeId);
        const modes: Record<string, string[]> = {};

        for (const modeEntry of fs.readdirSync(themePath, { withFileTypes: true })) {
            if (!modeEntry.isDirectory() || shouldSkipFolder(modeEntry.name)) continue;

            const files = fs
                .readdirSync(path.join(themePath, modeEntry.name))
                .filter((file) => AUDIO_EXT.test(file))
                .sort()
                .map((file) => `/audio/music/${themeId}/${modeEntry.name}/${file}`);

            if (files.length > 0) {
                modes[modeEntry.name] = files;
            }
        }

        if (Object.keys(modes).length > 0) {
            manifest[themeId] = modes;
        }
    }

    return manifest;
}

function writeManifest(musicRoot: string): void {
    const manifest = scanMusicThemes(musicRoot);
    fs.writeFileSync(path.join(musicRoot, MANIFEST_NAME), `${JSON.stringify(manifest, null, 2)}\n`);
}

function watchMusicFolders(server: ViteDevServer, musicRoot: string): void {
    server.watcher.add(musicRoot);
    server.watcher.on("all", (event, filePath) => {
        if (!filePath.startsWith(musicRoot) || filePath.endsWith(MANIFEST_NAME)) return;
        if (event !== "add" && event !== "unlink" && event !== "change") return;
        writeManifest(musicRoot);
    });
}

/** Scan `public/audio/music/{theme}/{mode}/*` and write `manifest.json` for runtime loading. */
export function musicManifestPlugin(): Plugin {
    let musicRoot = "";

    return {
        name: "music-manifest",
        configResolved(config) {
            musicRoot = path.resolve(config.publicDir, "audio/music");
        },
        buildStart() {
            writeManifest(musicRoot);
        },
        configureServer(server) {
            writeManifest(musicRoot);
            watchMusicFolders(server, musicRoot);
        },
    };
}
