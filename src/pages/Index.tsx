import { Link, useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Instagram, ArrowRight, ArrowUpRight, MapPin, Users, Tv, Activity, Check } from "lucide-react";
import heroImage from "@/assets/hero-women-new.png";
import loverballWordmark from "@/assets/loverball-wordmark.png.asset.json";

import WhatsHappeningNow from "@/components/WhatsHappeningNow";
import StoriesSection from "@/components/StoriesSection";
import { INSTAGRAM_URL } from "@/lib/socialLinks";

/* ============================================================
   LOVERBALL — HOMEPAGE
   Fable-inspired: deep ink hero, editorial serif/sans mix,
   warm cream sections, coral accent. Location-aware fan
   platform for women's sports.
   ============================================================ */

const C = {
  ink: "#0D0D0D",
  inkSoft: "#1A1A1A",
  inkRule: "rgba(245,240,232,0.14)",
  inkMuted: "#A8A29A",
  cream: "#F5F0E8",
  creamHi: "#FBF7EF",
  creamMuted: "#6B6B6B",
  rule: "rgba(13,13,13,0.12)",
  accent: "#E85D26",
};

const fonts = {
  serif: "'Playfair Display', 'Tiempos Headline', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
  mono: "'Space Mono', ui-monospace, monospace",
  display: "'Anton', Impact, sans-serif",
};

const MEMBERSHIP_PRICE = 35;

const TAGLINE =
  "Loverball is a location-aware fan platform that helps women's sports fans connect online and in real life, discover what's happening nearby, know where to watch, and stay on top of live scores and team updates.";

/* ---------- Atoms ---------- */

const Mono = ({
  children,
  color,
  size = 11,
}: { children: React.ReactNode; color?: string; size?: number }) => (
  <span
    style={{
      fontFamily: fonts.mono,
      fontSize: size,
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      color: color ?? C.creamMuted,
      fontWeight: 500,
    }}
  >
    {children}
  </span>
);

/* ---------- Page ---------- */

