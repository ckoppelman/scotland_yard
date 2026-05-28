import { PhaseAction } from "../PhaseAction";
import type { PhaseActionContext, PhaseActionResult } from "../types";

/** Placeholder for a future double-move cinematic. */
export class PlayDoubleMoveAnimationAction extends PhaseAction {
    readonly id = "play-double-move-animation";

    async run(ctx: PhaseActionContext): Promise<PhaseActionResult> {
        if (ctx.move?.action !== "double-start") {
            return { status: "continue" };
        }
        // No animation implemented yet — reserve timing slot for future work.
        return { status: "continue" };
    }
}
