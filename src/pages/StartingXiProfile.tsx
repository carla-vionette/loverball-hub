import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, MoreHorizontal, Sparkles, Beer, Calendar, Users, Plus } from "lucide-react";
import Seo from "@/components/Seo";
import DraftConfirmModal from "@/components/club/DraftConfirmModal";
import MutualDraftCelebration from "@/components/club/MutualDraftCelebration";
import { getMember, loadDrafts, saveDrafts } from "@/lib/startingXiData";

const C = {
  bg: "#0a0a0a",
  card: "#1A1A1A",
  cardHi: "#2A2A2A",
  text: "#FAF5E9",
  muted: "#B8B8B8",
  pink: "#E86BB0",
  gold: "#E6F25A",
  border: "rgba(250, 245, 233, 0.08)",
  borderHi: "rgba(250, 245, 233, 0.15)",
};
const mono = { fontFamily: "'Poppins', system-ui, sans-serif" } as const;
const serif = { fontFamily: "'Anton', Impact, sans-serif" } as const;
const sans = { fontFamily: "'Poppins', system-ui, sans-serif" } as const;

const Label: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.muted }) => (
  <span
    className="uppercase"
    style={{ ...mono, fontSize: 10, letterSpacing: "0.2em", color, fontWeight: 500 }}
  >
    {children}
  </span>
);

const TeamChip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    className="inline-flex items-center"
    style={{
      ...sans,
      fontSize: 11,
      color: C.text,
      background: C.card,
      border: `0.5px solid ${C.borderHi}`,
      padding: "6px 12px",
      borderRadius: 999,
      fontWeight: 500,
    }}
  >
    {children}
  </span>
);

const SmallChip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    className="uppercase inline-flex"
    style={{
      ...mono,
      fontSize: 9,
      letterSpacing: "0.18em",
      color: C.muted,
      background: C.cardHi,
      padding: "5px 9px",
      borderRadius: 999,
      fontWeight: 500,
    }}
  >
    {children}
  </span>
);

const iconFor = (k: "beer" | "calendar" | "users") => {
  const props = { size: 16, color: C.pink, strokeWidth: 1.6 };
  if (k === "beer") return <Beer {...props} />;
  if (k === "calendar") return <Calendar {...props} />;
  return <Users {...props} />;
};

const StartingXiProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const m = id ? getMember(id) : undefined;

  const [state, setState] = useState(loadDrafts);
  const [confirm, setConfirm] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    saveDrafts(state);
  }, [state]);

  if (!m) {
    return (
      <div style={{ background: C.bg, color: C.text }} className="min-h-screen flex items-center justify-center">
        <button onClick={() => navigate("/club/xi")} style={{ color: C.pink }}>
          Back to Your Team
        </button>
      </div>
    );
  }

  const alreadyDrafted = state.drafted.includes(m.id);

  const handleDraft = () => {
    if (alreadyDrafted || state.draftsLeft <= 0) return;
    setState((s) => ({
      draftsLeft: Math.max(0, s.draftsLeft - 1),
      drafted: [...s.drafted, m.id],
    }));
    setConfirm(true);
  };

  const handleConfirmClose = () => {
    setConfirm(false);
    setTimeout(() => setCelebrate(true), 600);
  };

  return (
    <div style={{ background: C.bg, color: C.text, ...sans }} className="min-h-screen">
      <Seo
        title={`${m.name} — Starting XI | Loverball`}
        description={`${m.team} · ${m.city}. ${m.vibe}`}
        path={`/club/xi/${m.id}`}
      />

      <main className="max-w-[440px] mx-auto pb-36">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-5">
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="p-1.5 -ml-1.5"
            style={{ color: C.text }}
          >
            <ChevronLeft size={22} strokeWidth={1.5} />
          </button>
          <Label>Member</Label>
          <button aria-label="More" className="p-1.5 -mr-1.5" style={{ color: C.text }}>
            <MoreHorizontal size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Hero photo */}
        <div className="px-4 mt-3 relative">
          <img
            src={m.photo}
            alt={m.name}
            className="w-full object-cover"
            style={{ height: 280, borderRadius: 16 }}
          />
          {/* Match badge */}
          <div
            className="absolute top-5 right-7 flex items-center gap-1.5 uppercase"
            style={{
              ...mono,
              fontSize: 10,
              letterSpacing: "0.18em",
              color: C.text,
              background: "rgba(10,10,10,0.6)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: `0.5px solid ${C.pink}`,
              padding: "6px 10px",
              borderRadius: 8,
              fontWeight: 500,
            }}
          >
            <Sparkles size={11} color={C.pink} strokeWidth={1.5} /> {m.match}% Match
          </div>
          {/* Gradient + name overlay */}
          <div
            className="absolute left-4 right-4 bottom-0 px-4 pb-4 pt-12"
            style={{
              background: "linear-gradient(to top, rgba(10,10,10,0.92), transparent)",
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
            }}
          >
            <h1 style={{ ...serif, fontWeight: 500, fontSize: "clamp(32px, 10vw, 48px)", color: C.text, lineHeight: 0.95, letterSpacing: "-0.03em" }}>
              {m.name}
            </h1>
            <p className="mt-1.5">
              <span
                className="uppercase"
                style={{ ...mono, fontSize: 10, letterSpacing: "0.18em", color: C.pink, fontWeight: 500 }}
              >
                {m.team}
              </span>
              <span style={{ ...sans, fontSize: 12, color: C.muted, marginLeft: 8 }}>
                {m.joined}
              </span>
            </p>
          </div>
        </div>

        {/* Why you'd vibe */}
        <section className="px-5 mt-6">
          <div
            className="p-4"
            style={{
              background: "rgba(212, 83, 126, 0.08)",
              border: "0.5px solid rgba(212, 83, 126, 0.35)",
              borderRadius: 14,
            }}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={12} color={C.pink} strokeWidth={1.5} />
              <Label color={C.pink}>Why you'd vibe</Label>
            </div>
            <ul className="mt-3 space-y-1.5">
              {m.reasons.map((r) => (
                <li key={r} className="flex gap-2" style={{ fontSize: 13, lineHeight: 1.5, color: C.text }}>
                  <span style={{ color: C.pink }}>▸</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Vibe block */}
        <section className="px-5 mt-7">
          <Label>Vibe</Label>
          <p
            className="mt-3"
            style={{
              ...mono,
              fontSize: 12.5,
              lineHeight: 1.65,
              color: C.text,
            }}
          >
            {m.vibeLong}
          </p>
        </section>

        {/* Rides for */}
        <section className="px-5 mt-7">
          <Label>Rides for</Label>
          <div className="mt-3 flex flex-wrap gap-2">
            {m.teams.map((t) => (
              <TeamChip key={t}>{t}</TeamChip>
            ))}
          </div>
        </section>

        {/* You both */}
        <section className="px-5 mt-7">
          <Label>You both</Label>
          <ul className="mt-3 space-y-2">
            {m.youBoth.map((row) => (
              <li
                key={row.label}
                className="flex items-center gap-3"
                style={{
                  background: C.card,
                  padding: 10,
                  borderRadius: 8,
                  border: `0.5px solid ${C.border}`,
                }}
              >
                {iconFor(row.icon)}
                <span style={{ fontSize: 13, color: C.text }}>{row.label}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Recent rounds */}
        <section className="px-5 mt-7">
          <Label>Recent rounds</Label>
          <ul className="mt-3 space-y-2">
            {m.rounds.map((r) => (
              <li key={r.label} className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: 36, height: 36, background: C.cardHi, borderRadius: 8 }}
                >
                  <Sparkles size={14} color={C.pink} strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p style={{ fontSize: 13, color: C.text, lineHeight: 1.35 }}>{r.label}</p>
                  <p style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", color: C.muted, marginTop: 2 }}>
                    {r.ago.toUpperCase()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Tags */}
        <section className="px-5 mt-7">
          <Label>Tags</Label>
          <div className="mt-3 flex flex-wrap gap-2">
            {m.tags.map((t) => (
              <SmallChip key={t}>{t}</SmallChip>
            ))}
          </div>
        </section>
      </main>

      {/* Sticky CTA */}
      <div
        className="fixed left-0 right-0 z-30 px-5"
        style={{
          bottom: 0,
          paddingBottom: "max(20px, env(safe-area-inset-bottom))",
          paddingTop: 40,
          background: "linear-gradient(to top, #0a0a0a 55%, rgba(10,10,10,0.85) 80%, transparent)",
        }}
      >
        <div className="max-w-[440px] mx-auto flex gap-2.5">
          <button
            onClick={() => navigate(-1)}
            className="uppercase"
            style={{
              ...sans,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.18em",
              color: C.text,
              background: "transparent",
              border: `0.5px solid ${C.borderHi}`,
              padding: "14px 16px",
              borderRadius: 24,
              flexBasis: "33%",
            }}
          >
            Pass
          </button>
          <button
            onClick={handleDraft}
            disabled={alreadyDrafted || state.draftsLeft <= 0}
            className="uppercase flex-1 inline-flex items-center justify-center gap-1.5 transition-opacity active:opacity-80"
            style={{
              ...sans,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.18em",
              color: "#0a0a0a",
              background: C.pink,
              padding: "14px 16px",
              borderRadius: 24,
              opacity: alreadyDrafted || state.draftsLeft <= 0 ? 0.5 : 1,
            }}
          >
            <Plus size={14} strokeWidth={2} />
            {alreadyDrafted ? "Drafted" : "Draft to your XI"}
          </button>
        </div>
      </div>

      <DraftConfirmModal
        open={confirm}
        memberFirstName={m.firstName}
        suggestedOpener={m.opener}
        draftsLeft={state.draftsLeft}
        onClose={handleConfirmClose}
      />

      <MutualDraftCelebration
        open={celebrate}
        themPhotoUrl={m.photo}
        themFirstName={m.firstName}
        themInitial={m.firstName[0]}
        upcomingHint={m.upcoming}
        onClose={() => setCelebrate(false)}
        onSayHi={() => {
          setCelebrate(false);
          navigate("/inbox");
        }}
      />
    </div>
  );
};

export default StartingXiProfile;
