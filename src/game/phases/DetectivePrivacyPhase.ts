import { TurnPhase, type GameState } from "../gameState";
import { HidePlayerMarkersAction } from "../phaseActions/actions/PlayerMarkerVisibilityActions";
import {
    ShowPrivacyModalAction,
    WaitForPrivacyModalDismissAction,
} from "../phaseActions/actions/PrivacyModalActions";
import { SetMusicModeAction } from "../phaseActions/actions/SetMusicModeAction";
import { Phase } from "./Phase";

export class DetectivePrivacyPhase extends Phase {
    readonly turnPhase = TurnPhase.PRIVACY_DETECTIVE;

    entryActions() {
        return [
            new SetMusicModeAction("detective"),
            new HidePlayerMarkersAction(),
            new ShowPrivacyModalAction("detectives"),
            new WaitForPrivacyModalDismissAction(),
        ];
    }

    protected canComplete(_state: GameState): boolean {
        return true;
    }

    protected nextPhase(): TurnPhase {
        return TurnPhase.FUGITIVE_CUTSCENE;
    }
}

export const detectivePrivacyPhase = new DetectivePrivacyPhase();
