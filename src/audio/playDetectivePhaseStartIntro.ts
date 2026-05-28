import { getAnimationsEnabled } from "../displayPreferences";
import { buildDetectiveTurnIntro } from "../game/detectiveTurnIntro";
import {
    fugitiveAnimationDelayMs,
    fugitiveCutsceneDurationMs,
    fugitiveCutsceneMoveCount,
    GAMEPLAY_ANIMATION_MS,
} from "../game/cutsceneTiming";
import type { GameState } from "../game/gameState";
import type { MoveFeedbackHandlers } from "./playGameSfx";
import { MIN_SFX_BEFORE_TURN_MS, playSfxForAtLeast, SfxType, ticketToSfxType } from "./sfx";

export type DetectivePhaseStartHandlers = MoveFeedbackHandlers;

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });
}

/** Cinematic handoff when detectives begin their round after Mr. X moved. */
export async function playDetectivePhaseStartIntro(
    prev: GameState,
    next: GameState,
    handlers?: DetectivePhaseStartHandlers,
): Promise<void> {
    const intro = buildDetectiveTurnIntro(prev, next);
    const moveCount = fugitiveCutsceneMoveCount(intro);
    const minDuration = getAnimationsEnabled()
        ? fugitiveCutsceneDurationMs(moveCount)
        : MIN_SFX_BEFORE_TURN_MS;

    handlers?.onDetectiveTurnIntroStart?.(intro);

    if (getAnimationsEnabled() && intro.isRevealTurn) {
        handlers?.onFugitivePoof?.("in");
    }

    const hasTransportMoves = intro.latestMoves.some((move) => ticketToSfxType(move.ticket) !== null);

    if (hasTransportMoves) {
        const transportTasks = intro.latestMoves.map(async (move, index) => {
            const transportSfx = ticketToSfxType(move.ticket);
            if (transportSfx === null) return;

            await delay(fugitiveAnimationDelayMs(index));
            await playSfxForAtLeast(transportSfx, GAMEPLAY_ANIMATION_MS);
        });

        await Promise.all([...transportTasks, delay(minDuration)]);
        return;
    }

    if (!intro.isRevealTurn) {
        await playSfxForAtLeast(SfxType.FUGITIVE_HIDE, minDuration);
        return;
    }

    // Reveal turn: poof + overlay only — cutscene owns the moment, not the screech brake.
    await delay(minDuration);
}
