import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type MouseEvent,
    type PointerEvent,
} from "react";
import { type Ticket } from "../constants";
import {
    getPlayerCanMove,
    getReachableNodesForDragPreview,
    getReachableNodesForSelectedTicket,
    hasPlayableMoveWithTicket,
} from "../game/gameRules";
import { TurnPhase, type NewGameSettings, type PlayerState } from "../game/gameState";
import { resolveMapLayout } from "../game/resolveMapLayout";
import {
    CONNECTION_TO_COLOR_AND_OFFSET,
    MAP_ZOOM_STEP,
    NODE_DROP_HIT_R,
    PRIVACY_MODAL_MAP_PAN,
    PRIVACY_MODAL_MAP_ZOOM,
} from "./constants";
import { getGameStatusText } from "./gameStatusText";
import { BoardNode } from "./map/BoardNode";
import { ConnectionEdge } from "./map/ConnectionEdge";
import { GameMapSection } from "./map/GameMapSection";
import {
    buildNodePixelPositions,
    buildNodeStationBoardLook,
    clampMapPan,
    clampMapZoom,
    clientToSvgPoint,
    mapBoardBackgroundRect,
    mapSvgFrame,
    parallelConnectionEndpoints,
    pixelCoords,
    sortedConnectionEndpoints,
} from "./map/mapLayout";
import { AcknowledgementsModal } from "./modals/AcknowledgementsModal";
import { GameOverModal } from "./modals/GameOverModal";
import { GameIntroModal } from "./modals/GameIntroModal";
import { MustPassModal } from "./modals/MustPassModal";
import { PauseModal } from "./modals/PauseModal";
import { PrivacyTurnModal } from "./modals/PrivacyTurnModal";
import { NewGameSettingsModal } from "./modals/NewGameSettingsModal";
import { QuickRulesModal } from "./modals/QuickRulesModal";
import { SettingsModal } from "./modals/SettingsModal";
import type { GameBoardProps } from "./types";
import { useModalFade } from "./modals/useModalFade";
import { AppGameMenu } from "./shell/AppGameMenu";
import { GameSideDock } from "./shell/GameSideDock";
import { FlyingTicketTransfer } from "./animations/FlyingTicketTransfer";

