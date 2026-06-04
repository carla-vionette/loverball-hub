/**
 * Pure helpers for the event password gate.
 *
 * The UI is just a thin shell around these functions so we can unit-test the
 * state machine deterministically with mocked time.
 *
 * Naming follows the server response shape from `verify_event_password`
 * (see supabase migration): `{ ok, locked, attempts_left, retry_after_seconds,
 * error? }`. The server no longer enforces a lockout, but the return shape is
 * kept for backward compatibility.
 */

const SESSION_TOKEN_BYTES = 16;

export const SESSION_TOKEN_KEY = "event_pw_session_token";
export const unlockKey = (id: string) => `event_unlock_${id}`;

export type VerifyResponse = {
  ok?: boolean;
  locked?: boolean;
  attempts_left?: number;
  retry_after_seconds?: number;
  error?: string;
};

/** Discrete UI states the gate can be in. */
export type GateStatus = "idle" | "wrong";

export interface GateState {
  status: GateStatus;
  message: string | null;
}

/**
 * Derive the visible gate state from the current error. Pure — easy to test.
 */
export const deriveState = (args: {
  /** Optional override copy for the "wrong password" path. */
  lastError?: string | null;
}): GateState => {
  const { lastError } = args;

  if (lastError) {
    return {
      status: "wrong",
      message: lastError,
    };
  }

  return {
    status: "idle",
    message: null,
  };
};

/**
 * Apply a server verify response to local state. Returns the next
 * `{ unlocked, error }` pair. Server is source of truth.
 */
export const applyVerifyResponse = (
  res: VerifyResponse,
): { unlocked: boolean; error: string | null } => {
  if (res.ok === true) {
    return { unlocked: true, error: null };
  }
  return {
    unlocked: false,
    error: "That password didn't work. Please try again.",
  };
};

/** Stable per-browser token; passed to the server for anonymous users. */
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
