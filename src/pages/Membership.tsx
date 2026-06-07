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

// ── Single source of truth for membership pricing ──
const MEMBERSHIP_PRICE = {
  amount: 35,
  currencyPrefix: "$",
  cadence: "/ month",
} as const;

const CLUB_FEATURES = [
  "Unlimited group chats & circles",
  "Smart fan matching",
  "Members-only events & watch parties",
  "RSVP priority",
  "Full creator library",
  "Founding-member perks",
  "Early access to drops",
  "VIP events & city meetups",
];

const Membership = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const goJoin = () => navigate(user ? "/profile" : "/auth?mode=signup");

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }} className="min-h-screen">
      <Seo
        title="Membership — Loverball"
        description="Join The Club for the full members-only home for women sports fans."
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
          The Club.
        </h1>
        <p className="mt-6 max-w-xl mx-auto" style={{ color: C.muted, fontSize: 17, lineHeight: 1.6 }}>
          One membership. Full access to the members-only home for women sports fans.
        </p>
      </section>

      <section className="px-5 md:px-10 pb-20 max-w-2xl mx-auto">
        <article
          className="p-8 flex flex-col"
          style={{
            background: `linear-gradient(180deg, ${C.surfaceHi}, ${C.surface})`,
            border: `1px solid ${C.raspberry}`,
            borderRadius: 18,
            boxShadow: "0 30px 60px -30px rgba(232,93,47,0.4)",
          }}
        >
          <Mono color={C.raspberry}>The Club</Mono>
          <div className="mt-4 flex items-baseline gap-2">
            <span style={{ fontFamily: fonts.display, fontSize: 56, lineHeight: 1, color: C.text }}>
              {MEMBERSHIP_PRICE.currencyPrefix}{MEMBERSHIP_PRICE.amount}
            </span>
            <span style={{ color: C.muted, fontSize: 13 }}>{MEMBERSHIP_PRICE.cadence}</span>
          </div>
          <p className="mt-2" style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
            The full Loverball experience.
          </p>

          <ul className="mt-6 space-y-3 flex-1">
            {CLUB_FEATURES.map((f) => (
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
              background: C.raspberry,
              color: "#fff",
              border: "none",
              fontFamily: fonts.mono,
              fontSize: 12,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              padding: "16px 24px",
              borderRadius: 999,
              fontWeight: 500,
            }}
          >
            JOIN THE CLUB
          </button>
        </article>

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