export function GameBoard({
    state,
    phasePresentation,
    onDismissPrivacyModal,
    onTicketClick,
    onNodeClick,
    onReset,
    pendingMoveNode,
    pendingTicketAnchor,
    pendingDoubleMove,
    onCancelPendingMove,
    onPlayerDragToStation,
    pendingValidTickets,
    onPendingDoubleMove,
    onPassTurn,
    onPause,
    onResumePause,
    musicThemeId,
    musicEnabled,
    musicVolume,
    sfxEnabled,
    sfxVolume,
    onMusicThemeChange,
    onMusicEnabledChange,
    onMusicVolumeChange,
    onSfxEnabledChange,
    onSfxVolumeChange,
    animationsEnabled,
    onAnimationsEnabledChange,
    interactionLocked = false,
    fugitivePoof = null,
    onTicketTransferComplete,
}: GameBoardProps) {
    const { players, mapGraph, winner, currentTurn, turns, turnLog } = state;
    const detectiveTurnIntro = phasePresentation.detectiveTurnIntro;
    const cutsceneMoveIndex = phasePresentation.cutsceneMoveIndex;

    const activePlayer = state.players[state.currentTurn.playerOrdinal];

    const [dismissedGameIntro, setDismissedGameIntro] = useState(false);
    const [introFromMenu, setIntroFromMenu] = useState(false);
    const [rulesModalOpen, setRulesModalOpen] = useState(false);
    const [acknowledgementsModalOpen, setAcknowledgementsModalOpen] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [newGameSettingsOpen, setNewGameSettingsOpen] = useState(false);
    const [gameOverModalDismissed, setGameOverModalDismissed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const [userSidePanel, setUserSidePanel] = useState<"control" | "mrx" | "players" | null>(null);
    /** Orchestrator overrides (e.g. ticket transfer) take effect on the same render — no useEffect lag. */
    const sidePanel = phasePresentation.sidePanel ?? userSidePanel;

    const toggleSidePanel = useCallback((id: "control" | "mrx" | "players") => {
        setUserSidePanel((p) => (p === id ? null : id));
    }, []);

    const bumpMarkerPulseFromPlayerCard = useCallback((player: PlayerState) => {
        setMarkerBoardPulseKeyById((prev) => ({
            ...prev,
            [player.description.id]: (prev[player.description.id] ?? 0) + 1,
        }));
    }, []);

    useEffect(() => {
        if (sidePanel === null) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && phasePresentation.sidePanel === null) {
                setUserSidePanel(null);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [sidePanel, phasePresentation.sidePanel]);

    useEffect(() => {
        if (!menuOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [menuOpen]);

    useEffect(() => {
        if (winner === null) setGameOverModalDismissed(false);
    }, [winner]);

    useEffect(() => {
        if (!menuOpen) return;
        const onPointerDown = (e: Event) => {
            if (menuRef.current?.contains(e.target as Node)) return;
            setMenuOpen(false);
        };
        document.addEventListener("pointerdown", onPointerDown, true);
        return () => document.removeEventListener("pointerdown", onPointerDown, true);
    }, [menuOpen]);

    const mrXCount = useMemo(() => players.filter((p) => !p.description.isDetective).length, [players]);
    const criminalLabel = mrXCount === 1 ? "fugitive" : "fugitives";

    const detectives = useMemo(() => players.filter((p) => p.description.isDetective), [players]);
    const mrXPlayers = useMemo(() => players.filter((p) => !p.description.isDetective), [players]);

    const handleNewGame = useCallback(() => {
        setIntroFromMenu(false);
        setDismissedGameIntro(false);
        onReset();
    }, [onReset]);

    const showGameIntroModal =
        (winner === null && turnLog.length === 0 && !dismissedGameIntro) || introFromMenu;

    const isPaused = state.currentTurn.isPaused;

    const showPauseModal = winner === null && isPaused;

    const showMrXPrivacyModal =
        winner === null &&
        !isPaused &&
        (phasePresentation.privacyModal === "mrx" ||
            state.currentTurn.phase === TurnPhase.PRIVACY_FUGITIVE);

    const showDetectivePrivacyModal =
        winner === null &&
        !isPaused &&
        (phasePresentation.privacyModal === "detectives" ||
            state.currentTurn.phase === TurnPhase.PRIVACY_DETECTIVE);

    useEffect(() => {
        if (detectiveTurnIntro === null) return;
        setUserSidePanel((panel: typeof userSidePanel) => (panel === "mrx" ? panel : "mrx"));
    }, [detectiveTurnIntro?.key]);

    const completeGameIntroDismiss = useCallback(() => {
        setDismissedGameIntro(true);
        setIntroFromMenu(false);
    }, []);

    const openNewGameSettingsFromIntro = useCallback(() => {
        setDismissedGameIntro(true);
        setIntroFromMenu(false);
        setNewGameSettingsOpen(true);
    }, []);

    const onRulesModalComplete = useCallback(() => {
        setRulesModalOpen(false);
    }, []);

    const onAcknowledgementsModalComplete = useCallback(() => {
        setAcknowledgementsModalOpen(false);
    }, []);

    const onSettingsModalComplete = useCallback(() => {
        setSettingsModalOpen(false);
    }, []);

    const onNewGameSettingsModalComplete = useCallback(() => {
        setNewGameSettingsOpen(false);
    }, []);

    const showGameOverModal = winner !== null && !gameOverModalDismissed;

    const showMustPassModal =
        winner === null &&
        !isPaused &&
        !showGameIntroModal &&
        !showMrXPrivacyModal &&
        !showDetectivePrivacyModal &&
        pendingMoveNode === null &&
        activePlayer.position !== null &&
        state.currentTurn.ticket === null &&
        state.currentTurn.doubleMovePart !== 1 &&
        (state.currentTurn.phase === TurnPhase.FUGITIVE || state.currentTurn.phase === TurnPhase.DETECTIVE) &&
        !getPlayerCanMove(state, activePlayer);

    const completeGameOverModalDismiss = useCallback(() => {
        setGameOverModalDismissed(true);
    }, []);
    const gameOverFade = useModalFade(showGameOverModal, completeGameOverModalDismiss);

    useEffect(() => {
        if (!showGameOverModal) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") gameOverFade.requestClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [gameOverFade.requestClose, showGameOverModal]);

    const openNewGameSettingsFromGameOver = useCallback(() => {
        setGameOverModalDismissed(true);
        setNewGameSettingsOpen(true);
    }, []);

    const mrXPrivacyFade = useModalFade(showMrXPrivacyModal, onDismissPrivacyModal);
    const detectivePrivacyFade = useModalFade(showDetectivePrivacyModal, onDismissPrivacyModal);
    const pauseFade = useModalFade(showPauseModal, onResumePause);
    const gameIntroFade = useModalFade(showGameIntroModal, completeGameIntroDismiss);
    const rulesFade = useModalFade(rulesModalOpen, onRulesModalComplete);
    const acknowledgementsFade = useModalFade(acknowledgementsModalOpen, onAcknowledgementsModalComplete);
    const settingsFade = useModalFade(settingsModalOpen, onSettingsModalComplete);
    const newGameSettingsFade = useModalFade(newGameSettingsOpen, onNewGameSettingsModalComplete);

    useEffect(() => {
        if (!settingsModalOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") settingsFade.requestClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [settingsFade.requestClose, settingsModalOpen]);

    useEffect(() => {
        if (!acknowledgementsModalOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") acknowledgementsFade.requestClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [acknowledgementsFade.requestClose, acknowledgementsModalOpen]);

    const confirmNewGameWithSettings = useCallback(
        (settings: NewGameSettings) => {
            setIntroFromMenu(false);
            setDismissedGameIntro(false);
            onReset(settings);
            newGameSettingsFade.requestClose();
        },
        [newGameSettingsFade.requestClose, onReset],
    );

    useEffect(() => {
        if (!newGameSettingsOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") newGameSettingsFade.requestClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [newGameSettingsOpen, newGameSettingsFade.requestClose]);

    const mapLayout = useMemo(() => resolveMapLayout(mapGraph), [mapGraph]);
    const nodePixelPositions = useMemo(
        () => buildNodePixelPositions(mapGraph, mapLayout),
        [mapGraph, mapLayout],
    );
    const nodeStationLook = useMemo(() => buildNodeStationBoardLook(mapGraph), [mapGraph]);
    const boardBackgroundRect = useMemo(() => mapBoardBackgroundRect(mapLayout), [mapLayout]);

    const { width: contentW, height: contentH, frameTx, frameTy } = useMemo(
        () => mapSvgFrame(mapGraph, nodePixelPositions, mapLayout),
        [mapGraph, nodePixelPositions, mapLayout],
    );

    const mapAreaRef = useRef<HTMLDivElement>(null);
    const [mapAreaPx, setMapAreaPx] = useState(() =>
        typeof window !== "undefined" ? { w: window.innerWidth, h: window.innerHeight } : { w: 0, h: 0 },
    );

    useLayoutEffect(() => {
        const el = mapAreaRef.current;
        if (!el) return;
        const read = () => {
            const r = el.getBoundingClientRect();
            setMapAreaPx({ w: r.width, h: r.height });
        };
        read();
        const ro = new ResizeObserver(read);
        ro.observe(el);
        window.addEventListener("resize", read);
        return () => {
            ro.disconnect();
            window.removeEventListener("resize", read);
        };
    }, []);

    const { layoutW, layoutH } = useMemo(() => {
        const w = mapAreaPx.w;
        const h = mapAreaPx.h;
        if (w <= 0 || h <= 0 || contentW <= 0 || contentH <= 0) {
            return { layoutW: contentW, layoutH: contentH };
        }
        const pad = 8;
        const s = Math.min(1, (w - pad) / contentW, (h - pad) / contentH);
        return { layoutW: contentW * s, layoutH: contentH * s };
    }, [mapAreaPx, contentW, contentH]);

    const [mapZoom, setMapZoom] = useState(1);
    const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
    const [markerBoardPulseKeyById, setMarkerBoardPulseKeyById] = useState<Record<string, number>>({});
    const svgRef = useRef<SVGSVGElement | null>(null);
    const suppressClickRef = useRef(false);
    const dragRef = useRef<null | { startClient: { x: number; y: number }; startPan: { x: number; y: number } }>(
        null,
    );
    const panGestureRef = useRef(false);

    useEffect(() => {
        setMapZoom(1);
        setMapPan({ x: 0, y: 0 });
    }, [contentW, contentH]);

    const zoomAroundCenter = useCallback(
        (oldZoom: number, newZoom: number) => {
            const oldVbW = contentW / oldZoom;
            const oldVbH = contentH / oldZoom;
            const cx = mapPan.x + oldVbW / 2;
            const cy = mapPan.y + oldVbH / 2;
            const newVbW = contentW / newZoom;
            const newVbH = contentH / newZoom;
            return clampMapPan(
                { x: cx - newVbW / 2, y: cy - newVbH / 2 },
                newZoom,
                contentW,
                contentH,
            );
        },
        [contentW, contentH, mapPan.x, mapPan.y],
    );

    const zoomIn = useCallback(() => {
        setMapZoom((z) => {
            const newZ = clampMapZoom(z * MAP_ZOOM_STEP);
            if (newZ === z) return z;
            setMapPan(() => zoomAroundCenter(z, newZ));
            return newZ;
        });
    }, [zoomAroundCenter]);

    const zoomOut = useCallback(() => {
        setMapZoom((z) => {
            const newZ = clampMapZoom(z / MAP_ZOOM_STEP);
            if (newZ === z) return z;
            setMapPan(() => zoomAroundCenter(z, newZ));
            return newZ;
        });
    }, [zoomAroundCenter]);

    const resetMapView = useCallback(() => {
        setMapZoom(1);
        setMapPan({ x: 0, y: 0 });
    }, []);

    useLayoutEffect(() => {
        if (!showMrXPrivacyModal && !showDetectivePrivacyModal && !showGameIntroModal && !showPauseModal) return;
        setMapZoom(PRIVACY_MODAL_MAP_ZOOM);
        setMapPan(clampMapPan(PRIVACY_MODAL_MAP_PAN, PRIVACY_MODAL_MAP_ZOOM, contentW, contentH));
        window.scrollTo(0, 0);
    }, [showDetectivePrivacyModal, showGameIntroModal, showMrXPrivacyModal, showPauseModal, contentW, contentH]);

    useEffect(() => {
        if (!showPauseModal) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") pauseFade.requestClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [pauseFade.requestClose, showPauseModal]);

    const findNodeAtSvgPoint = useCallback(
        (sx: number, sy: number): number | null => {
            let best: { id: number; d2: number } | null = null;
            for (const node of mapGraph.nodes) {
                const c = pixelCoords(nodePixelPositions, node.id);
                const nx = frameTx + c.x;
                const ny = frameTy + c.y;
                const dx = sx - nx;
                const dy = sy - ny;
                const d2 = dx * dx + dy * dy;
                if (d2 <= NODE_DROP_HIT_R * NODE_DROP_HIT_R && (!best || d2 < best.d2)) {
                    best = { id: node.id, d2 };
                }
            }
            return best?.id ?? null;
        },
        [mapGraph.nodes, nodePixelPositions, frameTx, frameTy],
    );

    const tokenDragRef = useRef<null | { startClient: { x: number; y: number } }>(null);
    const [tokenDragVisual, setTokenDragVisual] = useState({ x: 0, y: 0 });
    const [tokenDragging, setTokenDragging] = useState(false);

    const activeMarkerDragBindings = useMemo(() => {
        if (winner !== null || pendingMoveNode !== null || state.currentTurn.ticket !== null) return undefined;
        return {
            onPointerDown(e: PointerEvent<SVGGElement>) {
                e.stopPropagation();
                e.preventDefault();
                tokenDragRef.current = { startClient: { x: e.clientX, y: e.clientY } };
                setTokenDragging(true);
                setTokenDragVisual({ x: 0, y: 0 });
                try {
                    e.currentTarget.setPointerCapture(e.pointerId);
                } catch {
                    /* ignore */
                }
            },
            onPointerMove(e: PointerEvent<SVGGElement>) {
                if (!tokenDragRef.current) return;
                const svg = svgRef.current;
                if (!svg) return;
                const vbW = contentW / mapZoom;
                const scale = vbW / svg.clientWidth;
                const { startClient } = tokenDragRef.current;
                setTokenDragVisual({
                    x: (e.clientX - startClient.x) * scale,
                    y: (e.clientY - startClient.y) * scale,
                });
            },
            onPointerUp(e: PointerEvent<SVGGElement>) {
                const start = tokenDragRef.current?.startClient;
                tokenDragRef.current = null;
                setTokenDragging(false);
                setTokenDragVisual({ x: 0, y: 0 });
                try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                } catch {
                    /* ignore */
                }
                const svg = svgRef.current;
                if (!start || !svg) return;
                const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6;
                if (moved) suppressClickRef.current = true;
                if (!moved) return;
                const pt = clientToSvgPoint(svg, e.clientX, e.clientY);
                onPlayerDragToStation(findNodeAtSvgPoint(pt.x, pt.y), { x: e.clientX, y: e.clientY });
            },
            onPointerCancel(e: PointerEvent<SVGGElement>) {
                tokenDragRef.current = null;
                setTokenDragging(false);
                setTokenDragVisual({ x: 0, y: 0 });
                try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                } catch {
                    /* ignore */
                }
            },
        };
    }, [
        winner,
        pendingMoveNode,
        state.currentTurn.ticket,
        contentW,
        mapZoom,
        findNodeAtSvgPoint,
        onPlayerDragToStation,
    ]);

    const markersRenderOrder = useMemo(() => {
        const ord = state.currentTurn.playerOrdinal;
        return [...state.players]
            .filter((p) => p.position !== null)
            .sort((a, b) => (a.description.order === ord ? 1 : 0) - (b.description.order === ord ? 1 : 0));
    }, [state.players, state.currentTurn.playerOrdinal]);

    /** Ticket-first move, or drag preview: any station that can legally complete the move from here. */
    const highlightedMoveTargetNodes = useMemo(() => {
        const s = new Set<number>();
        if (winner !== null) return s;
        if (pendingMoveNode !== null) return s;
        if (state.currentTurn.ticket !== null) {
            for (const n of getReachableNodesForSelectedTicket(state)) s.add(n);
            return s;
        }
        if (tokenDragging) {
            for (const n of getReachableNodesForDragPreview(state)) s.add(n);
        }
        return s;
    }, [winner, pendingMoveNode, state, tokenDragging]);

    const mapConnectionElements = useMemo(
        () =>
            mapGraph.connections.map((connection) => {
                const [a, b] = sortedConnectionEndpoints(connection.nodes);
                const style = CONNECTION_TO_COLOR_AND_OFFSET[connection.ticket];
                const p1 = pixelCoords(nodePixelPositions, a);
                const p2 = pixelCoords(nodePixelPositions, b);
                const line = parallelConnectionEndpoints(p1, p2, style.offset);
                return (
                    <ConnectionEdge
                        key={`${a}-${b}-${connection.ticket}`}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke={style.color}
                    />
                );
            }),
        [mapGraph.connections, nodePixelPositions],
    );

    const mapBoardNodeElements = useMemo(
        () =>
            mapGraph.nodes.map((node) => (
                <BoardNode
                    key={`node-${node.id}`}
                    nodeId={node.id}
                    coords={pixelCoords(nodePixelPositions, node.id)}
                    stationLook={nodeStationLook.get(node.id)!}
                    onNodeClick={onNodeClick}
                    highlightReachable={highlightedMoveTargetNodes.has(node.id)}
                />
            )),
        [mapGraph.nodes, nodePixelPositions, nodeStationLook, onNodeClick, highlightedMoveTargetNodes],
    );

    const ticketPlayableFromCurrentNode = useMemo((): Record<Ticket, boolean> => {
        const r = {} as Record<Ticket, boolean>;
        (["taxi", "bus", "underground", "black", "double"] as const).forEach((t) => {
            r[t] = hasPlayableMoveWithTicket(state, t);
        });
        return r;
    }, [state]);

    const onMapPointerDown = useCallback(
        (e: PointerEvent<SVGSVGElement>) => {
            const panButton = e.button === 1;
            const leftPan = e.button === 0 && mapZoom > 1;
            if (!panButton && !leftPan) return;
            e.preventDefault();
            panGestureRef.current = false;
            dragRef.current = {
                startClient: { x: e.clientX, y: e.clientY },
                startPan: { ...mapPan },
            };
            try {
                e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
                /* ignore */
            }
        },
        [mapPan, mapZoom],
    );

    const onMapPointerMove = useCallback(
        (e: PointerEvent<SVGSVGElement>) => {
            const d = dragRef.current;
            if (!d) return;
            const dx = e.clientX - d.startClient.x;
            const dy = e.clientY - d.startClient.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 4) panGestureRef.current = true;
            if (!panGestureRef.current) return;
            const svg = svgRef.current;
            if (!svg) return;
            const vbW = contentW / mapZoom;
            const scale = vbW / svg.clientWidth;
            setMapPan(
                clampMapPan(
                    {
                        x: d.startPan.x - dx * scale,
                        y: d.startPan.y - dy * scale,
                    },
                    mapZoom,
                    contentW,
                    contentH,
                ),
            );
        },
        [contentW, contentH, mapZoom],
    );

    const endMapDrag = useCallback(() => {
        if (panGestureRef.current) suppressClickRef.current = true;
        dragRef.current = null;
        panGestureRef.current = false;
    }, []);

    const onMapPointerUp = useCallback(
        (e: PointerEvent<SVGSVGElement>) => {
            endMapDrag();
            try {
                e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
                /* ignore */
            }
        },
        [endMapDrag],
    );

    const onMapClickCapture = useCallback((e: MouseEvent<SVGSVGElement>) => {
        if (suppressClickRef.current) {
            suppressClickRef.current = false;
            e.preventDefault();
            e.stopPropagation();
        }
    }, []);

    const viewBoxW = contentW / mapZoom;
    const viewBoxH = contentH / mapZoom;
    const viewBox = `${mapPan.x} ${mapPan.y} ${viewBoxW} ${viewBoxH}`;

    const status = useMemo(() => getGameStatusText(state), [state]);

    const ticketTransferFlight = phasePresentation.ticketTransferFlight;

    return (
        <>
            {ticketTransferFlight !== null && onTicketTransferComplete !== undefined && (
                <FlyingTicketTransfer
                    flight={ticketTransferFlight}
                    playersPanelReady={sidePanel === "players"}
                    onComplete={onTicketTransferComplete}
                />
            )}
            <PrivacyTurnModal
                variant="mrx"
                fade={mrXPrivacyFade}
                criminalLabel={criminalLabel}
                mrXPlayers={mrXPlayers}
                detectives={detectives}
            />
            <PrivacyTurnModal
                variant="detectives"
                fade={detectivePrivacyFade}
                criminalLabel={criminalLabel}
                mrXPlayers={mrXPlayers}
                detectives={detectives}
            />
            <GameIntroModal
                fade={gameIntroFade}
                introFromMenu={introFromMenu}
                turnLogLength={turnLog.length}
                onOpenRules={() => setRulesModalOpen(true)}
                onOpenNewGameSettings={openNewGameSettingsFromIntro}
            />
            {winner !== null && gameOverFade.mounted && (
                <GameOverModal
                    fade={gameOverFade}
                    winner={winner}
                    players={players}
                    onViewMap={gameOverFade.requestClose}
                    onNewGame={handleNewGame}
                    onNewGameWithSettings={openNewGameSettingsFromGameOver}
                />
            )}
            {newGameSettingsFade.mounted && (
                <NewGameSettingsModal fade={newGameSettingsFade} onConfirm={confirmNewGameWithSettings} />
            )}
            <QuickRulesModal fade={rulesFade} />
            <AcknowledgementsModal fade={acknowledgementsFade} />
            <SettingsModal
                fade={settingsFade}
                musicThemeId={musicThemeId}
                musicEnabled={musicEnabled}
                musicVolume={musicVolume}
                sfxEnabled={sfxEnabled}
                sfxVolume={sfxVolume}
                onMusicThemeChange={onMusicThemeChange}
                onMusicEnabledChange={onMusicEnabledChange}
                onMusicVolumeChange={onMusicVolumeChange}
                onSfxEnabledChange={onSfxEnabledChange}
                onSfxVolumeChange={onSfxVolumeChange}
                animationsEnabled={animationsEnabled}
                onAnimationsEnabledChange={onAnimationsEnabledChange}
            />
            {showMustPassModal && <MustPassModal activePlayer={activePlayer} onPass={onPassTurn} />}
            <PauseModal fade={pauseFade} currentPlayer={activePlayer} />
            <AppGameMenu
                menuRef={menuRef}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                onNewGame={handleNewGame}
                onOpenNewGameSettings={() => setNewGameSettingsOpen(true)}
                onOpenIntro={() => setIntroFromMenu(true)}
                onOpenRules={() => setRulesModalOpen(true)}
                onOpenAcknowledgements={() => setAcknowledgementsModalOpen(true)}
                onOpenSettings={() => setSettingsModalOpen(true)}
                pauseDisabled={winner !== null || isPaused}
                resumeDisabled={winner !== null || !isPaused}
                onPause={onPause}
                onResumePause={onResumePause}
            />
            <div className={`game-layout${interactionLocked ? " game-layout--locked" : ""}`} aria-busy={interactionLocked}>
                <GameMapSection
                    mapAreaRef={mapAreaRef}
                    svgRef={svgRef}
                    layoutW={layoutW}
                    layoutH={layoutH}
                    mapLayout={mapLayout}
                    mapZoom={mapZoom}
                    viewBox={viewBox}
                    frameTx={frameTx}
                    frameTy={frameTy}
                    boardBackgroundRect={boardBackgroundRect}
                    mapConnectionElements={mapConnectionElements}
                    mapBoardNodeElements={mapBoardNodeElements}
                    onMapPointerDown={onMapPointerDown}
                    onMapPointerMove={onMapPointerMove}
                    onMapPointerUp={onMapPointerUp}
                    endMapDrag={endMapDrag}
                    onMapClickCapture={onMapClickCapture}
                    zoomOut={zoomOut}
                    zoomIn={zoomIn}
                    resetMapView={resetMapView}
                    markersRenderOrder={markersRenderOrder}
                    state={state}
                    turns={turns}
                    currentTurn={currentTurn}
                    activePlayer={activePlayer}
                    nodePixelPositions={nodePixelPositions}
                    pendingMoveNode={pendingMoveNode}
                    pendingTicketAnchor={pendingTicketAnchor}
                    pendingValidTickets={pendingValidTickets}
                    pendingDoubleMove={pendingDoubleMove}
                    onTicketClick={onTicketClick}
                    onPendingDoubleMove={onPendingDoubleMove}
                    onCancelPendingMove={onCancelPendingMove}
                    activeMarkerDragBindings={activeMarkerDragBindings}
                    tokenDragging={tokenDragging}
                    tokenDragVisual={tokenDragVisual}
                    markerBoardPulseKeyById={markerBoardPulseKeyById}
                    fugitivePoof={fugitivePoof}
                    detectiveTurnIntro={detectiveTurnIntro}
                    cutsceneMoveIndex={cutsceneMoveIndex}
                    playerMarkersVisible={phasePresentation.playerMarkersVisible}
                />
                <GameSideDock
                    sidePanel={sidePanel}
                    toggleSidePanel={toggleSidePanel}
                    state={state}
                    status={status}
                    activePlayer={activePlayer}
                    players={players}
                    bumpMarkerPulseFromPlayerCard={bumpMarkerPulseFromPlayerCard}
                    onTicketClick={onTicketClick}
                    pendingMoveNode={pendingMoveNode}
                    pendingTicketAnchor={pendingTicketAnchor}
                    pendingValidTickets={pendingValidTickets}
                    ticketPlayableFromCurrentNode={ticketPlayableFromCurrentNode}
                    onCancelPendingMove={onCancelPendingMove}
                    detectiveTurnIntro={detectiveTurnIntro}
                    cutsceneMoveIndex={cutsceneMoveIndex}
                />
            </div>
        </>
    );
}
