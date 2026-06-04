import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { C, fonts } from "@/lib/editorialTheme";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "@/components/NotificationBell";
import navLogo from "@/assets/loverball-logo-black.png";

/**
 * SiteNav — single shared top navigation used on every public/editorial page.
 *
 * Auth-aware variants (same shell, only the right-side actions differ):
 *  - Logged out: "Sign in" link + "Join Free" pill
 *  - Logged in : "Profile" link + "Open App" pill
 *
 * Tokens, type, spacing and active states are identical everywhere.
 */

const PUBLIC_NAV_ITEMS: Array<[string, string]> = [
  ["FEED", "/feed"],
  ["Events", "/events"],
  ["Club", "/club"],
];

const MEMBER_NAV_ITEMS: Array<[string, string]> = [
  ["FEED", "/feed"],
  ["Events", "/events"],
  ["Club", "/club"],
  ["Profile", "/profile"],
];

const linkStyle = {
  fontFamily: fonts.mono,
  fontSize: 11,
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
};

const pillStyle = {
  fontFamily: fonts.mono,
  fontSize: 11,
  letterSpacing: "0.16em",
  textTransform: "uppercase" as const,
  padding: "10px 18px",
  borderRadius: 999,
};

const SiteNav = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const baseNavItems = user ? MEMBER_NAV_ITEMS : PUBLIC_NAV_ITEMS;
  const navItems: Array<[string, string]> = isAdmin
    ? [...baseNavItems, ["Admin", "/admin"]]
    : baseNavItems;

  const isActive = (to: string) => {
    const [toPath, toQuery] = to.split("?");
    const params = new URLSearchParams(search);
    const tab = params.get("tab");
    if (toPath === "/feed") {
      if (pathname !== "/feed" && !pathname.startsWith("/feed/")) return false;
      // Stories link active only when tab=stories; FEED active otherwise
      if (toQuery?.includes("tab=stories")) return tab === "stories";
      return tab !== "stories";
    }
    return toPath === "/" ? pathname === "/" : pathname === toPath || pathname.startsWith(toPath + "/");
  };

  const goSignIn = () => navigate("/auth?mode=signin");
  const goJoin = () => navigate("/onboarding");

  return (
    <nav
      className="fixed top-0 inset-x-0"
      role="navigation"
      aria-label="Primary"
      style={{
        zIndex: 100,
        background: "#FAF7F2",
        borderBottom: `1px solid #E8E3DC`,
      }}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-10 py-4 flex items-center justify-between gap-6">
        <Link to="/" aria-label="Loverball home" className="flex items-center shrink-0">
          <img src={navLogo} alt="Loverball" className="h-9 md:h-10 w-auto block" loading="lazy" decoding="async" />
        </Link>

        <div className="hidden md:flex items-center gap-7 xl:gap-9">
          {navItems.map(([label, to]) => {
            const active = isActive(to);
            return (
              <Link
                key={label}
                to={to}
                aria-current={active ? "page" : undefined}
                style={{ ...linkStyle, color: active ? "#E85D2F" : "#1A1A1A" }}
                className="transition-colors hover:!text-[#E85D2F]"
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <NotificationBell />
              <Link to="/profile" style={{ ...linkStyle, color: "#1A1A1A" }} className="transition-colors hover:!text-[#E85D2F]">
                Profile
              </Link>
              <Link to="/feed" style={{ ...pillStyle, background: "#E85D2F", color: "#FFFFFF" }}>
                Open App
              </Link>
            </>
          ) : (
            <>
              <button onClick={goSignIn} style={{ ...linkStyle, color: "#1A1A1A" }} className="transition-colors hover:!text-[#E85D2F]">
                Sign in
              </button>
              <button onClick={goJoin} style={{ ...pillStyle, background: "#E85D2F", color: "#FFFFFF" }}>
                JOIN US!
              </button>
            </>
          )}
        </div>

        {user && <div className="md:hidden flex items-center"><NotificationBell /></div>}

        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          style={{ color: "#1A1A1A" }}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="md:hidden px-5 pb-5 pt-3 flex flex-col gap-4"
          style={{ borderTop: `0.5px solid #E8E3DC`, background: "#FAF7F2" }}
        >
          {navItems.map(([label, to]) => (
            <Link
              key={label}
              to={to}
              onClick={() => setMobileOpen(false)}
              style={{ ...linkStyle, color: isActive(to) ? "#E85D2F" : "#1A1A1A", fontSize: 12 }}
            >
              {label}
            </Link>
          ))}
          <div className="flex gap-3 pt-2">
            {user ? (
              <Link
                to="/feed"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center"
                style={{ ...pillStyle, background: "#E85D2F", color: "#FFFFFF" }}
              >
                Open App
              </Link>
            ) : (
              <>
                <button
                  onClick={() => { setMobileOpen(false); goSignIn(); }}
                  className="flex-1"
                  style={{ ...pillStyle, background: "transparent", color: "#1A1A1A", border: `1px solid #E8E3DC` }}
                >
                  Sign in
                </button>
                <button
                  onClick={() => { setMobileOpen(false); goJoin(); }}
                  className="flex-1"
                  style={{ ...pillStyle, background: "#E85D2F", color: "#FFFFFF" }}
                >
                  JOIN US!
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default SiteNav;
