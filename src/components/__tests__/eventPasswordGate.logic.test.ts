import { describe, it, expect } from "vitest";
import {
  MAX_ATTEMPTS,
  LOCKOUT_MS,
  applyVerifyResponse,
  deriveState,
  formatRemaining,
  getOrCreateSessionToken,
} from "../eventPasswordGate.logic";

// Frozen "now" lets us assert exact deadlines without flakiness.
const T0 = 1_700_000_000_000;

describe("formatRemaining", () => {
  it("formats sub-minute durations as seconds", () => {
    expect(formatRemaining(15_000)).toBe("15s");
  });
  it("formats minute+seconds with zero-padded seconds", () => {
    expect(formatRemaining(65_000)).toBe("1m 05s");
  });
  it("clamps negative values to 0s", () => {
    expect(formatRemaining(-1)).toBe("0s");
  });
});

describe("applyVerifyResponse", () => {
  it("treats ok=true as unlocked and resets counters", () => {
    const r = applyVerifyResponse({ ok: true }, T0);
    expect(r).toEqual({ unlocked: true, lockedUntil: 0, attemptsLeft: MAX_ATTEMPTS, error: null });
  });

  it("converts a server-reported wrong attempt into the next state", () => {
    const r = applyVerifyResponse({ ok: false, locked: false, attempts_left: 3 }, T0);
    expect(r.unlocked).toBe(false);
    expect(r.lockedUntil).toBe(0);
    expect(r.attemptsLeft).toBe(3);
    expect(r.error).toMatch(/3 attempts left/);
  });

  it("uses singular copy when exactly one attempt remains", () => {
    const r = applyVerifyResponse({ ok: false, attempts_left: 1 }, T0);
    expect(r.error).toMatch(/1 attempt left/);
  });

  it("turns locked=true into a future deadline using retry_after_seconds", () => {
    const r = applyVerifyResponse({ ok: false, locked: true, retry_after_seconds: 120 }, T0);
    expect(r.unlocked).toBe(false);
    expect(r.lockedUntil).toBe(T0 + 120_000);
    expect(r.attemptsLeft).toBe(0);
    expect(r.error).toMatch(/Too many wrong attempts/);
  });

  it("falls back to LOCKOUT_MS when the server omits retry_after_seconds", () => {
    const r = applyVerifyResponse({ ok: false, locked: true }, T0);
    expect(r.lockedUntil).toBe(T0 + LOCKOUT_MS);
  });

  it("never echoes server error strings (no account-validity leak)", () => {
    const r = applyVerifyResponse(
      // pretend the server tried to leak something — we ignore it
      { ok: false, locked: false, attempts_left: 2, error: "user u@x.com not found" },
      T0,
    );
    expect(r.error).not.toMatch(/user|email|@/i);
  });
});

describe("deriveState", () => {
  it("idle when no error and no lockout", () => {
    const s = deriveState({ lockedUntil: 0, attemptsLeft: MAX_ATTEMPTS, now: T0 });
    expect(s.status).toBe("idle");
    expect(s.message).toBeNull();
  });

  it("wrong when an error is present and >1 attempt left", () => {
    const s = deriveState({
      lockedUntil: 0,
      attemptsLeft: 3,
      now: T0,
      lastError: "That password didn't work. 3 attempts left before a temporary lockout.",
    });
    expect(s.status).toBe("wrong");
    expect(s.message).toMatch(/3 attempts left/);
  });

  it("last_attempt when exactly one attempt remains and an error is present", () => {
    const s = deriveState({
      lockedUntil: 0,
      attemptsLeft: 1,
      now: T0,
      lastError: "anything",
    });
    expect(s.status).toBe("last_attempt");
    expect(s.message).toMatch(/1 attempt left/);
  });

  it("locked while cooldown is in the future, with countdown copy", () => {
    const s = deriveState({ lockedUntil: T0 + 90_000, attemptsLeft: 0, now: T0 });
    expect(s.status).toBe("locked");
    expect(s.remainingMs).toBe(90_000);
    expect(s.message).toMatch(/1m 30s/);
  });

  it("cooldown_expired the moment now catches up to the deadline", () => {
    const s = deriveState({ lockedUntil: T0, attemptsLeft: 0, now: T0 });
    expect(s.status).toBe("cooldown_expired");
    expect(s.lockedUntil).toBe(0);
    expect(s.attemptsLeft).toBe(MAX_ATTEMPTS);
  });

  it("transitions locked → cooldown_expired purely as a function of time", () => {
    const lockedUntil = T0 + 5_000;
    expect(deriveState({ lockedUntil, attemptsLeft: 0, now: T0 + 1_000 }).status).toBe("locked");
    expect(deriveState({ lockedUntil, attemptsLeft: 0, now: T0 + 5_000 }).status).toBe(
      "cooldown_expired",
    );
    expect(deriveState({ lockedUntil, attemptsLeft: 0, now: T0 + 10_000 }).status).toBe(
      "cooldown_expired",
    );
  });
});

