import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Instagram, Mail, MapPin } from "lucide-react";
import { C, fonts } from "@/lib/editorialTheme";
import { INSTAGRAM_URL } from "@/lib/socialLinks";

const CONTACT_EMAIL = "hello@loverball.com";

const Slug = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: C.raspberry }}>{children}</span>
);
const Mono = ({ children, color = C.muted, size = 11 }: any) => (
  <span style={{ fontFamily: fonts.mono, fontSize: size, letterSpacing: "0.14em", textTransform: "uppercase", color }}>{children}</span>
);

const Contact = () => (
  <div style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }} className="min-h-screen">
    <Seo title="Contact — Loverball" description="Get in touch with Loverball — the members-only home for sports fandom. Press, partnerships, and member support." path="/contact" />

    <header className="px-6 md:px-12 pt-10 pb-6 flex items-center justify-between" style={{ borderBottom: `0.5px solid ${C.border}` }}>
      <Link to="/" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 28, letterSpacing: "-0.02em" }}>Loverball</Link>
      <nav className="hidden md:flex items-center gap-8">
        {[["Watch", "/feed"], ["Connect", "/connect"], ["Events", "/events"], ["Club", "/club"]].map(([l, h]) => (
          <Link key={l} to={h} style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted }}>{l}</Link>
        ))}
      </nav>
    </header>

    <section className="px-6 md:px-12 pt-16 md:pt-24 pb-12 max-w-5xl">
      <Slug>Contact</Slug>
      <h1 className="mt-6" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontWeight: 500, fontSize: "clamp(48px, 8vw, 104px)", lineHeight: 0.95, letterSpacing: "-0.03em" }}>
        Say hi.
      </h1>
      <p className="mt-8 max-w-xl" style={{ fontSize: 18, lineHeight: 1.6, color: C.muted }}>
        Press, partnerships, member support, or anything else — we read everything.
      </p>
    </section>

    <section className="px-6 md:px-12 pb-24 grid md:grid-cols-3 gap-px max-w-5xl" style={{ background: C.border }}>
      {[
        { Icon: Mail, chip: "Email", h: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
        { Icon: Instagram, chip: "Instagram", h: "@loverball", href: INSTAGRAM_URL },
        { Icon: MapPin, chip: "HQ", h: "Los Angeles, CA", href: null as string | null },
      ].map(({ Icon, chip, h, href }) => (
        <div key={chip} className="p-10" style={{ background: C.bg }}>
          <Mono color={C.raspberry}>{chip}</Mono>
          <div className="mt-6"><Icon size={24} color={C.gold} strokeWidth={1.25} /></div>
          {href ? (
            <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="mt-6 block hover:opacity-80 transition-opacity" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 26, lineHeight: 1.1, letterSpacing: "-0.01em" }}>{h}</a>
          ) : (
            <div className="mt-6" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 26, lineHeight: 1.1, letterSpacing: "-0.01em" }}>{h}</div>
          )}
        </div>
      ))}
    </section>

    <footer className="px-6 md:px-12 py-10" style={{ borderTop: `0.5px solid ${C.border}` }}>
      <Mono size={10}>© 2026 Loverball · Built in LA</Mono>
    </footer>
  </div>
);

export default Contact;
