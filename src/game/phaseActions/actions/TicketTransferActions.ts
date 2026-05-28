import { getAnimationsEnabled } from "../../../displayPreferences";
import { SIDE_PANEL_OPEN_MS } from "../../cutsceneTiming";
import { PhaseAction } from "../PhaseAction";
import { ticketTransferTargetsFromMove } from "../ticketTransferFromMove";
import type { PhaseActionContext, PhaseActionResult } from "../types";

/**
 * Detective moves transfer spent tickets to fugitives in {@link movePlayer}.
 * Opens the players drawer and flies a flipping ticket from the detective
 * marker to the Mr. X card.
 */
export class TransferTicketsToFugitiveAction extends PhaseAction {
    readonly id = "transfer-tickets-to-fugitive";

    async run(ctx: PhaseActionContext): Promise<PhaseActionResult> {
        if (ctx.move === undefined) return { status: "continue" };

        const targets = ticketTransferTargetsFromMove(ctx.move);
        if (targets === null) return { status: "continue" };

        if (!getAnimationsEnabled()) {
            ctx.patchPresentation({ sidePanel: "players" });
            await ctx.services.delay(SIDE_PANEL_OPEN_MS);
            return { status: "continue" };
        }

        await ctx.services.playTicketTransferToFugitive(targets);
        return { status: "continue" };
    }
}

/** Fugitive moves consume a ticket in rules; this action marks that step. */
export class LoseFugitiveTicketAction extends PhaseAction {
    readonly id = "lose-fugitive-ticket";

    async run(_ctx: PhaseActionContext): Promise<PhaseActionResult> {
        return { status: "continue" };
    }
}
