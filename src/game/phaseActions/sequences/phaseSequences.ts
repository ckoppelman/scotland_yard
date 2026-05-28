import type { PhaseAction } from "../PhaseAction";
import {
    HidePrivacyModalAction,
} from "../actions/PrivacyModalActions";
import { ShowPlayerMarkersAction } from "../actions/PlayerMarkerVisibilityActions";
import { getPhase } from "../../phases";
import { TurnPhase } from "../../gameState";

export type PhaseSequenceKind = "entry" | "per-turn" | "post-move-immediate" | "post-move-handoff";

export function resolvePhaseEntryActions(phase: TurnPhase): PhaseAction[] {
    return getPhase(phase)?.entryActions() ?? [];
}

export function resolvePostMoveActions(phase: TurnPhase): PhaseAction[] {
    return getPhase(phase)?.postMoveActions() ?? [];
}

export function resolveImmediateActions(phase: TurnPhase): PhaseAction[] {
    return getPhase(phase)?.immediateActions() ?? [];
}

/** Clear privacy modal presentation when leaving a privacy phase. */
export function privacyExitActions(): PhaseAction[] {
    return [new HidePrivacyModalAction(), new ShowPlayerMarkersAction()];
}
