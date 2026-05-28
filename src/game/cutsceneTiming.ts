import type { DetectiveTurnIntro } from "./detectiveTurnIntro";

/** One visual or SFX beat (headline, emoji sweep, ticket flip). Keep in sync with cutscene CSS durations. */
export const GAMEPLAY_ANIMATION_MS = 2000;

/** Delay between each fugitive's cutscene beat when multiple fugitives moved. See docs/fugitive-cutscene.md. */
export const FUGITIVE_ANIMATION_STAGGER_MS = 1500;

export function fugitiveAnimationDelayMs(index: number): number {
    return index * FUGITIVE_ANIMATION_STAGGER_MS;
}

export function fugitiveAnimationDelaySeconds(index: number): number {
    return fugitiveAnimationDelayMs(index) / 1000;
}

export function fugitiveCutsceneMoveCount(intro: DetectiveTurnIntro): number {
    return Math.max(intro.latestMoves.length, 1);
}

/** Total time until the last fugitive's animation finishes. */
export function fugitiveCutsceneDurationMs(moveCount: number): number {
    if (moveCount <= 1) return GAMEPLAY_ANIMATION_MS;
    return GAMEPLAY_ANIMATION_MS + (moveCount - 1) * FUGITIVE_ANIMATION_STAGGER_MS;
}
