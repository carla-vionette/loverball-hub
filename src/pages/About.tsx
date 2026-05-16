import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { C, fonts } from "@/lib/editorialTheme";

const Slug = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: C.raspberry }}>{children}</span>
);
const Mono = ({ children, color = C.muted, size = 11 }: any) => (
  <span style={{ fontFamily: fonts.mono, fontSize: size, letterSpacing: "0.14em", textTransform: "uppercase", color }}>{children}</span>
);

const About = () => (
  <div style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }} className="min-h-screen">
    <Seo title="About — Loverball" description="Loverball is the members-only home for sports fandom. Built in Los Angeles for the fans who finally want a place that gets it." path="/about" />

    <header className="px-6 md:px-12 pt-10 pb-6 flex items-center justify-between" style={{ borderBottom: `0.5px solid ${C.border}` }}>
      <Link to="/" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 28, letterSpacing: "-0.02em" }}>Loverball</Link>
      <nav className="hidden md:flex items-center gap-8">
        {[["Watch", "/feed"], ["Connect", "/connect"], ["Events", "/events"], ["Club", "/club"]].map(([l, h]) => (
          <Link key={l} to={h} style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted }}>{l}</Link>
        ))}
      </nav>
    </header>

    <section className="px-6 md:px-12 pt-16 md:pt-24 pb-12 max-w-4xl">
      <Slug>About</Slug>
      <h1 className="mt-6" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500, fontSize: "clamp(48px, 8vw, 104px)", lineHeight: 0.95, letterSpacing: "-0.03em" }}>
        A members-only home for sports fandom.
      </h1>
    </section>

    <section className="px-6 md:px-12 pb-24 max-w-3xl space-y-8" style={{ fontSize: 18, lineHeight: 1.7, color: C.text }}>
      <p><span style={{ fontFamily: fonts.serif, fontSize: 64, lineHeight: 0.8, float: "left", marginRight: 10, marginTop: 6, color: C.raspberry }}>L</span>overball is a private club for sports fans built in Los Angeles. We make space for the watch parties, group chats, rivalries, rituals, and friendships that the rest of the internet keeps flattening.</p>
      <p style={{ color: C.muted }}>We started Loverball because the best part of sports is who you watch it with. Members get matched into fan circles, find people headed to the same game, and trade hot takes in rooms where the conversation actually goes somewhere.</p>
      <p style={{ color: C.muted }}>No bots. No bad-faith trolls. No algorithm dragging you off-topic. Just members, the games, and the people who love them.</p>
      <div className="pt-6 flex flex-wrap gap-6">
        <Link to="/contact" style={{ fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: C.raspberry, borderBottom: `1px solid ${C.raspberry}` }}>Contact us</Link>
        <Link to="/auth?mode=signup" style={{ fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: C.text, borderBottom: `1px solid ${C.borderStrong}` }}>Join Loverball</Link>
      </div>
    </section>

    <footer className="px-6 md:px-12 py-10" style={{ borderTop: `0.5px solid ${C.border}` }}>
      <Mono size={10}>© 2026 Loverball · Built in LA</Mono>
    </footer>
  </div>
);

export default About;
