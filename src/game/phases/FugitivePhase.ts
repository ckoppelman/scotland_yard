import { TurnPhase, type PlayerState } from "../gameState";
import { AwaitPlayerMoveAction } from "../phaseActions/actions/AwaitPlayerMoveAction";
import { PlayDoubleMoveAnimationAction } from "../phaseActions/actions/PlayDoubleMoveAnimationAction";
import {
    PlayImmediateMoveFeedbackAction,
    PlayMoveFeedbackAction,
} from "../phaseActions/actions/PlayMoveFeedbackAction";
import { SetMusicModeAction } from "../phaseActions/actions/SetMusicModeAction";
import { ShowPlayerMarkersAction } from "../phaseActions/actions/PlayerMarkerVisibilityActions";
import { LoseFugitiveTicketAction } from "../phaseActions/actions/TicketTransferActions";
import { PlayerTurnPhase } from "./PlayerTurnPhase";

export class FugitivePhase extends PlayerTurnPhase {
    readonly turnPhase = TurnPhase.FUGITIVE;

    protected readonly roundExitPhase = TurnPhase.PRIVACY_DETECTIVE;

    protected isRoundPlayer(player: PlayerState): boolean {
        return !player.description.isDetective;
    }

    entryActions() {
        return [
            new SetMusicModeAction("fugitive"),
            new ShowPlayerMarkersAction(),
            new AwaitPlayerMoveAction(),
        ];
    }

    postMoveActions() {
        return [
            new PlayDoubleMoveAnimationAction(),
            new LoseFugitiveTicketAction(),
            new PlayMoveFeedbackAction(),
            new AwaitPlayerMoveAction(),
        ];
    }

    immediateActions() {
        return [new PlayDoubleMoveAnimationAction(), new PlayImmediateMoveFeedbackAction()];
    }
}

export const fugitivePhase = new FugitivePhase();
