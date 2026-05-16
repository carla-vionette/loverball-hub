import { Link, useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { ArrowRight, Tv, Users, MessagesSquare, MapPin, Gift, Sparkles } from "lucide-react";
import { C, fonts } from "@/lib/editorialTheme";

const Slug = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: C.raspberry }}>{children}</span>
);
const Mono = ({ children, color = C.muted, size = 11 }: any) => (
  <span style={{ fontFamily: fonts.mono, fontSize: size, letterSpacing: "0.14em", textTransform: "uppercase", color }}>{children}</span>
);

const NavBar = () => (
  <header className="px-6 md:px-12 pt-10 pb-6 flex items-center justify-between" style={{ borderBottom: `0.5px solid ${C.border}` }}>
    <Link to="/" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 28, letterSpacing: "-0.02em", color: C.text }}>Loverball</Link>
    <nav className="hidden md:flex items-center gap-8">
      {[["Watch","/feed"],["Connect","/connect"],["Events","/events"],["Club","/club"]].map(([l,h]) => (
        <Link key={l} to={h} style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: l === "Club" ? C.text : C.muted }}>{l}</Link>
      ))}
    </nav>
  </header>
);

const PILLARS = [
  {
    Icon: Tv,
    chip: "Watch parties",
    h: "Watch the game with your people.",
    p: "Members-only watch parties, both IRL and in private chat rooms. Live reactions, hot takes, post-game debriefs — without the chaos of public timelines.",
  },
  {
    Icon: Sparkles,
    chip: "Fan matching",
    h: "Smart matches, not swipes.",
    p: "Three curated drafts a week, built around the teams you love, the games you watch, and the city you live in. Make the introductions count.",
  },
  {
    Icon: MessagesSquare,
    chip: "Group chats",
    h: "Rooms by team & moment.",
    p: "Private group chats organized by team, sport, and ritual. The game-thread energy you actually want — vetted, members-only, on-topic.",
  },
  {
    Icon: MapPin,
    chip: "City crews",
    h: "Find your local lineup.",
    p: "City crews for the cities Loverball lives in. LA first, then everywhere members show up. Bar takeovers, away-game travel, post-game dinners.",
  },
  {
    Icon: Users,
    chip: "Fan circles",
    h: "Small rooms, real friendships.",
    p: "Members-only circles built around fandoms and rituals. Quiet onboarding so new members land in a real conversation, not a stadium of strangers.",
  },
  {
    Icon: Gift,
    chip: "Perks",
    h: "Members-only everything.",
    p: "Priority event invites, mixers, merch drops, partner discounts, and a direct line to the team. The good stuff is reserved for the people in the room.",
  },
];

const Club = () => {
  const navigate = useNavigate();

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }} className="min-h-screen">
      <Seo
        title="The Club — Loverball"
        description="The Club is the members-only home for women's sports fans. Watch parties, fan matching, group chats, city crews, and members-only perks."
        path="/club"
      />

      <NavBar />

      {/* Hero */}
      <section className="px-6 md:px-12 pt-16 md:pt-24 pb-20 max-w-6xl">
        <Slug>The Club</Slug>
        <h1 className="mt-6" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500, fontSize: "clamp(48px, 9vw, 128px)", lineHeight: 0.92, letterSpacing: "-0.03em" }}>
          The members-only home<br/>for women's sports fans.
        </h1>
        <p className="mt-8 max-w-xl" style={{ fontSize: 18, lineHeight: 1.6, color: C.muted }}>
          A private club for the watch parties, group chats, city crews, and friendships that the rest of the internet keeps flattening. Vetted, quiet, real.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 items-center">
          <button
            onClick={() => navigate("/auth?mode=signup")}
            className="inline-flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: C.raspberry, color: "#fff", fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", padding: "16px 26px", borderRadius: 999, fontWeight: 500 }}
          >
            Join the Club <ArrowRight size={14} />
          </button>
          <Link to="/membership" style={{ fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: C.raspberry, borderBottom: `1px solid ${C.raspberry}`, paddingBottom: 2 }}>
            See passes
          </Link>
        </div>
      </section>

      {/* Pillars */}
      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: C.border, borderTop: `0.5px solid ${C.border}`, borderBottom: `0.5px solid ${C.border}` }}>
        {PILLARS.map(({ Icon, chip, h, p }) => (
          <article key={chip} className="p-10" style={{ background: C.bg }}>
            <Mono color={C.raspberry}>{chip}</Mono>
            <div className="mt-6"><Icon size={28} color={C.gold} strokeWidth={1.25} /></div>
            <h3 className="mt-6" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500, fontSize: 30, lineHeight: 1.05, letterSpacing: "-0.02em" }}>{h}</h3>
            <p className="mt-4" style={{ color: C.muted, fontSize: 15, lineHeight: 1.6 }}>{p}</p>
          </article>
        ))}
      </section>

      {/* Manifesto / Member perks editorial */}
      <section className="px-6 md:px-12 py-24 max-w-5xl">
        <div className="grid md:grid-cols-12 gap-10 items-start">
          <div className="md:col-span-4">
            <Slug>Member perks</Slug>
          </div>
          <div className="md:col-span-8">
            <h2 style={{ fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500, fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1, letterSpacing: "-0.02em" }}>
              The room you've been looking for.
            </h2>
            <ul className="mt-10 space-y-5" style={{ fontSize: 17, lineHeight: 1.6 }}>
              {[
                "Priority RSVP to every members-only event",
                "Curated fan matches three times a week",
                "Private city crews and away-game travel",
                "Members-only mixers, dinners, and bar takeovers",
                "Merch drops and partner perks",
                "A direct line to the Loverball team",
              ].map((p) => (
                <li key={p} className="flex items-start gap-4">
                  <span style={{ color: C.raspberry, fontFamily: fonts.mono, fontSize: 11, marginTop: 6 }}>—</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 md:px-12 py-24 text-center" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <Slug>Join</Slug>
        <h2 className="mt-4 mx-auto max-w-3xl" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500, fontSize: "clamp(40px, 6vw, 80px)", lineHeight: 1, letterSpacing: "-0.02em" }}>
          A members-only home for sports fandom.
        </h2>
        <p className="mt-6 mx-auto max-w-md" style={{ color: C.muted, fontSize: 16, lineHeight: 1.6 }}>
          The Club is invite-only this season. Bring your code, or join the waitlist.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => navigate("/auth?mode=signup")}
            className="inline-flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: C.raspberry, color: "#fff", fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", padding: "18px 30px", borderRadius: 999, fontWeight: 500 }}
          >
            Join the Club <ArrowRight size={14} />
          </button>
          <Link
            to="/membership"
            className="inline-flex items-center justify-center gap-2 transition-all hover:bg-white/5"
            style={{ background: "transparent", color: C.text, fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", padding: "17px 28px", borderRadius: 999, fontWeight: 500, border: `1px solid ${C.borderStrong}` }}
          >
            Compare passes
          </Link>
        </div>
      </section>

      <footer className="px-6 md:px-12 py-10" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <Mono size={10}>© 2026 Loverball · Built in LA</Mono>
      </footer>
    </div>
  );
};

export default Club;
