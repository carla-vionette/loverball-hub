import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { User, Search, CalendarDays, Settings, ShoppingBag, Play, Home, Compass, Newspaper, Shield, Trophy, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import GlobalSearch from "@/components/GlobalSearch";
import loverballLogo from "@/assets/loverball-script-logo.png";

const mainNavItems = [
  { icon: Home, label: "For You", path: "/home" },
  { icon: Compass, label: "Discover", path: "/explore" },
  { icon: Play, label: "Watch", path: "/watch" },
  { icon: Newspaper, label: "Feed", path: "/feed" },
  { icon: CalendarDays, label: "Events", path: "/events" },
  { icon: Trophy, label: "Scores", path: "/scores" },
  { icon: ShoppingBag, label: "Shop", path: "/shop" },
  { icon: Users, label: "Friends", path: "/friends" },
];

const secondaryNavItems = [
  { icon: User, label: "Profile", path: "/profile" },
];

const DesktopNav = () => {
  const location = useLocation();
  const { isAdmin, user } = useAuth();
  const isActive = (path: string) => location.pathname === path;
  const [friendsBadge, setFriendsBadge] = useState(0);

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

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-background border-r border-border/20 flex-col z-50"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="px-4 py-6 border-b border-border/20 flex items-center justify-center">
        <Link to="/" className="focus-ring rounded-lg" aria-label="Loverball home">
          <img src={loverballLogo} alt="Loverball logo" className="w-[140px] h-auto object-contain" />
        </Link>
      </div>

      <div className="px-4 py-3">
        <GlobalSearch />
      </div>

      <nav className="flex-1 py-3 flex flex-col" aria-label="Primary">
        <div className="space-y-0.5">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const showBadge = item.path === "/friends" && friendsBadge > 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 px-5 py-2.5 mx-3 rounded-xl transition-all duration-200 focus-ring ${
                  active
                    ? "text-primary font-semibold bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-2 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
                      {friendsBadge > 99 ? "99+" : friendsBadge}
                    </span>
                  )}
                </div>
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex-1" />

        <div className="space-y-0.5 border-t border-border/20 pt-3">
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 px-5 py-2.5 mx-3 rounded-xl transition-all duration-200 focus-ring ${
                  active
                    ? "text-primary font-semibold bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}

          <Link
            to="/settings"
            className={`flex items-center gap-3 px-5 py-2.5 mx-3 rounded-xl transition-all duration-200 focus-ring ${
              isActive("/settings")
                ? "text-primary font-semibold bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Settings className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm">Settings</span>
          </Link>

          <Link
            to="/search"
            className={`flex items-center gap-3 px-5 py-2.5 mx-3 rounded-xl transition-all duration-200 focus-ring ${
              isActive("/search")
                ? "text-primary font-semibold bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Search className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm">Search</span>
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-5 py-2.5 mx-3 rounded-xl transition-all duration-200 focus-ring ${
                isActive("/admin")
                  ? "text-primary font-semibold bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Shield className="w-5 h-5" aria-hidden="true" />
              <span className="text-sm">Admin</span>
            </Link>
          )}
        </div>
      </nav>
    </aside>
  );
};

export default DesktopNav;