const Index = () => {
  const navigate = useNavigate();
  const goJoin = () => navigate("/auth?mode=signup");

  return (
    <div style={{ background: C.cream, color: C.ink, fontFamily: fonts.sans }}>
      <Seo
        title="Loverball — Location-aware fan platform for women's sports"
        description="Loverball helps women's sports fans connect online and IRL, discover what's happening nearby, know where to watch, and stay on top of live scores and team updates."
        path="/"
      />

      {/* Animations */}
      <style>{`
        @keyframes lb-rise {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes lb-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes lb-pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.6); opacity: 0.5; }
        }
        .lb-rise { animation: lb-rise 0.9s cubic-bezier(0.16,1,0.3,1) both; }
        .lb-fade { animation: lb-fade 1.2s ease-out both; }
        .lb-delay-1 { animation-delay: 0.1s; }
        .lb-delay-2 { animation-delay: 0.25s; }
        .lb-delay-3 { animation-delay: 0.4s; }
        .lb-delay-4 { animation-delay: 0.55s; }
        .lb-card-hover { transition: transform 320ms cubic-bezier(0.16,1,0.3,1), border-color 320ms ease, background 320ms ease; }
        .lb-card-hover:hover { transform: translateY(-4px); }
      `}</style>

      {/* ============ TOP NAV ============ */}
      <nav
        className="px-5 md:px-10 py-5 flex items-center justify-between sticky top-0 z-50"
        style={{
          background: "rgba(13,13,13,0.85)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: `1px solid ${C.inkRule}`,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={goJoin}
            style={{
              background: C.accent, color: "#fff",
              fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.2em",
              textTransform: "uppercase", padding: "12px 22px", borderRadius: 999,
              fontWeight: 600,
              boxShadow: "0 8px 24px -10px rgba(232,93,38,0.6)",
            }}
            className="hover:-translate-y-0.5 transition-transform"
          >
            Join
          </button>
          <Link
            to="/auth?mode=signin"
            style={{
              fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.22em",
              textTransform: "uppercase", color: C.cream,
            }}
            className="hover:opacity-60 transition-opacity"
          >
            Sign In
          </Link>
        </div>
        <div className="hidden md:flex items-center gap-9">
          {[
            ["About", "/about"],
            ["Membership", "/membership"],
            ["Events", "/events"],
            ["Stories", "/feed"],
          ].map(([l, h]) => (
            <Link
              key={l}
              to={h}
              style={{
                fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.22em",
                textTransform: "uppercase", color: C.cream,
              }}
              className="hover:opacity-60 transition-opacity"
            >
              {l}
            </Link>
          ))}
        </div>
      </nav>

      {/* ============ HERO — deep ink, editorial ============ */}
      <section
        className="px-5 md:px-10 pt-12 md:pt-20 pb-20 md:pb-32 relative overflow-hidden"
        style={{ background: C.ink, color: C.cream }}
      >
        {/* soft ambient accent glow */}
        <div
          aria-hidden
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${C.accent}33 0%, transparent 70%)`,
            filter: "blur(40px)",
          }}
        />

        <div className="max-w-[1400px] mx-auto relative">
          {/* Editorial issue line */}
          <div className="flex items-center justify-between mb-10 md:mb-16 lb-fade">
            <Mono color={C.cream}>Vol. 01 — Founding Issue</Mono>
            <Mono color={C.inkMuted}>Los Angeles, CA</Mono>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            {/* LEFT — Logo + Headline */}
            <div className="lg:col-span-7">
              {/* Hero wordmark */}
              <img
                src={loverballWordmark.url}
                alt="Loverball"
                className="block mb-8 md:mb-10 w-[280px] md:w-[380px] lg:w-[440px] h-auto select-none lb-rise"
                draggable={false}
                loading="eager"
                decoding="async"
                style={{ filter: "brightness(0) invert(1)" }}
              />

              {/* Location pill */}
              <div className="mb-8 lb-rise lb-delay-1">
                <span
                  className="inline-flex items-center gap-2"
                  style={{
                    background: `${C.accent}1A`,
                    color: C.accent,
                    border: `1px solid ${C.accent}66`,
                    fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.22em",
                    textTransform: "uppercase", padding: "8px 14px", borderRadius: 999,
                    fontWeight: 600,
                  }}
                >
                  <span className="relative flex w-2 h-2">
                    <span
                      className="absolute inline-flex w-full h-full rounded-full"
                      style={{ background: C.accent, animation: "lb-pulse-dot 2s infinite" }}
                    />
                    <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: C.accent }} />
                  </span>
                  <MapPin size={12} strokeWidth={2.5} />
                  Find fans near you
                </span>
              </div>

              {/* Editorial headline — mixed serif italic + sans display */}
              <h1
                className="lb-rise lb-delay-2"
                style={{ lineHeight: 0.9, letterSpacing: "-0.035em" }}
              >
                <span
                  style={{
                    display: "block",
                    fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 400,
                    fontSize: "clamp(44px, 7vw, 112px)",
                    color: C.cream,
                  }}
                >
                  Her game,
                </span>
                <span
                  style={{
                    display: "block",
                    fontFamily: fonts.display, fontWeight: 400,
                    fontSize: "clamp(56px, 9.5vw, 152px)",
                    textTransform: "uppercase",
                    color: C.cream,
                    letterSpacing: "-0.02em",
                  }}
                >
                  her city,
                </span>
                <span
                  style={{
                    display: "block",
                    fontFamily: fonts.display, fontWeight: 400,
                    fontSize: "clamp(56px, 9.5vw, 152px)",
                    textTransform: "uppercase",
                    color: C.accent,
                    letterSpacing: "-0.02em",
                  }}
                >
                  her crew.
                </span>
              </h1>

              <p
                className="mt-8 max-w-xl lb-rise lb-delay-3"
                style={{ fontSize: 17, lineHeight: 1.6, color: C.inkMuted }}
              >
                {TAGLINE}
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-5 lb-rise lb-delay-4">
                <button
                  onClick={goJoin}
                  style={{
                    background: C.accent, color: "#fff",
                    fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.2em",
                    textTransform: "uppercase", padding: "18px 32px", borderRadius: 999,
                    fontWeight: 600,
                    boxShadow: "0 14px 36px -14px rgba(232,93,38,0.7)",
                  }}
                  className="hover:-translate-y-0.5 transition-transform"
                >
                  Join the Community
                </button>
                <Link
                  to="/events"
                  style={{
                    fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.2em",
                    textTransform: "uppercase", color: C.cream,
                    borderBottom: `1px solid ${C.cream}`, paddingBottom: 4,
                  }}
                  className="inline-flex items-center gap-2 hover:opacity-70"
                >
                  See what's nearby <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* RIGHT — image with editorial caption */}
            <div className="lg:col-span-5 lb-fade lb-delay-3">
              <figure>
                <div
                  className="relative overflow-hidden"
                  style={{
                    aspectRatio: "4/5",
                    borderRadius: 4,
                    border: `1px solid ${C.inkRule}`,
                  }}
                >
                  <img
                    src={heroImage}
                    alt="Women sports fans at a Loverball watch party in Los Angeles"
                    className="w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                  />
                  {/* Live location chip */}
                  <div
                    className="absolute top-4 left-4 inline-flex items-center gap-2"
                    style={{
                      background: "rgba(13,13,13,0.7)",
                      backdropFilter: "blur(8px)",
                      color: C.cream,
                      border: `1px solid ${C.inkRule}`,
                      padding: "8px 12px",
                      borderRadius: 999,
                      fontFamily: fonts.mono, fontSize: 10, letterSpacing: "0.18em",
                      textTransform: "uppercase",
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: C.accent, animation: "lb-pulse-dot 2s infinite" }}
                    />
                    Live · Echo Park
                  </div>
                </div>
                <figcaption className="mt-4 flex items-start justify-between gap-4">
                  <Mono color={C.inkMuted} size={10}>Fig. 01 — Members watch party</Mono>
                  <Mono color={C.cream} size={10}>2026</Mono>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MARQUEE TICKER ============ */}
      <div style={{ background: C.accent, color: "#fff" }} className="overflow-hidden">
        <div
          className="marquee-track py-4 whitespace-nowrap"
          style={{
            fontFamily: fonts.serif,
            fontStyle: "italic",
            fontSize: 26,
            letterSpacing: "-0.01em",
          }}
        >
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k} className="inline-flex items-center gap-10 px-6">
              {[
                "Connect IRL",
                "★",
                "Find fans near you",
                "★",
                "Know where to watch",
                "★",
                "Live scores",
                "★",
                "Built for women's sports",
                "★",
              ].map((t, i) => (
                <span key={`${k}-${i}`}>{t}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ============ THREE PILLARS — Connect / Watch / Score ============ */}
      <section className="px-5 md:px-10 py-24 md:py-36" style={{ background: C.cream }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-end justify-between gap-6 mb-16">
            <div className="max-w-2xl">
              <Mono color={C.ink}>§ 01 — The Platform</Mono>
              <h2
                className="mt-5"
                style={{
                  fontFamily: fonts.serif,
                  fontWeight: 400,
                  fontSize: "clamp(40px, 6vw, 88px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.03em",
                  color: C.ink,
                }}
              >
                Connect. Watch.<br />
                <span style={{ fontStyle: "italic", color: C.accent }}>Score.</span>
              </h2>
            </div>
            <Mono color={C.creamMuted}>Three pillars</Mono>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                n: "01",
                kicker: "Connect",
                Icon: Users,
                title: "Find your fans.",
                body: "Smart matching by team, city, and vibe. Group chats, city crews, and the IRL friendships you've been looking for.",
              },
              {
                n: "02",
                kicker: "Watch",
                Icon: Tv,
                title: "Know where to watch.",
                body: "Watch parties, sports bars, and venues near you — plus the broadcast info so you never miss a tip-off, kick-off, or first pitch.",
              },
              {
                n: "03",
                kicker: "Score",
                Icon: Activity,
                title: "Live scores & updates.",
                body: "Real-time scores, team updates, and storylines from the WNBA, NWSL, NCAA, and every league women are leading.",
              },
            ].map((b) => (
              <article
                key={b.n}
                className="p-8 md:p-10 flex flex-col lb-card-hover"
                style={{
                  background: C.creamHi,
                  border: `1px solid ${C.rule}`,
                  borderRadius: 20,
                  minHeight: 400,
                }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="inline-flex items-center justify-center"
                    style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: C.ink, color: C.accent,
                    }}
                  >
                    <b.Icon size={22} strokeWidth={1.75} />
                  </div>
                  <span
                    style={{
                      fontFamily: fonts.display,
                      fontSize: 56,
                      lineHeight: 1,
                      color: C.accent,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {b.n}
                  </span>
                </div>
                <div className="mt-10">
                  <Mono color={C.creamMuted} size={10}>{b.kicker}</Mono>
                </div>
                <h3
                  className="mt-3"
                  style={{
                    fontFamily: fonts.serif,
                    fontWeight: 400,
                    fontSize: 30,
                    lineHeight: 1.1,
                    letterSpacing: "-0.015em",
                    color: C.ink,
                  }}
                >
                  {b.title}
                </h3>
                <p
                  className="mt-4 flex-1"
                  style={{ color: C.inkSoft, fontSize: 15, lineHeight: 1.65 }}
                >
                  {b.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHAT'S HAPPENING NEARBY ============ */}
      <section
        className="px-5 md:px-10 py-20 md:py-28"
        style={{ background: C.creamHi, borderTop: `1px solid ${C.rule}` }}
      >
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-end justify-between mb-10 gap-6">
            <div>
              <Mono color={C.creamMuted}>§ 02 — On Deck</Mono>
              <h2
                className="mt-3"
                style={{
                  fontFamily: fonts.serif,
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: "clamp(36px, 5vw, 64px)",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  color: C.ink,
                }}
              >
                What's happening nearby.
              </h2>
            </div>
            <Link
              to="/events"
              style={{
                fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.22em",
                textTransform: "uppercase", color: C.ink,
              }}
              className="hidden md:inline-flex items-center gap-2 hover:opacity-60"
            >
              All events <ArrowUpRight size={14} />
            </Link>
          </div>
          <WhatsHappeningNow />
        </div>
      </section>

      {/* ============ STORIES ============ */}
      <section className="px-5 md:px-10 py-20 md:py-28" style={{ background: C.cream }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-10">
            <Mono color={C.creamMuted}>§ 03 — The Reading Room</Mono>
            <h2
              className="mt-3"
              style={{
                fontFamily: fonts.serif,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: "clamp(36px, 5vw, 64px)",
                lineHeight: 1,
                letterSpacing: "-0.02em",
                color: C.ink,
              }}
            >
              Stories worth reading.
            </h2>
          </div>
          <StoriesSection />
        </div>
      </section>

      {/* ============ PULLED QUOTE — deep ink ============ */}
      <section
        className="px-5 md:px-10 py-28 md:py-40"
        style={{ background: C.ink, color: C.cream }}
      >
        <div className="max-w-[1200px] mx-auto">
          <Mono color={C.inkMuted}>§ 04 — From a Member</Mono>
          <blockquote
            className="mt-10"
            style={{
              fontFamily: fonts.serif,
              fontWeight: 400,
              fontSize: "clamp(34px, 5.5vw, 84px)",
              lineHeight: 1.08,
              letterSpacing: "-0.025em",
              color: C.cream,
            }}
          >
            <span style={{ color: C.accent, fontStyle: "italic" }}>"</span>
            I opened Loverball, found three watch parties within two miles, and
            <span style={{ fontStyle: "italic" }}> walked in already knowing people.</span>
            <span style={{ color: C.accent, fontStyle: "italic" }}>"</span>
          </blockquote>
          <div className="mt-12 flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ background: C.accent, color: "#fff", fontFamily: fonts.serif, fontSize: 18, fontStyle: "italic" }}
            >
              M
            </div>
            <div>
              <div style={{ fontFamily: fonts.sans, fontSize: 15, color: C.cream }}>Maya R.</div>
              <Mono color={C.inkMuted} size={10}>Founding Member · Los Angeles</Mono>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MEMBERSHIP — single tier ============ */}
      <section className="px-5 md:px-10 py-24 md:py-36" style={{ background: C.cream }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-5">
              <Mono color={C.ink}>§ 05 — Membership</Mono>
              <h2
                className="mt-5"
                style={{
                  fontFamily: fonts.serif,
                  fontWeight: 400,
                  fontSize: "clamp(44px, 7vw, 104px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.03em",
                  color: C.ink,
                }}
              >
                One pass.<br />
                <span style={{ fontStyle: "italic" }}>Everything in.</span>
              </h2>
              <p className="mt-8 max-w-md" style={{ color: C.inkSoft, fontSize: 17, lineHeight: 1.55 }}>
                The Club is our full members-only home. Location-aware matching,
                unlimited group chats, members-only events, RSVP priority, and the
                founding-member perks while we're still small.
              </p>
            </div>

            <div className="lg:col-span-7">
              <article
                className="relative p-8 md:p-12 lb-card-hover"
                style={{ background: C.ink, color: C.cream, borderRadius: 24 }}
              >
                <div className="flex items-start justify-between gap-4 mb-10">
                  <Mono color={C.accent}>The Club</Mono>
                  <Mono color={C.inkMuted} size={10}>Monthly</Mono>
                </div>

                <div className="flex items-baseline gap-3">
                  <span
                    style={{
                      fontFamily: fonts.display,
                      fontSize: "clamp(96px, 14vw, 180px)",
                      lineHeight: 0.9,
                      color: C.cream,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    ${MEMBERSHIP_PRICE}
                  </span>
                  <span style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 22, color: C.inkMuted }}>
                    / month
                  </span>
                </div>

                <div className="mt-10 pt-8" style={{ borderTop: `1px solid ${C.inkRule}` }}>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    {[
                      "Location-aware fan matching",
                      "Unlimited group chats & circles",
                      "Members-only events & watch parties",
                      "Where-to-watch finder",
                      "Live scores & team updates",
                      "RSVP priority",
                      "Founding-member perks",
                      "VIP city meetups",
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-3" style={{ fontSize: 14, lineHeight: 1.55 }}>
                        <Check size={16} color={C.accent} strokeWidth={2.25} className="mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <button
                    onClick={goJoin}
                    style={{
                      background: C.accent, color: "#fff",
                      fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.2em",
                      textTransform: "uppercase", padding: "18px 32px", borderRadius: 999,
                      fontWeight: 600,
                      boxShadow: "0 14px 36px -16px rgba(232,93,38,0.7)",
                    }}
                    className="hover:-translate-y-0.5 transition-transform"
                  >
                    Join The Club
                  </button>
                  <Link
                    to="/membership"
                    style={{
                      fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.22em",
                      textTransform: "uppercase", color: C.cream,
                      borderBottom: `1px solid ${C.inkMuted}`, paddingBottom: 4,
                    }}
                    className="inline-flex items-center gap-2 hover:opacity-80"
                  >
                    Full details <ArrowRight size={12} />
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="px-5 md:px-10 py-28 md:py-40 text-center" style={{ background: C.creamHi }}>
        <div className="max-w-4xl mx-auto">
          <Mono color={C.creamMuted}>§ 06 — One More Thing</Mono>
          <h2
            className="mt-6"
            style={{
              fontFamily: fonts.serif,
              fontWeight: 400,
              fontSize: "clamp(48px, 8vw, 128px)",
              lineHeight: 0.95,
              letterSpacing: "-0.035em",
              color: C.ink,
            }}
          >
            Sports are better<br />
            <span style={{ fontStyle: "italic", color: C.accent }}>with the right people.</span>
          </h2>
          <div className="mt-12 flex flex-wrap gap-4 justify-center">
            <button
              onClick={goJoin}
              style={{
                background: C.ink, color: C.cream,
                fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.2em",
                textTransform: "uppercase", padding: "20px 36px", borderRadius: 999,
                fontWeight: 500,
              }}
              className="hover:bg-[#2A2A2A] transition-colors"
            >
              Become a Member
            </button>
            <Link
              to="/events"
              style={{
                fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.2em",
                textTransform: "uppercase", color: C.ink,
                border: `1px solid ${C.ink}`, padding: "19px 35px", borderRadius: 999,
              }}
              className="inline-flex items-center gap-2 hover:bg-black/5"
            >
              See Upcoming Events <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ background: C.ink, color: C.cream }}>
        <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-7">
              <img
                src={loverballWordmark.url}
                alt="Loverball"
                className="w-[280px] md:w-[360px] h-auto select-none mb-6"
                draggable={false}
                loading="lazy"
                decoding="async"
                style={{ filter: "brightness(0) invert(1)" }}
              />
              <p className="max-w-md" style={{ color: C.inkMuted, fontSize: 15, lineHeight: 1.6 }}>
                A location-aware fan platform for women's sports. Connect online and IRL,
                find what's happening nearby, and never miss a score. Built in LA.
              </p>
              <a
                href="mailto:hello@loverball.com"
                className="mt-6 inline-block hover:opacity-80 transition-opacity"
                style={{ fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.1em", color: C.cream, borderBottom: `1px solid ${C.accent}`, paddingBottom: 3 }}
              >
                hello@loverball.com
              </a>
            </div>

            <div className="md:col-span-5 grid grid-cols-2 gap-8">
              {[
                { h: "Loverball", items: [["About", "/about"], ["Membership", "/membership"], ["Contact", "/contact"]] as [string, string][] },
                { h: "Explore", items: [["Feed", "/feed"], ["Events", "/events"], ["Club", "/club"]] as [string, string][] },
              ].map((col) => (
                <div key={col.h} className="flex flex-col gap-4">
                  <Mono color={C.inkMuted} size={10}>{col.h}</Mono>
                  {col.items.map(([label, to]) => (
                    <Link
                      key={label}
                      to={to}
                      style={{ fontFamily: fonts.serif, fontSize: 20, color: C.cream, letterSpacing: "-0.01em" }}
                      className="hover:text-[#E85D26] transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row md:items-center justify-between gap-6" style={{ borderTop: `1px solid ${C.inkRule}` }}>
            <Mono color={C.inkMuted} size={10}>© 2026 Loverball · Built in LA</Mono>
            <div className="flex items-center gap-6">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" style={{ color: C.cream, opacity: 0.7 }} className="hover:opacity-100 transition-opacity" aria-label="Loverball on Instagram">
                <Instagram size={18} />
              </a>
              {[["Privacy", "/privacy"], ["Terms", "/terms"]].map(([l, h]) => (
                <Link key={l} to={h} style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: C.inkMuted }} className="hover:text-[#F5F0E8] transition-colors">
                  {l}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
