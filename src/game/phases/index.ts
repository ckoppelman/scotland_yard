/** Macro game phases. See docs/game-phases.md. */
export { Phase, MACRO_PHASE_CYCLE } from "./Phase";
export type { PhaseCompleteResult } from "./Phase";
export { completeCurrentPhase, getPhase } from "./registry";
export { detectivePhase } from "./DetectivePhase";
export { fugitivePhase } from "./FugitivePhase";
export { fugitivePrivacyPhase } from "./FugitivePrivacyPhase";
export { detectivePrivacyPhase } from "./DetectivePrivacyPhase";
export { fugitiveCutscenePhase } from "./FugitiveCutscenePhase";
export { gameOverPhase } from "./GameOverPhase";
