import { Link, useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Instagram, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import heroImage from "@/assets/hero-women-new.png";
import loverballWordmark from "@/assets/loverball-wordmark.png.asset.json";

import WhatsHappeningNow from "@/components/WhatsHappeningNow";
import StoriesSection from "@/components/StoriesSection";
import { INSTAGRAM_URL } from "@/lib/socialLinks";

/* ============================================================
   LOVERBALL — HOMEPAGE
   Fable-inspired editorial overhaul.
   Warm cream and deep ink alternate. Serif italic display type
   pairs with Anton condensed for rhythm. Numbered editorial
   columns. One pulled quote. Single-tier membership.
   ============================================================ */

const C = {
  ink: "#0E0E0E",
  inkSoft: "#1A1A1A",
  cream: "#F4EFE6",
  creamHi: "#FBF7EF",
  paper: "#FFFFFF",
  rule: "#2A2A2A",
  ruleSoft: "rgba(14,14,14,0.12)",
  ruleOnInk: "rgba(244,239,230,0.14)",
  muted: "#6B6B6B",
  mutedOnInk: "#A8A29A",
  accent: "#E85D2F",
};

const fonts = {
  serif: "'Playfair Display', 'Tiempos Headline', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
  mono: "'Space Mono', ui-monospace, monospace",
  display: "'Anton', Impact, sans-serif",
};

const MEMBERSHIP_PRICE = 35;

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
      color: color ?? C.muted,
      fontWeight: 500,
    }}
  >
    {children}
  </span>
);

const Rule = ({ onDark = false }: { onDark?: boolean }) => (
  <div
    aria-hidden
    className="h-px w-full"
    style={{ background: onDark ? C.ruleOnInk : C.ruleSoft }}
  />
);

/* ---------- Page ---------- */

