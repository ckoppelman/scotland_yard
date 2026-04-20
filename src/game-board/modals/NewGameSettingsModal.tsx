import { useCallback, useEffect, useState, type FormEvent, type TransitionEventHandler } from "react";
import {
  DEFAULT_NEW_GAME_SETTINGS,
  type NewGameSettings,
} from "../../game/gameState";
import type { GameMapId } from "../../game/mapIds";
import { getMapGraph, MAP_SELECT_OPTIONS } from "../../game/mapRegistry";

const MAX_DETECTIVES = 5;
const MAX_FUGITIVES = 3;

type FadeApi = {
  mounted: boolean;
  openClass: boolean;
  requestClose: () => void;
  onBackdropTransitionEnd: TransitionEventHandler<HTMLDivElement>;
};

type Props = {
  fade: FadeApi;
  onConfirm: (settings: NewGameSettings) => void;
};

function parseNonNegativeInt(raw: string, fallback: number): number {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 0) return fallback;
  return n;
}

function clampPlayerCountsToMap(
  numDetectives: number,
  numFugitives: number,
  maxSlots: number,
): { numDetectives: number; numFugitives: number } {
  let nd = Math.min(MAX_DETECTIVES, Math.max(1, numDetectives));
  let nf = Math.min(MAX_FUGITIVES, Math.max(1, numFugitives));
  while (nd + nf > maxSlots) {
    if (nd >= nf && nd > 1) nd -= 1;
    else if (nf > 1) nf -= 1;
    else if (nd > 1) nd -= 1;
    else break;
  }
  return { numDetectives: nd, numFugitives: nf };
}

