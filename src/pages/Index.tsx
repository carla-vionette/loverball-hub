import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Instagram, Check, ArrowRight, BookOpen, CalendarHeart, Users } from "lucide-react";
import heroImage from "@/assets/hero-women-new.png";
import SiteNav from "@/components/SiteNav";
import WhatsHappeningNow from "@/components/WhatsHappeningNow";
import { INSTAGRAM_URL } from "@/lib/socialLinks";

/* ============================================================
   LOVERBALL — HOMEPAGE
   Conversion-first. Clear, editorial, female-forward.
   ============================================================ */

const C = {
  bg: "#0a0a0a",
  surface: "#161616",
  surfaceHi: "#1F1F1F",
  text: "#FAF5E9",
  muted: "#B8B8B8",
  raspberry: "#F04E23",   // Vermilion (primary)
  pink: "#E86BB0",        // Hot Pink (accent)
  neon: "#E6F25A",        // Neon Yellow (highlight)
  gold: "#E6F25A",        // legacy alias → Neon Yellow
  border: "rgba(250, 245, 233, 0.08)",
  borderStrong: "rgba(250, 245, 233, 0.15)",
};


const fonts = {
  serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
  mono: "'Space Mono', ui-monospace, 'JetBrains Mono', monospace",
};

const Mono = ({ children, color = C.muted, size = 11 }: { children: React.ReactNode; color?: string; size?: number }) => (
  <span style={{ fontFamily: fonts.mono, fontSize: size, letterSpacing: "0.16em", textTransform: "uppercase", color }}>{children}</span>
);

const Slug = ({ children, color = C.raspberry }: { children: React.ReactNode; color?: string }) => (
  <span style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color }}>{children}</span>
);

/* ---------- Buttons (single primary, single secondary) ---------- */

const PrimaryCTA = ({ children, onClick, full = false }: { children: React.ReactNode; onClick: () => void; full?: boolean }) => (
  <button
    onClick={onClick}
    style={{
      background: C.raspberry, color: "#fff",
      fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase",
      padding: "16px 28px", borderRadius: 999, fontWeight: 500,
      boxShadow: "0 10px 28px -12px rgba(212,83,126,0.6)",
      width: full ? "100%" : undefined,
      transition: "transform 160ms ease, opacity 160ms ease",
    }}
    className="hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4537E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
  >
    {children}
  </button>
);

const SecondaryCTA = ({ children, to, full = false }: { children: React.ReactNode; to: string; full?: boolean }) => (
  <Link
    to={to}
    style={{
      background: "transparent", color: C.text, border: `1px solid ${C.borderStrong}`,
      fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase",
      padding: "15px 27px", borderRadius: 999, fontWeight: 500,
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
      width: full ? "100%" : undefined,
    }}
    className="hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4537E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
  >
    {children}
  </Link>
);

/* ---------- Data ---------- */

const BENEFITS = [
  {
    Icon: BookOpen,
    eyebrow: "Sports stories",
    title: "Stories that get it.",
    body: "Smart, culturally fluent coverage of women's and pro sports — written for fans who actually watch.",
  },
  {
    Icon: CalendarHeart,
    eyebrow: "Watch parties & events",
    title: "Real-life, in real venues.",
    body: "LA watch parties, stadium meetups, and members-only mixers — show up, sit together, scream at the screen.",
  },
  {
    Icon: Users,
    eyebrow: "Fan matching & community",
    title: "Find your people.",
    body: "Smart matching by team, city, and vibe. Group chats, city crews, and the friends you've been looking for.",
  },
];

const TIERS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "A taste of the club.",
    features: ["Join core events for free", "Ad-supported editorial stories & scores", "Group chat preview"],
    cta: "Join Free",
  },
  {
    name: "All-Access",
    price: "$35",
    cadence: "/ month",
    blurb: "The full members-only home.",
    features: [
      "Everything in Free",
      "Unlimited group chats",
      "Smart fan matching",
      "Members-only events",
      "Private city crews",
      "Priority event invites",
      "Mixers, away-game travel, and merch drops",
    ],
    cta: "Go All-Access",
    highlight: true,
  },
];

