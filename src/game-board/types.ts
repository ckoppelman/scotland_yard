import type { MusicMode, MusicThemeId } from "../audio/musicTracks";
import type { Ticket } from "../constants";
import type { DetectiveTurnIntro } from "../game/detectiveTurnIntro";
import type { GameState, NewGameSettings } from "../game/gameState";

export type GameBoardProps = {
    state: GameState;
    onDismissPrivacyModal: () => void;
    onTicketClick: (ticket: Ticket) => void;
    onNodeClick: (node: number) => void;
    onReset: (settings?: NewGameSettings) => void;
    /** After drag-drop onto an adjacent station, user must pick a ticket. */
    pendingMoveNode: number | null;
    onCancelPendingMove: () => void;
    /** Called with station id under pointer at drop, or null if none. Optional pointer position for the ticket popup. */
    /** Screen coordinates for positioning the ticket popup (e.g. pointer at drop). */
    onPlayerDragToStation: (node: number | null, clientDrop?: { x: number; y: number }) => void;
    /** Tickets that can legally finish a pending drag to `pendingMoveNode` (subset for disabling buttons). */
    pendingValidTickets: Ticket[] | null;
    /** Screen position of the drop; when set with a pending move, the map popup is shown. */
    pendingTicketAnchor: { x: number; y: number } | null;
    /** Set when the user commits 2x for this drag popup; cleared with the pending move. */
    pendingDoubleMove: boolean;
    /** After drag, user may commit a double (2x) move from the popup; keeps popup open on success. */
    onPendingDoubleMove: () => void;
    /** When the current player has no legal move, the UI offers pass — routes here. */
    onPassTurn: () => void;
    /** Pause overlays a privacy modal; resume clears {@link GameState.currentTurn.isPaused}. */
    onPause: () => void;
    onResumePause: () => void;
    onMusicModeChange: (mode: MusicMode) => void;
    musicThemeId: MusicThemeId;
    musicEnabled: boolean;
    musicVolume: number;
    sfxEnabled: boolean;
    sfxVolume: number;
    onMusicThemeChange: (themeId: MusicThemeId) => void;
    onMusicEnabledChange: (enabled: boolean) => void;
    onMusicVolumeChange: (volume: number) => void;
    onSfxEnabledChange: (enabled: boolean) => void;
    onSfxVolumeChange: (volume: number) => void;
    animationsEnabled: boolean;
    onAnimationsEnabledChange: (enabled: boolean) => void;
    /** Blocks map/ticket input while a turn handoff sound is playing. */
    interactionLocked?: boolean;
    fugitivePoof?: { mode: "in" | "out"; key: number } | null;
    detectiveTurnIntro?: DetectiveTurnIntro | null;
};
