import type { Ticket } from "../constants";
import { shouldShowPrivacy } from "../game/displayLogic";
import type { DetectiveTurnIntro } from "../game/detectiveTurnIntro";
import type { GameState } from "../game/gameState";
import { fugitiveVisibilitySfxType } from "./fugitiveVisibilitySfx";
import { playSfx, playSfxForAtLeast, SfxType, ticketToSfxType } from "./sfx";

export type GameSfxAction = "double-start" | "cancel-double" | "pass";

export type MoveFeedbackHandlers = {
    onTransportAnimation?: (ticket: Ticket) => void;
    onFugitivePoof?: (mode: "in" | "out") => void;
    onDetectiveTurnIntroStart?: (intro: DetectiveTurnIntro) => void;
    onDetectiveTurnIntroEnd?: () => void;
    onMusicModeOverride?: (mode: "fugitive") => void;
};

function maybePlayTransportAnimation(ticket: Ticket | undefined, handlers?: MoveFeedbackHandlers): void {
    if (ticket === undefined || ticketToSfxType(ticket) === null) return;
    handlers?.onTransportAnimation?.(ticket);
}

function playerWillAdvance(prev: GameState, next: GameState, options?: { action?: GameSfxAction }): boolean {
    return (
        prev.currentTurn.playerOrdinal !== next.currentTurn.playerOrdinal &&
        prev.currentTurn.doubleMovePart !== 1 &&
        options?.action !== "pass"
    );
}

export function turnWillChange(
    prev: GameState,
    next: GameState,
    options?: { action?: GameSfxAction },
): boolean {
    if (options?.action === "pass") return true;
    if (playerWillAdvance(prev, next, options)) return true;
    if (shouldShowPrivacy(prev) && !shouldShowPrivacy(next)) return true;
    return false;
}

function preTurnChangeSfxType(
    prev: GameState,
    next: GameState,
    options?: { ticket?: Ticket; action?: GameSfxAction },
): SfxType | null {
    if (options?.ticket !== undefined) {
        const moveType = ticketToSfxType(options.ticket);
        if (moveType !== null) return moveType;
    }

    const visibilityType = fugitiveVisibilitySfxType(prev, next);
    if (visibilityType !== null) return visibilityType;

    return null;
}

function maybePlayFugitivePoof(type: SfxType, handlers?: MoveFeedbackHandlers): void {
    if (type === SfxType.FUGITIVE_REVEAL) {
        handlers?.onFugitivePoof?.("in");
    } else if (type === SfxType.FUGITIVE_HIDE) {
        handlers?.onFugitivePoof?.("out");
    }
}

/** Play the primary handoff sound, then wait before the UI turn changes. */
export async function playPreTurnChangeSfx(
    prev: GameState,
    next: GameState,
    options?: { ticket?: Ticket; action?: GameSfxAction },
    handlers?: MoveFeedbackHandlers,
): Promise<void> {
    maybePlayTransportAnimation(options?.ticket, handlers);

    const visibilityType = fugitiveVisibilitySfxType(prev, next);
    if (visibilityType !== null) {
        maybePlayFugitivePoof(visibilityType, handlers);
    }

    const type = preTurnChangeSfxType(prev, next, options);
    if (type === null) return;
    await playSfxForAtLeast(type);
}

export function playPostTurnChangeSfx(
    prev: GameState,
    next: GameState,
): void {
    if (prev.winner === null && next.winner !== null) {
        playSfx(SfxType.GAME_OVER);
    }
}

export function playImmediateGameSfx(
    _prev: GameState,
    _next: GameState,
    options?: { ticket?: Ticket; action?: GameSfxAction },
    handlers?: MoveFeedbackHandlers,
): void {
    if (options?.action === "double-start") {
        playSfx(SfxType.DOUBLE);
    } else if (options?.action === "cancel-double") {
        playSfx(SfxType.CANCEL);
    }

    if (options?.ticket !== undefined) {
        maybePlayTransportAnimation(options.ticket, handlers);
        const moveType = ticketToSfxType(options.ticket);
        if (moveType !== null) {
            playSfx(moveType);
        }
    }
}
