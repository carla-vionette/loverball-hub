import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Brand from "./Brand";
import BrandButton from "./BrandButton";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/how-it-works", label: "How it works" },
  { to: "/features", label: "Features" },
  { to: "/join", label: "Join" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-lb-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:py-4 lg:px-8">
        <Brand />

        {/* Desktop links */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                [
                  "font-condensed uppercase tracking-[0.18em] text-sm transition",
                  isActive ? "text-lime" : "text-lb-muted hover:text-white",
                ].join(" ")
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:block">
          <BrandButton to="/join" size="sm" variant="primary">
            Join free
          </BrandButton>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-lb-border text-white md:hidden"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-lb-border bg-background/95 md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-4" aria-label="Mobile">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  [
                    "py-3 font-condensed uppercase tracking-[0.18em] text-sm border-b border-lb-border/60",
                    isActive ? "text-lime" : "text-white",
                  ].join(" ")
                }
              >
                {l.label}
              </NavLink>
            ))}
            <BrandButton
              to="/join"
              className="mt-4"
              variant="primary"
              fullWidth
            >
              Join free
            </BrandButton>
          </nav>
        </div>
      )}
    </header>
  );
}

export default LandingNav;
