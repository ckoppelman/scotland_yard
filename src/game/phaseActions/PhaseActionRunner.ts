import type { PhaseAction } from "./PhaseAction";
import type { PhaseActionContext, PhaseActionResult } from "./types";

/** Runs a list of phase actions until one waits or the list completes. */
export class PhaseActionRunner {
    async runSequence(
        actions: PhaseAction[],
        ctx: PhaseActionContext,
        startIndex = 0,
    ): Promise<{ result: PhaseActionResult; nextIndex: number }> {
        let index = startIndex;
        while (index < actions.length) {
            const result = await actions[index]!.run(ctx);
            if (result.status === "wait") {
                return { result, nextIndex: index };
            }
            index++;
        }
        return { result: { status: "continue" }, nextIndex: index };
    }
}
