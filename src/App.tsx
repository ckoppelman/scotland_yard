import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  loadMusicEnabled,
  loadMusicThemeId,
  loadMusicVolume,
  loadSfxEnabled,
  loadSfxVolume,
  saveMusicEnabled,
  saveMusicThemeId,
  saveMusicVolume,
  saveSfxEnabled,
  saveSfxVolume,
} from "./audio/appPreferences";
import { syncSfxEnabled, syncSfxVolume, loadSfxTracks } from "./audio/sfx";
import {
  playImmediateGameSfx,
  playPostTurnChangeSfx,
  playPreTurnChangeSfx,
  turnWillChange,
  type GameSfxAction,
  type MoveFeedbackHandlers,
} from "./audio/playGameSfx";
import { playDetectivePhaseStartIntro } from "./audio/playDetectivePhaseStartIntro";
import { fugitiveCutsceneToken, isEnteringFugitiveCutscene } from "./game/detectiveTurnIntro";
import type { DetectiveTurnIntro } from "./game/detectiveTurnIntro";
import { type MusicMode, type MusicThemeId } from "./audio/musicTracks";
import { useBackgroundMusic } from "./audio/useBackgroundMusic";
import { GameBoard } from "./game-board";
import { initialState, TurnPhase, type GameState, type NewGameSettings } from "./game/gameState";
import { Ticket } from "./constants";
import {
  getPlayableTicketsBetweenNodes,
  passTurn,
  tryCancelDoubleMove,
  tryPlayDoubleMove,
  tryPlayMoveToAdjacent,
  tryPlayNode,
  tryPlayTicket,
  clearPrivacy,
  completeFugitiveCutscene,
  type PlayResult,
} from "./game/gameRules";
import { DEFAULT_GAME_MAP_ID } from "./game/mapIds";
import { getMapGraph } from "./game/mapRegistry";
import { useToast } from "./toast";
import {
  clearPersistedGameState,
  loadPersistedGameState,
  saveGameState,
} from "./game/persistGameState";
import { loadAnimationsEnabled, syncAnimationsEnabled } from "./displayPreferences";
import { TransportEmojiOverlay } from "./game-board/animations/TransportEmojiOverlay";
import {
  createTransportAnimationBurst,
  createFugitivePoofBurst,
  type TransportAnimationBurst,
} from "./game-board/animations/playTransportAnimation";
import { GAMEPLAY_ANIMATION_MS, type FugitivePoofBurst } from "./game-board/animations/fugitivePoof";

