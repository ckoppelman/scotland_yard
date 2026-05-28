import type { Ticket } from "../../constants";
import { TurnPhase, type GameState } from "../gameState";
import { PhaseActionRunner } from "./PhaseActionRunner";
import { HidePlayerMarkersAction, ShowPlayerMarkersAction } from "./actions/PlayerMarkerVisibilityActions";
import {
    ShowPrivacyModalAction,
    WaitForPrivacyModalDismissAction,
} from "./actions/PrivacyModalActions";
import {
    privacyExitActions,
    resolveImmediateActions,
    resolvePhaseEntryActions,
    resolvePostMoveActions,
} from "./sequences/phaseSequences";
import type {
    MoveActionContext,
    PhaseActionContext,
    PhaseActionServices,
    PhasePresentation,
    PhaseWaitKind,
} from "./types";
import { INITIAL_PHASE_PRESENTATION } from "./types";
import { turnWillChange } from "../../audio/playGameSfx";

export type PhaseOrchestratorCallbacks = {
    getState: () => GameState;
    setState: (state: GameState) => void;
    getPresentation: () => PhasePresentation;
    patchPresentation: (patch: Partial<PhasePresentation>) => void;
    services: PhaseActionServices;
};

/** Drives phase entry sequences, per-turn waits, and post-move feedback. */
export class PhaseOrchestrator {
    private readonly runner = new PhaseActionRunner();
    private activePhase: TurnPhase | null = null;
    private pendingActions: ReturnType<typeof resolvePhaseEntryActions> = [];
    private actionIndex = 0;
    private waitKind: PhaseWaitKind | null = null;
    private phaseSync: Promise<void> = Promise.resolve();

    constructor(private readonly callbacks: PhaseOrchestratorCallbacks) {}

    get isWaitingForPlayerMove(): boolean {
        return this.waitKind === "player-move";
    }

    get isWaitingForPrivacyModal(): boolean {
        return this.waitKind === "privacy-modal";
    }

    private buildContext(move?: MoveActionContext): PhaseActionContext {
        return {
            getState: this.callbacks.getState,
            setState: this.callbacks.setState,
            getPresentation: this.callbacks.getPresentation,
            patchPresentation: this.callbacks.patchPresentation,
            services: this.callbacks.services,
            move,
        };
    }

    private async ensureGameplayMarkersVisible(phase: TurnPhase): Promise<void> {
        if (
            (phase === TurnPhase.DETECTIVE || phase === TurnPhase.FUGITIVE) &&
            !this.callbacks.getPresentation().playerMarkersVisible
        ) {
            await this.runner.runSequence([new ShowPlayerMarkersAction()], this.buildContext());
        }
    }

    private async ensurePrivacyPresentation(phase: TurnPhase): Promise<void> {
        const modal = this.callbacks.getPresentation().privacyModal;
        if (phase === TurnPhase.PRIVACY_FUGITIVE && modal !== "mrx") {
            const { result } = await this.runner.runSequence(
                [
                    new HidePlayerMarkersAction(),
                    new ShowPrivacyModalAction("mrx"),
                    new WaitForPrivacyModalDismissAction(),
                ],
                this.buildContext(),
            );
            if (result.status === "wait") {
                this.waitKind = result.kind;
            }
        } else if (phase === TurnPhase.PRIVACY_DETECTIVE && modal !== "detectives") {
            const { result } = await this.runner.runSequence(
                [
                    new HidePlayerMarkersAction(),
                    new ShowPrivacyModalAction("detectives"),
                    new WaitForPrivacyModalDismissAction(),
                ],
                this.buildContext(),
            );
            if (result.status === "wait") {
                this.waitKind = result.kind;
            }
        }
    }

    /** Sync presentation to {@link GameState.currentTurn.phase}. */
    async syncToGamePhase(): Promise<void> {
        const phase = this.callbacks.getState().currentTurn.phase;
        this.phaseSync = this.phaseSync.then(() => this.runSyncPhase(phase));
        await this.phaseSync;
    }

    private async runSyncPhase(phase: TurnPhase): Promise<void> {
        const gamePhase = this.callbacks.getState().currentTurn.phase;
        if (gamePhase !== phase) {
            phase = gamePhase;
        }

        if (phase === this.activePhase) {
            await this.ensureGameplayMarkersVisible(phase);
            await this.ensurePrivacyPresentation(phase);
            return;
        }

        if (
            this.activePhase === TurnPhase.PRIVACY_FUGITIVE ||
            this.activePhase === TurnPhase.PRIVACY_DETECTIVE
        ) {
            await this.runner.runSequence(privacyExitActions(), this.buildContext());
        }

        this.activePhase = phase;
        this.pendingActions = resolvePhaseEntryActions(phase);
        this.actionIndex = 0;
        this.waitKind = null;

        if (this.pendingActions.length === 0) {
            return;
        }

        await this.advanceEntry();
    }

    private async advanceEntry(): Promise<void> {
        const { result, nextIndex } = await this.runner.runSequence(
            this.pendingActions,
            this.buildContext(),
            this.actionIndex,
        );
        this.actionIndex = nextIndex;
        if (result.status === "wait") {
            this.waitKind = result.kind;
        } else {
            this.waitKind = null;
        }
    }

    /** Resume after the privacy modal is dismissed. */
    async onPrivacyModalDismissed(): Promise<void> {
        if (this.waitKind !== "privacy-modal") return;
        this.waitKind = null;
        this.actionIndex++;
        await this.advanceEntry();
    }

    /**
     * Apply a {@link PlayResult} — runs immediate, handoff, or in-turn feedback actions,
     * updates game state, and starts the next phase sequence when the macro-phase changes.
     */
    async handlePlayResult(
        prev: GameState,
        next: GameState,
        options?: { ticket?: Ticket; action?: "double-start" | "cancel-double" | "pass" },
    ): Promise<void> {
        const move: MoveActionContext = { prev, next, ticket: options?.ticket, action: options?.action };

        const phase = prev.currentTurn.phase;
        const willChange = turnWillChange(prev, next, options);

        if (willChange) {
            const postMove = resolvePostMoveActions(phase);
            if (postMove.length > 0) {
                await this.runner.runSequence(postMove.slice(0, -1), this.buildContext(move));
            }

            this.callbacks.setState(next);

            if (next.currentTurn.phase !== phase) {
                await this.syncToGamePhase();
            } else if (postMove.length > 0) {
                const { result } = await this.runner.runSequence(
                    [postMove[postMove.length - 1]!],
                    this.buildContext(move),
                );
                if (result.status === "wait") {
                    this.waitKind = result.kind;
                }
            }
            return;
        }

        const immediate = resolveImmediateActions(phase);
        if (immediate.length > 0) {
            await this.runner.runSequence(immediate, this.buildContext(move));
        }
        this.callbacks.setState(next);
    }

    reset(): void {
        this.activePhase = null;
        this.pendingActions = [];
        this.actionIndex = 0;
        this.waitKind = null;
        this.callbacks.patchPresentation(INITIAL_PHASE_PRESENTATION);
    }
}