export function NewGameSettingsModal({ fade, onConfirm }: Props) {
  const [form, setForm] = useState<NewGameSettings>(DEFAULT_NEW_GAME_SETTINGS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fade.openClass) {
      setForm({
        ...DEFAULT_NEW_GAME_SETTINGS,
        detectiveTickets: { ...DEFAULT_NEW_GAME_SETTINGS.detectiveTickets },
        fugitiveTickets: { ...DEFAULT_NEW_GAME_SETTINGS.fugitiveTickets },
      });
      setError(null);
    }
  }, [fade.openClass]);

  const mapGraphForForm = getMapGraph(form.mapId);
  const maxStartingSlots = mapGraphForForm.startingPositions.length;

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const { numDetectives, numFugitives } = form;
      if (numDetectives < 1 || numDetectives > MAX_DETECTIVES) {
        setError(`Detectives must be between 1 and ${MAX_DETECTIVES}.`);
        return;
      }
      if (numFugitives < 1 || numFugitives > MAX_FUGITIVES) {
        setError(`Fugitives must be between 1 and ${MAX_FUGITIVES}.`);
        return;
      }
      if (numDetectives + numFugitives > maxStartingSlots) {
        setError(
          `This map has ${maxStartingSlots} starting positions; detectives plus fugitives cannot exceed that.`,
        );
        return;
      }
      setError(null);
      onConfirm(form);
    },
    [form, maxStartingSlots, onConfirm],
  );

  if (!fade.mounted) return null;

  return (
    <div
      className={`privacy-turn-modal privacy-turn-modal--intro${fade.openClass ? " privacy-turn-modal--open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-game-settings-title"
      onTransitionEnd={fade.onBackdropTransitionEnd}
    >
      <div className="privacy-turn-modal__panel privacy-turn-modal__panel--intro" onClick={(e) => e.stopPropagation()}>
        <h2 id="new-game-settings-title" className="privacy-turn-modal__intro-title">
          New game
        </h2>
        <p className="privacy-turn-modal__intro-sub">Choose players and starting tickets</p>
        <form className="new-game-settings" onSubmit={onSubmit}>
          <label className="new-game-settings__field new-game-settings__field--map">
            <span className="new-game-settings__label">Map</span>
            <select
              className="new-game-settings__input new-game-settings__select"
              value={form.mapId}
              onChange={(e) => {
                const mapId = e.target.value as GameMapId;
                const maxSlots = getMapGraph(mapId).startingPositions.length;
                setForm((f) => {
                  const next = clampPlayerCountsToMap(f.numDetectives, f.numFugitives, maxSlots);
                  return { ...f, mapId, ...next };
                });
              }}
            >
              {MAP_SELECT_OPTIONS.map(({ id, label }) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="new-game-settings__row new-game-settings__row--counts">
            <label className="new-game-settings__field">
              <span className="new-game-settings__label">Detectives</span>
              <input
                type="number"
                className="new-game-settings__input"
                min={1}
                max={MAX_DETECTIVES}
                required
                value={form.numDetectives}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    numDetectives: parseNonNegativeInt(e.target.value, f.numDetectives),
                  }))
                }
              />
            </label>
            <label className="new-game-settings__field">
              <span className="new-game-settings__label">Fugitives</span>
              <input
                type="number"
                className="new-game-settings__input"
                min={1}
                max={MAX_FUGITIVES}
                required
                value={form.numFugitives}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    numFugitives: parseNonNegativeInt(e.target.value, f.numFugitives),
                  }))
                }
              />
            </label>
          </div>
          <fieldset className="new-game-settings__fieldset">
            <legend className="new-game-settings__legend">Detective starting tickets</legend>
            <div className="new-game-settings__ticket-grid">
              <label className="new-game-settings__field">
                <span className="new-game-settings__label">🚕 Taxi</span>
                <input
                  type="number"
                  className="new-game-settings__input"
                  min={0}
                  value={form.detectiveTickets.taxi}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      detectiveTickets: { ...f.detectiveTickets, taxi: parseNonNegativeInt(e.target.value, f.detectiveTickets.taxi) },
                    }))
                  }
                />
              </label>
              <label className="new-game-settings__field">
                <span className="new-game-settings__label">🚌 Bus</span>
                <input
                  type="number"
                  className="new-game-settings__input"
                  min={0}
                  value={form.detectiveTickets.bus}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      detectiveTickets: { ...f.detectiveTickets, bus: parseNonNegativeInt(e.target.value, f.detectiveTickets.bus) },
                    }))
                  }
                />
              </label>
              <label className="new-game-settings__field">
                <span className="new-game-settings__label">🚇 Underground</span>
                <input
                  type="number"
                  className="new-game-settings__input"
                  min={0}
                  value={form.detectiveTickets.underground}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      detectiveTickets: {
                        ...f.detectiveTickets,
                        underground: parseNonNegativeInt(e.target.value, f.detectiveTickets.underground),
                      },
                    }))
                  }
                />
              </label>
            </div>
          </fieldset>
          <fieldset className="new-game-settings__fieldset">
            <legend className="new-game-settings__legend">Fugitive starting tickets</legend>
            <div className="new-game-settings__ticket-grid new-game-settings__ticket-grid--wide">
              <label className="new-game-settings__field">
                <span className="new-game-settings__label">🚕 Taxi</span>
                <input
                  type="number"
                  className="new-game-settings__input"
                  min={0}
                  value={form.fugitiveTickets.taxi}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      fugitiveTickets: { ...f.fugitiveTickets, taxi: parseNonNegativeInt(e.target.value, f.fugitiveTickets.taxi) },
                    }))
                  }
                />
              </label>
              <label className="new-game-settings__field">
                <span className="new-game-settings__label">🚌 Bus</span>
                <input
                  type="number"
                  className="new-game-settings__input"
                  min={0}
                  value={form.fugitiveTickets.bus}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      fugitiveTickets: { ...f.fugitiveTickets, bus: parseNonNegativeInt(e.target.value, f.fugitiveTickets.bus) },
                    }))
                  }
                />
              </label>
              <label className="new-game-settings__field">
                <span className="new-game-settings__label">🚇 Underground</span>
                <input
                  type="number"
                  className="new-game-settings__input"
                  min={0}
                  value={form.fugitiveTickets.underground}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      fugitiveTickets: {
                        ...f.fugitiveTickets,
                        underground: parseNonNegativeInt(e.target.value, f.fugitiveTickets.underground),
                      },
                    }))
                  }
                />
              </label>
              <label className="new-game-settings__field">
                <span className="new-game-settings__label">Black</span>
                <input
                  type="number"
                  className="new-game-settings__input"
                  min={0}
                  value={form.fugitiveTickets.black}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      fugitiveTickets: { ...f.fugitiveTickets, black: parseNonNegativeInt(e.target.value, f.fugitiveTickets.black) },
                    }))
                  }
                />
              </label>
              <label className="new-game-settings__field">
                <span className="new-game-settings__label">Double</span>
                <input
                  type="number"
                  className="new-game-settings__input"
                  min={0}
                  value={form.fugitiveTickets.double}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      fugitiveTickets: { ...f.fugitiveTickets, double: parseNonNegativeInt(e.target.value, f.fugitiveTickets.double) },
                    }))
                  }
                />
              </label>
            </div>
          </fieldset>
          {error !== null && (
            <p className="new-game-settings__error" role="alert">
              {error}
            </p>
          )}
          <div className="new-game-settings__actions">
            <button type="button" className="new-game-settings__btn new-game-settings__btn--secondary" onClick={fade.requestClose}>
              Cancel
            </button>
            <button type="submit" className="new-game-settings__btn new-game-settings__btn--primary">
              Start game
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
