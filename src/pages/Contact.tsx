import { Link } from "react-router-dom";
import { Mail, Instagram } from "lucide-react";
import Seo from "@/components/Seo";
import { INSTAGRAM_URL } from "@/lib/socialLinks";

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

const Contact = () => {
  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }} className="min-h-screen">
      <Seo
        title="Contact Loverball"
        description="Get in touch with the Loverball team. Reach out about membership, partnerships, press, or anything else."
        path="/contact"
      />

      <header className="px-5 md:px-10 py-5 flex items-center justify-between" style={{ borderBottom: `0.5px solid ${C.border}` }}>
        <Link to="/" style={{ fontFamily: fonts.display, fontSize: 22, letterSpacing: "-0.01em", textTransform: "uppercase", color: C.text }}>
          Loverball
        </Link>
        <Link to="/" style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: C.muted }} className="hover:text-white">
          ← Home
        </Link>
      </header>

      <section className="px-5 md:px-10 pt-16 pb-12 max-w-3xl mx-auto">
        <Mono color={C.raspberry}>Contact</Mono>
        <h1 className="mt-4" style={{ fontFamily: fonts.display, fontSize: "clamp(48px, 8vw, 88px)", lineHeight: 0.95, letterSpacing: "-0.01em", textTransform: "uppercase" }}>
          Say hello.
        </h1>
        <p className="mt-6" style={{ color: C.muted, fontSize: 18, lineHeight: 1.6 }}>
          For support, membership questions, partnerships, press, or just to
          tell us about your team — we'd love to hear from you.
        </p>

        <a
          href="mailto:hello@loverball.com"
          className="mt-10 flex items-center gap-4 p-6 transition-colors hover:bg-white/5"
          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18 }}
        >
          <span
            className="inline-flex items-center justify-center"
            style={{ width: 48, height: 48, borderRadius: 14, background: `${C.raspberry}1A`, color: C.raspberry }}
          >
            <Mail size={22} />
          </span>
          <span className="flex flex-col">
            <Mono size={10}>Email us</Mono>
            <span style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 1.1, letterSpacing: "-0.005em", textTransform: "uppercase", color: C.text }}>
              hello@loverball.com
            </span>
          </span>
        </a>

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-4 p-6 transition-colors hover:bg-white/5"
          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18 }}
        >
          <span
            className="inline-flex items-center justify-center"
            style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.06)", color: C.text }}
          >
            <Instagram size={22} />
          </span>
          <span className="flex flex-col">
            <Mono size={10}>Follow along</Mono>
            <span style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 1.1, letterSpacing: "-0.005em", textTransform: "uppercase", color: C.text }}>
              @loverball
            </span>
          </span>
        </a>
      </section>

      <section className="px-5 md:px-10 py-16 max-w-3xl mx-auto" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <Mono>Support</Mono>
            <p className="mt-3" style={{ color: C.text, fontSize: 15, lineHeight: 1.6 }}>
              Account, membership, or event help — email{" "}
              <a href="mailto:hello@loverball.com" style={{ color: C.raspberry }} className="underline underline-offset-4">
                hello@loverball.com
              </a>{" "}
              and we'll get back within a couple of business days.
            </p>
          </div>
          <div>
            <Mono>Partnerships & press</Mono>
            <p className="mt-3" style={{ color: C.text, fontSize: 15, lineHeight: 1.6 }}>
              Brand collabs, creators, teams, leagues, or press — send a note to{" "}
              <a href="mailto:hello@loverball.com" style={{ color: C.raspberry }} className="underline underline-offset-4">
                hello@loverball.com
              </a>{" "}
              with a quick intro and we'll route it to the right person.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
