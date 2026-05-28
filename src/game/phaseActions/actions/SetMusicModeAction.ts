import type { MusicMode } from "../../../audio/musicTracks";
import { PhaseAction } from "../PhaseAction";
import type { PhaseActionContext, PhaseActionResult } from "../types";

export class SetMusicModeAction extends PhaseAction {
    readonly id = "set-music-mode";

    constructor(private readonly mode: MusicMode) {
        super();
    }

    async run(ctx: PhaseActionContext): Promise<PhaseActionResult> {
        if (ctx.getPresentation().musicMode !== this.mode) {
            ctx.patchPresentation({ musicMode: this.mode });
        }
        ctx.services.ensureMusicPlaying();
        return { status: "continue" };
    }
}
