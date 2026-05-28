import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { defineConfig } from "vitest/config";
import { sfxManifestPlugin } from "./vite/sfxManifestPlugin";

export default defineConfig({
  plugins: [
    react(),
    svgr(), // or svgr({ svgrOptions: { icon: true } }) etc.
    sfxManifestPlugin(),
  ],
  test: {
    environment: "jsdom",
  },
});