export default function App() {
  const { showToast } = useToast();
  const [state, setState] = useState<GameState | null>(null);
  const [gameMusicMode, setGameMusicMode] = useState<MusicMode>("ambient");
  const [musicEnabled, setMusicEnabled] = useState(loadMusicEnabled);
  const [musicThemeId, setMusicThemeId] = useState(loadMusicThemeId);
  const [musicVolume, setMusicVolume] = useState(loadMusicVolume);
  const [sfxEnabled, setSfxEnabled] = useState(loadSfxEnabled);
  const [sfxVolume, setSfxVolume] = useState(loadSfxVolume);
  const [animationsEnabled, setAnimationsEnabled] = useState(loadAnimationsEnabled);
  const handleMusicModeChange = useCallback((mode: MusicMode) => {
    setGameMusicMode(mode);
  }, []);
  const handleMusicEnabledChange = useCallback((enabled: boolean) => {
    setMusicEnabled(enabled);
    saveMusicEnabled(enabled);
  }, []);
  const handleMusicVolumeChange = useCallback((volume: number) => {
    setMusicVolume(volume);
    saveMusicVolume(volume);
  }, []);
  const handleMusicThemeChange = useCallback((themeId: MusicThemeId) => {
    setMusicThemeId(themeId);
    saveMusicThemeId(themeId);
  }, []);
  const handleSfxEnabledChange = useCallback((enabled: boolean) => {
    setSfxEnabled(enabled);
    saveSfxEnabled(enabled);
    syncSfxEnabled(enabled);
  }, []);
  const handleSfxVolumeChange = useCallback((volume: number) => {
    setSfxVolume(volume);
    saveSfxVolume(volume);
    syncSfxVolume(volume);
  }, []);
  const handleAnimationsEnabledChange = useCallback((enabled: boolean) => {
    setAnimationsEnabled(enabled);
    syncAnimationsEnabled(enabled);
  }, []);

  useEffect(() => {
    syncSfxEnabled(sfxEnabled);
    syncSfxVolume(sfxVolume);
  }, [sfxEnabled, sfxVolume]);

  useEffect(() => {
    void loadSfxTracks();
  }, []);

  useEffect(() => {
    syncAnimationsEnabled(animationsEnabled);
  }, [animationsEnabled]);

  useBackgroundMusic(state === null ? "ambient" : gameMusicMode, musicEnabled, musicVolume, musicThemeId);

  useEffect(() => {
    let cancelled = false;
    void loadPersistedGameState().then((loaded) => {
      if (cancelled) return;
      setState(loaded ?? initialState(DEFAULT_GAME_MAP_ID, getMapGraph(DEFAULT_GAME_MAP_ID), 2, 1));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state === null) return;
    void saveGameState(state);
  }, [state]);
  const [pendingMoveNode, setPendingMoveNode] = useState<number | null>(null);
  /** Screen coords for the “which ticket?” popup after a drag-drop. */
  const [pendingTicketAnchor, setPendingTicketAnchor] = useState<{ x: number; y: number } | null>(null);
  /** Mirrors game double-move intent for this drag popup (set when user commits 2x; cleared with pending move). */
  const [pendingDoubleMove, setPendingDoubleMove] = useState(false);
  const [turnTransitionPending, setTurnTransitionPending] = useState(false);
  const [transportAnimation, setTransportAnimation] = useState<TransportAnimationBurst | null>(null);
  const [fugitivePoof, setFugitivePoof] = useState<FugitivePoofBurst | null>(null);
  const [detectiveTurnIntro, setDetectiveTurnIntro] = useState<DetectiveTurnIntro | null>(null);
  const fugitiveCutsceneStartedRef = useRef<string | null>(null);

  const moveFeedbackHandlers = useMemo<MoveFeedbackHandlers>(
    () => ({
      onTransportAnimation: (ticket: Ticket) => {
        const burst = createTransportAnimationBurst(ticket);
        if (burst !== null) setTransportAnimation(burst);
      },
      onFugitivePoof: (mode) => {
        const burst = createFugitivePoofBurst(mode);
        if (burst === null) return;
        setFugitivePoof(burst);
        window.setTimeout(() => {
          setFugitivePoof((current) => (current?.key === burst.key ? null : current));
        }, GAMEPLAY_ANIMATION_MS);
      },
      onDetectiveTurnIntroStart: (intro) => {
        setDetectiveTurnIntro(intro);
      },
      onDetectiveTurnIntroEnd: () => {
        setDetectiveTurnIntro(null);
      },
      onMusicModeOverride: () => {
        setGameMusicMode("fugitive");
      },
    }),
    [],
  );

  const runFugitiveCutscene = useCallback(
    async (cutsceneState: GameState) => {
      setTurnTransitionPending(true);
      try {
        const prevPrivacy: GameState = {
          ...cutsceneState,
          currentTurn: { ...cutsceneState.currentTurn, phase: TurnPhase.PRIVACY_DETECTIVE },
        };
        const previewDetective: GameState = {
          ...cutsceneState,
          currentTurn: { ...cutsceneState.currentTurn, phase: TurnPhase.DETECTIVE },
        };
        await playDetectivePhaseStartIntro(prevPrivacy, previewDetective, moveFeedbackHandlers);
        const completed = completeFugitiveCutscene(cutsceneState);
        if (!completed.ok) {
          showToast(completed.message, "error");
          return;
        }
        setState(completed.state);
        playPostTurnChangeSfx(cutsceneState, completed.state);
      } finally {
        setDetectiveTurnIntro(null);
        setTurnTransitionPending(false);
      }
    },
    [moveFeedbackHandlers, showToast],
  );

  useEffect(() => {
    if (state === null || state.currentTurn.phase !== TurnPhase.FUGITIVE_CUTSCENE) {
      fugitiveCutsceneStartedRef.current = null;
      return;
    }
    const token = fugitiveCutsceneToken(state);
    if (fugitiveCutsceneStartedRef.current === token) return;
    fugitiveCutsceneStartedRef.current = token;
    void runFugitiveCutscene(state);
  }, [runFugitiveCutscene, state]);

  const commitPlayResult = async (
    prev: GameState,
    result: PlayResult,
    options?: { ticket?: Ticket; action?: GameSfxAction; onApplied?: () => void },
  ) => {
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    const next = result.state;
    if (isEnteringFugitiveCutscene(prev, next)) {
      setState(next);
      options?.onApplied?.();
      return;
    }

    if (turnWillChange(prev, next, options)) {
      setTurnTransitionPending(true);
      try {
        await playPreTurnChangeSfx(prev, next, options, moveFeedbackHandlers);
        setState(next);
        playPostTurnChangeSfx(prev, next);
        options?.onApplied?.();
      } finally {
        setTurnTransitionPending(false);
      }
      return;
    }

    playImmediateGameSfx(prev, next, options, moveFeedbackHandlers);
    setState(next);
    options?.onApplied?.();
  };

  const pendingValidTickets = useMemo(() => {
    if (state === null || pendingMoveNode === null) return null;
    const p = state.players[state.currentTurn.playerOrdinal];
    if (p.position === null) return [];
    return getPlayableTicketsBetweenNodes(state, p.position, pendingMoveNode);
  }, [pendingMoveNode, state]);

  if (state === null) {
    return <main className="app-shell app-shell--boot" aria-busy="true" />;
  }

  const handlePendingDoubleMove = () => {
    if (pendingMoveNode === null) return;
    void commitPlayResult(state, tryPlayDoubleMove(state), {
      action: "double-start",
      onApplied: () => setPendingDoubleMove(true),
    });
  };

  const handleTicketClick = (ticket: Ticket) => {
    if (pendingMoveNode !== null) {
      void commitPlayResult(state, tryPlayMoveToAdjacent(state, pendingMoveNode, ticket), {
        ticket,
        onApplied: () => {
          setPendingMoveNode(null);
          setPendingTicketAnchor(null);
          setPendingDoubleMove(false);
        },
      });
      return;
    }
    const result = tryPlayTicket(state, ticket);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setState(result.state);
  };

  const handleNodeClick = (node: number) => {
    if (pendingMoveNode !== null) {
      showToast("Choose a ticket for your move, or cancel.", "error");
      return;
    }
    const ticket = state.currentTurn.ticket;
    void commitPlayResult(state, tryPlayNode(state, node), ticket !== null ? { ticket } : undefined);
  };

  const handleDismissPrivacyModal = () => {
    void commitPlayResult(state, clearPrivacy(state));
  };

  const handlePassTurn = () => {
    void commitPlayResult(state, passTurn(state), { action: "pass" });
  };

  const handlePause = () => {
    setState((s) => {
      if (s === null) return s;
      return { ...s, currentTurn: { ...s.currentTurn, isPaused: true } };
    });
  };

  const handleResumePause = () => {
    setState((s) => {
      if (s === null) return s;
      return { ...s, currentTurn: { ...s.currentTurn, isPaused: false } };
    });
  };

  const handlePlayerDragToStation = (node: number | null, clientDrop?: { x: number; y: number }) => {
    if (node === null) return;
    const p = state.players[state.currentTurn.playerOrdinal];
    if (p.position === null) return;
    if (p.position === node) {
      showToast("That’s where you already are.", "error");
      return;
    }
    if (state.currentTurn.ticket !== null) {
      showToast("Finish or change your ticket selection first.", "error");
      return;
    }
    const playable = getPlayableTicketsBetweenNodes(state, p.position, node);
    if (playable.length === 0) {
      showToast("Drop on an adjacent station you can reach with a ticket you still have.", "error");
      return;
    }
    setPendingMoveNode(node);
    if (clientDrop) setPendingTicketAnchor({ x: clientDrop.x, y: clientDrop.y });
    if (state.currentTurn.doubleMovePart == null) {
      setPendingDoubleMove(false);
    }
  };

  return (
    <main className="app-shell">
      <TransportEmojiOverlay
        burst={transportAnimation}
        onComplete={() => setTransportAnimation(null)}
      />
      <GameBoard
        state={state}
        onTicketClick={handleTicketClick}
        onNodeClick={handleNodeClick}
        onReset={(settings?: NewGameSettings) => {
          setPendingMoveNode(null);
          setPendingTicketAnchor(null);
          setPendingDoubleMove(false);
          clearPersistedGameState();
          setState(
            settings !== undefined
              ? initialState(settings.mapId, getMapGraph(settings.mapId), settings.numDetectives, settings.numFugitives, {
                  detective: settings.detectiveTickets,
                  fugitive: settings.fugitiveTickets,
                })
              : initialState(DEFAULT_GAME_MAP_ID, getMapGraph(DEFAULT_GAME_MAP_ID), 2, 1),
          );
        }}
        pendingMoveNode={pendingMoveNode}
        pendingTicketAnchor={pendingTicketAnchor}
        pendingDoubleMove={pendingDoubleMove}
        onCancelPendingMove={() => {
          if (state.currentTurn.doubleMovePart === 1) {
            void commitPlayResult(state, tryCancelDoubleMove(state), { action: "cancel-double" });
          }
          setPendingMoveNode(null);
          setPendingTicketAnchor(null);
          setPendingDoubleMove(false);
        }}
        onPlayerDragToStation={handlePlayerDragToStation}
        pendingValidTickets={pendingValidTickets}
        onPendingDoubleMove={handlePendingDoubleMove}
        onDismissPrivacyModal={handleDismissPrivacyModal}
        onPassTurn={handlePassTurn}
        onPause={handlePause}
        onResumePause={handleResumePause}
        onMusicModeChange={handleMusicModeChange}
        musicThemeId={musicThemeId}
        musicEnabled={musicEnabled}
        musicVolume={musicVolume}
        sfxEnabled={sfxEnabled}
        sfxVolume={sfxVolume}
        onMusicThemeChange={handleMusicThemeChange}
        onMusicEnabledChange={handleMusicEnabledChange}
        onMusicVolumeChange={handleMusicVolumeChange}
        onSfxEnabledChange={handleSfxEnabledChange}
        onSfxVolumeChange={handleSfxVolumeChange}
        animationsEnabled={animationsEnabled}
        onAnimationsEnabledChange={handleAnimationsEnabledChange}
        interactionLocked={
          turnTransitionPending || state.currentTurn.phase === TurnPhase.FUGITIVE_CUTSCENE
        }
        fugitivePoof={fugitivePoof}
        detectiveTurnIntro={detectiveTurnIntro}
      />
    </main>
  );
}
