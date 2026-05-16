import { Link, useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { ArrowRight, Users, MessagesSquare, Sparkles, MapPin } from "lucide-react";
import { C, fonts } from "@/lib/editorialTheme";

const Slug = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: C.raspberry }}>
    {children}
  </span>
);

const Mono = ({ children, color = C.muted, size = 11 }: { children: React.ReactNode; color?: string; size?: number }) => (
  <span style={{ fontFamily: fonts.mono, fontSize: size, letterSpacing: "0.14em", textTransform: "uppercase", color }}>{children}</span>
);

const PrimaryBtn = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
    style={{ background: C.raspberry, color: "#fff", fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", padding: "16px 26px", borderRadius: 999, fontWeight: 500 }}
  >
    {children}
  </button>
);

const Connect = () => {
  const navigate = useNavigate();

  const pillars = [
    { Icon: Sparkles, chip: "Matching", h: "Smart matches, not swipes", p: "Curated by the teams you love, the games you watch, and the city you live in. Three drafts a week — make them count." },
    { Icon: MessagesSquare, chip: "Group chats", h: "Rooms by team & city", p: "Live game-thread energy in private rooms. Sound off during the game, debrief after, plan the next watch party." },
    { Icon: Users, chip: "Fan circles", h: "Find your people", p: "Small, members-only circles built around fandoms and rituals. Quiet onboarding, real friendships." },
    { Icon: MapPin, chip: "IRL", h: "Mixers in your city", p: "Members-only meetups, watch parties, and away-game travel. Hosted in LA first, expanding by demand." },
  ];

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }} className="min-h-screen">
      <Seo
        title="Connect — Loverball"
        description="Connect with sports fans who actually get it. Smart matching, private group chats, and members-only mixers built around the teams you love."
        path="/connect"
      />

      <header className="px-6 md:px-12 pt-10 pb-6 flex items-center justify-between" style={{ borderBottom: `0.5px solid ${C.border}` }}>
        <Link to="/" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 28, letterSpacing: "-0.02em" }}>Loverball</Link>
        <nav className="hidden md:flex items-center gap-8">
          {[["Watch", "/feed"], ["Connect", "/connect"], ["Events", "/events"], ["Club", "/club"]].map(([l, h]) => (
            <Link key={l} to={h} style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: l === "Connect" ? C.text : C.muted }}>{l}</Link>
          ))}
        </nav>
      </header>

      <section className="px-6 md:px-12 pt-16 md:pt-24 pb-20 max-w-6xl">
        <Slug>Issue · Connect</Slug>
        <h1 className="mt-6" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500, fontSize: "clamp(48px, 8vw, 112px)", lineHeight: 0.95, letterSpacing: "-0.03em" }}>
          Find your<br/>people.
        </h1>
        <p className="mt-8 max-w-xl" style={{ fontSize: 18, lineHeight: 1.6, color: C.muted }}>
          A members-only home for sports fans who want more than a comment section. Matching, group chats, and meetups — quiet, vetted, real.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <PrimaryBtn onClick={() => navigate("/auth?mode=signup")}>Join Loverball <ArrowRight size={14} /></PrimaryBtn>
          <Link to="/club" style={{ fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: C.raspberry, borderBottom: `1px solid ${C.raspberry}`, paddingBottom: 2, alignSelf: "center" }}>
            What is The Club?
          </Link>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-24 grid md:grid-cols-2 gap-px" style={{ background: C.border }}>
        {pillars.map(({ Icon, chip, h, p }) => (
          <article key={chip} className="p-10" style={{ background: C.bg }}>
            <Mono color={C.raspberry}>{chip}</Mono>
            <div className="mt-6"><Icon size={28} color={C.gold} strokeWidth={1.25} /></div>
            <h3 className="mt-6" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500, fontSize: 32, lineHeight: 1.05, letterSpacing: "-0.02em" }}>{h}</h3>
            <p className="mt-4" style={{ color: C.muted, fontSize: 15, lineHeight: 1.6 }}>{p}</p>
          </article>
        ))}
      </section>

      <footer className="px-6 md:px-12 py-10" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <Mono size={10}>© 2026 Loverball · Built in LA</Mono>
      </footer>
    </div>
  );
};

export default Connect;
