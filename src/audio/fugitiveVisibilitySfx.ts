import { shouldShowMrX } from "../game/displayLogic";
import { isEnteringFugitiveCutscene } from "../game/detectiveTurnIntro";
import type { GameState } from "../game/gameState";
import { TurnPhase } from "../game/gameState";
import { SfxType } from "./sfxTracks";

/** Handoffs into the fugitive phase — cutscene/privacy owns audio, not turn-change stingers. */
export function isHandoffToFugitiveRound(prev: GameState, next: GameState): boolean {
    const prevActive = prev.players[prev.currentTurn.playerOrdinal];
    const nextActive = next.players[next.currentTurn.playerOrdinal];
    if (prevActive === undefined || nextActive === undefined) return false;

    if (prev.currentTurn.phase === TurnPhase.PRIVACY_FUGITIVE && next.currentTurn.phase === TurnPhase.FUGITIVE) {
        return true;
    }

    if (next.currentTurn.phase === TurnPhase.PRIVACY_FUGITIVE && prevActive.description.isDetective) {
        return true;
    }

    if (
        next.currentTurn.phase === TurnPhase.FUGITIVE &&
        !nextActive.description.isDetective &&
        prevActive.description.isDetective
    ) {
        return true;
    }

    if (
        prev.currentTurn.phase === TurnPhase.FUGITIVE &&
        next.currentTurn.phase === TurnPhase.FUGITIVE &&
        !prevActive.description.isDetective &&
        !nextActive.description.isDetective
    ) {
        return true;
    }

    return false;
}

export function fugitiveVisibilitySfxType(prev: GameState, next: GameState): SfxType | null {
    if (
        isEnteringFugitiveCutscene(prev, next) ||
        next.currentTurn.phase === TurnPhase.PRIVACY_DETECTIVE ||
        next.currentTurn.phase === TurnPhase.PRIVACY_FUGITIVE ||
        next.currentTurn.phase === TurnPhase.FUGITIVE_CUTSCENE ||
        prev.currentTurn.phase === TurnPhase.FUGITIVE_CUTSCENE
    ) {
        return null;
    }

    if (isHandoffToFugitiveRound(prev, next)) {
        return null;
    }

    const nextActive = next.players[next.currentTurn.playerOrdinal];

    if (
        nextActive !== undefined &&
        !nextActive.description.isDetective &&
        next.currentTurn.phase === TurnPhase.FUGITIVE
    ) {
        return null;
    }

    const prevVisible = shouldShowMrX(prev);
    const nextVisible = shouldShowMrX(next);
    if (prevVisible === nextVisible) return null;
    return nextVisible ? SfxType.FUGITIVE_REVEAL : SfxType.FUGITIVE_HIDE;
}
