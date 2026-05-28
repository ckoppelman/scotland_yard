/** Re-exports the phase API. See docs/game-phases.md for architecture. */
export { MACRO_PHASE_CYCLE, completeCurrentPhase, getPhase } from "./phases";
export type { PhaseCompleteResult as PhaseAdvanceResult } from "./phases";
