import { buildDetectiveTurnIntro, fugitiveCutsceneToken } from "../../detectiveTurnIntro";
import { finishFugitiveCutscene, tryClaimFugitiveCutscene } from "../../fugitiveCutsceneGuard";
import { completeFugitiveCutscene } from "../../gameRules";
import { TurnPhase } from "../../gameState";
import { PhaseActionRunner } from "../PhaseActionRunner";
import { PhaseAction } from "../PhaseAction";
import type { PhaseActionContext, PhaseActionResult } from "../types";
import { PlayCutsceneMoveBeatAction } from "./PlayCutsceneMoveBeatAction";
import { PlayCutsceneRevealBeatAction } from "./PlayCutsceneRevealBeatAction";

/** Runs the full fugitive cutscene: per-move beats then optional reveal. */
export class RunFugitiveCutsceneAction extends PhaseAction {
    readonly id = "run-fugitive-cutscene";

    private readonly runner = new PhaseActionRunner();

    async run(ctx: PhaseActionContext): Promise<PhaseActionResult> {
        const cutsceneState = ctx.getState();
        if (cutsceneState.currentTurn.phase !== TurnPhase.FUGITIVE_CUTSCENE) {
            return { status: "continue" };
        }

        const token = fugitiveCutsceneToken(cutsceneState);
        if (!tryClaimFugitiveCutscene(token)) {
            return { status: "continue" };
        }

        const prevPrivacy = {
            ...cutsceneState,
            currentTurn: { ...cutsceneState.currentTurn, phase: TurnPhase.PRIVACY_DETECTIVE },
        };
        const previewDetective = {
            ...cutsceneState,
            currentTurn: { ...cutsceneState.currentTurn, phase: TurnPhase.DETECTIVE },
        };
        const intro = buildDetectiveTurnIntro(prevPrivacy, previewDetective);

        ctx.patchPresentation({
            interactionLocked: true,
            detectiveTurnIntro: intro,
            cutsceneMoveIndex: null,
        });

        let succeeded = false;
        try {
            const beats: PhaseAction[] = intro.latestMoves.map(
                (_, index) => new PlayCutsceneMoveBeatAction(intro, index),
            );
            beats.push(new PlayCutsceneRevealBeatAction(intro));

            await this.runner.runSequence(beats, ctx);

            const completed = completeFugitiveCutscene(cutsceneState);
            if (completed.ok) {
                ctx.setState(completed.state);
                succeeded = true;
            }
        } finally {
            finishFugitiveCutscene(token, succeeded);
            ctx.patchPresentation({
                interactionLocked: false,
                detectiveTurnIntro: null,
                cutsceneMoveIndex: null,
            });
        }

        return { status: "continue" };
    }
}
