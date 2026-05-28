import { PhaseAction } from "../PhaseAction";
import type { PhaseActionContext, PhaseActionResult } from "../types";

/** Blocks the sequence until the active player commits a move or pass. */
export class AwaitPlayerMoveAction extends PhaseAction {
    readonly id = "await-player-move";

    async run(_ctx: PhaseActionContext): Promise<PhaseActionResult> {
        return { status: "wait", kind: "player-move" };
    }
}
