import { Link, useNavigate } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import Seo from "@/components/Seo";
import { useAuth } from "@/hooks/useAuth";

const C = {
  bg: "#0a0a0a",
  surface: "#161616",
  surfaceHi: "#1F1F1F",
  text: "#FAF5E9",
  muted: "#B8B8B8",
  raspberry: "#E85D2F",
  border: "rgba(250, 245, 233, 0.08)",
  borderStrong: "rgba(250, 245, 233, 0.15)",
};
const fonts = {
  sans: "'Inter', system-ui, sans-serif",
  mono: "'Space Mono', ui-monospace, monospace",
  display: "'Anton', Impact, sans-serif",
};

const Mono = ({ children, color = C.muted, size = 11 }: { children: React.ReactNode; color?: string; size?: number }) => (
  <span style={{ fontFamily: fonts.mono, fontSize: size, letterSpacing: "0.22em", textTransform: "uppercase", color, fontWeight: 600 }}>{children}</span>
);

const TIERS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "Get a feel for the community.",
    features: [
      "Create a profile",
      "Browse public events",
      "Follow women-led channels",
      "Read the feed",
    ],
    cta: "Join free",
    highlight: false,
  },
  {
    name: "All-Access",
    price: "$15",
    cadence: "/ month",
    blurb: "The full members-only home.",
    features: [
      "Unlimited group chats & circles",
      "Smart fan matching",
      "Members-only events & watch parties",
      "RSVP priority",
      "Full creator library",
    ],
    cta: "Start All-Access",
    highlight: true,
  },
  {
    name: "The Club",
    price: "$35",
    cadence: "/ month",
    blurb: "The full Loverball experience.",
    features: [
      "Everything in All-Access",
      "Founding-member perks",
      "Early access to drops",
      "VIP events & city meetups",
    ],
    cta: "Join The Club",
    highlight: false,
  },
];

const Membership = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const goJoin = () => navigate(user ? "/profile" : "/auth?mode=signup");

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }} className="min-h-screen">
      <Seo
        title="Membership — Loverball"
        description="Free to join. Upgrade to All-Access for unlimited group chats, smart matching, and members-only events."
        path="/membership"
      />

      <header className="px-5 md:px-10 py-5 flex items-center justify-between" style={{ borderBottom: `0.5px solid ${C.border}` }}>
        <Link to="/" style={{ fontFamily: fonts.display, fontSize: 22, letterSpacing: "-0.01em", textTransform: "uppercase", color: C.text }}>
          Loverball
        </Link>
        <Link to="/" style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: C.muted }} className="hover:text-white">
          ← Home
        </Link>
      </header>

      <section className="px-5 md:px-10 pt-16 pb-12 max-w-5xl mx-auto text-center">
        <Mono color={C.raspberry}>Membership</Mono>
        <h1 className="mt-4" style={{ fontFamily: fonts.display, fontSize: "clamp(48px, 8vw, 96px)", lineHeight: 0.95, letterSpacing: "-0.01em", textTransform: "uppercase" }}>
          Pick your pass.
        </h1>
        <p className="mt-6 max-w-xl mx-auto" style={{ color: C.muted, fontSize: 17, lineHeight: 1.6 }}>
          Start free. Upgrade when you're ready for the full members-only home for women sports fans.
        </p>
      </section>

      <section className="px-5 md:px-10 pb-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((t) => (
            <article
              key={t.name}
              className="p-8 flex flex-col"
              style={{
                background: t.highlight ? `linear-gradient(180deg, ${C.surfaceHi}, ${C.surface})` : C.surface,
                border: `1px solid ${t.highlight ? C.raspberry : C.border}`,
                borderRadius: 18,
                boxShadow: t.highlight ? "0 30px 60px -30px rgba(232,93,47,0.4)" : "none",
              }}
            >
              <div className="flex items-baseline justify-between">
                <Mono color={t.highlight ? C.raspberry : C.muted}>{t.name}</Mono>
                {t.highlight && <Mono color={C.raspberry}>Most popular</Mono>}
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span style={{ fontFamily: fonts.display, fontSize: 56, lineHeight: 1, color: C.text }}>{t.price}</span>
                <span style={{ color: C.muted, fontSize: 13 }}>{t.cadence}</span>
              </div>
              <p className="mt-2" style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>{t.blurb}</p>

              <ul className="mt-6 space-y-3 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-3" style={{ fontSize: 14, color: C.text }}>
                    <Check size={16} style={{ color: C.raspberry, flexShrink: 0, marginTop: 3 }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={goJoin}
                className="mt-8 w-full"
                style={{
                  background: t.highlight ? C.raspberry : "transparent",
                  color: t.highlight ? "#fff" : C.text,
                  border: t.highlight ? "none" : `1px solid ${C.borderStrong}`,
                  fontFamily: fonts.mono,
                  fontSize: 12,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  padding: "16px 24px",
                  borderRadius: 999,
                  fontWeight: 500,
                }}
              >
                {t.cta}
              </button>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center" style={{ color: C.muted, fontSize: 13 }}>
          Cancel anytime. Questions about membership? Email{" "}
          <a href="mailto:hello@loverball.com" style={{ color: C.raspberry }} className="underline underline-offset-4">
            hello@loverball.com
          </a>
        </p>
      </section>

      <section className="px-5 md:px-10 py-16 text-center max-w-3xl mx-auto" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <h2 style={{ fontFamily: fonts.display, fontSize: "clamp(32px, 5vw, 52px)", lineHeight: 0.95, textTransform: "uppercase", letterSpacing: "-0.01em" }}>
          Not sure yet?
        </h2>
        <p className="mt-5" style={{ color: C.muted, fontSize: 16 }}>
          Browse what's happening this week — no account required.
        </p>
        <Link to="/events" className="mt-8 inline-flex items-center gap-2" style={{ border: `1px solid ${C.borderStrong}`, color: C.text, fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", padding: "15px 27px", borderRadius: 999 }}>
          View Upcoming Events <ArrowRight size={14} />
        </Link>
      </section>
    </div>
  );
};

export default Membership;
