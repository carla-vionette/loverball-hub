import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { User, Search, CalendarDays, Settings, ShoppingBag, Newspaper, Shield, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import GlobalSearch from "@/components/GlobalSearch";
import loverballLogo from "@/assets/loverball-script-logo.png";

const SIDEBAR_BG = "#0F0F12";
const ACCENT = "#E91E63";

const mainNavItems = [
  { icon: Newspaper, label: "Feed", path: "/feed" },
  { icon: CalendarDays, label: "Events", path: "/events" },
  { icon: ShoppingBag, label: "Shop", path: "/shop" },
  { icon: Users, label: "Friends", path: "/friends" },
];

const secondaryNavItems = [
  { icon: User, label: "Profile", path: "/profile" },
];

type MiniProfile = { name: string; photo: string | null };

const NavItem = ({
  to,
  icon: Icon,
  label,
  active,
  badge,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  active: boolean;
  badge?: number;
}) => (
  <Link
    to={to}
    aria-current={active ? "page" : undefined}
    className="relative flex items-center gap-3 h-11 px-5 xl:px-6 mx-0 transition-colors focus-ring outline-none"
    style={{
      color: active ? "#FFFFFF" : "rgba(255,255,255,0.55)",
      fontWeight: active ? 500 : 400,
    }}
    title={label}
  >
    {/* Active accent bar */}
    <span
      aria-hidden
      className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full transition-opacity"
      style={{ background: ACCENT, opacity: active ? 1 : 0 }}
    />
    <div className="relative shrink-0">
      <Icon className="w-5 h-5" aria-hidden />
      {!!badge && badge > 0 && (
        <span
          className="absolute -top-1.5 -right-2 text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5"
          style={{ background: ACCENT, color: "#fff" }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </div>
    <span className="text-sm hidden xl:inline truncate">{label}</span>
  </Link>
);

const DesktopNav = () => {
  const location = useLocation();
  const { isAdmin, user } = useAuth();
  const isActive = (path: string) => location.pathname === path;
  const [friendsBadge, setFriendsBadge] = useState(0);
  const [mini, setMini] = useState<MiniProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("name, profile_photo_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        setMini({ name: data.name || "Member", photo: data.profile_photo_url || null });
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      const [unreadRes, pendingRes] = await Promise.all([
        supabase.from("direct_messages").select("id", { count: "exact", head: true }).eq("receiver_id", user.id).eq("read", false),
        supabase.from("friendships").select("id", { count: "exact", head: true }).eq("addressee_id", user.id).eq("status", "pending"),
      ]);
      setFriendsBadge((unreadRes.count || 0) + (pendingRes.count || 0));
    };
    fetchCount();
    const channel = supabase
      .channel("desktop-nav-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages", filter: `receiver_id=eq.${user.id}` }, () => fetchCount())
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships", filter: `addressee_id=eq.${user.id}` }, () => fetchCount())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const firstName = mini?.name?.split(" ")[0] || "Member";
  const initial = (mini?.name?.[0] || "M").toUpperCase();

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 h-screen w-16 xl:w-64 flex-col z-[1000] transition-[width] duration-200"
      style={{
        background: SIDEBAR_BG,
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div
        className="px-3 xl:px-5 pt-5 pb-4 flex items-center justify-center xl:justify-start"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <Link to="/" className="focus-ring rounded-lg block" aria-label="Loverball home">
          <img
            src={loverballLogo}
            alt="Loverball"
            className="h-7 xl:h-8 w-auto object-contain"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </Link>
      </div>

      {/* Mini profile card */}
      {user && (
        <Link
          to="/profile/edit"
          className="mx-2 xl:mx-3 mt-3 rounded-xl flex items-center gap-2.5 xl:gap-3 p-2 xl:px-2.5 xl:py-2.5 transition-colors hover:bg-white/[0.04]"
          style={{ border: "1px solid rgba(255,255,255,0.06)" }}
          aria-label="Edit profile"
          title={`${firstName} — Edit profile`}
        >
          <div
            className="w-9 h-9 rounded-full shrink-0 overflow-hidden flex items-center justify-center"
            style={{ background: "rgba(233,30,99,0.18)", color: ACCENT, fontWeight: 600, fontSize: 13 }}
          >
            {mini?.photo ? (
              <img src={mini.photo} alt={firstName} className="w-full h-full object-cover" />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <div className="hidden xl:flex flex-col min-w-0 flex-1">
            <span className="text-[13px] text-white font-medium truncate">{firstName}</span>
            <span
              className="text-[10px] uppercase tracking-[0.16em] truncate"
              style={{ color: ACCENT, fontWeight: 500 }}
            >
              Edit profile
            </span>
          </div>
        </Link>
      )}

      {/* Search */}
      <div className="px-2 xl:px-3 pt-3 pb-2 hidden xl:block">
        <GlobalSearch />
      </div>
      <Link
        to="/search"
        className="xl:hidden mx-auto mt-3 mb-1 w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:bg-white/[0.06]"
        style={{ color: "rgba(255,255,255,0.55)" }}
        aria-label="Search"
        title="Search"
      >
        <Search className="w-5 h-5" />
      </Link>

      {/* Primary nav */}
      <nav className="flex-1 py-2 flex flex-col" aria-label="Primary">
        <div className="space-y-0.5">
          {mainNavItems.map((item) => (
            <NavItem
              key={item.path}
              to={item.path}
              icon={item.icon}
              label={item.label}
              active={isActive(item.path)}
              badge={item.path === "/friends" ? friendsBadge : undefined}
            />
          ))}
        </div>

        <div className="flex-1" />

        <div
          className="space-y-0.5 pt-3 mt-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {secondaryNavItems.map((item) => (
            <NavItem key={item.path} to={item.path} icon={item.icon} label={item.label} active={isActive(item.path)} />
          ))}
          <NavItem to="/settings" icon={Settings} label="Settings" active={isActive("/settings")} />
          {isAdmin && (
            <NavItem to="/admin" icon={Shield} label="Admin" active={isActive("/admin")} />
          )}
        </div>
      </nav>
    </aside>
  );
};

export default DesktopNav;
