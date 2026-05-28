import { afterEach, describe, expect, it } from "vitest";
import {
    finishFugitiveCutscene,
    resetFugitiveCutsceneGuardForTest,
    tryClaimFugitiveCutscene,
} from "./fugitiveCutsceneGuard";

describe("fugitiveCutsceneGuard", () => {
    afterEach(() => {
        resetFugitiveCutsceneGuardForTest();
    });

    it("claims a token on first request", () => {
        expect(tryClaimFugitiveCutscene("3-12")).toBe(true);
    });

    it("rejects a second concurrent claim for the same token", () => {
        expect(tryClaimFugitiveCutscene("3-12")).toBe(true);
        expect(tryClaimFugitiveCutscene("3-12")).toBe(false);
    });

    it("allows a different token while the first is in flight", () => {
        expect(tryClaimFugitiveCutscene("3-12")).toBe(true);
        expect(tryClaimFugitiveCutscene("4-15")).toBe(true);
    });

    it("never allows a successful token to run again", () => {
        expect(tryClaimFugitiveCutscene("3-12")).toBe(true);
        finishFugitiveCutscene("3-12", true);
        expect(tryClaimFugitiveCutscene("3-12")).toBe(false);
    });

    it("allows retry after a failed cutscene", () => {
        expect(tryClaimFugitiveCutscene("3-12")).toBe(true);
        finishFugitiveCutscene("3-12", false);
        expect(tryClaimFugitiveCutscene("3-12")).toBe(true);
    });

    it("clears in-flight status on failure so another token can proceed", () => {
        expect(tryClaimFugitiveCutscene("3-12")).toBe(true);
        finishFugitiveCutscene("3-12", false);
        expect(tryClaimFugitiveCutscene("4-15")).toBe(true);
    });

    it("reset clears both in-flight and completed tokens", () => {
        expect(tryClaimFugitiveCutscene("3-12")).toBe(true);
        finishFugitiveCutscene("3-12", true);
        resetFugitiveCutsceneGuardForTest();
        expect(tryClaimFugitiveCutscene("3-12")).toBe(true);
    });
});
