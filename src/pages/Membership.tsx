import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Check, Minus, ArrowRight, ChevronDown } from "lucide-react";
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
        <Link key={l} to={h} style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted }}>{l}</Link>
      ))}
    </nav>
  </header>
);

type Tier = {
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    tagline: "A taste of the club. Read, watch, look around.",
    features: ["Editorial stories & scores", "Public watch parties", "Limited group chat preview", "Profile + 1 fan circle"],
    cta: "Create account",
  },
  {
    name: "Insider",
    price: "$15",
    cadence: "per month",
    tagline: "The members-only home, unlocked.",
    features: ["Everything in Free", "Unlimited group chats", "Smart fan matching", "RSVP to all members-only events", "Private city crews"],
    cta: "Become an Insider",
    highlight: true,
  },
  {
    name: "All-Access",
    price: "$35",
    cadence: "per month",
    tagline: "Front-row everything. The full Loverball pass.",
    features: ["Everything in Insider", "Priority event invites", "Members-only mixers & away-game travel", "Loverball merch drops", "Direct line to the team"],
    cta: "Go All-Access",
  },
];

const COMPARE: Array<{ label: string; free: boolean | string; insider: boolean | string; all: boolean | string }> = [
  { label: "Editorial stories & scores", free: true, insider: true, all: true },
  { label: "Fan matching", free: false, insider: true, all: true },
  { label: "Group chats", free: "Preview", insider: "Unlimited", all: "Unlimited" },
  { label: "City crews", free: false, insider: true, all: true },
  { label: "Members-only events", free: false, insider: true, all: "Priority" },
  { label: "Mixers & away-game travel", free: false, insider: false, all: true },
  { label: "Merch drops", free: false, insider: false, all: true },
];

const FAQS = [
  { q: "Who is Loverball for?", a: "Sports fans who want a serious community — built around watch parties, group chats, fan matching, and IRL meetups. Headquartered in LA, members worldwide." },
  { q: "Can I cancel anytime?", a: "Yes. Memberships are month-to-month. Cancel from your billing settings — no calls, no friction." },
  { q: "What's the difference between Insider and All-Access?", a: "Insider unlocks the full members-only community. All-Access adds priority event invites, mixers, away-game travel, and merch drops." },
  { q: "Do I need an invite code?", a: "Yes — Loverball is invite-only during this season. Use your code at signup, or join the waitlist." },
  { q: "Is there a free option?", a: "Free accounts can read editorial, view public watch parties, and preview the community. Matching, group chats, and events require Insider or higher." },
];

