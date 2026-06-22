import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Sparkles, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/analytics";
import { C, fonts, Mono } from "./_theme";

interface Drop {
  id: string;
  title: string;
  description: string | null;
  reward_type: string | null;
  image_url: string | null;
  available_from: string | null;
  available_until: string | null;
}

export default function DropSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [drop, setDrop] = useState<Drop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only signed-in users can read drops (RLS). Skip the call for visitors.
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("drops" as any)
        .select("id, title, description, reward_type, image_url, available_from, available_until")
        .eq("is_active", true)
        .or(`available_from.is.null,available_from.lte.${nowIso}`)
        .or(`available_until.is.null,available_until.gte.${nowIso}`)
        .order("available_from", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        setDrop((data as any) ?? null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const onUnlock = () => {
    trackEvent("user_behavior", "homepage_drop_unlock_click", { signed_in: !!user });
    navigate("/auth?mode=signup");
  };

  return (
    <section
      className="px-5 md:px-10 py-20 md:py-28"
      style={{ background: C.ink, color: C.cream }}
      aria-labelledby="drop-heading"
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-10">
          <Mono color={C.accent}>The Drop — Every Monday</Mono>
          <Mono color={C.inkMuted} size={10}>Members only</Mono>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-5">
            <h2
              id="drop-heading"
              style={{
                fontFamily: fonts.serif,
                fontWeight: 400,
                fontSize: "clamp(42px, 6.5vw, 96px)",
                lineHeight: 0.95,
                letterSpacing: "-0.035em",
                color: C.cream,
              }}
            >
              A surprise,<br />
              <span style={{ fontStyle: "italic", color: C.accent }}>every Monday.</span>
            </h2>
            <p
              className="mt-6 max-w-md"
              style={{ color: C.inkMuted, fontSize: 17, lineHeight: 1.6 }}
            >
              Seats, tickets, exclusive invites, gifts from women-owned brands, and
              perks we keep just for members. New drop every Monday — when it's
              gone, it's gone.
            </p>

            {!user && (
              <button
                onClick={onUnlock}
                className="mt-8 hover:-translate-y-0.5 transition-transform"
                style={{
                  background: C.accent,
                  color: "#fff",
                  fontFamily: fonts.sans,
                  fontSize: 15,
                  letterSpacing: "-0.01em",
                  padding: "16px 28px",
                  borderRadius: 999,
                  fontWeight: 600,
                  boxShadow: "0 14px 36px -16px rgba(232,93,38,0.7)",
                }}
              >
                Join to unlock →
              </button>
            )}
          </div>

          <div className="lg:col-span-7">
            <div
              className="relative overflow-hidden"
              style={{
                borderRadius: 24,
                border: `1px solid ${C.inkRule}`,
                background:
                  "linear-gradient(135deg, rgba(232,93,38,0.18) 0%, rgba(123,92,255,0.12) 60%, rgba(31,143,111,0.08) 100%)",
                aspectRatio: "16/10",
              }}
            >
              {/* Card content (real if member + drop, otherwise teaser) */}
              <div
                aria-hidden={!user || !drop}
                className="absolute inset-0 p-8 md:p-10 flex flex-col justify-between"
                style={{
                  filter: !user || !drop ? "blur(14px)" : "none",
                  transition: "filter 300ms ease",
                }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={16} color={C.accent} />
                  <Mono color={C.cream} size={10}>
                    {drop?.reward_type || "This week's drop"}
                  </Mono>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: fonts.serif,
                      fontStyle: "italic",
                      fontSize: "clamp(32px, 4.5vw, 56px)",
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                      color: C.cream,
                    }}
                  >
                    {drop?.title || "Two tickets · Sparks home opener"}
                  </div>
                  <p
                    className="mt-4 max-w-xl"
                    style={{ color: C.inkMuted, fontSize: 15, lineHeight: 1.6 }}
                  >
                    {drop?.description ||
                      "Court-adjacent seats, plus a pre-game members meetup at a local women-owned spot. RSVPs open Monday at noon."}
                  </p>
                  {drop?.available_until && (
                    <div className="mt-4 inline-flex items-center gap-2">
                      <Calendar size={14} color={C.accent} />
                      <span
                        style={{
                          fontFamily: fonts.sans,
                          fontSize: 13,
                          letterSpacing: "0",
                          color: C.inkMuted,
                        }}
                      >
                        Open through{" "}
                        {new Date(drop.available_until).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Gated overlay for visitors / loading */}
              {(!user || loading || !drop) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="text-center px-6 py-7 max-w-md"
                    style={{
                      background: "rgba(13,13,13,0.78)",
                      border: `1px solid ${C.inkRule}`,
                      borderRadius: 20,
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                    }}
                  >
                    <div
                      className="inline-flex items-center justify-center mb-4"
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 999,
                        background: C.accent,
                      }}
                    >
                      <Lock size={18} color="#fff" />
                    </div>
                    <div
                      style={{
                        fontFamily: fonts.serif,
                        fontStyle: "italic",
                        fontSize: 24,
                        color: C.cream,
                        lineHeight: 1.2,
                      }}
                    >
                      Members only — join to unlock.
                    </div>
                    <p
                      className="mt-3"
                      style={{ color: C.inkMuted, fontSize: 14, lineHeight: 1.55 }}
                    >
                      {user && !drop
                        ? "This week's drop goes live Monday at noon. Hang tight."
                        : "The Monday drop is exclusive to Club members. Join to see what's behind the curtain."}
                    </p>
                    {!user && (
                      <button
                        onClick={onUnlock}
                        className="mt-5 hover:-translate-y-0.5 transition-transform"
                        style={{
                          background: C.accent,
                          color: "#fff",
                          fontFamily: fonts.sans,
                          fontSize: 15,
                          letterSpacing: "-0.01em",
                          padding: "12px 22px",
                          borderRadius: 999,
                          fontWeight: 600,
                        }}
                      >
                        Join the Club →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
