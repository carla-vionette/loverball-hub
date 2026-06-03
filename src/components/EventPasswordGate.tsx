import { useState } from "react";
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
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      } else {
        setErr("That password didn't work. Try again.");
        setPassword("");
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

          {err && (
            <div
              className="text-sm rounded-xl px-3 py-2"
              style={{
                background: "rgba(232,93,47,0.08)",
                color: C.raspberry,
                border: `1px solid ${C.raspberry}33`,
              }}
              role="alert"
            >
              {err}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-full text-xs uppercase tracking-[0.22em] border-0"
            style={{ background: C.raspberry, color: "#fff", fontFamily: fonts.mono }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unlock event"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EventPasswordGate;