const Index = () => {
  const navigate = useNavigate();
  const goJoin = () => navigate("/auth?mode=signup");

  return (
    <div style={{ background: C.cream, color: C.ink, fontFamily: fonts.sans }}>
      <Seo
        title="Loverball — A home for women who love sports"
        description="A members community for women sports fans. Events, stories, watch parties, and the people you've been looking for. Built in LA."
        path="/"
      />

      {/* ============ TOP NAV ============ */}
      <nav className="px-5 md:px-10 py-5 flex items-center justify-between" style={{ background: C.cream }}>
        <Link to="/" className="flex items-center gap-2" aria-label="Loverball">
          <img
            src={loverballWordmark.url}
            alt="Loverball"
            className="h-7 md:h-8 w-auto select-none"
            draggable={false}
            loading="eager"
            decoding="async"
          />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {[
            ["About", "/about"],
            ["Membership", "/membership"],
            ["Events", "/events"],
            ["Stories", "/feed"],
          ].map(([l, h]) => (
            <Link
              key={l}
              to={h}
              style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: C.ink }}
              className="hover:opacity-60 transition-opacity"
            >
              {l}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/auth?mode=signin"
            style={{
              fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.22em",
              textTransform: "uppercase", color: C.ink,
            }}
            className="hidden sm:inline hover:opacity-60"
          >
            Sign in
          </Link>
          <button
            onClick={goJoin}
            style={{
              background: C.ink, color: C.cream,
              fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.2em",
              textTransform: "uppercase", padding: "12px 20px", borderRadius: 999,
              fontWeight: 500,
            }}
            className="hover:bg-[#2A2A2A] transition-colors"
          >
            Join
          </button>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section className="px-5 md:px-10 pt-10 md:pt-16 pb-20 md:pb-28">
        <div className="max-w-[1400px] mx-auto">
          {/* Editorial issue line */}
          <div className="flex items-center justify-between mb-10 md:mb-16">
            <Mono color={C.ink}>Vol. 01 — Founding Issue</Mono>
            <Mono color={C.muted}>Los Angeles, CA</Mono>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
            {/* LEFT — editorial headline */}
            <div className="lg:col-span-7">
              <h1
                style={{
                  fontFamily: fonts.serif,
                  fontWeight: 400,
                  fontSize: "clamp(56px, 9vw, 148px)",
                  lineHeight: 0.92,
                  letterSpacing: "-0.035em",
                  color: C.ink,
                }}
              >
                A home<br />
                <span style={{ fontStyle: "italic", fontWeight: 400 }}>for women</span><br />
                who love<br />
                <span style={{ color: C.accent }}>sports.</span>
              </h1>

              <div className="mt-10 max-w-md">
                <p style={{ fontSize: 17, lineHeight: 1.55, color: C.inkSoft }}>
                  Loverball is the members community for women who actually watch the game.
                  Real-life watch parties, smart fan matching, and the room you've been looking for.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <button
                    onClick={goJoin}
                    style={{
                      background: C.accent, color: "#fff",
                      fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.18em",
                      textTransform: "uppercase", padding: "18px 30px", borderRadius: 999,
                      fontWeight: 500,
                      boxShadow: "0 12px 32px -14px rgba(232,93,47,0.55)",
                    }}
                    className="hover:-translate-y-0.5 transition-transform"
                  >
                    Become a Member
                  </button>
                  <Link
                    to="/about"
                    style={{
                      fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.18em",
                      textTransform: "uppercase", color: C.ink,
                      borderBottom: `1px solid ${C.ink}`, paddingBottom: 4,
                    }}
                    className="inline-flex items-center gap-2 hover:opacity-60"
                  >
                    Read the Manifesto <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>

            {/* RIGHT — image with editorial caption */}
            <div className="lg:col-span-5">
              <figure>
                <div
                  className="relative overflow-hidden"
                  style={{ aspectRatio: "4/5", borderRadius: 2 }}
                >
                  <img
                    src={heroImage}
                    alt="Women sports fans at a Loverball watch party in Los Angeles"
                    className="w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                  />
                </div>
                <figcaption className="mt-4 flex items-start justify-between gap-4">
                  <Mono color={C.muted} size={10}>
                    Fig. 01 — Members watch party, Echo Park
                  </Mono>
                  <Mono color={C.ink} size={10}>2026</Mono>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MARQUEE TICKER ============ */}
      <div style={{ background: C.ink, color: C.cream }} className="overflow-hidden">
        <div
          className="marquee-track py-5 whitespace-nowrap"
          style={{
            fontFamily: fonts.serif,
            fontStyle: "italic",
            fontSize: 28,
            letterSpacing: "-0.01em",
          }}
        >
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k} className="inline-flex items-center gap-10 px-6">
              {[
                "Her Game",
                "·",
                "Her Community",
                "·",
                "Real-life events",
                "·",
                "No permission required",
                "·",
                "Built in LA",
                "·",
              ].map((t, i) => (
                <span key={`${k}-${i}`}>{t}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ============ MANIFESTO ============ */}
      <section className="px-5 md:px-10 py-24 md:py-36" style={{ background: C.cream }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-3">
              <Mono color={C.ink}>§ 01 — The Manifesto</Mono>
            </div>
            <div className="lg:col-span-9">
              <p
                style={{
                  fontFamily: fonts.serif,
                  fontWeight: 400,
                  fontSize: "clamp(28px, 4vw, 56px)",
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  color: C.ink,
                }}
              >
                We started Loverball because there was no women-first home for fans of
                the <span style={{ fontStyle: "italic" }}>WNBA, NWSL, NCAA,</span> the Sparks, Angel City,
                and every team in between. <span style={{ color: C.muted }}>So we built one.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ WHAT YOU GET — numbered editorial columns ============ */}
      <section className="px-5 md:px-10 pb-24 md:pb-36" style={{ background: C.cream }}>
        <div className="max-w-[1400px] mx-auto">
          <Rule />
          <div className="pt-10 mb-16 flex items-end justify-between gap-6">
            <h2
              style={{
                fontFamily: fonts.serif,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: "clamp(40px, 6vw, 88px)",
                lineHeight: 0.95,
                letterSpacing: "-0.025em",
                color: C.ink,
              }}
            >
              What you get.
            </h2>
            <Mono color={C.muted}>§ 02</Mono>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: C.ruleSoft }}>
            {[
              {
                n: "01",
                kicker: "Stories",
                title: "Coverage that gets it.",
                body: "Smart, culturally fluent writing on women's and pro sports — for fans who actually watch the game.",
              },
              {
                n: "02",
                kicker: "Events",
                title: "Real life, real venues.",
                body: "LA watch parties, stadium meetups, members mixers. Show up, sit together, scream at the screen.",
              },
              {
                n: "03",
                kicker: "Community",
                title: "Find your people.",
                body: "Smart matching by team, city, and vibe. Group chats, city crews, and the friends you've been looking for.",
              },
            ].map((b) => (
              <article
                key={b.n}
                className="p-8 md:p-10 flex flex-col"
                style={{ background: C.cream, minHeight: 360 }}
              >
                <div className="flex items-baseline justify-between">
                  <span
                    style={{
                      fontFamily: fonts.display,
                      fontSize: 72,
                      lineHeight: 1,
                      color: C.accent,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {b.n}
                  </span>
                  <Mono color={C.muted} size={10}>{b.kicker}</Mono>
                </div>
                <h3
                  className="mt-10"
                  style={{
                    fontFamily: fonts.serif,
                    fontWeight: 400,
                    fontSize: 28,
                    lineHeight: 1.1,
                    letterSpacing: "-0.015em",
                    color: C.ink,
                  }}
                >
                  {b.title}
                </h3>
                <p
                  className="mt-4 flex-1"
                  style={{ color: C.inkSoft, fontSize: 15, lineHeight: 1.6 }}
                >
                  {b.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHAT'S HAPPENING (existing component, framed) ============ */}
      <section className="px-5 md:px-10 py-20 md:py-28" style={{ background: C.creamHi, borderTop: `1px solid ${C.ruleSoft}` }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <Mono color={C.muted}>§ 03 — On Deck</Mono>
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
                What's happening now.
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
          <div className="flex items-end justify-between mb-10">
            <div>
              <Mono color={C.muted}>§ 04 — The Reading Room</Mono>
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
          </div>
          <StoriesSection />
        </div>
      </section>

      {/* ============ PULLED QUOTE — deep ink section ============ */}
      <section
        className="px-5 md:px-10 py-28 md:py-40"
        style={{ background: C.ink, color: C.cream }}
      >
        <div className="max-w-[1200px] mx-auto">
          <Mono color={C.mutedOnInk}>§ 05 — From a Member</Mono>
          <blockquote
            className="mt-10"
            style={{
              fontFamily: fonts.serif,
              fontWeight: 400,
              fontSize: "clamp(36px, 5.5vw, 88px)",
              lineHeight: 1.08,
              letterSpacing: "-0.025em",
              color: C.cream,
            }}
          >
            <span style={{ color: C.accent, fontStyle: "italic" }}>"</span>
            I finally have somewhere to scream about a fourth quarter without
            <span style={{ fontStyle: "italic" }}> explaining myself.</span>
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
              <Mono color={C.mutedOnInk} size={10}>Founding Member · Los Angeles</Mono>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MEMBERSHIP — single tier ============ */}
      <section className="px-5 md:px-10 py-24 md:py-36" style={{ background: C.cream }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-5">
              <Mono color={C.ink}>§ 06 — Membership</Mono>
              <h2
                className="mt-5"
                style={{
                  fontFamily: fonts.serif,
                  fontWeight: 400,
                  fontSize: "clamp(48px, 7vw, 108px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.03em",
                  color: C.ink,
                }}
              >
                One pass.<br />
                <span style={{ fontStyle: "italic" }}>Everything in.</span>
              </h2>
              <p className="mt-8 max-w-md" style={{ color: C.inkSoft, fontSize: 17, lineHeight: 1.55 }}>
                The Club is our full members-only home. Unlimited group chats,
                smart fan matching, members-only events, RSVP priority, and the
                founding-member perks while we're still small.
              </p>
            </div>

            <div className="lg:col-span-7">
              <article
                className="relative p-8 md:p-12"
                style={{
                  background: C.ink,
                  color: C.cream,
                  borderRadius: 4,
                }}
              >
                <div className="flex items-start justify-between gap-4 mb-10">
                  <Mono color={C.accent}>The Club</Mono>
                  <Mono color={C.mutedOnInk} size={10}>Monthly</Mono>
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
                  <span style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 22, color: C.mutedOnInk }}>
                    / month
                  </span>
                </div>

                <div className="mt-10 pt-8" style={{ borderTop: `1px solid ${C.ruleOnInk}` }}>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    {[
                      "Unlimited group chats & circles",
                      "Smart fan matching",
                      "Members-only events & watch parties",
                      "RSVP priority",
                      "Full creator library",
                      "Founding-member perks",
                      "Early access to drops",
                      "VIP events & city meetups",
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
                      borderBottom: `1px solid ${C.mutedOnInk}`, paddingBottom: 4,
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
          <Mono color={C.muted}>§ 07 — One More Thing</Mono>
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
              <div
                style={{
                  fontFamily: fonts.serif,
                  fontWeight: 400,
                  fontStyle: "italic",
                  fontSize: "clamp(56px, 10vw, 160px)",
                  lineHeight: 0.9,
                  color: C.cream,
                  letterSpacing: "-0.04em",
                }}
              >
                Loverball.
              </div>
              <p className="mt-6 max-w-md" style={{ color: C.mutedOnInk, fontSize: 15, lineHeight: 1.6 }}>
                A members community for women who love sports. Built in Los Angeles,
                growing city by city.
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
                  <Mono color={C.mutedOnInk} size={10}>{col.h}</Mono>
                  {col.items.map(([label, to]) => (
                    <Link
                      key={label}
                      to={to}
                      style={{ fontFamily: fonts.serif, fontSize: 20, color: C.cream, letterSpacing: "-0.01em" }}
                      className="hover:text-[#E85D2F] transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row md:items-center justify-between gap-6" style={{ borderTop: `1px solid ${C.ruleOnInk}` }}>
            <Mono color={C.mutedOnInk} size={10}>© 2026 Loverball · Built in LA</Mono>
            <div className="flex items-center gap-6">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" style={{ color: C.cream, opacity: 0.7 }} className="hover:opacity-100 transition-opacity" aria-label="Loverball on Instagram">
                <Instagram size={18} />
              </a>
              {[["Privacy", "/privacy"], ["Terms", "/terms"]].map(([l, h]) => (
                <Link key={l} to={h} style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: C.mutedOnInk }} className="hover:text-[#F4EFE6] transition-colors">
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
