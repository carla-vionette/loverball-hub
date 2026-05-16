import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Menu, X, Instagram, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-women-new.png";
import featuredImage from "@/assets/landing-athletes.jpg";
import secondaryImage from "@/assets/landing-fans.jpg";
import manifestoImage from "@/assets/landing-community.jpg";
import { INSTAGRAM_URL } from "@/lib/socialLinks";

/* ============================================================
   LOVERBALL — MEMBERS-ONLY LANDING
   Dark editorial sports magazine + private club
   ============================================================ */

const C = {
  bg: "#0a0a0a",
  surface: "#1A1A1A",
  surfaceHi: "#2A2A2A",
  text: "#FAF5E9",
  muted: "#B8B8B8",
  raspberry: "#D4537E",
  gold: "#E8B86A",
  teal: "#4ECDC4",
  border: "rgba(250, 245, 233, 0.08)",
  borderStrong: "rgba(250, 245, 233, 0.15)",
};

const fonts = {
  serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
  mono: "'Space Mono', ui-monospace, 'JetBrains Mono', monospace",
};

/* ---------- Small atoms ---------- */

const Slug = ({ children, color = C.raspberry }: { children: React.ReactNode; color?: string }) => (
  <span
    style={{
      fontFamily: fonts.mono,
      fontSize: 11,
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      color,
    }}
  >
    {children}
  </span>
);

const Chip = ({ children, accent = C.raspberry }: { children: React.ReactNode; accent?: string }) => (
  <span
    className="inline-flex items-center"
    style={{
      fontFamily: fonts.mono,
      fontSize: 10,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: accent,
      background: `${accent}14`,
      border: `0.5px solid ${accent}55`,
      padding: "5px 10px",
      borderRadius: 4,
    }}
  >
    {children}
  </span>
);

const Mono = ({ children, color = C.muted, size = 11 }: { children: React.ReactNode; color?: string; size?: number }) => (
  <span
    style={{
      fontFamily: fonts.mono,
      fontSize: size,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color,
    }}
  >
    {children}
  </span>
);

const PinkLink = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <button
    onClick={onClick}
    style={{
      fontFamily: fonts.mono,
      fontSize: 12,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: C.raspberry,
      borderBottom: `1px solid ${C.raspberry}`,
      paddingBottom: 2,
    }}
    className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
  >
    {children}
  </button>
);

const PrimaryBtn = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
    style={{
      background: C.raspberry,
      color: "#fff",
      fontFamily: fonts.mono,
      fontSize: 12,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      padding: "16px 26px",
      borderRadius: 999,
      fontWeight: 500,
    }}
  >
    {children}
  </button>
);

const OutlineBtn = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center justify-center gap-2 transition-all hover:bg-white/5 active:scale-[0.98]"
    style={{
      background: "transparent",
      color: C.text,
      fontFamily: fonts.mono,
      fontSize: 12,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      padding: "15px 26px",
      borderRadius: 999,
      border: `1px solid ${C.borderStrong}`,
      fontWeight: 500,
    }}
  >
    {children}
  </button>
);

/* ---------- Page ---------- */

