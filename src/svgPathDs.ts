/** Pull every `<path d="…">` from raw SVG markup (handles `class` before `d`, multiline `d`). */
export function extractSvgPathDs(svg: string): string[] {
    const paths: string[] = [];
    const re = /<path[\s\S]*?d="([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(svg)) !== null) {
        paths.push(m[1].replace(/\s+/g, " ").trim());
    }
    return paths;
}
