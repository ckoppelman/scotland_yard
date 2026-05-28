import { TurnPhase, type PlayerState } from "../gameState";
import { AwaitPlayerMoveAction } from "../phaseActions/actions/AwaitPlayerMoveAction";
import {
    PlayImmediateMoveFeedbackAction,
    PlayMoveFeedbackAction,
} from "../phaseActions/actions/PlayMoveFeedbackAction";
import { SetMusicModeAction } from "../phaseActions/actions/SetMusicModeAction";
import { ShowPlayerMarkersAction } from "../phaseActions/actions/PlayerMarkerVisibilityActions";
import { TransferTicketsToFugitiveAction } from "../phaseActions/actions/TicketTransferActions";
import { PlayerTurnPhase } from "./PlayerTurnPhase";

export class DetectivePhase extends PlayerTurnPhase {
    readonly turnPhase = TurnPhase.DETECTIVE;

    protected readonly roundExitPhase = TurnPhase.PRIVACY_FUGITIVE;

    protected isRoundPlayer(player: PlayerState): boolean {
        return player.description.isDetective;
    }

    entryActions() {
        return [
            new SetMusicModeAction("detective"),
            new ShowPlayerMarkersAction(),
            new AwaitPlayerMoveAction(),
        ];
    }

    postMoveActions() {
        return [
            new TransferTicketsToFugitiveAction(),
            new PlayMoveFeedbackAction(),
            new AwaitPlayerMoveAction(),
        ];
    }

    immediateActions() {
        return [new PlayImmediateMoveFeedbackAction()];
    }
}

export const detectivePhase = new DetectivePhase();
