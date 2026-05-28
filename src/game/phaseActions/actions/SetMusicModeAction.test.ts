import { describe, expect, it, vi } from "vitest";
import { INITIAL_PHASE_PRESENTATION } from "../types";
import { SetMusicModeAction } from "./SetMusicModeAction";

describe("SetMusicModeAction", () => {
    it("sets music mode when it changes", async () => {
        const patchPresentation = vi.fn();
        const ensureMusicPlaying = vi.fn();
        const action = new SetMusicModeAction("fugitive");

        await action.run({
            getPresentation: () => INITIAL_PHASE_PRESENTATION,
            patchPresentation,
            services: { ensureMusicPlaying },
        } as never);

        expect(patchPresentation).toHaveBeenCalledWith({ musicMode: "fugitive" });
        expect(ensureMusicPlaying).toHaveBeenCalled();
    });

    it("still resumes music when the requested mode is already active", async () => {
        const patchPresentation = vi.fn();
        const ensureMusicPlaying = vi.fn();
        const action = new SetMusicModeAction("fugitive");

        await action.run({
            getPresentation: () => ({ ...INITIAL_PHASE_PRESENTATION, musicMode: "fugitive" }),
            patchPresentation,
            services: { ensureMusicPlaying },
        } as never);

        expect(patchPresentation).not.toHaveBeenCalled();
        expect(ensureMusicPlaying).toHaveBeenCalled();
    });
});
