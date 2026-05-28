import { describe, expect, it } from "vitest";
import { fugitiveVisibilitySfxType } from "./fugitiveVisibilitySfx";
import { DEFAULT_GAME_RULES, TurnPhase, type CurrentTurn, type GameState, type PlayerState } from "../game/gameState";
import { DEFAULT_GAME_MAP_ID } from "../game/mapIds";
import { clearPrivacy, tryPlayNode } from "../game/gameRules";
import type { Color, Ticket } from "../constants";
import {
    finishFugitiveCutscene,
    resetFugitiveCutsceneGuardForTest,
    tryClaimFugitiveCutscene,
} from "../game/fugitiveCutsceneGuard";

const TURNS_24 = Array.from({ length: 24 }, (_, i) => ({ showMrX: i % 3 === 0 }));

function player(
    ordinal: number,
    isDetective: boolean,
    color: Color,
    position: number,
): PlayerState {
    return {
        description: {
            id: `${isDetective ? "det" : "fug"}-${ordinal}`,
            name: isDetective ? `Detective ${ordinal + 1}` : `Fugitive ${ordinal}`,
            color,
            order: ordinal,
            isDetective,
        },
        position,
        tickets: { taxi: 4, bus: 3, underground: 2, black: 5, double: 2 },
    };
}

function stateWith(partial: Partial<GameState> & { players: PlayerState[]; currentTurn: CurrentTurn }): GameState {
    return {
        mapId: DEFAULT_GAME_MAP_ID,
        mapGraph: {
            nodes: [],
            connections: [],
            startingPositions: [1, 2, 3, 4],
        },
        winner: null,
        turns: TURNS_24,
        turnLog: [],
        gameRules: DEFAULT_GAME_RULES,
        fugitivePrivacyDismissed: false,
        ...partial,
    };
}

describe("fugitiveVisibilitySfxType", () => {
    const twoDetectivesTwoFugitives = [
        player(0, true, "red", 1),
        player(1, true, "blue", 2),
        player(2, false, "mrX", 3),
        player(3, false, "mrY", 4),
    ];

    it("does not play reveal/hide when detectives hand off to fugitive privacy", () => {
        const prev = stateWith({
            players: twoDetectivesTwoFugitives,
            currentTurn: {
                playerOrdinal: 1,
                ticket: null,
                turnNumber: 1,
                phase: TurnPhase.DETECTIVE,
                isPaused: false,
                detectivesPassing: [],
                fugitivesPassing: [],
            },
        });
        const next = stateWith({
            players: twoDetectivesTwoFugitives,
            currentTurn: {
                playerOrdinal: 2,
                ticket: null,
                turnNumber: 1,
                phase: TurnPhase.PRIVACY_FUGITIVE,
                isPaused: false,
                detectivesPassing: [],
                fugitivesPassing: [],
            },
        });

        expect(fugitiveVisibilitySfxType(prev, next)).toBeNull();
    });

    it("does not play reveal/hide when fugitive privacy clears into Mr X's turn", () => {
        const prev = stateWith({
            players: twoDetectivesTwoFugitives,
            currentTurn: {
                playerOrdinal: 2,
                ticket: null,
                turnNumber: 1,
                phase: TurnPhase.PRIVACY_FUGITIVE,
                isPaused: false,
                detectivesPassing: [],
                fugitivesPassing: [],
            },
        });
        const next = stateWith({
            players: twoDetectivesTwoFugitives,
            currentTurn: {
                playerOrdinal: 2,
                ticket: null,
                turnNumber: 1,
                phase: TurnPhase.FUGITIVE,
                isPaused: false,
                detectivesPassing: [],
                fugitivesPassing: [],
            },
        });

        expect(fugitiveVisibilitySfxType(prev, next)).toBeNull();
    });

    it("does not play reveal/hide when handing off between two fugitives", () => {
        const prev = stateWith({
            players: twoDetectivesTwoFugitives,
            currentTurn: {
                playerOrdinal: 2,
                ticket: null,
                turnNumber: 1,
                phase: TurnPhase.FUGITIVE,
                isPaused: false,
                detectivesPassing: [],
                fugitivesPassing: [],
            },
        });
        const next = stateWith({
            players: twoDetectivesTwoFugitives,
            currentTurn: {
                playerOrdinal: 3,
                ticket: null,
                turnNumber: 1,
                phase: TurnPhase.FUGITIVE,
                isPaused: false,
                detectivesPassing: [],
                fugitivesPassing: [],
            },
        });

        expect(fugitiveVisibilitySfxType(prev, next)).toBeNull();
    });

    it("does not play reveal/hide when fugitive round ends and detective privacy begins", () => {
        const prev = stateWith({
            players: twoDetectivesTwoFugitives,
            currentTurn: {
                playerOrdinal: 3,
                ticket: null,
                turnNumber: 1,
                phase: TurnPhase.FUGITIVE,
                isPaused: false,
                detectivesPassing: [],
                fugitivesPassing: [],
            },
        });
        const next = stateWith({
            players: twoDetectivesTwoFugitives,
            currentTurn: {
                playerOrdinal: 0,
                ticket: null,
                turnNumber: 2,
                phase: TurnPhase.PRIVACY_DETECTIVE,
                isPaused: false,
                detectivesPassing: [],
                fugitivesPassing: [],
            },
        });

        expect(fugitiveVisibilitySfxType(prev, next)).toBeNull();
    });

    it("does not play reveal/hide when entering the fugitive cutscene", () => {
        const prev = stateWith({
            players: twoDetectivesTwoFugitives,
            currentTurn: {
                playerOrdinal: 0,
                ticket: null,
                turnNumber: 2,
                phase: TurnPhase.PRIVACY_DETECTIVE,
                isPaused: false,
                detectivesPassing: [],
                fugitivesPassing: [],
            },
        });
        const next = stateWith({
            players: twoDetectivesTwoFugitives,
            currentTurn: {
                playerOrdinal: 0,
                ticket: null,
                turnNumber: 2,
                phase: TurnPhase.FUGITIVE_CUTSCENE,
                isPaused: false,
                detectivesPassing: [],
                fugitivesPassing: [],
            },
        });

        expect(fugitiveVisibilitySfxType(prev, next)).toBeNull();
    });
});

