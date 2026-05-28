import type { PhaseActionContext, PhaseActionResult } from "./types";

/** One step in a phase sequence (music, modal, move feedback, cutscene beat, …). */
export abstract class PhaseAction {
    abstract readonly id: string;

    abstract run(ctx: PhaseActionContext): Promise<PhaseActionResult>;
}
