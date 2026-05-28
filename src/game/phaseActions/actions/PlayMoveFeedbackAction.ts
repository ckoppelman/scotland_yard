import type { Ticket } from "../../../constants";
import { ticketToSfxType } from "../../../audio/sfx";
import { PhaseAction } from "../PhaseAction";
import type { MoveActionContext, PhaseActionContext, PhaseActionResult } from "../types";

function ticketFromMove(move?: MoveActionContext): Ticket | undefined {
    if (move === undefined) return undefined;
    if (move.ticket !== undefined) return move.ticket;

    const last = move.next.turnLog.at(-1);
    if (last === undefined) return undefined;
    if (last.playerOrdinal !== move.prev.currentTurn.playerOrdinal) return undefined;
    if (last.ticket === null) return undefined;
    return last.ticket;
}

/** Transport emoji overlay + SFX after a completed move. */
export class PlayMoveFeedbackAction extends PhaseAction {
    readonly id = "play-move-feedback";

    async run(ctx: PhaseActionContext): Promise<PhaseActionResult> {
        const ticket = ticketFromMove(ctx.move);
        if (ticket === undefined || ticketToSfxType(ticket) === null) {
            return { status: "continue" };
        }

        ctx.patchPresentation({ interactionLocked: true });
        try {
            await ctx.services.playTransportFeedback(ticket);
        } finally {
            ctx.patchPresentation({ interactionLocked: false });
        }
        return { status: "continue" };
    }
}

/** Immediate feedback for in-turn events (ticket pick, double-start) without blocking. */
export class PlayImmediateMoveFeedbackAction extends PhaseAction {
    readonly id = "play-immediate-move-feedback";

    async run(ctx: PhaseActionContext): Promise<PhaseActionResult> {
        const ticket = ctx.move?.ticket;
        if (ticket !== undefined) {
            ctx.services.playImmediateTransportFeedback(ticket);
        }
        return { status: "continue" };
    }
}
