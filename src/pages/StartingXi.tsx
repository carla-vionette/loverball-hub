import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, MessagesSquare, ArrowRight } from "lucide-react";
import Seo from "@/components/Seo";
import BottomNav from "@/components/BottomNav";
import DraftConfirmModal from "@/components/club/DraftConfirmModal";
import MutualDraftCelebration from "@/components/club/MutualDraftCelebration";
import {
  loadDrafts,
  saveDrafts,
  type Member,
} from "@/lib/startingXiData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Aligned with shared editorialTheme palette so The Club matches the rest of the platform.
const C = {
  bg: "#0a0a0a",
  card: "#1A1A1A",
  cardHi: "#2A2A2A",
  text: "#E6F25A",
  muted: "#B8B8B8",
  pink: "#E86BB0",
  gold: "#E6F25A",
  raspberry: "#F04E23",
  border: "rgba(250, 245, 233, 0.08)",
  borderHi: "rgba(250, 245, 233, 0.15)",
};

const mono = { fontFamily: "'Space Mono', ui-monospace, 'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Anton', Impact, sans-serif" } as const;
const sans = { fontFamily: "'Inter', system-ui, sans-serif" } as const;
const display = { fontFamily: "'Anton', Impact, sans-serif" } as const;

const Label: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({
  children,
  color = C.muted,
  size = 10,
}) => (
  <span
    className="uppercase"
    style={{ ...mono, color, fontSize: size, letterSpacing: "0.18em", fontWeight: 500 }}
  >
    {children}
  </span>
);

const Chip: React.FC<{ children: React.ReactNode; pink?: boolean }> = ({ children, pink }) => (
  <span
    className="uppercase inline-flex items-center"
    style={{
      ...mono,
      fontSize: 9,
      letterSpacing: "0.18em",
      color: pink ? C.pink : C.muted,
      background: C.cardHi,
      padding: "5px 9px",
      borderRadius: 999,
      fontWeight: 500,
    }}
  >
    {children}
  </span>
);

const MemberCard: React.FC<{ m: Member; onDraft: () => void; disabled: boolean; alreadyDrafted: boolean }> = ({
  m,
  onDraft,
  disabled,
  alreadyDrafted,
}) => {
  const navigate = useNavigate();
  return (
    <article
      onClick={() => navigate(`/members/${m.id}`)}
      className="flex gap-3 p-3 cursor-pointer transition-colors hover:bg-[#141414] active:bg-[#141414]"
      style={{
        background: C.card,
        border: `0.5px solid ${C.border}`,
        borderRadius: 14,
      }}
    >
      {m.photo ? (
        <img
          src={m.photo}
          alt={m.name}
          loading="lazy"
          className="object-cover flex-shrink-0"
          style={{ width: 72, height: 88, borderRadius: 10 }}
        />
      ) : (
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width: 72,
            height: 88,
            borderRadius: 10,
            background: C.pink,
            color: "#0a0a0a",
            fontFamily: "'Anton', Impact, sans-serif",
            fontSize: 32,
            textTransform: "uppercase",
          }}
        >
          {m.firstName?.[0] || "?"}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 style={{ ...serif, fontWeight: 500, fontSize: 22, color: C.raspberry, lineHeight: 1.15, letterSpacing: "-0.015em" }}>{m.name}</h3>
        </div>
        <p
          className="uppercase mt-1"
          style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", color: C.pink, fontWeight: 500 }}
        >
          {m.team} · {m.city}
        </p>
        <p
          className="mt-1.5 truncate"
          style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontSize: 11,
            color: C.muted,
            letterSpacing: "0.01em",
          }}
        >
          VIBE: {m.vibe}
        </p>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5 min-w-0">
            {m.tags.slice(0, 3).map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled && !alreadyDrafted) onDraft();
            }}
            disabled={disabled || alreadyDrafted}
            className="uppercase whitespace-nowrap transition-opacity active:opacity-80"
            style={{
              ...mono,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.16em",
              color: alreadyDrafted ? C.muted : "#0a0a0a",
              background: alreadyDrafted ? C.cardHi : C.pink,
              padding: "8px 14px",
              borderRadius: 999,
              opacity: disabled ? 0.4 : 1,
            }}

          >
            {alreadyDrafted ? "Added" : "+ Add"}
          </button>
        </div>
      </div>
    </article>
  );
};

const FloatingNav: React.FC = () => {
  const tabs = [
    { key: "feed", label: "Feed", to: "/feed" },
    { key: "irl", label: "IRL", to: "/events" },
    { key: "club", label: "Club", to: "/club/xi", active: true },
    { key: "pass", label: "Pass", to: "/membership" },
  ];
  return (
    <nav
      className="fixed left-1/2 -translate-x-1/2 z-40 flex items-center"
      style={{
        bottom: "max(16px, env(safe-area-inset-bottom))",
        background: C.card,
        border: `0.5px solid ${C.pink}`,
        borderRadius: 30,
        padding: "8px 6px",
      }}
    >
      {tabs.map((t) => (
        <Link
          key={t.key}
          to={t.to}
          className="relative flex flex-col items-center uppercase"
          style={{
            ...mono,
            fontSize: 11,
            letterSpacing: "0.16em",
            color: t.active ? C.pink : C.muted,
            padding: "6px 14px",
            fontWeight: 600,
          }}

        >
          {t.label}
          {t.active && (
            <span
              style={{
                marginTop: 3,
                width: 4,
                height: 4,
                borderRadius: 999,
                background: C.pink,
              }}
            />
          )}
        </Link>
      ))}
    </nav>
  );
};

