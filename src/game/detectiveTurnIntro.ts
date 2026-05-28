import { TurnPhase, type GameState } from "./gameState";
import { latestFugitiveRoundMoves } from "./fugitiveTicketMarkers";
import type { LatestFugitiveMove } from "./fugitiveTicketMarkers";

export type FugitiveMovedHint = {
    id: string;
    name: string;
    stationId: number;
};

export type DetectiveTurnIntro = {
    key: number;
    fugitives: FugitiveMovedHint[];
    isRevealTurn: boolean;
    latestMoves: LatestFugitiveMove[];
};

export function isFugitiveCutscenePhase(state: GameState): boolean {
    return state.currentTurn.phase === TurnPhase.FUGITIVE_CUTSCENE;
}

export function isEnteringFugitiveCutscene(prev: GameState, next: GameState): boolean {
    return (
        prev.currentTurn.phase === TurnPhase.PRIVACY_DETECTIVE &&
        next.currentTurn.phase === TurnPhase.FUGITIVE_CUTSCENE
    );
}

export function isRevealTurn(state: GameState): boolean {
    return state.turns[state.currentTurn.turnNumber - 1]?.showMrX ?? false;
}

export function fugitiveMovedHints(state: GameState): FugitiveMovedHint[] {
    return state.players
        .filter((player) => !player.description.isDetective && player.position !== null)
        .map((player) => ({
            id: player.description.id,
            name: player.description.name,
            stationId: player.position!,
        }));
}

/** @param previewDetectiveState state as it will be once the cutscene completes (DETECTIVE phase). */
export function buildDetectiveTurnIntro(
    prev: GameState,
    previewDetectiveState: GameState,
): DetectiveTurnIntro {
    return {
        key: Date.now(),
        fugitives: fugitiveMovedHints(prev),
        isRevealTurn: isRevealTurn(previewDetectiveState),
        latestMoves: latestFugitiveRoundMoves(prev),
    };
}

export function fugitiveCutsceneToken(state: GameState): string {
    return `${state.currentTurn.turnNumber}-${state.turnLog.length}`;
}
