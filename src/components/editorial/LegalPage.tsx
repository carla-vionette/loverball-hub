import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { C, fonts } from "@/lib/editorialTheme";
import { H1, H2, Body, Slug, Mono } from "@/components/editorial/primitives";



export const LegalSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-4">
    <H2 style={{ fontSize: "clamp(28px, 3.4vw, 40px)" }}>{title}</H2>
    <div className="space-y-4" style={{ fontFamily: fonts.sans, fontSize: 16, lineHeight: 1.7, color: C.muted }}>
      {children}
    </div>
  </section>
);

export const LegalList = ({ items }: { items: ReactNode[] }) => (
  <ul className="space-y-2 pl-5" style={{ listStyle: "disc" }}>
    {items.map((it, i) => <li key={i}>{it}</li>)}
  </ul>
);

const LegalPage = ({ kicker, title, updated, children }: { kicker: string; title: string; updated: string; children: ReactNode }) => {
  const navigate = useNavigate();
  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }} className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 md:px-12 pt-32 md:pt-40 pb-24">
        <button
          onClick={() => navigate(-1)}
          className="mb-10 inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
          style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted }}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        <Slug>{kicker}</Slug>
        <H1 className="mt-6" style={{ fontSize: "clamp(44px, 7vw, 88px)" }}>{title}</H1>
        <Mono size={10} color={C.muted}>{updated}</Mono>

        <div className="mt-16 space-y-12">{children}</div>
      </div>

      <footer className="px-6 md:px-12 py-10" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <Mono size={10}>© {new Date().getFullYear()} Loverball LLC · Built in LA</Mono>
      </footer>
    </div>
  );
};

export default LegalPage;