const profileToMember = (p: any): Member => {
  const sports: string[] = Array.isArray(p.favorite_sports) ? p.favorite_sports : [];
  const teams: string[] = Array.isArray(p.favorite_la_teams) && p.favorite_la_teams.length
    ? p.favorite_la_teams
    : sports;
  const primaryTeam = teams[0] || sports[0] || "Sports fan";
  const firstName = (p.name || "Member").split(" ")[0];
  const bio = (p.bio || "").trim();
  const tags = sports.slice(0, 3).map((s: string) => s.toUpperCase());
  return {
    id: p.id,
    name: p.name || "Member",
    firstName,
    photo: p.profile_photo_url || "",
    match: 0,
    team: primaryTeam,
    city: p.city || "",
    vibe: bio || "New to the Club",
    tags,
    teams,
    joined: "",
    reasons: [],
    vibeLong: bio,
    youBoth: [],
    rounds: [],
    opener: `Hey ${firstName} — saw we both ride for ${primaryTeam}.`,
  };
};

const StartingXi: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState(loadDrafts);
  const [confirm, setConfirm] = useState<Member | null>(null);
  const [celebrate, setCelebrate] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [viewerCity, setViewerCity] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    saveDrafts(state);
  }, [state]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1) Get viewer's city to drive location matching
      let myCity = "";
      if (user?.id) {
        const { data: me } = await supabase
          .from("profiles")
          .select("city")
          .eq("id", user.id)
          .maybeSingle();
        myCity = (me?.city || "").trim();
      }
      if (cancelled) return;
      setViewerCity(myCity);

      // 2) Pull a wider pool, then rank by city match
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, bio, city, profile_photo_url, favorite_sports, favorite_la_teams, created_at")
        .not("name", "is", null)
        .neq("name", "")
        .neq("id", user?.id || "00000000-0000-0000-0000-000000000000")
        .order("created_at", { ascending: false })
        .limit(120);
      if (cancelled) return;
      if (!error && data) {
        const norm = (s: string) => (s || "").trim().toLowerCase();
        const target = norm(myCity);
        const ranked = [...data].sort((a: any, b: any) => {
          const aMatch = target && norm(a.city) === target ? 1 : 0;
          const bMatch = target && norm(b.city) === target ? 1 : 0;
          return bMatch - aMatch;
        });
        setMembers(ranked.slice(0, 24).map(profileToMember));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);


  const handleDraft = (m: Member) => {
    if (state.draftsLeft <= 0) return;
    if (state.drafted.includes(m.id)) return;
    setState((s) => ({
      draftsLeft: Math.max(0, s.draftsLeft - 1),
      drafted: [...s.drafted, m.id],
    }));
    setConfirm(m);
  };

  // Demo loop: after closing the confirmation, simulate mutual draft after a short beat
  const handleConfirmClose = () => {
    const m = confirm;
    setConfirm(null);
    if (m) {
      setTimeout(() => setCelebrate(m), 600);
    }
  };

  return (
    <div style={{ background: C.bg, color: C.text, ...sans }} className="min-h-screen">
      <Seo
        title="Starting XI — The Club | Loverball"
        description="An AI-curated discovery feed for the women who ride for your teams. Members-only."
        path="/club/xi"
      />

      <BottomNav />

      <main className="max-w-[440px] mx-auto px-5 pt-24 md:pt-28 pb-36">
        <header className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: "0.22em", color: C.muted, textTransform: "uppercase" }}>find your people</span>
          </div>
          <h1 style={{ fontFamily: "'Anton', Impact, sans-serif", fontWeight: 500, fontSize: "clamp(40px, 10vw, 64px)", lineHeight: 0.95, color: C.text, margin: 0, letterSpacing: "-0.03em" }}>
            Your Team.
          </h1>
          <div className="mt-5 h-px w-full" style={{ background: "rgba(230, 242, 90, 0.08)" }} />
        </header>

        {/* Sub-header */}
        <div className="flex items-center justify-between mt-4">
          <Label color={C.muted}>{viewerCity ? `Near ${viewerCity}` : "Picked for you this week"}</Label>
          <Label color={C.pink}>
            Drafts left: {state.draftsLeft}
          </Label>
        </div>

        {/* Friends + DMs */}
        <section className="mt-6">
          <div className="flex items-end justify-between gap-4 mb-3">
            <div>
              <Label color={C.raspberry}>Current roster</Label>
              <h2 className="mt-1" style={{ ...serif, fontWeight: 500, fontSize: "clamp(28px, 7vw, 40px)", color: C.text, lineHeight: 1.0, letterSpacing: "-0.02em" }}>
                Your friends{state.drafted.length ? ` · ${state.drafted.length}` : ""}
              </h2>
            </div>
            <button
              onClick={() => navigate("/messages")}
              className="inline-flex items-center gap-1.5 uppercase"
              style={{ ...mono, fontSize: 11, letterSpacing: "0.16em", color: C.pink, fontWeight: 600 }}

              aria-label="Open direct messages"
            >
              <MessagesSquare size={13} /> Messages <ArrowRight size={11} />
            </button>
          </div>

          {(() => {
            const drafted = members.filter((m) => state.drafted.includes(m.id));
            if (drafted.length === 0) {
              return (
                <div
                  className="flex items-center justify-between gap-3 p-4"
                  style={{ background: C.card, border: `0.5px dashed ${C.borderHi}`, borderRadius: 14 }}
                >
                  <p style={{ ...sans, fontSize: 12, color: C.muted }}>
                    No friends drafted yet. Build your roster below.
                  </p>
                  <button
                    onClick={() => navigate("/messages")}
                    className="inline-flex items-center gap-1.5 uppercase whitespace-nowrap"
                    style={{
                      ...mono,
                      fontSize: 9,
                      letterSpacing: "0.18em",
                      color: "#0a0a0a",
                      background: C.pink,
                      padding: "7px 12px",
                      borderRadius: 999,
                      fontWeight: 500,
                    }}
                  >
                    Open DMs
                  </button>
                </div>
              );
            }
            return (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: "thin" }}>
                {drafted.map((m) => (
                  <div key={m.id} className="flex-shrink-0 flex flex-col items-center gap-2" style={{ width: 72 }}>
                    <button
                      onClick={() => navigate(`/members/${m.id}`)}
                      className="relative overflow-hidden transition-transform hover:-translate-y-0.5"
                      style={{ width: 56, height: 56, borderRadius: 999, border: `1px solid ${C.borderHi}` }}
                      aria-label={`View ${m.name}`}
                    >
                      {m.photo ? (
                        <img src={m.photo} alt={m.name} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: C.pink, color: "#0a0a0a", ...display, fontSize: 22 }}
                        >
                          {m.firstName?.[0] || "?"}
                        </div>
                      )}
                    </button>
                    <div
                      className="w-full text-center truncate uppercase"
                      style={{ ...mono, fontSize: 9, letterSpacing: "0.12em", color: C.muted }}
                    >
                      {m.firstName}
                    </div>
                    <button
                      onClick={() => navigate(`/messages?member=${m.id}`)}
                      className="inline-flex items-center justify-center"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 999,
                        background: C.cardHi,
                        border: `0.5px solid ${C.border}`,
                        color: C.pink,
                      }}
                      aria-label={`Message ${m.firstName}`}
                    >
                      <MessagesSquare size={12} />
                    </button>
                  </div>
                ))}
              </div>
            );
          })()}
        </section>

        {/* Featured strip */}
        <div
          className="mt-6 flex items-start gap-2.5 p-3"
          style={{
            background: "rgba(212, 83, 126, 0.08)",
            border: "0.5px solid rgba(212, 83, 126, 0.35)",
            borderRadius: 12,
          }}
        >
          <Sparkles size={14} color={C.pink} className="mt-0.5 flex-shrink-0" strokeWidth={1.5} />
          <p style={{ fontSize: 12.5, lineHeight: 1.5, color: C.text }}>
            Suggested Friends
          </p>
        </div>

        {/* Feed */}
        {loading ? (
          <p className="mt-8 text-center" style={{ ...mono, fontSize: 10, letterSpacing: "0.2em", color: C.muted }}>
            Loading members…
          </p>
        ) : members.length === 0 ? (
          <p className="mt-8 text-center" style={{ ...mono, fontSize: 10, letterSpacing: "0.2em", color: C.muted }}>
            No members yet — invite the first one.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {members.map((m) => (
              <li key={m.id}>
                <MemberCard
                  m={m}
                  onDraft={() => handleDraft(m)}
                  disabled={state.draftsLeft <= 0}
                  alreadyDrafted={state.drafted.includes(m.id)}
                />
              </li>
            ))}
          </ul>
        )}

        {state.draftsLeft === 0 && (
          <p className="mt-6 text-center" style={{ ...mono, fontSize: 10, letterSpacing: "0.2em", color: C.muted }}>
            Drafts reset Monday
          </p>
        )}
      </main>

      

      <DraftConfirmModal
        open={!!confirm}
        memberFirstName={confirm?.firstName || ""}
        suggestedOpener={confirm?.opener}
        draftsLeft={state.draftsLeft}
        onClose={handleConfirmClose}
      />

      <MutualDraftCelebration
        open={!!celebrate}
        themPhotoUrl={celebrate?.photo}
        themFirstName={celebrate?.firstName || ""}
        themInitial={celebrate?.firstName?.[0]}
        upcomingHint={celebrate?.upcoming}
        onClose={() => setCelebrate(null)}
        onSayHi={() => { setCelebrate(null); navigate("/messages"); }}
      />
    </div>
  );
};

export default StartingXi;
