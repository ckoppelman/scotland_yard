/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module "*.svg?raw" {
    const src: string;
    export default src;
}
