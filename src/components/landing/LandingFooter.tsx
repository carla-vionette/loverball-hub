import { Link } from "react-router-dom";
import Brand from "./Brand";
import { Instagram } from "lucide-react";

const PRODUCT = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/features", label: "Features" },
  { to: "/events", label: "Watch parties" },
  { to: "/join", label: "Join" },
];

const COMPANY = [
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-lb-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Brand />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-lb-muted font-body">
              Loverball is where women sports fans find their squad, match on
              fandom, and never watch alone again.
            </p>
          </div>

          <FooterCol title="Product" items={PRODUCT} />
          <FooterCol title="Company" items={COMPANY} />

          <div>
            <h4 className="font-condensed uppercase tracking-[0.2em] text-xs text-lime">Connect</h4>
            <a
              href="https://instagram.com/loverball"
              target="_blank"
              rel="noreferrer noopener"
              className="mt-4 inline-flex items-center gap-2 text-sm text-lb-muted hover:text-white"
            >
              <Instagram size={16} /> @loverball
            </a>
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-lb-muted font-condensed">
              Drop into the DMs.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-lb-border pt-6 md:flex-row md:items-center">
          <p className="text-xs uppercase tracking-[0.18em] text-lb-muted font-condensed">
            © {new Date().getFullYear()} Loverball. All rights reserved.
          </p>
          <p className="text-xs uppercase tracking-[0.18em] text-lb-muted font-condensed">
            For the love of the game.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: { to: string; label: string }[] }) {
  return (
    <div>
      <h4 className="font-condensed uppercase tracking-[0.2em] text-xs text-lime">{title}</h4>
      <ul className="mt-4 space-y-2">
        {items.map((it) => (
          <li key={it.to}>
            <Link to={it.to} className="text-sm text-lb-muted hover:text-white">
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LandingFooter;
