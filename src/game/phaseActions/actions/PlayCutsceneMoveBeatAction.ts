import { ticketToSfxType } from "../../../audio/sfx";
import { fugitiveAnimationDelayMs, GAMEPLAY_ANIMATION_MS } from "../../cutsceneTiming";
import type { DetectiveTurnIntro } from "../../detectiveTurnIntro";
import { PhaseAction } from "../PhaseAction";
import type { PhaseActionContext, PhaseActionResult } from "../types";
import { PlayDoubleMoveAnimationAction } from "./PlayDoubleMoveAnimationAction";

/** One cutscene beat: headline index, stagger, transport emoji, and ticket SFX. */
export class PlayCutsceneMoveBeatAction extends PhaseAction {
    readonly id = "play-cutscene-move-beat";

    constructor(
        private readonly intro: DetectiveTurnIntro,
        private readonly moveIndex: number,
    ) {
        super();
    }

    async run(ctx: PhaseActionContext): Promise<PhaseActionResult> {
        const move = this.intro.latestMoves[this.moveIndex];
        if (move === undefined) {
            return { status: "continue" };
        }

        ctx.patchPresentation({
            detectiveTurnIntro: this.intro,
            cutsceneMoveIndex: this.moveIndex,
        });

        await ctx.services.delay(fugitiveAnimationDelayMs(this.moveIndex));

        if (move.ticket === "double") {
            await new PlayDoubleMoveAnimationAction().run(ctx);
        }

        const sfx = ticketToSfxType(move.ticket);
        if (sfx !== null) {
            await ctx.services.playSfxForAtLeast(sfx, GAMEPLAY_ANIMATION_MS);
        } else {
            await ctx.services.delay(GAMEPLAY_ANIMATION_MS);
        }

        return { status: "continue" };
    }
}