const Index = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const goJoin = () => navigate("/auth?mode=signup");
  const goSignIn = () => navigate("/auth?mode=signin");

  const navItems: Array<{ label: string; to: string }> = [
    { label: "Watch", to: "/feed" },
    { label: "Connect", to: "/connect" },
    { label: "Events", to: "/events" },
    { label: "Club", to: "/club" },
  ];

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }} className="min-h-screen">
      <Seo
        title="Loverball — The members-only home for sports fandom."
        description="Watch the game. Connect with your people. Loverball is the members-only home for sports fandom — built around stories, watch parties, and the community that finally gets it."
        path="/"
      />

      {/* ============ STICKY NAV ============ */}
      <nav
        className="fixed top-0 inset-x-0 z-50"
        style={{
          background: "rgba(10, 10, 10, 0.8)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: `0.5px solid ${C.border}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-10 py-4 flex items-center justify-between">
          <Link to="/" className="flex flex-col">
            <span
              style={{
                fontFamily: fonts.serif,
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: 22,
                lineHeight: 1,
                color: C.text,
                letterSpacing: "-0.01em",
              }}
            >
              Loverball
            </span>
            <span className="md:hidden mt-0.5">
              <Mono size={9}>SPORT STORIES + COMMUNITY</Mono>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: C.text,
                }}
                className="hover:text-[#D4537E] transition-colors"
              >
                {n.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-5">
            <button
              onClick={goSignIn}
              style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: C.muted }}
              className="hover:text-[#FAF5E9] transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={goJoin}
              style={{
                background: C.raspberry,
                color: "#fff",
                fontFamily: fonts.mono,
                fontSize: 11,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                padding: "10px 18px",
                borderRadius: 999,
              }}
            >
              JOIN
            </button>
          </div>

          <button
            className="md:hidden p-2 -mr-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden px-5 pb-5 pt-2 flex flex-col gap-4" style={{ borderTop: `0.5px solid ${C.border}` }}>
            {navItems.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                onClick={() => setMobileOpen(false)}
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 12,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: C.text,
                }}
              >
                {n.label}
              </Link>
            ))}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setMobileOpen(false); goSignIn(); }}
                className="flex-1"
                style={{
                  fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
                  color: C.text, padding: "11px 18px", borderRadius: 999, border: `1px solid ${C.borderStrong}`,
                }}
              >
                Sign in
              </button>
              <button
                onClick={() => { setMobileOpen(false); goJoin(); }}
                className="flex-1"
                style={{
                  background: C.raspberry, color: "#fff",
                  fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
                  padding: "12px 18px", borderRadius: 999,
                }}
              >
                JOIN
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ============ HERO ============ */}
      <header
        className="relative min-h-[100svh] flex flex-col"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.85) 60%, rgba(10,10,10,1) 100%), url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center 25%",
        }}
      >
        <div className="flex-1 flex items-end pb-20 pt-28 md:pt-32">
          <div className="max-w-7xl w-full mx-auto px-5 md:px-10">
            <div className="max-w-4xl">
              <div className="mb-6">
                <Slug>Members only · Est. 2026 · Los Angeles</Slug>
              </div>

              <h1
                style={{
                  fontFamily: fonts.serif,
                  fontStyle: "italic",
                  fontWeight: 500,
                  fontSize: "clamp(44px, 7vw, 96px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.02em",
                  color: C.text,
                  margin: 0,
                }}
              >
                The members-only<br />
                home for <span style={{ color: C.raspberry }}>sports fandom.</span>
              </h1>

              <p
                className="mt-8 max-w-2xl"
                style={{
                  fontFamily: fonts.sans,
                  fontSize: "clamp(15px, 1.6vw, 18px)",
                  lineHeight: 1.55,
                  color: C.text,
                  fontWeight: 400,
                }}
              >
                Watch the game. Connect with your people. Loverball is the room
                sports fans have been waiting for — built around stories,
                watch parties, and the kind of community that finally gets it.
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                <PrimaryBtn onClick={goJoin}>Join the club — free</PrimaryBtn>
                <OutlineBtn onClick={() => navigate("/feed")}>Browse this week's drop</OutlineBtn>
              </div>

              <div className="mt-8">
                <Mono>Built by women who've been in the group chat the whole time</Mono>
              </div>
            </div>
          </div>
        </div>

        {/* Live ticker */}
        <div
          className="w-full"
          style={{
            background: "rgba(10,10,10,0.6)",
            borderTop: `0.5px solid ${C.border}`,
            borderBottom: `0.5px solid ${C.border}`,
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="max-w-7xl mx-auto px-5 md:px-10 py-3 flex items-center gap-4 overflow-x-auto whitespace-nowrap">
            <span
              style={{
                fontFamily: fonts.mono, fontSize: 10, letterSpacing: "0.22em",
                color: C.raspberry, textTransform: "uppercase",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 999, background: C.raspberry, display: "inline-block" }} />
              Live ticker
            </span>
            <Mono color={C.text} size={11}>Arsenal vs Chelsea · Sun 7am PT</Mono>
            <span style={{ color: C.muted }}>·</span>
            <Mono color={C.muted} size={11}>Watch party at The Cock &amp; Bull</Mono>
            <span style={{ color: C.muted }}>·</span>
            <Mono color={C.gold} size={11}>Members RSVP'd: 23</Mono>
          </div>
        </div>
      </header>

      {/* ============ THE DAILY FEED ============ */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 py-20 md:py-28">
        <div className="flex items-baseline justify-between mb-10">
          <div className="flex items-center gap-3">
            <Slug>The Daily Feed</Slug>
            <span style={{ width: 32, height: 1, background: C.raspberry, display: "inline-block" }} />
          </div>
          <PinkLink onClick={() => navigate("/feed")}>
            Read the full feed <ArrowRight size={14} />
          </PinkLink>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Large featured */}
          <article
            className="md:col-span-7 group"
            style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 4, overflow: "hidden" }}
          >
            <div
              className="w-full"
              style={{
                aspectRatio: "16/10",
                backgroundImage: `url(${featuredImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="p-7 md:p-9">
              <Chip>Featured</Chip>
              <h3
                className="mt-5"
                style={{
                  fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
                  fontSize: "clamp(26px, 3.4vw, 38px)", lineHeight: 1.1, color: C.text,
                  letterSpacing: "-0.015em",
                }}
              >
                Inside the room where the WNBA's next era is being written.
              </h3>
              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <Mono color={C.muted} size={11}>By the editorial team</Mono>
                <span style={{ color: C.muted }}>·</span>
                <Mono color={C.muted} size={11}>Published · Nov 14, 2026</Mono>
                <span style={{ color: C.muted }}>·</span>
                <Mono color={C.muted} size={11}>9 min read</Mono>
              </div>
            </div>
          </article>

          {/* Two stacked small */}
          <div className="md:col-span-5 flex flex-col gap-5">
            {[
              { tag: "Match recap", title: "Angel City held it down. Here's how.", read: "5 min read" },
              { tag: "Profile", title: "The case for Caitlin, and the people who made it.", read: "7 min read" },
            ].map((c, i) => (
              <article
                key={i}
                className="flex-1 group flex flex-col"
                style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 4, overflow: "hidden" }}
              >
                <div
                  style={{
                    aspectRatio: "16/9",
                    background:
                      i === 0
                        ? `linear-gradient(135deg, ${C.raspberry}44, ${C.surface})`
                        : `linear-gradient(135deg, ${C.gold}44, ${C.surface})`,
                  }}
                />
                <div className="p-5 md:p-6 flex flex-col gap-3 flex-1">
                  <Mono color={i === 0 ? C.raspberry : C.gold}>{c.tag}</Mono>
                  <h4
                    style={{
                      fontFamily: fonts.sans, fontWeight: 500,
                      fontSize: 18, lineHeight: 1.25, color: C.text, margin: 0,
                    }}
                  >
                    {c.title}
                  </h4>
                  <div className="mt-auto"><Mono color={C.muted} size={10}>{c.read}</Mono></div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <Mono>Published weekly · Free to read · Members get it first</Mono>
        </div>
      </section>

      {/* ============ TWO VERBS ============ */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 py-20 md:py-28" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <div className="mb-14 max-w-3xl">
          <Slug>The two verbs</Slug>
          <h2
            className="mt-5"
            style={{
              fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
              fontSize: "clamp(38px, 5.5vw, 64px)", lineHeight: 1, letterSpacing: "-0.02em", color: C.text, margin: 0,
            }}
          >
            Two things, done right.
          </h2>
          <p className="mt-6" style={{ color: C.muted, fontSize: 17, lineHeight: 1.55 }}>
            Everything Loverball does is in service of one of these.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[
            {
              chip: "01 · Watch",
              title: "Every story. Every game. Every angle.",
              body:
                "Match recaps that skip the offside explainer. Player profiles that go past the press conference. Live watch parties at hand-picked LA bars. Stadium meetups for Angel City, Sparks, and Sol games. Plus exclusive on-platform video — interviews, breakdowns, and the kind of storytelling you won't find anywhere else.",
              features: [
                "Sports stories · weekly",
                "Watch parties · live",
                "Stadium meetups · season-long",
                "Exclusive video · members only",
              ],
              caption: "Stories free to read. Events first to members.",
              link: "See what's on this week",
              to: "/feed",
            },
            {
              chip: "02 · Connect",
              title: "Your starting XI is already here.",
              body:
                "We use smart matching to introduce you to women who ride for your teams, watch the way you watch, and live close enough to actually meet. No swiping. No cold DMs. Just your people, drafted to your XI — with built-in openers so the first message isn't on you. Plus members-only group chats by team, by city, and by vibe.",
              features: [
                "Smart matching · AI-curated",
                "Mutual draft · no thirsty DMs",
                "Group chats · by team & city",
                "Members-only mixers · monthly",
              ],
              caption: "Three drafts a week. Make them count.",
              link: "Find your team",
              to: "/club",
            },
          ].map((card) => (
            <article
              key={card.chip}
              className="p-7 md:p-10 flex flex-col"
              style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 4 }}
            >
              <div><Chip>{card.chip}</Chip></div>
              <h3
                className="mt-6"
                style={{
                  fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
                  fontSize: "clamp(28px, 3.4vw, 42px)", lineHeight: 1.05, color: C.text,
                  letterSpacing: "-0.015em",
                }}
              >
                {card.title}
              </h3>
              <p className="mt-6" style={{ color: C.text, fontSize: 16, lineHeight: 1.65, opacity: 0.85 }}>
                {card.body}
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {card.features.map((f) => (
                  <span
                    key={f}
                    style={{
                      fontFamily: fonts.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
                      color: C.text, background: C.surfaceHi, border: `0.5px solid ${C.border}`,
                      padding: "8px 12px", borderRadius: 4,
                    }}
                  >
                    ▸ {f}
                  </span>
                ))}
              </div>
              <div className="mt-8"><Mono>{card.caption}</Mono></div>
              <div className="mt-5"><PinkLink onClick={() => navigate(card.to)}>{card.link} <ArrowRight size={14} /></PinkLink></div>
            </article>
          ))}
        </div>
      </section>

      {/* ============ A WEEK IN LOVERBALL ============ */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 py-20 md:py-28" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <div className="mb-14 max-w-3xl">
          <Slug>The schedule</Slug>
          <h2
            className="mt-5"
            style={{
              fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
              fontSize: "clamp(34px, 5vw, 56px)", lineHeight: 1, letterSpacing: "-0.02em", color: C.text, margin: 0,
            }}
          >
            Here's what a week as a member looks like.
          </h2>
          <p className="mt-6" style={{ color: C.muted, fontSize: 17, lineHeight: 1.55 }}>
            Watch and connect, every day, on your schedule.
          </p>
        </div>

        <ol className="flex flex-col">
          {[
            { day: "Mon", verb: "Watch", body: "Coffee with the Monday recap. Everything that happened over the weekend, in your inbox by 8am." },
            { day: "Wed", verb: "Connect", body: "Three new members drafted to your XI. The AI surfaces women who ride for your teams, in your city." },
            { day: "Fri", verb: "Watch", body: "Pre-game drop: this weekend's matchups, where Loverball members are gathering, and the bars to RSVP to." },
            { day: "Sat", verb: "Watch + Connect", body: "Live watch party at the right bar with the right crowd. Group chat open. Screenshots flying." },
            { day: "Sun", verb: "Watch", body: "Post-game deep dives. Player breakdowns. The full editorial drop while you nurse your hangover." },
          ].map((row, i, arr) => (
            <li
              key={row.day}
              className="grid grid-cols-[80px_1fr] md:grid-cols-[160px_120px_1fr] gap-4 md:gap-8 py-7"
              style={{ borderBottom: i === arr.length - 1 ? "none" : `0.5px solid ${C.border}` }}
            >
              <div>
                <span style={{ fontFamily: fonts.mono, fontSize: 13, letterSpacing: "0.22em", textTransform: "uppercase", color: C.text }}>
                  {row.day}
                </span>
              </div>
              <div className="hidden md:block">
                <Mono color={C.raspberry} size={11}>{row.verb}</Mono>
              </div>
              <div>
                <div className="md:hidden mb-2"><Mono color={C.raspberry} size={10}>{row.verb}</Mono></div>
                <p
                  style={{
                    fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 400,
                    fontSize: "clamp(18px, 2.2vw, 24px)", lineHeight: 1.4, color: C.text, margin: 0,
                  }}
                >
                  {row.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ============ PROBLEM / PULL QUOTE ============ */}
      <section style={{ background: C.surface }} className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-5 md:px-10">
          <div style={{ position: "relative" }}>
            <span
              aria-hidden
              style={{
                fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
                color: C.raspberry, fontSize: "clamp(120px, 18vw, 220px)",
                lineHeight: 0.8, position: "absolute", top: -20, left: -8, opacity: 0.95,
              }}
            >
              "
            </span>
            <blockquote
              className="relative pl-10 md:pl-20"
              style={{
                fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
                fontSize: "clamp(28px, 4vw, 48px)", lineHeight: 1.15, color: C.text,
                letterSpacing: "-0.015em", margin: 0,
              }}
            >
              Female sports fans spend billions. And still get nothing built for them.
            </blockquote>
          </div>

          <p
            className="mt-12 max-w-2xl"
            style={{ color: C.text, fontSize: 17, lineHeight: 1.65, opacity: 0.85 }}
          >
            Sports media talks past us. Apps treat us like a marketing demo. Watch parties feel
            like we crashed someone else's. The group chat is great — but it ends at five women.
          </p>

          <p
            className="mt-10"
            style={{
              fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
              color: C.raspberry, fontSize: "clamp(22px, 2.6vw, 30px)",
              letterSpacing: "-0.01em", margin: 0,
            }}
          >
            So we built the room ourselves. Members only.
          </p>
        </div>
      </section>

      {/* ============ THE PASS / TIERS ============ */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 py-20 md:py-28">
        <div className="mb-14 max-w-3xl">
          <Slug>The Pass</Slug>
          <h2
            className="mt-5"
            style={{
              fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
              fontSize: "clamp(38px, 5.5vw, 64px)", lineHeight: 1, letterSpacing: "-0.02em", color: C.text, margin: 0,
            }}
          >
            Pick your level. Cancel anytime.
          </h2>
          <div className="mt-6"><Mono>Every tier is a membership. Choose yours.</Mono></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              name: "Free",
              tagline: "For the curious fan.",
              price: "$0",
              priceMeta: "Always",
              features: [
                "Every Loverball story, free to read",
                "Browse upcoming events",
                "Create your fan profile",
              ],
              cta: "Sign up free",
              fine: "No credit card. 30 seconds.",
              accent: null,
            },
            {
              name: "Insider",
              tagline: "For the fan who shows up.",
              price: "$15",
              priceMeta: "Per month",
              chip: "Most members pick this",
              features: [
                "Everything in Free, plus:",
                "Access to all Loverball watch parties & events",
                "The Starting XI matching feature",
                "Exclusive on-platform video content",
                "Insider-only newsletter & group chats",
                "Member discounts on tickets & merch",
              ],
              cta: "Become an Insider",
              fine: "First 7 days free. Cancel anytime.",
              accent: C.raspberry,
            },
            {
              name: "All-Access",
              tagline: "For the fan who runs the group chat.",
              price: "$35",
              priceMeta: "Per month",
              features: [
                "Everything in Insider, plus:",
                "Priority RSVP to sold-out events",
                "Members-only mixers & athlete panels",
                "Behind-the-scenes content & interviews",
                "Quarterly Loverball merch drop",
                "First invites to brand partner activations",
              ],
              cta: "Go All-Access",
              fine: "Limited spots each month. Founding member pricing.",
              accent: C.gold,
            },
          ].map((tier) => {
            const borderWidth = tier.accent ? "2px" : "0.5px";
            const borderColor = tier.accent || C.border;
            return (
              <article
                key={tier.name}
                className="relative p-7 md:p-9 flex flex-col"
                style={{
                  background: C.surface,
                  border: `${borderWidth} solid ${borderColor}`,
                  borderRadius: 4,
                }}
              >
                {tier.chip && (
                  <div className="absolute -top-3 left-7"><Chip>{tier.chip}</Chip></div>
                )}
                <div className="flex items-baseline justify-between">
                  <h3
                    style={{
                      fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
                      fontSize: 28, color: tier.accent || C.text, margin: 0, letterSpacing: "-0.01em",
                    }}
                  >
                    {tier.name}
                  </h3>
                  <div className="text-right">
                    <div style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 28, color: C.text, lineHeight: 1 }}>{tier.price}</div>
                    <div className="mt-1"><Mono color={C.muted} size={9}>{tier.priceMeta}</Mono></div>
                  </div>
                </div>

                <p className="mt-3" style={{ color: C.muted, fontSize: 14, lineHeight: 1.5 }}>{tier.tagline}</p>

                <div
                  className="my-6"
                  style={{ height: 1, background: C.border }}
                />

                <ul className="flex flex-col gap-3 flex-1">
                  {tier.features.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3"
                      style={{ fontSize: 14, color: C.text, lineHeight: 1.5 }}
                    >
                      <span style={{ color: tier.accent || C.raspberry, marginTop: 2 }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={goJoin}
                  className="mt-8 inline-flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{
                    background: tier.accent === C.gold ? C.gold : C.raspberry,
                    color: tier.accent === C.gold ? "#0a0a0a" : "#fff",
                    fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
                    padding: "14px 22px", borderRadius: 999, fontWeight: 500,
                  }}
                >
                  {tier.cta} <ArrowRight size={14} />
                </button>
                <div className="mt-4 text-center"><Mono color={C.muted} size={9}>{tier.fine}</Mono></div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ============ TESTIMONIALS / THE CLUB SAYS ============ */}
      <section
        className="py-20 md:py-28"
        style={{ borderTop: `0.5px solid ${C.border}` }}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <div className="mb-14 max-w-3xl">
            <Slug>The club says</Slug>
            <h2
              className="mt-5"
              style={{
                fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
                fontSize: "clamp(34px, 5vw, 56px)", lineHeight: 1, letterSpacing: "-0.02em", color: C.text, margin: 0,
              }}
            >
              The members who get it.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Large */}
            <article
              className="md:col-span-7 p-8 md:p-12"
              style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 4, position: "relative" }}
            >
              <span
                aria-hidden
                style={{
                  fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
                  color: C.raspberry, fontSize: "clamp(80px, 12vw, 140px)",
                  lineHeight: 0.8, position: "absolute", top: 0, left: 18, opacity: 0.95,
                }}
              >
                "
              </span>
              <blockquote
                className="relative pt-10 md:pt-14"
                style={{
                  fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
                  fontSize: "clamp(22px, 2.6vw, 30px)", lineHeight: 1.3, color: C.text,
                  letterSpacing: "-0.01em", margin: 0,
                }}
              >
                I've watched Arsenal alone for ten years. Loverball found me five women in LA who actually understand why I'm screaming at 7am.
              </blockquote>
              <div className="mt-8"><Mono color={C.muted} size={11}>Insider member · Arsenal FC · Los Angeles</Mono></div>
            </article>

            <div className="md:col-span-5 flex flex-col gap-5">
              {[
                {
                  q: "I joined for the stories and stayed for the watch parties. It's the only sports community I've ever actually used.",
                  byline: "All-Access member · Angel City FC · Los Angeles",
                },
                {
                  q: "Walked into my first Loverball watch party not knowing anyone. Left with a group chat I'm still in.",
                  byline: "Insider member · LA Sparks · Los Angeles",
                },
              ].map((t, i) => (
                <article
                  key={i}
                  className="p-6 md:p-7 flex-1"
                  style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 4 }}
                >
                  <p
                    style={{
                      fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 400,
                      fontSize: 18, lineHeight: 1.4, color: C.text, margin: 0,
                    }}
                  >
                    "{t.q}"
                  </p>
                  <div className="mt-5"><Mono color={C.muted} size={10}>{t.byline}</Mono></div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-10 text-center">
            <Mono color={C.gold}>★★★★★ "Finally." — what we hear most</Mono>
          </div>
        </div>
      </section>

      {/* ============ MANIFESTO ============ */}
      <section
        className="relative py-24 md:py-32"
        style={{
          background: C.surface,
          backgroundImage: `radial-gradient(ellipse at top, ${C.raspberry}22, transparent 60%)`,
        }}
      >
        <div className="max-w-3xl mx-auto px-5 md:px-10">
          <Slug>From the editors</Slug>
          <h2
            className="mt-6"
            style={{
              fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
              fontSize: "clamp(38px, 6vw, 72px)", lineHeight: 0.98, letterSpacing: "-0.02em", color: C.text, margin: 0,
            }}
          >
            Women's sports isn't having a moment.
          </h2>
          <p
            className="mt-5"
            style={{
              fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
              color: C.raspberry, fontSize: "clamp(24px, 3.2vw, 36px)",
              letterSpacing: "-0.01em", margin: 0, lineHeight: 1.1,
            }}
          >
            We've been the moment.
          </p>

          <div className="mt-10 flex flex-col gap-6" style={{ maxWidth: 600 }}>
            <p style={{ color: C.text, fontSize: 17, lineHeight: 1.7, opacity: 0.9 }}>
              We knew Sam Kerr before the World Cup. Watched Caitlin Clark in college. Argued
              about Arteta's lineup at 6am. Sat in half-empty stands for Angel City's opener.
              Texted our friends through every WNBA Finals overtime.
            </p>
            <p style={{ color: C.text, fontSize: 17, lineHeight: 1.7, opacity: 0.9 }}>
              We've been here. We've been loud. We've been everywhere except in the rooms
              built for us.
            </p>
          </div>

          <p
            className="mt-12"
            style={{
              fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
              color: C.raspberry, fontSize: "clamp(26px, 3.6vw, 42px)",
              letterSpacing: "-0.015em", margin: 0, lineHeight: 1.1,
            }}
          >
            Loverball is that room. Members only.
          </p>

          <div className="mt-10"><Mono>— The Loverball editorial team</Mono></div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="max-w-5xl mx-auto px-5 md:px-10 py-24 md:py-32 text-center">
        <h2
          style={{
            fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
            fontSize: "clamp(34px, 5.5vw, 64px)", lineHeight: 1.05, letterSpacing: "-0.02em",
            color: C.text, margin: 0,
          }}
        >
          The members-only home for sports fandom.<br />
          <span style={{ color: C.raspberry }}>Your seat is open.</span>
        </h2>

        <div className="mt-10 flex flex-wrap gap-3 justify-center">
          <PrimaryBtn onClick={goJoin}>Join Loverball — free forever</PrimaryBtn>
          <OutlineBtn onClick={goJoin}>Try Insider — first week free</OutlineBtn>
        </div>

        <div className="mt-8"><Mono>Cancel anytime · Built in LA · Made for everywhere</Mono></div>
      </section>

      {/* ============ NEWSLETTER + FOOTER ============ */}
      <footer style={{ borderTop: `0.5px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto px-5 md:px-10 py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-7">
              <Slug>The weekly drop</Slug>
              <h3
                className="mt-5"
                style={{
                  fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
                  fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1, color: C.text, margin: 0,
                  letterSpacing: "-0.015em",
                }}
              >
                Get the weekly drop.
              </h3>
              <p className="mt-4 max-w-md" style={{ color: C.muted, fontSize: 16, lineHeight: 1.55 }}>
                Stories, schedules, and group chat previews. One email. Sundays. Unsubscribe whenever.
              </p>

              <form
                onSubmit={(e) => { e.preventDefault(); goJoin(); }}
                className="mt-7 flex gap-2 max-w-md"
              >
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 px-4 py-3 outline-none"
                  style={{
                    background: C.surface, color: C.text,
                    border: `0.5px solid ${C.borderStrong}`, borderRadius: 999,
                    fontFamily: fonts.sans, fontSize: 14,
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: C.raspberry, color: "#fff",
                    fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
                    padding: "12px 22px", borderRadius: 999,
                  }}
                >
                  Subscribe
                </button>
              </form>
            </div>

            <div className="md:col-span-5 grid grid-cols-2 gap-8">
              {[
                { h: "Read", items: [["About", "/about"], ["Watch", "/feed"], ["Connect", "/connect"]] },
                { h: "Club", items: [["Events", "/events"], ["The Pass", "/membership"], ["Contact", "/contact"]] },
              ].map((col) => (
                <div key={col.h} className="flex flex-col gap-3">
                  <Mono color={C.muted} size={10}>{col.h}</Mono>
                  {col.items.map(([label, to]) => (
                    <Link
                      key={label}
                      to={to}
                      style={{ fontFamily: fonts.sans, fontSize: 14, color: C.text }}
                      className="hover:text-[#D4537E] transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div
            className="pt-10 flex flex-col md:flex-row md:items-end justify-between gap-8"
            style={{ borderTop: `0.5px solid ${C.border}` }}
          >
            <div>
              <div
                style={{
                  fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
                  fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1, color: C.text,
                  letterSpacing: "-0.02em",
                }}
              >
                Loverball
              </div>
              <p className="mt-3 max-w-md" style={{ color: C.muted, fontSize: 14, lineHeight: 1.55 }}>
                The members-only home for sports fandom.
              </p>
            </div>

            <div className="flex flex-col md:items-end gap-5">
              <div className="flex items-center gap-4">
                {[
                  { Icon: Instagram, href: INSTAGRAM_URL },
                ].map(({ Icon, href }, i) => (
                  <a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: C.text, opacity: 0.7 }}
                    className="hover:opacity-100 transition-opacity"
                    aria-label="Loverball on Instagram"
                  >
                    <Icon size={20} />
                  </a>
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                {[["Privacy", "/privacy"], ["Terms", "/terms"]].map(([l, h]) => (
                  <Link key={l} to={h} style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: C.muted }}>{l}</Link>
                ))}
              </div>
              <Mono color={C.muted} size={10}>© 2026 Loverball · Built in LA · SPORT STORIES + COMMUNITY</Mono>
            </div>
          </div>
        </div>

        {/* Decorative manifesto strip image, very subtle */}
        <div
          aria-hidden
          style={{
            height: 4,
            background: `linear-gradient(90deg, ${C.raspberry}, ${C.gold}, ${C.teal})`,
            opacity: 0.4,
          }}
        />
      </footer>
    </div>
  );
};

export default Index;
