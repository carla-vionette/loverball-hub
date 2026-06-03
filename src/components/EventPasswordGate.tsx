import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { C, fonts } from "@/lib/editorialTheme";
import {
  MAX_ATTEMPTS,
  applyVerifyResponse,
  deriveState,
  formatCountdown,
  getOrCreateSessionToken,
  lockoutKey,
  attemptsLeftKey,
  unlockKey,
  type VerifyResponse,
} from "./eventPasswordGate.logic";
import { subscribeGateBus, type GateBus } from "./eventPasswordGate.bus";

interface Props {
  eventId: string;
  eventTitle: string;
  coverImage: string | null;
  onUnlock: () => void;
}

// ---- thin storage adapters (gate is the only consumer) ---------------------
const readNum = (k: string) => {
  try {
    return parseInt(localStorage.getItem(k) || "0", 10) || 0;
  } catch {
    return 0;
  }
};
const writeNum = (k: string, n: number) => {
  try {
    localStorage.setItem(k, String(n));
  } catch {
    /* ignore */
  }
};
const clearKeys = (...keys: string[]) => {
  try {
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
};

export const isEventUnlocked = (id: string) => {
  try {
    return sessionStorage.getItem(unlockKey(id)) === "1";
  } catch {
    return false;
  }
};

const markUnlocked = (id: string) => {
  try {
    sessionStorage.setItem(unlockKey(id), "1");
  } catch {
    /* ignore */
  }
  clearKeys(lockoutKey(id), attemptsLeftKey(id));
};

const EventPasswordGate = ({ eventId, eventTitle, coverImage, onUnlock }: Props) => {
  const reactId = useId();
  const inputId = `event-password-input-${reactId}`;
  const statusId = `event-password-status-${reactId}`;
  const attemptsId = `event-password-attempts-${reactId}`;
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number>(() => readNum(lockoutKey(eventId)));
  const [attemptsLeft, setAttemptsLeft] = useState<number>(() => {
    const stored = readNum(attemptsLeftKey(eventId));
    return stored > 0 ? stored : MAX_ATTEMPTS;
  });
  const [now, setNow] = useState<number>(() => Date.now());

  const state = useMemo(
    () => deriveState({ lockedUntil, attemptsLeft, now, lastError }),
    [lockedUntil, attemptsLeft, now, lastError],
  );

  // Tick once a second while a cooldown is active so the countdown updates.
  useEffect(() => {
    if (state.status !== "locked") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state.status]);

  // When the cooldown just expired, clear stored deadline so the input re-enables.
  useEffect(() => {
    if (state.status === "cooldown_expired") {
      clearKeys(lockoutKey(eventId));
      setLockedUntil(0);
      setAttemptsLeft(MAX_ATTEMPTS);
      setLastError(null);
      busRef.current?.publish({ type: "cleared", at: Date.now() });
    }
  }, [state.status, eventId]);

  // ---- Cross-tab sync ----
  // When any tab unlocks / triggers a lockout / hits the cooldown reset, every
  // other tab viewing the same event reflects that without a manual refresh.
  // Server is still the source of truth — this is a UX polish layer.
  const busRef = useRef<GateBus | null>(null);
  useEffect(() => {
    const bus = subscribeGateBus(eventId, (msg) => {
      switch (msg.type) {
        case "unlocked":
          markUnlocked(eventId);
          onUnlock();
          break;
        case "locked":
          setLockedUntil(msg.lockedUntil);
          setAttemptsLeft(0);
          writeNum(lockoutKey(eventId), msg.lockedUntil);
          writeNum(attemptsLeftKey(eventId), 0);
          setNow(Date.now());
          break;
        case "attempts":
          setAttemptsLeft(msg.attemptsLeft);
          writeNum(attemptsLeftKey(eventId), msg.attemptsLeft);
          break;
        case "cleared":
          clearKeys(lockoutKey(eventId), attemptsLeftKey(eventId));
          setLockedUntil(0);
          setAttemptsLeft(MAX_ATTEMPTS);
          setLastError(null);
          break;
      }
    });
    busRef.current = bus;
    return () => {
      bus.close();
      busRef.current = null;
    };
  }, [eventId, onUnlock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.status === "locked") return;
    if (!password.trim()) {
      setLastError("Enter the event password.");
      return;
    }
    setLoading(true);
    setLastError(null);
    try {
      const { data, error } = await supabase.rpc("verify_event_password", {
        p_event_id: eventId,
        p_password: password,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        p_session_token: getOrCreateSessionToken(),
      } as any);
      if (error) throw error;

      const next = applyVerifyResponse((data ?? {}) as VerifyResponse, Date.now());
      if (next.unlocked) {
        markUnlocked(eventId);
        busRef.current?.publish({ type: "unlocked", at: Date.now() });
        onUnlock();
        return;
      }

      setPassword("");
      setLockedUntil(next.lockedUntil);
      setAttemptsLeft(next.attemptsLeft);
      setLastError(next.error);
      if (next.lockedUntil > 0) {
        writeNum(lockoutKey(eventId), next.lockedUntil);
        busRef.current?.publish({
          type: "locked",
          lockedUntil: next.lockedUntil,
          at: Date.now(),
        });
      } else {
        busRef.current?.publish({
          type: "attempts",
          attemptsLeft: next.attemptsLeft,
          at: Date.now(),
        });
      }
      writeNum(attemptsLeftKey(eventId), next.attemptsLeft);
    } catch {
      // Never echo backend error text — could leak internals or account info.
      setLastError("Couldn't verify password. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const isLocked = state.status === "locked";
  const showAttemptHint =
    !isLocked && state.attemptsLeft < MAX_ATTEMPTS && state.attemptsLeft > 0;

  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center px-5 py-10"
      style={{
        background: coverImage
          ? `linear-gradient(180deg, rgba(10,17,40,0.85), rgba(10,17,40,0.96)), url(${coverImage}) center/cover`
          : C.bg,
        color: C.text,
        fontFamily: fonts.sans,
      }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-7 border"
        style={{ background: C.surface, borderColor: C.border }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
          style={{ background: "rgba(232,93,47,0.12)" }}
        >
          <Lock className="w-5 h-5" style={{ color: C.raspberry }} />
        </div>
        <div
          className="text-[10px] uppercase tracking-[0.3em] mb-2"
          style={{ fontFamily: fonts.mono, color: C.raspberry }}
        >
          Private event
        </div>
        <h1
          className="mb-2"
          style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 28, lineHeight: 1.1 }}
        >
          {eventTitle}
        </h1>
        <p className="mb-6 text-sm" style={{ color: C.muted, lineHeight: 1.55 }}>
          The host shared a password with their guest list. Enter it to see the event details and
          RSVP.
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
          aria-busy={loading}
        >
          <div>
            <label
              htmlFor={inputId}
              className="block mb-2"
              style={{
                fontFamily: fonts.mono,
                color: C.muted,
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Event password
            </label>
            <Input
              id="event-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="off"
              disabled={isLocked}
              aria-invalid={state.status === "wrong" || state.status === "last_attempt"}
              aria-describedby="event-password-status event-password-attempts"
              style={{
                background: C.bg,
                borderColor: C.borderStrong,
                color: C.text,
                height: 52,
                fontSize: 17,
                borderRadius: 14,
              }}
            />

            {/* Attempts remaining — polite live region so screen readers
                announce the count without interrupting typing. */}
            <div
              id="event-password-attempts"
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="mt-2 text-[11px] min-h-[1rem]"
              style={{ color: C.muted, fontFamily: fonts.mono, letterSpacing: "0.05em" }}
            >
              {showAttemptHint
                ? `${state.attemptsLeft} ${state.attemptsLeft === 1 ? "attempt" : "attempts"} remaining before lockout`
                : ""}
            </div>
          </div>

          {/* Combined status / error region.
              - Lockout uses role="timer" with the live countdown for visual
                users plus aria-live="assertive" so screen readers hear the
                lockout immediately when triggered (including cross-tab).
              - Wrong-password errors use role="alert".
              The empty wrapper persists in the DOM so live-region updates
              are reliably announced. */}
          <div
            id="event-password-status"
            role={isLocked ? "timer" : "alert"}
            aria-live={isLocked ? "assertive" : "assertive"}
            aria-atomic="true"
            className={state.message ? "text-sm rounded-xl px-3 py-3" : "sr-only"}
            style={
              state.message
                ? {
                    background: "rgba(232,93,47,0.08)",
                    color: C.raspberry,
                    border: `1px solid ${C.raspberry}33`,
                  }
                : undefined
            }
          >
            {isLocked ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div
                    className="text-[10px] uppercase tracking-[0.25em] mb-1"
                    style={{ fontFamily: fonts.mono, opacity: 0.85 }}
                  >
                    Locked — too many wrong attempts
                  </div>
                  <div className="text-[12px]" style={{ color: C.muted }}>
                    The input will re-enable automatically when the countdown ends.
                  </div>
                </div>
                <time
                  dateTime={`PT${Math.max(0, Math.ceil(state.remainingMs / 1000))}S`}
                  aria-label={`${Math.max(0, Math.ceil(state.remainingMs / 1000))} seconds until you can try again`}
                  className="tabular-nums text-2xl font-semibold"
                  style={{ fontFamily: fonts.mono, color: C.raspberry }}
                >
                  {formatCountdown(state.remainingMs)}
                </time>
              </div>
            ) : (
              state.message
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || isLocked}
            className="w-full"
            style={{
              background: C.raspberry,
              color: "#fff",
              height: 52,
              fontSize: 16,
              borderRadius: 14,
            }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isLocked ? (
              "Locked"
            ) : (
              "Unlock event"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EventPasswordGate;
