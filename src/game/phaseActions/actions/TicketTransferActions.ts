import { PhaseAction } from "../PhaseAction";
import type { PhaseActionContext, PhaseActionResult } from "../types";

/**
 * Detective moves transfer spent tickets to fugitives in {@link movePlayer}.
 * This action marks that presentation step in the sequence.
 */
export class TransferTicketsToFugitiveAction extends PhaseAction {
    readonly id = "transfer-tickets-to-fugitive";

    async run(_ctx: PhaseActionContext): Promise<PhaseActionResult> {
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
