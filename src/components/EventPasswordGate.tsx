import { useEffect, useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { C, fonts } from "@/lib/editorialTheme";

interface Props {
  eventId: string;
  eventTitle: string;
  coverImage: string | null;
  onUnlock: () => void;
}

const unlockKey = (id: string) => `event_unlock_${id}`;
const attemptsKey = (id: string) => `event_pw_attempts_${id}`;
const lockoutKey = (id: string) => `event_pw_lockout_${id}`;
const SESSION_TOKEN_KEY = "event_pw_session_token";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes (client mirror; server is source of truth)

const getSessionToken = (): string => {
  try {
    let t = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!t) {
      const arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      t = Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
      localStorage.setItem(SESSION_TOKEN_KEY, t);
    }
    return t;
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
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
    localStorage.removeItem(attemptsKey(id));
    localStorage.removeItem(lockoutKey(id));
  } catch {
    /* ignore */
  }
};

const getAttempts = (id: string): number => {
  try {
    return parseInt(localStorage.getItem(attemptsKey(id)) || "0", 10) || 0;
  } catch {
    return 0;
  }
};

const setAttempts = (id: string, n: number) => {
  try {
    localStorage.setItem(attemptsKey(id), String(n));
  } catch {
    /* ignore */
  }
};

const getLockoutUntil = (id: string): number => {
  try {
    return parseInt(localStorage.getItem(lockoutKey(id)) || "0", 10) || 0;
  } catch {
    return 0;
  }
};

const setLockoutUntil = (id: string, until: number) => {
  try {
    localStorage.setItem(lockoutKey(id), String(until));
  } catch {
    /* ignore */
  }
};

const formatRemaining = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r.toString().padStart(2, "0")}s` : `${r}s`;
};

const EventPasswordGate = ({ eventId, eventTitle, coverImage, onUnlock }: Props) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lockedUntil, setLockedUntilState] = useState<number>(() => getLockoutUntil(eventId));
  const [now, setNow] = useState<number>(Date.now());

  const remainingMs = Math.max(0, lockedUntil - now);
  const isLocked = remainingMs > 0;
  const attempts = getAttempts(eventId);
  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - attempts);

  useEffect(() => {
    if (!isLocked) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [isLocked]);

  useEffect(() => {
    if (isLocked) {
      setErr(`Too many wrong attempts. Try again in ${formatRemaining(remainingMs)}.`);
    }
  }, [isLocked, remainingMs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    if (!password.trim()) {
      setErr("Enter the event password.");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const { data, error } = await supabase.rpc("verify_event_password", {
        p_event_id: eventId,
        p_password: password,
      });
      if (error) throw error;
      if (data === true) {
        markUnlocked(eventId);
        onUnlock();
        return;
      }
      const next = getAttempts(eventId) + 1;
      setAttempts(eventId, next);
      setPassword("");

      if (next >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MS;
        setLockoutUntil(eventId, until);
        setLockedUntilState(until);
        setNow(Date.now());
        setErr(
          `Too many wrong attempts. This device is locked out for ${formatRemaining(LOCKOUT_MS)}.`,
        );
      } else {
        const left = MAX_ATTEMPTS - next;
        setErr(
          `That password didn't work. ${left} ${left === 1 ? "attempt" : "attempts"} left before a temporary lockout.`,
        );
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Couldn't verify password.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

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

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
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
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="off"
              disabled={isLocked}
              style={{
                background: C.bg,
                borderColor: C.borderStrong,
                color: C.text,
                height: 52,
                fontSize: 17,
                borderRadius: 14,
              }}
            />
            {!isLocked && attempts > 0 && attemptsLeft > 0 && (
              <div
                className="mt-2 text-[11px]"
                style={{ color: C.muted, fontFamily: fonts.mono, letterSpacing: "0.05em" }}
              >
                {attemptsLeft} {attemptsLeft === 1 ? "attempt" : "attempts"} remaining
              </div>
            )}
          </div>

          {err && (
            <div
              className="text-sm rounded-xl px-3 py-2"
              style={{
                background: "rgba(232,93,47,0.08)",
                color: C.raspberry,
                border: `1px solid ${C.raspberry}33`,
              }}
              role="alert"
              aria-live="polite"
            >
              {isLocked
                ? `Too many wrong attempts. Try again in ${formatRemaining(remainingMs)}.`
                : err}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || isLocked}
            className="w-full h-14 rounded-full text-xs uppercase tracking-[0.22em] border-0 disabled:opacity-50"
            style={{ background: C.raspberry, color: "#fff", fontFamily: fonts.mono }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isLocked ? (
              `Locked · ${formatRemaining(remainingMs)}`
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