describe("end-to-end: failed attempts → lockout → cooldown → retry", () => {
  it("walks the full state machine with mocked time", () => {
    let lockedUntil = 0;
    let attemptsLeft = MAX_ATTEMPTS;
    let err: string | null = null;
    let now = T0;

    // 4 wrong attempts (server counts down attempts_left).
    for (let i = 0; i < 4; i++) {
      const next = applyVerifyResponse(
        { ok: false, locked: false, attempts_left: MAX_ATTEMPTS - (i + 1) },
        now,
      );
      lockedUntil = next.lockedUntil;
      attemptsLeft = next.attemptsLeft;
      err = next.error;
    }
    expect(deriveState({ lockedUntil, attemptsLeft, now, lastError: err }).status).toBe(
      "last_attempt",
    );

    // 5th wrong → server returns locked=true.
    const locked = applyVerifyResponse(
      { ok: false, locked: true, retry_after_seconds: 300 },
      now,
    );
    lockedUntil = locked.lockedUntil;
    attemptsLeft = locked.attemptsLeft;
    err = locked.error;
    expect(deriveState({ lockedUntil, attemptsLeft, now, lastError: err }).status).toBe("locked");

    // Halfway through cooldown — still locked.
    now += 150_000;
    expect(deriveState({ lockedUntil, attemptsLeft, now }).status).toBe("locked");

    // Cooldown elapsed — UI surfaces cooldown_expired.
    now += 200_000;
    const expired = deriveState({ lockedUntil, attemptsLeft, now });
    expect(expired.status).toBe("cooldown_expired");
    expect(expired.attemptsLeft).toBe(MAX_ATTEMPTS);

    // After UI clears the deadline, a successful verify unlocks.
    const ok = applyVerifyResponse({ ok: true }, now);
    expect(ok.unlocked).toBe(true);
  });

  it("a password change during lockout does not bypass: locked response keeps user locked", () => {
    // Even if the server now accepts a different password, while locked=true the
    // response still has ok=false and the client honors the deadline.
    const next = applyVerifyResponse(
      { ok: false, locked: true, retry_after_seconds: 60 },
      T0,
    );
    expect(next.unlocked).toBe(false);
    expect(next.lockedUntil).toBe(T0 + 60_000);
  });

  it("switching identifiers (new session token) is observed as a fresh state from the UI", () => {
    // Identifier swap is a server-side concept — from the client's POV it just
    // means a fresh response with attempts_left near MAX. We assert the helper
    // doesn't carry stale lockout state across responses.
    const fresh = applyVerifyResponse({ ok: false, attempts_left: 4 }, T0);
    expect(fresh.lockedUntil).toBe(0);
    expect(fresh.attemptsLeft).toBe(4);
  });
});

describe("getOrCreateSessionToken", () => {
  const makeStorage = () => {
    const m = new Map<string, string>();
    return {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
      _map: m,
    };
  };

  it("creates and persists a 32-hex-char token on first call", () => {
    const s = makeStorage();
    const t = getOrCreateSessionToken(s);
    expect(t).toMatch(/^[0-9a-f]{32}$/);
    expect(s._map.get("event_pw_session_token")).toBe(t);
  });

  it("returns the existing token on subsequent calls", () => {
    const s = makeStorage();
    const a = getOrCreateSessionToken(s);
    const b = getOrCreateSessionToken(s);
    expect(a).toBe(b);
  });
});
