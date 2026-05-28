import { TurnPhase, type GameState } from "../gameState";
import { RunFugitiveCutsceneAction } from "../phaseActions/actions/CutsceneActions";
import { HidePlayerMarkersAction } from "../phaseActions/actions/PlayerMarkerVisibilityActions";
import { SetMusicModeAction } from "../phaseActions/actions/SetMusicModeAction";
import { Phase } from "./Phase";

export class FugitiveCutscenePhase extends Phase {
    readonly turnPhase = TurnPhase.FUGITIVE_CUTSCENE;

    entryActions() {
        return [
            new SetMusicModeAction("fugitive"),
            new HidePlayerMarkersAction(),
            new RunFugitiveCutsceneAction(),
        ];
    }

    protected canComplete(_state: GameState): boolean {
        return true;
    }

    protected nextPhase(): TurnPhase {
        return TurnPhase.DETECTIVE;
    }
}

export const fugitiveCutscenePhase = new FugitiveCutscenePhase();
