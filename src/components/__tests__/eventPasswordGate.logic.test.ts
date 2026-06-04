import { describe, it, expect } from "vitest";
import {
  applyVerifyResponse,
  deriveState,
  getOrCreateSessionToken,
} from "../eventPasswordGate.logic";

describe("applyVerifyResponse", () => {
  it("treats ok=true as unlocked", () => {
    const r = applyVerifyResponse({ ok: true });
    expect(r).toEqual({ unlocked: true, error: null });
  });

  it("returns a generic error when ok=false", () => {
    const r = applyVerifyResponse({ ok: false });
    expect(r.unlocked).toBe(false);
    expect(r.error).toMatch(/didn't work/);
  });

  it("ignores server error strings (no account-validity leak)", () => {
    const r = applyVerifyResponse(
      { ok: false, error: "user u@x.com not found" },
    );
    expect(r.error).not.toMatch(/user|email|@/i);
  });
});

describe("deriveState", () => {
  it("idle when no error", () => {
    const s = deriveState({});
    expect(s.status).toBe("idle");
    expect(s.message).toBeNull();
  });

  it("wrong when an error is present", () => {
    const s = deriveState({ lastError: "That password didn't work." });
    expect(s.status).toBe("wrong");
    expect(s.message).toBe("That password didn't work.");
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