describe("two-fugitive phase flow", () => {
    const players = [
        player(0, true, "red", 1),
        player(1, true, "blue", 2),
        player(2, false, "mrX", 3),
        player(3, false, "mrY", 4),
    ];

    const graph = {
        nodes: [
            { id: 1, position: { x: 0, y: 0 } },
            { id: 2, position: { x: 1, y: 0 } },
            { id: 3, position: { x: 2, y: 0 } },
            { id: 4, position: { x: 3, y: 0 } },
        ],
        connections: [
            { nodes: new Set([1, 2]), ticket: "taxi" as Ticket },
            { nodes: new Set([2, 3]), ticket: "taxi" as Ticket },
            { nodes: new Set([3, 4]), ticket: "taxi" as Ticket },
        ],
        startingPositions: [1, 2, 3, 4],
    };

    function base(phase: TurnPhase, playerOrdinal: number, turnNumber = 1): GameState {
        return {
            mapId: DEFAULT_GAME_MAP_ID,
            mapGraph: graph,
            players,
            currentTurn: {
                playerOrdinal,
                ticket: null,
                turnNumber,
                phase,
                isPaused: false,
                detectivesPassing: [],
                fugitivesPassing: [],
            },
            winner: null,
            turns: TURNS_24,
            turnLog: [],
            gameRules: DEFAULT_GAME_RULES,
            fugitivePrivacyDismissed: true,
        };
    }

    it("keeps Mr Y in fugitive phase after Mr X moves", () => {
        let s = base(TurnPhase.FUGITIVE, 2);
        s = { ...s, currentTurn: { ...s.currentTurn, ticket: "taxi" as Ticket } };
        const moved = tryPlayNode(s, 4);
        expect(moved.ok).toBe(true);
        if (!moved.ok) return;
        expect(moved.state.currentTurn.playerOrdinal).toBe(3);
        expect(moved.state.currentTurn.phase).toBe(TurnPhase.FUGITIVE);
    });

    it("enters detective privacy only after the second fugitive moves", () => {
        let s = base(TurnPhase.FUGITIVE, 3);
        s = { ...s, currentTurn: { ...s.currentTurn, ticket: "taxi" as Ticket } };
        const moved = tryPlayNode(s, 3);
        expect(moved.ok).toBe(true);
        if (!moved.ok) return;
        expect(moved.state.currentTurn.playerOrdinal).toBe(0);
        expect(moved.state.currentTurn.phase).toBe(TurnPhase.PRIVACY_DETECTIVE);
    });

    it("enters cutscene once when clearing detective privacy after both fugitives moved", () => {
        const s = base(TurnPhase.PRIVACY_DETECTIVE, 0, 2);
        const cleared = clearPrivacy(s);
        expect(cleared.ok).toBe(true);
        if (!cleared.ok) return;
        expect(cleared.state.currentTurn.phase).toBe(TurnPhase.FUGITIVE_CUTSCENE);
    });
});

describe("fugitiveCutsceneGuard", () => {
    it("allows only one successful cutscene per token", () => {
        resetFugitiveCutsceneGuardForTest();
        expect(tryClaimFugitiveCutscene("round-1")).toBe(true);
        expect(tryClaimFugitiveCutscene("round-1")).toBe(false);
        finishFugitiveCutscene("round-1", true);
        expect(tryClaimFugitiveCutscene("round-1")).toBe(false);
    });
});
