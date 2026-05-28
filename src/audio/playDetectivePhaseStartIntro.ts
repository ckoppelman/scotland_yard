import { getAnimationsEnabled } from "../displayPreferences";
import { buildDetectiveTurnIntro } from "../game/detectiveTurnIntro";
import { GAMEPLAY_ANIMATION_MS } from "../game-board/animations/fugitivePoof";
import type { GameState } from "../game/gameState";
import type { MoveFeedbackHandlers } from "./playGameSfx";
import { MIN_SFX_BEFORE_TURN_MS, playSfxForAtLeast, SfxType, ticketToSfxType } from "./sfx";

export type DetectivePhaseStartHandlers = MoveFeedbackHandlers;

/** Cinematic handoff when detectives begin their round after Mr. X moved. */
export async function playDetectivePhaseStartIntro(
    prev: GameState,
    next: GameState,
    handlers?: DetectivePhaseStartHandlers,
): Promise<void> {
    const intro = buildDetectiveTurnIntro(prev, next);
    const minDuration = getAnimationsEnabled() ? GAMEPLAY_ANIMATION_MS : MIN_SFX_BEFORE_TURN_MS;

    handlers?.onMusicModeOverride?.("fugitive");
    handlers?.onDetectiveTurnIntroStart?.(intro);

    if (getAnimationsEnabled() && intro.isRevealTurn) {
        handlers?.onFugitivePoof?.("in");
    }

    const lastMove = intro.latestMoves.at(-1);
    const transportSfx = lastMove !== undefined ? ticketToSfxType(lastMove.ticket) : null;
    if (transportSfx !== null) {
        await playSfxForAtLeast(transportSfx, minDuration);
        return;
    }

    if (!intro.isRevealTurn) {
        await playSfxForAtLeast(SfxType.FUGITIVE_HIDE, minDuration);
        return;
    }

    // Reveal turn: poof + overlay only — cutscene owns the moment, not the screech brake.
    await new Promise<void>((resolve) => {
        window.setTimeout(resolve, minDuration);
    });
}