const Membership = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }} className="min-h-screen">
      <Seo
        title="Choose your pass — Loverball Membership"
        description="Choose your Loverball pass. Free, Insider, or All-Access — the members-only home for sports fandom."
        path="/membership"
      />

      <NavBar />

      {/* Hero */}
      <section className="px-6 md:px-12 pt-16 md:pt-24 pb-16 max-w-6xl">
        <Slug>Membership · Choose your pass</Slug>
        <h1 className="mt-6" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500, fontSize: "clamp(48px, 8vw, 112px)", lineHeight: 0.95, letterSpacing: "-0.03em" }}>
          Pick your<br/>Loverball pass.
        </h1>
        <p className="mt-8 max-w-xl" style={{ fontSize: 18, lineHeight: 1.6, color: C.muted }}>
          Three ways in. All built around the same idea — sports are better with the right people.
        </p>
      </section>

      {/* Pricing tiers */}
      <section className="px-6 md:px-12 pb-24 grid md:grid-cols-3 gap-px max-w-6xl" style={{ background: C.border }}>
        {TIERS.map((t) => (
          <article
            key={t.name}
            className="p-8 md:p-10 flex flex-col"
            style={{
              background: t.highlight ? C.surface : C.bg,
              border: t.highlight ? `0.5px solid ${C.raspberry}55` : undefined,
            }}
          >
            <div className="flex items-center justify-between">
              <Mono color={t.highlight ? C.raspberry : C.muted}>{t.name}</Mono>
              {t.highlight && <Mono color={C.gold} size={10}>Most popular</Mono>}
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span style={{ fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500, fontSize: 64, lineHeight: 1, letterSpacing: "-0.02em" }}>{t.price}</span>
              <Mono>/ {t.cadence}</Mono>
            </div>
            <p className="mt-3" style={{ color: C.muted, fontSize: 14, lineHeight: 1.5 }}>{t.tagline}</p>

            <ul className="mt-8 space-y-3 flex-1">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-3" style={{ fontSize: 14, lineHeight: 1.5 }}>
                  <Check size={16} color={C.raspberry} strokeWidth={2} className="mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate("/auth?mode=signup")}
              className="mt-10 inline-flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: t.highlight ? C.raspberry : "transparent",
                color: t.highlight ? "#fff" : C.text,
                border: t.highlight ? "none" : `1px solid ${C.borderStrong}`,
                fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase",
                padding: "16px 22px", borderRadius: 999, fontWeight: 500,
              }}
            >
              {t.cta} <ArrowRight size={14} />
            </button>
          </article>
        ))}
      </section>

      {/* Comparison */}
      <section className="px-6 md:px-12 py-20 max-w-6xl" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <Slug>Compare</Slug>
        <h2 className="mt-4 mb-12" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500, fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1, letterSpacing: "-0.02em" }}>
          What's in each pass.
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `0.5px solid ${C.borderStrong}` }}>
                <th className="text-left py-4"><Mono>Feature</Mono></th>
                <th className="text-left py-4"><Mono>Free</Mono></th>
                <th className="text-left py-4"><Mono color={C.raspberry}>Insider</Mono></th>
                <th className="text-left py-4"><Mono color={C.gold}>All-Access</Mono></th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row) => (
                <tr key={row.label} style={{ borderBottom: `0.5px solid ${C.border}` }}>
                  <td className="py-4 pr-4" style={{ fontSize: 15 }}>{row.label}</td>
                  {[row.free, row.insider, row.all].map((v, i) => (
                    <td key={i} className="py-4 pr-4" style={{ fontSize: 14, color: C.muted }}>
                      {v === true ? <Check size={16} color={C.raspberry} /> : v === false ? <Minus size={16} color={C.border} /> : <span style={{ color: C.text }}>{v}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 md:px-12 py-20 max-w-3xl" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <Slug>FAQ</Slug>
        <h2 className="mt-4 mb-12" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500, fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1, letterSpacing: "-0.02em" }}>
          Questions, answered.
        </h2>

        <div>
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} style={{ borderBottom: `0.5px solid ${C.border}` }}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full text-left py-6 flex items-center justify-between gap-4"
                >
                  <span style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 22, lineHeight: 1.2, letterSpacing: "-0.01em" }}>{f.q}</span>
                  <ChevronDown size={18} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 200ms", color: C.muted }} />
                </button>
                {isOpen && (
                  <p className="pb-6 pr-10" style={{ color: C.muted, fontSize: 15, lineHeight: 1.6 }}>{f.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 md:px-12 py-24 text-center" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <Slug>Ready</Slug>
        <h2 className="mt-4 mx-auto max-w-3xl" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500, fontSize: "clamp(40px, 6vw, 80px)", lineHeight: 1, letterSpacing: "-0.02em" }}>
          The members-only home for sports fandom.
        </h2>
        <button
          onClick={() => navigate("/auth?mode=signup")}
          className="mt-10 inline-flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: C.raspberry, color: "#fff", fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", padding: "18px 30px", borderRadius: 999, fontWeight: 500 }}
        >
          Join Loverball <ArrowRight size={14} />
        </button>
      </section>

      <footer className="px-6 md:px-12 py-10" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <Mono size={10}>© 2026 Loverball · Built in LA</Mono>
      </footer>
    </div>
  );
};

export default Membership;
