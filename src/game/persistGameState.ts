import type {
  GameState,
  PlayerState,
  TurnLog,
  TurnLogEntry,
} from "./gameState";
import type { GameMapId } from "./mapIds";
import { GAME_MAP_IDS } from "./mapIds";
import { getMapGraph } from "./mapRegistry";

const STORAGE_V1 = "scotland-yard:game:v1";
/** Raw AES-256 key material; kept out of localStorage so saved ciphertext stays opaque there. */
const SESSION_KEY_B64 = "scotland-yard:mrx-key:v1";

function isPersistedMapId(value: string): value is GameMapId {
  return (GAME_MAP_IDS as readonly string[]).includes(value);
}

function isMrXPlayer(players: PlayerState[], ordinal: number): boolean {
  const p = players[ordinal];
  return p !== undefined && !p.description.isDetective;
}

type MrXSecretV1 = {
  v: 1;
  /** Non-detective player ordinal → station id */
  playerPositions: Record<number, number | null>;
  /** Turn log index → station id for Mr X–only rows */
  turnLogPositions: Record<number, number>;
};

type PersistedPayloadV1 = {
  v: 1;
  mapId: GameMapId;
  players: PlayerState[];
  currentTurn: GameState["currentTurn"];
  gameover: GameState["gameover"];
  turns: GameState["turns"];
  /** Mr X rows use position -1 as a sentinel; filled from ciphertext after decrypt */
  turnLog: TurnLog;
  /** AES-GCM(iv || ciphertext), base64 */
  mrxCipher: string;
};

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function getOrCreateAesKey(): Promise<CryptoKey> {
  const existing = sessionStorage.getItem(SESSION_KEY_B64);
  let raw: Uint8Array;
  if (existing) {
    raw = base64ToUint8(existing);
    if (raw.byteLength !== 32) {
      raw = new Uint8Array(32);
      crypto.getRandomValues(raw);
      sessionStorage.setItem(SESSION_KEY_B64, uint8ToBase64(raw));
    }
  } else {
    raw = new Uint8Array(32);
    crypto.getRandomValues(raw);
    sessionStorage.setItem(SESSION_KEY_B64, uint8ToBase64(raw));
  }
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

async function encryptJson(key: CryptoKey, obj: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(obj));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data),
  );
  const out = new Uint8Array(iv.length + cipher.length);
  out.set(iv, 0);
  out.set(cipher, iv.length);
  return uint8ToBase64(out);
}

async function decryptJson<T>(key: CryptoKey, b64: string): Promise<T | null> {
  try {
    const combined = base64ToUint8(b64);
    if (combined.length < 13) return null;
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );
    return JSON.parse(new TextDecoder().decode(plain)) as T;
  } catch {
    return null;
  }
}

const SENTINEL_MRX = -1;

function buildSecretFromState(state: GameState): MrXSecretV1 {
  const playerPositions: Record<number, number | null> = {};
  for (let i = 0; i < state.players.length; i++) {
    if (!isMrXPlayer(state.players, i)) continue;
    playerPositions[i] = state.players[i]!.position;
  }
  const turnLogPositions: Record<number, number> = {};
  for (let i = 0; i < state.turnLog.length; i++) {
    const e = state.turnLog[i]!;
    if (!isMrXPlayer(state.players, e.playerOrdinal)) continue;
    turnLogPositions[i] = e.position;
  }
  return { v: 1, playerPositions, turnLogPositions };
}

function stripForStorage(state: GameState): Omit<PersistedPayloadV1, "mrxCipher"> {
  const players = state.players.map((p) =>
    p.description.isDetective
      ? p
      : { ...p, position: null as number | null },
  );
  const turnLog: TurnLog = state.turnLog.map((e) =>
    isMrXPlayer(state.players, e.playerOrdinal)
      ? ({ ...e, position: SENTINEL_MRX } as TurnLogEntry)
      : e,
  );
  return {
    v: 1,
    mapId: state.mapId,
    players,
    currentTurn: state.currentTurn,
    gameover: state.gameover,
    turns: state.turns,
    turnLog,
  };
}

function applySecret(
  base: Omit<PersistedPayloadV1, "mrxCipher">,
  secret: MrXSecretV1,
): GameState {
  const mapGraph = getMapGraph(base.mapId);
  const players = base.players.map((p, i) => {
    if (p.description.isDetective) return p;
    const pos = secret.playerPositions[i];
    return { ...p, position: pos ?? null };
  });
  const turnLog = base.turnLog.map((e, i) => {
    if (!isMrXPlayer(players, e.playerOrdinal)) return e;
    const pos = secret.turnLogPositions[i];
    if (pos === undefined) return e;
    return { ...e, position: pos };
  });
  return {
    mapId: base.mapId,
    players,
    currentTurn: base.currentTurn,
    gameover: base.gameover,
    mapGraph,
    turns: base.turns,
    turnLog,
  };
}

export async function saveGameState(state: GameState): Promise<void> {
  const key = await getOrCreateAesKey();
  const secret = buildSecretFromState(state);
  const mrxCipher = await encryptJson(key, secret);
  const payload: PersistedPayloadV1 = {
    ...stripForStorage(state),
    mrxCipher,
  };
  try {
    localStorage.setItem(STORAGE_V1, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export async function loadPersistedGameState(): Promise<GameState | null> {
  const raw = localStorage.getItem(STORAGE_V1);
  if (!raw) return null;
  let parsed: PersistedPayloadV1;
  try {
    parsed = JSON.parse(raw) as PersistedPayloadV1;
  } catch {
    return null;
  }
  if (parsed.v !== 1 || !parsed.mrxCipher || !parsed.mapId) return null;
  if (!isPersistedMapId(parsed.mapId)) return null;

  const { mrxCipher, ...rest } = parsed;
  const key = await getOrCreateAesKey();
  const secret = await decryptJson<MrXSecretV1>(key, mrxCipher);
  if (!secret || secret.v !== 1) {
    // Missing or wrong session key (e.g. new tab): leave localStorage so another tab can still load.
    return null;
  }
  return applySecret(rest, secret);
}

export function clearPersistedGameState(): void {
  try {
    localStorage.removeItem(STORAGE_V1);
  } catch {
    /* ignore */
  }
}
