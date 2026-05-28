import { GAMEPLAY_ANIMATION_MS } from "../../cutsceneTiming";
import type { DetectiveTurnIntro } from "../../detectiveTurnIntro";
import { PhaseAction } from "../PhaseAction";
import type { PhaseActionContext, PhaseActionResult } from "../types";

/** Reveal fugitive tokens on a reveal round (poof). Full reveal animation TBD. */
export class PlayCutsceneRevealBeatAction extends PhaseAction {
    readonly id = "play-cutscene-reveal-beat";

    constructor(private readonly intro: DetectiveTurnIntro) {
        super();
    }

    async run(ctx: PhaseActionContext): Promise<PhaseActionResult> {
        if (!this.intro.isRevealTurn) {
            return { status: "continue" };
        }

        ctx.services.playFugitivePoof("in");
        await ctx.services.delay(GAMEPLAY_ANIMATION_MS);
        return { status: "continue" };
    }
}
