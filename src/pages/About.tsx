import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Seo from "@/components/Seo";

const C = {
  bg: "#0a0a0a",
  surface: "#161616",
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

const About = () => {
  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }} className="min-h-screen">
      <Seo
        title="About Loverball — A home for women sports fans"
        description="Loverball is a members community for women who love sports. Built in LA for fans who want a real seat at the game."
        path="/about"
      />

      {/* Top bar */}
      <header className="px-5 md:px-10 py-5 flex items-center justify-between" style={{ borderBottom: `0.5px solid ${C.border}` }}>
        <Link to="/" style={{ fontFamily: fonts.display, fontSize: 22, letterSpacing: "-0.01em", textTransform: "uppercase", color: C.text }}>
          Loverball
        </Link>
        <Link to="/" style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: C.muted }} className="hover:text-white">
          ← Home
        </Link>
      </header>

      {/* Hero */}
      <section className="px-5 md:px-10 pt-16 pb-12 max-w-5xl mx-auto">
        <Mono color={C.raspberry}>About</Mono>
        <h1 className="mt-4" style={{ fontFamily: fonts.display, fontSize: "clamp(48px, 8vw, 96px)", lineHeight: 0.95, letterSpacing: "-0.01em", textTransform: "uppercase" }}>
          A home for women<br />who love sports.
        </h1>
        <p className="mt-8 max-w-2xl" style={{ color: C.muted, fontSize: 18, lineHeight: 1.6 }}>
          Loverball is a members community built for women sports fans —
          the ones who actually watch the game, know the lineup, and want
          a place to talk about it without explaining themselves.
        </p>
      </section>

      {/* Story */}
      <section className="px-5 md:px-10 py-16 max-w-5xl mx-auto" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <Mono>Our story</Mono>
          </div>
          <div className="md:col-span-8 space-y-5" style={{ color: C.text, fontSize: 17, lineHeight: 1.7 }}>
            <p>
              We started Loverball in Los Angeles because there was no
              women-first home for fans of the WNBA, NWSL, NCAA, the Sparks,
              Angel City FC, and every team in between.
            </p>
            <p>
              The plan is simple: a members community where you can find
              your people, show up to real-world watch parties and games,
              and follow women-led creators who actually cover women's sports.
            </p>
            <p>
              Free to join. Upgrade when you're ready for the full
              members-only home.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-5 md:px-10 py-16 max-w-5xl mx-auto" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <Mono>What we stand for</Mono>
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {[
            { h: "Women-led", b: "Every channel, host, and creator on the platform is women-led. No exceptions." },
            { h: "Real life", b: "We're built around in-person watch parties, games, and gatherings — not just feeds." },
            { h: "Built in LA", b: "Loverball started in LA and is growing city by city, one community at a time." },
          ].map((v) => (
            <article key={v.h} className="p-8" style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 16 }}>
              <h3 style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 1.05, textTransform: "uppercase", letterSpacing: "-0.005em" }}>{v.h}</h3>
              <p className="mt-4" style={{ color: C.muted, fontSize: 15, lineHeight: 1.6 }}>{v.b}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 md:px-10 py-20 text-center max-w-3xl mx-auto" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <h2 style={{ fontFamily: fonts.display, fontSize: "clamp(36px, 6vw, 64px)", lineHeight: 0.95, textTransform: "uppercase", letterSpacing: "-0.01em" }}>
          Come find your team.
        </h2>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link to="/membership" style={{ background: C.raspberry, color: "#fff", fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", padding: "16px 28px", borderRadius: 999, fontWeight: 500 }}>
            See Membership
          </Link>
          <Link to="/events" style={{ border: `1px solid ${C.borderStrong}`, color: C.text, fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", padding: "15px 27px", borderRadius: 999 }} className="inline-flex items-center gap-2">
            View Events <ArrowRight size={14} />
          </Link>
        </div>
        <p className="mt-8" style={{ color: C.muted, fontSize: 14 }}>
          Questions? Email <a href="mailto:hello@loverball.com" style={{ color: C.raspberry }} className="underline underline-offset-4">hello@loverball.com</a>
        </p>
      </section>
    </div>
  );
};

export default About;
