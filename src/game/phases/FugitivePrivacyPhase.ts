import { TurnPhase, type GameState } from "../gameState";
import { HidePlayerMarkersAction } from "../phaseActions/actions/PlayerMarkerVisibilityActions";
import {
    ShowPrivacyModalAction,
    WaitForPrivacyModalDismissAction,
} from "../phaseActions/actions/PrivacyModalActions";
import { SetMusicModeAction } from "../phaseActions/actions/SetMusicModeAction";
import { Phase } from "./Phase";

export class FugitivePrivacyPhase extends Phase {
    readonly turnPhase = TurnPhase.PRIVACY_FUGITIVE;

    entryActions() {
        return [
            new SetMusicModeAction("fugitive"),
            new HidePlayerMarkersAction(),
            new ShowPrivacyModalAction("mrx"),
            new WaitForPrivacyModalDismissAction(),
        ];
    }

    protected canComplete(_state: GameState): boolean {
        return true;
    }

    protected nextPhase(): TurnPhase {
        return TurnPhase.FUGITIVE;
    }

    protected onExit(state: GameState): GameState {
        return { ...state, fugitivePrivacyDismissed: true };
    }
}

export const fugitivePrivacyPhase = new FugitivePrivacyPhase();
