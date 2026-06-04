import { useEffect, useRef, useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { C, fonts } from "@/lib/editorialTheme";
import {
  applyVerifyResponse,
  deriveState,
  getOrCreateSessionToken,
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
};

const EventPasswordGate = ({ eventId, eventTitle, coverImage, onUnlock }: Props) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const state = deriveState({ lastError });

  // ---- Cross-tab sync ----
  // When any tab unlocks, every other tab viewing the same event reflects
  // that without a manual refresh.
  const busRef = useRef<GateBus | null>(null);
  useEffect(() => {
    const bus = subscribeGateBus(eventId, (msg) => {
      if (msg.type === "unlocked") {
        markUnlocked(eventId);
        onUnlock();
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

      const next = applyVerifyResponse((data ?? {}) as VerifyResponse);
      if (next.unlocked) {
        markUnlocked(eventId);
        busRef.current?.publish({ type: "unlocked", at: Date.now() });
        onUnlock();
        return;
      }

      setPassword("");
      setLastError(next.error);
    } catch {
      // Never echo backend error text — could leak internals or account info.
      setLastError("Couldn't verify password. Check your connection and try again.");
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

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
          aria-busy={loading}
        >
          <div>
            <label
              htmlFor="event-password-input"
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
              aria-invalid={state.status === "wrong"}
              style={{
                background: C.bg,
                borderColor: C.borderStrong,
                color: C.text,
                height: 52,
                fontSize: 17,
                borderRadius: 14,
              }}
            />
          </div>

          {state.message && (
            <div
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
              className="text-sm rounded-xl px-3 py-3"
              style={{
                background: "rgba(232,93,47,0.08)",
                color: C.raspberry,
                border: `1px solid ${C.raspberry}33`,
              }}
            >
              {state.message}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
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
