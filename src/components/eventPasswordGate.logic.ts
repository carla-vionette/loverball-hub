/**
 * Pure helpers for the event password gate.
 *
 * The UI is just a thin shell around these functions so we can unit-test the
 * full state machine (idle → wrong → last-attempt → locked → cooldown ticking
 * → cooldown expired → idle) deterministically with mocked time.
 *
 * Naming follows the server response shape from `verify_event_password`
 * (see supabase migration 20260603171332): `{ ok, locked, attempts_left,
 * retry_after_seconds, error? }`. The server is always the source of truth;
 * local storage is only used to remember the lockout deadline across reloads
 * so the UI can render the cooldown timer without re-querying the server.
 */

export const MAX_ATTEMPTS = 5;
export const LOCKOUT_MS = 5 * 60 * 1000;
const SESSION_TOKEN_BYTES = 16;

export const SESSION_TOKEN_KEY = "event_pw_session_token";
export const unlockKey = (id: string) => `event_unlock_${id}`;
export const lockoutKey = (id: string) => `event_pw_lockout_${id}`;
export const attemptsLeftKey = (id: string) => `event_pw_left_${id}`;

export type VerifyResponse = {
  ok?: boolean;
  locked?: boolean;
  attempts_left?: number;
  retry_after_seconds?: number;
  error?: string;
};

/** Discrete UI states the gate can be in. */
export type GateStatus =
  | "idle"               // nothing tried yet (or any non-error state)
  | "wrong"              // last submit was wrong, more attempts remain
  | "last_attempt"       // exactly one attempt left before lockout
  | "locked"             // server says we are in a cooldown window
  | "cooldown_expired";  // local deadline passed; ready to try again

export interface GateState {
  status: GateStatus;
  attemptsLeft: number;       // 0..MAX_ATTEMPTS
  lockedUntil: number;        // epoch ms; 0 if not locked
  remainingMs: number;        // ms until cooldown ends; 0 if not locked
  message: string | null;     // user-facing copy for the current state
}

/** Format ms as "Xm SSs" or "Ns" — used in inline copy. */
export const formatRemaining = (ms: number): string => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r.toString().padStart(2, "0")}s` : `${r}s`;
};

/** Format ms as a clock-style "M:SS" — used for the large countdown timer. */
export const formatCountdown = (ms: number): string => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

/**
 * Derive the visible gate state from a stored lockout deadline, the
 * server-reported attempts_left, and the current time. Pure — easy to test.
 */
export const deriveState = (args: {
  lockedUntil: number;
  attemptsLeft: number;
  now: number;
  /** Optional override copy for the "wrong password" path. */
  lastError?: string | null;
}): GateState => {
  const { lockedUntil, attemptsLeft, now, lastError } = args;
  const remainingMs = Math.max(0, lockedUntil - now);

  if (remainingMs > 0) {
    return {
      status: "locked",
      attemptsLeft: 0,
      lockedUntil,
      remainingMs,
      message: `Too many wrong attempts. Try again in ${formatRemaining(remainingMs)}.`,
    };
  }

  // Cooldown just expired — UI should clear the deadline next render.
  if (lockedUntil > 0 && remainingMs === 0) {
    return {
      status: "cooldown_expired",
      attemptsLeft: MAX_ATTEMPTS,
      lockedUntil: 0,
      remainingMs: 0,
      message: "You can try again now.",
    };
  }

  if (attemptsLeft === 1 && lastError) {
    return {
      status: "last_attempt",
      attemptsLeft,
      lockedUntil: 0,
      remainingMs: 0,
      message: "That password didn't work. 1 attempt left before a temporary lockout.",
    };
  }

  if (lastError) {
    return {
      status: "wrong",
      attemptsLeft,
      lockedUntil: 0,
      remainingMs: 0,
      message: lastError,
    };
  }

  return {
    status: "idle",
    attemptsLeft: attemptsLeft || MAX_ATTEMPTS,
    lockedUntil: 0,
    remainingMs: 0,
    message: null,
  };
};

/**
 * Apply a server verify response to local state. Returns the next
 * `{ lockedUntil, attemptsLeft, error }` triple. Server is source of truth;
 * we only translate it for the UI.
 *
 * Importantly, errors NEVER reference accounts/emails — we always talk about
 * the password or lockout window to avoid leaking account validity.
 */
export const applyVerifyResponse = (
  res: VerifyResponse,
  now: number,
): { unlocked: boolean; lockedUntil: number; attemptsLeft: number; error: string | null } => {
  if (res.ok === true) {
    return { unlocked: true, lockedUntil: 0, attemptsLeft: MAX_ATTEMPTS, error: null };
  }
  if (res.locked) {
    const secs = Math.max(1, res.retry_after_seconds ?? LOCKOUT_MS / 1000);
    return {
      unlocked: false,
      lockedUntil: now + secs * 1000,
      attemptsLeft: 0,
      error: `Too many wrong attempts. Try again in ${formatRemaining(secs * 1000)}.`,
    };
  }
  const left = Math.max(0, res.attempts_left ?? MAX_ATTEMPTS - 1);
  return {
    unlocked: false,
    lockedUntil: 0,
    attemptsLeft: left,
    error:
      left === 1
        ? "That password didn't work. 1 attempt left before a temporary lockout."
        : `That password didn't work. ${left} attempts left before a temporary lockout.`,
  };
};

/** Stable per-browser token; the server keys lockouts off it for anon users. */
export const getOrCreateSessionToken = (
  storage: Pick<Storage, "getItem" | "setItem"> = localStorage,
  rand: (n: number) => Uint8Array = (n) => {
    const a = new Uint8Array(n);
    crypto.getRandomValues(a);
    return a;
  },
): string => {
  try {
    const existing = storage.getItem(SESSION_TOKEN_KEY);
    if (existing && existing.length >= 16) return existing;
    const t = Array.from(rand(SESSION_TOKEN_BYTES), (b) => b.toString(16).padStart(2, "0")).join("");
    storage.setItem(SESSION_TOKEN_KEY, t);
    return t;
  } catch {
    // Storage unavailable (private mode, SSR): fall back to a per-call token.
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
};
