import { getAnimationsEnabled } from "../displayPreferences";
import { buildDetectiveTurnIntro } from "../game/detectiveTurnIntro";
import type { GameState } from "../game/gameState";
import type { MoveFeedbackHandlers } from "./playGameSfx";
import { playSfxForAtLeast, SfxType, ticketToSfxType } from "./sfx";

export type DetectivePhaseStartHandlers = MoveFeedbackHandlers;

/** Cinematic handoff when detectives begin their round after Mr. X moved. */
export async function playDetectivePhaseStartIntro(
    prev: GameState,
    next: GameState,
    handlers?: DetectivePhaseStartHandlers,
): Promise<void> {
    const intro = buildDetectiveTurnIntro(prev, next);

    handlers?.onMusicModeOverride?.("fugitive");
    handlers?.onDetectiveTurnIntroStart?.(intro);

    if (getAnimationsEnabled() && intro.isRevealTurn) {
        handlers?.onFugitivePoof?.("in");
    }

    const lastMove = intro.latestMoves.at(-1);
    const transportSfx = lastMove !== undefined ? ticketToSfxType(lastMove.ticket) : null;
    if (transportSfx !== null) {
        await playSfxForAtLeast(transportSfx);
    } else {
        const sfxType = intro.isRevealTurn ? SfxType.FUGITIVE_REVEAL : SfxType.FUGITIVE_HIDE;
        await playSfxForAtLeast(sfxType);
    }

    handlers?.onDetectiveTurnIntroEnd?.();
}
