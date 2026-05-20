import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Instagram, Mail, MapPin } from "lucide-react";
import { C, fonts } from "@/lib/editorialTheme";
import { INSTAGRAM_URL } from "@/lib/socialLinks";
import { H1, Body, Slug, Mono } from "@/components/editorial/primitives";


const CONTACT_EMAIL = "hello@loverball.com";


const Contact = () => (
  <div style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }} className="min-h-screen">
    <Seo title="Contact — Loverball" description="Get in touch with Loverball — the members-only home for sports fandom. Press, partnerships, and member support." path="/contact" />
    <SiteNav />

    <section className="px-6 md:px-12 pt-32 md:pt-40 pb-12 max-w-5xl">
      <Slug>Contact</Slug>
      <H1 className="mt-6">Say hi.</H1>
      <Body muted size={18} className="mt-8 max-w-xl">
        Press, partnerships, member support, or anything else — we read everything.
      </Body>
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
            <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="mt-6 block hover:opacity-80 transition-opacity" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 26, lineHeight: 1.15, letterSpacing: "-0.015em", color: C.text }}>{h}</a>
          ) : (
            <div className="mt-6" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 26, lineHeight: 1.15, letterSpacing: "-0.015em", color: C.text }}>{h}</div>
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
