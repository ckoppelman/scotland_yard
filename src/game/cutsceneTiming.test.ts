import { describe, expect, it } from "vitest";
import {
    FUGITIVE_ANIMATION_STAGGER_MS,
    GAMEPLAY_ANIMATION_MS,
    fugitiveAnimationDelayMs,
    fugitiveAnimationDelaySeconds,
    fugitiveCutsceneDurationMs,
} from "./cutsceneTiming";

describe("cutscene timing", () => {
    it("staggers each fugitive 1.5s after the previous", () => {
        expect(fugitiveAnimationDelayMs(0)).toBe(0);
        expect(fugitiveAnimationDelayMs(1)).toBe(FUGITIVE_ANIMATION_STAGGER_MS);
        expect(fugitiveAnimationDelaySeconds(0)).toBe(0);
        expect(fugitiveAnimationDelaySeconds(1)).toBe(1.5);
        expect(fugitiveAnimationDelaySeconds(2)).toBe(3);
    });

    it("extends cutscene duration so the last fugitive can finish", () => {
        expect(fugitiveCutsceneDurationMs(1)).toBe(GAMEPLAY_ANIMATION_MS);
        expect(fugitiveCutsceneDurationMs(2)).toBe(GAMEPLAY_ANIMATION_MS + FUGITIVE_ANIMATION_STAGGER_MS);
        expect(fugitiveCutsceneDurationMs(3)).toBe(GAMEPLAY_ANIMATION_MS + 2 * FUGITIVE_ANIMATION_STAGGER_MS);
    });
});