const QUOTES = [
  {
    q: "I finally have somewhere to scream about a 4th quarter without explaining myself.",
    name: "Maya R.",
    meta: "Member · LA",
  },
  {
    q: "Met three of my closest friends at a Loverball watch party. We now travel for away games.",
    name: "Priya S.",
    meta: "All-Access · LA",
  },
  {
    q: "It's the rare community that's actually about the sport — and the women who love it.",
    name: "Jordan T.",
    meta: "Member · NYC",
  },
];

/* ---------- Page ---------- */

const Index = () => {
  const navigate = useNavigate();
  const goJoin = () => navigate("/auth?mode=signup");
  const goSignIn = () => navigate("/auth?mode=signin");



  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }} className="min-h-screen">
      <Seo
        title="Loverball — brings together events, members, stories, and culture"
        description="Loverball brings together events, members, stories, and culture for women who love sports."
        path="/"
      />

      <SiteNav />

      {/* ============ HERO ============ */}
      <section className="pt-32 md:pt-40 pb-20 md:pb-28 px-5 md:px-10 relative overflow-hidden">
        <div aria-hidden className="absolute -top-20 -left-20 w-[480px] h-[480px] rounded-full pointer-events-none" style={{ background: C.raspberry, opacity: 0.18, filter: "blur(120px)" }} />
        <div aria-hidden className="absolute top-40 right-0 w-[420px] h-[420px] rounded-full pointer-events-none" style={{ background: C.pink, opacity: 0.18, filter: "blur(140px)" }} />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span style={{ background: "transparent", color: C.text, border: `1px solid ${C.borderStrong}`, fontFamily: fonts.mono, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", padding: "6px 12px", borderRadius: 999 }}>
                Built in LA
              </span>
              <span style={{ background: C.pink, color: "#fff", fontFamily: fonts.mono, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", padding: "6px 12px", borderRadius: 999, fontWeight: 600 }}>
                Members only
              </span>
            </div>

            <h1 className="mt-2" style={{ lineHeight: 0.92, letterSpacing: "-0.02em" }}>
              <span style={{ fontFamily: "'Anton', Impact, sans-serif", fontWeight: 400, fontSize: "clamp(52px, 9vw, 120px)", textTransform: "uppercase", color: C.text, display: "block" }}>
                Her Game.
              </span>
              <span
                style={{
                  fontFamily: "'Anton', Impact, sans-serif", fontWeight: 400,
                  fontSize: "clamp(52px, 9vw, 120px)", textTransform: "uppercase",
                  display: "block",
                  background: `linear-gradient(95deg, ${C.raspberry} 0%, ${C.pink} 60%, ${C.neon} 100%)`,
                  WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
                }}
              >
                HER COMMUNITY.
              </span>
            </h1>

            <p className="mt-6 max-w-xl" style={{ color: C.muted, fontSize: "clamp(16px, 1.5vw, 19px)", lineHeight: 1.6 }}>
              Loverball brings together events, members, stories, and culture for women who love sports.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
               <PrimaryCTA onClick={goJoin}>JOIN US!</PrimaryCTA>
              <SecondaryCTA to="/auth?mode=signin">Sign In <ArrowRight size={14} /></SecondaryCTA>
              <SecondaryCTA to="/membership">See Membership <ArrowRight size={14} /></SecondaryCTA>
            </div>

            <p className="mt-6" style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: C.muted }}>
              Open membership · A home for women in sports
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="relative">
              <div aria-hidden className="absolute -inset-3 rounded-[16px]" style={{ background: C.neon, transform: "rotate(-2deg)" }} />
              <div
                className="relative overflow-hidden"
                style={{ borderRadius: 12, aspectRatio: "4/5", background: C.surface, border: `1px solid ${C.borderStrong}` }}
              >
                <img src={heroImage} alt="Women sports fans at a Loverball watch party" className="w-full h-full object-cover" />
                <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 50%, rgba(10,10,10,0.85) 100%)" }} />
                <div className="absolute top-4 left-4 flex items-center gap-1.5" style={{ background: C.raspberry, color: "#fff", borderRadius: 999, padding: "6px 12px", fontFamily: fonts.mono, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, boxShadow: "0 8px 24px -8px rgba(240,78,35,0.7)" }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Starting 5
                </div>
                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
                  <Mono color="#fff" size={10}>Members watch party · LA</Mono>
                  <span style={{ background: C.neon, color: "#0a0a0a", borderRadius: 999, padding: "4px 10px", fontFamily: fonts.mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700 }}>
                    Live weekly
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-16 -mx-5 md:-mx-10 overflow-hidden" style={{ background: C.neon }}>
          <div className="marquee-track py-3" style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 22, letterSpacing: "0.04em", textTransform: "uppercase", color: "#0a0a0a" }}>
            {Array.from({ length: 2 }).map((_, k) => (
              <div key={k} className="flex items-center gap-8 px-4">
                {["Her game", "★", "HER COMMUNITY", "★", "EVENTS", "★", "No permission required", "★", "Built in LA", "★"].map((t, i) => (
                  <span key={`${k}-${i}`}>{t}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHAT YOU GET ============ */}
      <section className="px-5 md:px-10 py-20 md:py-28" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-14">
            <Slug>What you get</Slug>
            <h2
              className="mt-5"
              style={{
                fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
                fontSize: "clamp(36px, 5vw, 60px)", lineHeight: 1, letterSpacing: "-0.02em", color: C.text,
              }}
            >
              Three things, done right.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BENEFITS.map(({ Icon, eyebrow, title, body }) => (
              <article
                key={eyebrow}
                className="p-8"
                style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 12 }}
              >
                <div
                  className="inline-flex items-center justify-center mb-6"
                  style={{ width: 44, height: 44, borderRadius: 12, background: `${C.raspberry}1A`, color: C.raspberry }}
                >
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <Mono color={C.muted} size={10}>{eyebrow}</Mono>
                <h3
                  className="mt-3"
                  style={{
                    fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
                    fontSize: 26, lineHeight: 1.15, letterSpacing: "-0.015em", color: C.text,
                  }}
                >
                  {title}
                </h3>
                <p className="mt-4" style={{ color: C.muted, fontSize: 15, lineHeight: 1.6 }}>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ MEMBERSHIP ============ */}
      <section className="px-5 md:px-10 py-20 md:py-28" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div className="max-w-2xl">
              <Slug>Membership</Slug>
              <h2
                className="mt-5"
                style={{
                  fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
                  fontSize: "clamp(36px, 5vw, 60px)", lineHeight: 1, letterSpacing: "-0.02em", color: C.text,
                }}
              >
                Pick your pass.
              </h2>
              <p className="mt-5 max-w-md" style={{ color: C.muted, fontSize: 16, lineHeight: 1.6 }}>
                Start free. Upgrade to All-Access when you're ready for the full members-only home.
              </p>
            </div>
            <Link to="/membership" style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: C.raspberry }} className="inline-flex items-center gap-2 hover:opacity-80">
              Compare all features <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {TIERS.map((t) => {
              const hi = !!t.highlight;
              return (
                <article
                  key={t.name}
                  className="relative p-8 flex flex-col"
                  style={{
                    background: hi ? `linear-gradient(180deg, ${C.raspberry}12 0%, ${C.surface} 60%)` : C.surface,
                    border: hi ? `1.5px solid ${C.raspberry}` : `0.5px solid ${C.border}`,
                    borderRadius: 12,
                    boxShadow: hi ? `0 24px 60px -28px ${C.raspberry}99` : "none",
                  }}
                >
                  {hi && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1.5"
                      style={{
                        background: C.raspberry, color: "#fff",
                        fontFamily: fonts.mono, fontSize: 10, letterSpacing: "0.18em",
                        textTransform: "uppercase", borderRadius: 999, fontWeight: 600,
                      }}
                    >
                      Most popular
                    </div>
                  )}
                  <Mono color={hi ? C.raspberry : C.muted}>{t.name}</Mono>
                  <div className="mt-5 flex items-baseline gap-2">
                    <span style={{ fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500, fontSize: 56, lineHeight: 1, letterSpacing: "-0.02em", color: C.text }}>{t.price}</span>
                    <Mono>{t.cadence}</Mono>
                  </div>
                  <p className="mt-3" style={{ color: C.muted, fontSize: 14, lineHeight: 1.55 }}>{t.blurb}</p>

                  <ul className="mt-7 space-y-3 flex-1">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-3" style={{ fontFamily: fonts.sans, fontSize: 14, lineHeight: 1.55, color: C.text }}>
                        <Check size={16} color={hi ? C.raspberry : C.gold} strokeWidth={2.25} className="mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    {hi ? (
                      <PrimaryCTA onClick={goJoin} full>{t.cta}</PrimaryCTA>
                    ) : (
                      <SecondaryCTA to="/auth?mode=signup" full>{t.cta}</SecondaryCTA>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ SOCIAL PROOF ============ */}
      <section className="px-5 md:px-10 py-20 md:py-28" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-14">
            <Slug>Members</Slug>
            <h2
              className="mt-5"
              style={{
                fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
                fontSize: "clamp(36px, 5vw, 60px)", lineHeight: 1, letterSpacing: "-0.02em", color: C.text,
              }}
            >
              The room you've been looking for.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {QUOTES.map((q, i) => (
              <figure
                key={i}
                className="p-8 flex flex-col"
                style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 12 }}
              >
                <span style={{ fontFamily: fonts.serif, fontStyle: "italic", color: C.raspberry, fontSize: 48, lineHeight: 0.6 }}>“</span>
                <blockquote
                  className="mt-3 flex-1"
                  style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 22, lineHeight: 1.3, color: C.text, letterSpacing: "-0.01em" }}
                >
                  {q.q}
                </blockquote>
                <figcaption className="mt-6">
                  <div style={{ fontFamily: fonts.sans, fontSize: 14, color: C.text, fontWeight: 500 }}>{q.name}</div>
                  <Mono size={10}>{q.meta}</Mono>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="px-5 md:px-10 py-24 md:py-32 text-center" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <div className="max-w-3xl mx-auto">
          <Slug>Join</Slug>
          <h2
            className="mt-5"
            style={{
              fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500,
              fontSize: "clamp(40px, 6vw, 80px)", lineHeight: 1, letterSpacing: "-0.02em", color: C.text,
            }}
          >
            Sports are better with the right people.
          </h2>
          <p className="mt-6 max-w-xl mx-auto" style={{ color: C.muted, fontSize: 17, lineHeight: 1.6 }}>
            Free to join. Upgrade to All-Access for unlimited group chats, smart matching, and members-only events.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            <PrimaryCTA onClick={goJoin}>JOIN US!</PrimaryCTA>
            <SecondaryCTA to="/events">View Upcoming Events</SecondaryCTA>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ borderTop: `0.5px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto px-5 md:px-10 py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-14">
            <div className="md:col-span-6">
              <div style={{ fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500, fontSize: "clamp(36px, 5vw, 52px)", lineHeight: 1, color: C.text, letterSpacing: "-0.02em" }}>
                Loverball
              </div>
              <p className="mt-3 max-w-md" style={{ color: C.muted, fontSize: 14, lineHeight: 1.55 }}>
                A members community for women sports fans. Built in LA.
              </p>
            </div>

            <div className="md:col-span-6 grid grid-cols-2 gap-8">
              {[
                { h: "Loverball", items: [["About", "/about"], ["Membership", "/membership"], ["Contact", "/contact"]] },
                { h: "Explore", items: [["Watch", "/feed"], ["Events", "/events"], ["Club", "/club"]] },
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

          <div className="pt-8 flex flex-col md:flex-row md:items-center justify-between gap-6" style={{ borderTop: `0.5px solid ${C.border}` }}>
            <Mono color={C.muted} size={10}>© 2026 Loverball · Built in LA</Mono>
            <div className="flex items-center gap-5">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" style={{ color: C.text, opacity: 0.7 }} className="hover:opacity-100 transition-opacity" aria-label="Loverball on Instagram">
                <Instagram size={18} />
              </a>
              {[["Privacy", "/privacy"], ["Terms", "/terms"]].map(([l, h]) => (
                <Link key={l} to={h} style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: C.muted }} className="hover:text-[#FAF5E9] transition-colors">
                  {l}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div aria-hidden style={{ height: 4, background: `linear-gradient(90deg, ${C.raspberry}, ${C.pink} 55%, ${C.neon})` }} />
      </footer>
    </div>
  );
};

export default Index;
