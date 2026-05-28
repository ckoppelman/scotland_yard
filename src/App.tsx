import { useCallback, useEffect, useState } from "react";
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
import { loadMusicTracks } from "./audio/musicTracks";
import { syncSfxEnabled, syncSfxVolume, loadSfxTracks } from "./audio/sfx";
import { type MusicThemeId } from "./audio/musicTracks";
import { useBackgroundMusic, ensureBackgroundMusicPlaying } from "./audio/useBackgroundMusic";
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
import type { FugitivePoofBurst } from "./game-board/animations/fugitivePoof";
import type { TransportAnimationBurst } from "./game-board/animations/playTransportAnimation";
import { usePhaseOrchestrator } from "./hooks/usePhaseOrchestrator";
import type { GameSfxAction } from "./audio/playGameSfx";

export default function App() {
  const { showToast } = useToast();
  const [state, setState] = useState<GameState | null>(null);
  const [musicEnabled, setMusicEnabled] = useState(loadMusicEnabled);
  const [musicThemeId, setMusicThemeId] = useState(loadMusicThemeId);
  const [musicVolume, setMusicVolume] = useState(loadMusicVolume);
  const [sfxEnabled, setSfxEnabled] = useState(loadSfxEnabled);
  const [sfxVolume, setSfxVolume] = useState(loadSfxVolume);
  const [animationsEnabled, setAnimationsEnabled] = useState(loadAnimationsEnabled);
  const [transportAnimation, setTransportAnimation] = useState<TransportAnimationBurst | null>(null);
  const [fugitivePoof, setFugitivePoof] = useState<FugitivePoofBurst | null>(null);
  const [privacyDismissPending, setPrivacyDismissPending] = useState(false);

  const {
    presentation,
    musicMode,
    commitPlayResult: orchestratorCommit,
    resetPresentation,
    interactionLocked,
  } = usePhaseOrchestrator(state, setState, setTransportAnimation, setFugitivePoof);

  const handleMusicEnabledChange = useCallback((enabled: boolean) => {
    setMusicEnabled(enabled);
    saveMusicEnabled(enabled);
    if (enabled) {
      ensureBackgroundMusicPlaying();
    }
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
    void loadMusicTracks();
  }, []);

  useEffect(() => {
    syncAnimationsEnabled(animationsEnabled);
  }, [animationsEnabled]);

  useBackgroundMusic(
    state === null ? "ambient" : state.currentTurn.isPaused ? "ambient" : musicMode,
    musicEnabled,
    musicVolume,
    musicThemeId,
  );

  useEffect(() => {
    if (state === null) return;
    void saveGameState(state);
  }, [state]);

  useEffect(() => {
    let cancelled = false;
    void loadPersistedGameState().then((loaded) => {
      if (cancelled) return;
      const initial =
        loaded ?? initialState(DEFAULT_GAME_MAP_ID, getMapGraph(DEFAULT_GAME_MAP_ID), 2, 1);
      setState(initial);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const commitPlayResult = async (
    prev: GameState,
    result: PlayResult,
    options?: { ticket?: Ticket; action?: GameSfxAction; onApplied?: () => void },
  ) => {
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    const ok = await orchestratorCommit(prev, result, options);
    if (!ok) {
      showToast("That transition is already in progress.", "error");
    }
  };

  const [pendingMoveNode, setPendingMoveNode] = useState<number | null>(null);
  const [pendingTicketAnchor, setPendingTicketAnchor] = useState<{ x: number; y: number } | null>(null);
  const [pendingDoubleMove, setPendingDoubleMove] = useState(false);

  const pendingValidTickets = state && pendingMoveNode !== null
    ? (() => {
        const p = state.players[state.currentTurn.playerOrdinal];
        if (p.position === null) return [];
        return getPlayableTicketsBetweenNodes(state, p.position, pendingMoveNode);
      })()
    : null;

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
    void commitPlayResult(state, result, { ticket });
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
    if (privacyDismissPending || interactionLocked) return;
    const phase = state.currentTurn.phase;
    if (phase !== TurnPhase.PRIVACY_DETECTIVE && phase !== TurnPhase.PRIVACY_FUGITIVE) {
      return;
    }
    const result = clearPrivacy(state);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setPrivacyDismissPending(true);
    void commitPlayResult(state, result).finally(() => {
      setPrivacyDismissPending(false);
    });
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
        phasePresentation={presentation}
        onTicketClick={handleTicketClick}
        onNodeClick={handleNodeClick}
        onReset={(settings?: NewGameSettings) => {
          setPendingMoveNode(null);
          setPendingTicketAnchor(null);
          setPendingDoubleMove(false);
          clearPersistedGameState();
          resetPresentation();
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
        interactionLocked={interactionLocked || state.currentTurn.phase === TurnPhase.FUGITIVE_CUTSCENE}
        fugitivePoof={fugitivePoof}
      />
    </main>
  );
}
