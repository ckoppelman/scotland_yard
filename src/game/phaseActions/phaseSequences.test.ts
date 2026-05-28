import { describe, expect, it } from "vitest";
import { TurnPhase } from "../gameState";
import {
    detectivePhase,
    fugitivePhase,
    fugitivePrivacyPhase,
    detectivePrivacyPhase,
    fugitiveCutscenePhase,
} from "../phases";
import {
    resolveImmediateActions,
    resolvePhaseEntryActions,
    resolvePostMoveActions,
} from "./sequences/phaseSequences";

describe("phaseSequences", () => {
    it("defines detective round entry as music, markers, await move", () => {
        const ids = detectivePhase.entryActions().map((a) => a.id);
        expect(ids).toEqual(["set-music-mode", "show-player-markers", "await-player-move"]);
    });

    it("defines detective post-move feedback then await next move", () => {
        const ids = detectivePhase.postMoveActions().map((a) => a.id);
        expect(ids).toEqual([
            "transfer-tickets-to-fugitive",
            "play-move-feedback",
            "await-player-move",
        ]);
    });

    it("defines fugitive privacy as hide markers and modal gate", () => {
        const ids = fugitivePrivacyPhase.entryActions().map((a) => a.id);
        expect(ids).toEqual([
            "set-music-mode",
            "hide-player-markers",
            "show-privacy-modal",
            "wait-privacy-modal-dismiss",
        ]);
    });

    it("defines fugitive round entry and post-move steps", () => {
        expect(fugitivePhase.entryActions().map((a) => a.id)).toEqual([
            "set-music-mode",
            "show-player-markers",
            "await-player-move",
        ]);
        expect(fugitivePhase.postMoveActions().map((a) => a.id)).toEqual([
            "play-double-move-animation",
            "lose-fugitive-ticket",
            "play-move-feedback",
            "await-player-move",
        ]);
    });

    it("defines detective privacy with detective music", () => {
        const actions = detectivePrivacyPhase.entryActions();
        expect(actions[0]?.id).toBe("set-music-mode");
        expect(actions.at(-1)?.id).toBe("wait-privacy-modal-dismiss");
    });

    it("defines fugitive cutscene as music, hidden markers, cutscene runner", () => {
        const ids = fugitiveCutscenePhase.entryActions().map((a) => a.id);
        expect(ids).toEqual(["set-music-mode", "hide-player-markers", "run-fugitive-cutscene"]);
    });

    it("maps TurnPhase to entry sequences via phase classes", () => {
        expect(resolvePhaseEntryActions(TurnPhase.DETECTIVE)).toHaveLength(3);
        expect(resolvePhaseEntryActions(TurnPhase.PRIVACY_FUGITIVE)).toHaveLength(4);
        expect(resolvePhaseEntryActions(TurnPhase.FUGITIVE)).toHaveLength(3);
        expect(resolvePhaseEntryActions(TurnPhase.PRIVACY_DETECTIVE)).toHaveLength(4);
        expect(resolvePhaseEntryActions(TurnPhase.FUGITIVE_CUTSCENE)).toHaveLength(3);
        expect(resolvePhaseEntryActions(TurnPhase.GAME_OVER)).toHaveLength(0);
    });

    it("maps gameplay phases to post-move and immediate actions", () => {
        expect(resolvePostMoveActions(TurnPhase.DETECTIVE)).toHaveLength(3);
        expect(resolvePostMoveActions(TurnPhase.FUGITIVE)).toHaveLength(4);
        expect(resolveImmediateActions(TurnPhase.DETECTIVE)).toHaveLength(1);
        expect(resolveImmediateActions(TurnPhase.FUGITIVE)).toHaveLength(2);
    });
});
