/** Module-level guard so React StrictMode / double-dismiss cannot run the same cutscene twice. */
const cutsceneTokensInFlight = new Set<string>();
const completedCutsceneTokens = new Set<string>();

export function tryClaimFugitiveCutscene(token: string): boolean {
    if (completedCutsceneTokens.has(token)) return false;
    if (cutsceneTokensInFlight.has(token)) return false;
    cutsceneTokensInFlight.add(token);
    return true;
}

export function finishFugitiveCutscene(token: string, succeeded: boolean): void {
    cutsceneTokensInFlight.delete(token);
    if (succeeded) {
        completedCutsceneTokens.add(token);
    }
}

/** @internal test helper */
export function resetFugitiveCutsceneGuardForTest(): void {
    cutsceneTokensInFlight.clear();
    completedCutsceneTokens.clear();
}
