import { PhaseAction } from "../PhaseAction";
import type { PhaseActionContext, PhaseActionResult } from "../types";

export class ShowPrivacyModalAction extends PhaseAction {
    readonly id = "show-privacy-modal";

    constructor(private readonly variant: "mrx" | "detectives") {
        super();
    }

    async run(ctx: PhaseActionContext): Promise<PhaseActionResult> {
        ctx.patchPresentation({ privacyModal: this.variant });
        return { status: "continue" };
    }
}

export class HidePrivacyModalAction extends PhaseAction {
    readonly id = "hide-privacy-modal";

    async run(ctx: PhaseActionContext): Promise<PhaseActionResult> {
        ctx.patchPresentation({ privacyModal: null });
        return { status: "continue" };
    }
}

export class WaitForPrivacyModalDismissAction extends PhaseAction {
    readonly id = "wait-privacy-modal-dismiss";

    async run(_ctx: PhaseActionContext): Promise<PhaseActionResult> {
        return { status: "wait", kind: "privacy-modal" };
    }
}
