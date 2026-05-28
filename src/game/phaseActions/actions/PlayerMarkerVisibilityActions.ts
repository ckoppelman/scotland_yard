import { PhaseAction } from "../PhaseAction";
import type { PhaseActionContext, PhaseActionResult } from "../types";

export class HidePlayerMarkersAction extends PhaseAction {
    readonly id = "hide-player-markers";

    async run(ctx: PhaseActionContext): Promise<PhaseActionResult> {
        ctx.patchPresentation({ playerMarkersVisible: false });
        return { status: "continue" };
    }
}

export class ShowPlayerMarkersAction extends PhaseAction {
    readonly id = "show-player-markers";

    async run(ctx: PhaseActionContext): Promise<PhaseActionResult> {
        if (ctx.getPresentation().playerMarkersVisible) {
            return { status: "continue" };
        }
        ctx.patchPresentation({ playerMarkersVisible: true });
        return { status: "continue" };
    }
}
