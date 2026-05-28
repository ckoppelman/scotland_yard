# Fugitive cutscene and move feedback

After every fugitive round, the game pauses in `FUGITIVE_CUTSCENE` phase before detectives take their turns. A short cinematic summarizes what happened: headlines, transport emojis, ticket flips on the Mr. X round log, optional reveal poof, and sound.

With **multiple fugitives**, each move is staggered **1.5 seconds** apart so beats do not pile on top of each other.

## When the cutscene runs

1. All fugitives finish their moves for the round.
2. The active player dismisses **Detective privacy** (`PRIVACY_DETECTIVE` → `FUGITIVE_CUTSCENE`).
3. `App.tsx` calls `runFugitiveCutscene`, which plays `playDetectivePhaseStartIntro` then advances to `DETECTIVE` via `completeFugitiveCutscene`.

The cutscene is **not** replayed when resuming a saved game in cutscene phase unless the guard allows it once per token (see below).

## Timing constants

Defined in [`src/game/cutsceneTiming.ts`](../src/game/cutsceneTiming.ts):

| Constant | Value | Role |
|----------|-------|------|
| `GAMEPLAY_ANIMATION_MS` | 2000 | Length of one emoji sweep, ticket flip, headline pop, or transport SFX beat |
| `FUGITIVE_ANIMATION_STAGGER_MS` | 1500 | Delay between successive fugitive moves in a multi-fugitive round |
| `fugitiveCutsceneDurationMs(n)` | `2000 + (n − 1) × 1500` | Minimum time before the cutscene can finish when animations are enabled |

Helpers:

- `fugitiveAnimationDelayMs(index)` / `fugitiveAnimationDelaySeconds(index)` — delay for move at `index` (0-based, in round order).

## What staggers per move

All staggered elements use the same index from [`latestFugitiveRoundMoves`](../src/game/fugitiveTicketMarkers.ts) (moves in chronological order for the round that just ended).

| Feedback | File | Mechanism |
|----------|------|-----------|
| “{Name} has moved” headlines | [`FugitiveCutsceneMapOverlay.tsx`](../src/game-board/animations/FugitiveCutsceneMapOverlay.tsx) | CSS `animation-delay` on each headline |
| Transport emoji sweep (🚕 🚐 🚈 🛸) | Same overlay | CSS `animation-delay` per move with a transport ticket |
| Ticket flip on Mr. X board | [`playerCards.tsx`](../src/game-board/players/playerCards.tsx) → [`MrXTicketFlip.tsx`](../src/game-board/animations/MrXTicketFlip.tsx) | CSS `animation-delay` via `cutsceneFlip.delay` |
| Transport SFX | [`playDetectivePhaseStartIntro.ts`](../src/audio/playDetectivePhaseStartIntro.ts) | `setTimeout` + `playSfxForAtLeast` per move |
| Cutscene map poof (reveal rounds only) | [`App.tsx`](../src/App.tsx) handlers | Single poof at cutscene start (not per fugitive) |

Moves that used **double** or other non-transport tickets still get a stagger slot for the headline; they skip emoji and transport SFX for that index.

## Reveal vs hide rounds

- **Reveal** (`showMrX` on the current round): fugitive tokens may appear with an “in” poof; transport SFX play per move; reveal screech is **not** used during cutscene (the overlay owns the moment).
- **Hide**: if no transport moves exist, one `FUGITIVE_HIDE` stinger plays for the full cutscene duration; otherwise transport SFX stagger as above.

## Live fugitive turns (during `FUGITIVE` phase)

While fugitives are still moving, feedback is **one move at a time** (no multi-fugitive stagger):

- Transport emoji: [`TransportEmojiOverlay.tsx`](../src/game-board/animations/TransportEmojiOverlay.tsx) via `onTransportAnimation` in [`playGameSfx.ts`](../src/audio/playGameSfx.ts).
- Handoff between fugitives in the same round: transport SFX still plays; **reveal/hide stingers are suppressed** so the cutscene can handle visibility drama later ([`fugitiveVisibilitySfx.ts`](../src/audio/fugitiveVisibilitySfx.ts)).

## Duplicate cutscene guard

[`fugitiveCutsceneGuard.ts`](../src/game/fugitiveCutsceneGuard.ts) tracks cutscenes by token `"{turnNumber}-{turnLog.length}"`. React Strict Mode or double privacy dismiss must not run the same cutscene twice. Tests live in [`fugitiveCutsceneGuard.test.ts`](../src/game/fugitiveCutsceneGuard.test.ts).

## Settings

- **Animations** (`displayPreferences`): when disabled, cutscene uses `MIN_SFX_BEFORE_TURN_MS` instead of staggered visual timing; poof and overlay delays are shortened via CSS `prefers-reduced-motion` where applicable.
- **SFX / music**: independent toggles in the game menu; cutscene respects SFX enabled state.

## Tests

| Area | File |
|------|------|
| Timing helpers | [`cutsceneTiming.test.ts`](../src/game/cutsceneTiming.test.ts) |
| Cutscene intro + staggered SFX | [`playDetectivePhaseStartIntro.test.ts`](../src/audio/playDetectivePhaseStartIntro.test.ts) |
| Handoff / visibility SFX rules | [`fugitiveVisibilitySfx.test.ts`](../src/audio/fugitiveVisibilitySfx.test.ts) |
| Guard | [`fugitiveCutsceneGuard.test.ts`](../src/game/fugitiveCutsceneGuard.test.ts) |
| Intro payload | [`detectiveTurnIntro.test.ts`](../src/game/detectiveTurnIntro.test.ts) |

## Changing the stagger

Edit `FUGITIVE_ANIMATION_STAGGER_MS` in `cutsceneTiming.ts`. Then update:

1. `fugitiveCutsceneDurationMs` (derived automatically).
2. Tests in `cutsceneTiming.test.ts` and `playDetectivePhaseStartIntro.test.ts`.
3. Any CSS that assumes a fixed 2s animation length if you change `GAMEPLAY_ANIMATION_MS` as well.

Visual delays read from `fugitiveAnimationDelaySeconds`; audio reads from `fugitiveAnimationDelayMs` — keep both in sync via the shared constant.
