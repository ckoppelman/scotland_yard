import type { MusicMode } from "../../audio/musicTracks";
import type { SfxType } from "../../audio/sfxTracks";
import type { Ticket } from "../../constants";
import type { DetectiveTurnIntro } from "../detectiveTurnIntro";
import type { GameState } from "../gameState";

/** Outcome of a single phase action. */
export type PhaseActionResult =
    | { status: "continue" }
    | { status: "wait"; kind: PhaseWaitKind };

export type PhaseWaitKind = "player-move" | "privacy-modal" | "cutscene";

/** Presentation controlled by phase actions (music, markers, modals, cutscene beats). */
export type PhasePresentation = {
    musicMode: MusicMode;
    playerMarkersVisible: boolean;
    privacyModal: "mrx" | "detectives" | null;
    detectiveTurnIntro: DetectiveTurnIntro | null;
    /** Active cutscene move index for staggered headline / emoji / ticket flip. */
    cutsceneMoveIndex: number | null;
    interactionLocked: boolean;
};

export const INITIAL_PHASE_PRESENTATION: PhasePresentation = {
    musicMode: "ambient",
    playerMarkersVisible: true,
    privacyModal: null,
    detectiveTurnIntro: null,
    cutsceneMoveIndex: null,
    interactionLocked: false,
};

/** Side-effect services injected into actions (SFX, animations). */
export type PhaseActionServices = {
    playTransportFeedback: (ticket: Ticket) => Promise<void>;
    playImmediateTransportFeedback: (ticket: Ticket) => void;
    showTransportAnimation: (ticket: Ticket) => void;
    playSfxForAtLeast: (type: SfxType, minMs: number) => Promise<void>;
    playFugitivePoof: (mode: "in" | "out") => void;
    playGameOverSfx: () => void;
    ensureMusicPlaying: () => void;
    delay: (ms: number) => Promise<void>;
};

/** Move context passed into post-move actions. */
export type MoveActionContext = {
    prev: GameState;
    next: GameState;
    ticket?: Ticket;
    action?: "double-start" | "cancel-double" | "pass";
};

export type PhaseActionContext = {
    getState: () => GameState;
    setState: (state: GameState) => void;
    getPresentation: () => PhasePresentation;
    patchPresentation: (patch: Partial<PhasePresentation>) => void;
    services: PhaseActionServices;
    move?: MoveActionContext;
};
