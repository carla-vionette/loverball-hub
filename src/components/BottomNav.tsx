import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { User, CalendarDays, ShoppingBag, Play, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { icon: Play, label: "Watch", path: "/home" },
  { icon: ShoppingBag, label: "Shop", path: "/shop" },
  { icon: CalendarDays, label: "Events", path: "/events" },
  { icon: Users, label: "Friends", path: "/friends" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const isWatchScreen = pathname === "/home";
  const { user } = useAuth();
  const [badgeCount, setBadgeCount] = useState(0);

  const fetchBadgeCount = async () => {
    if (!user) { setBadgeCount(0); return; }

    const [unreadRes, pendingRes] = await Promise.all([
      supabase
        .from("direct_messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false),
      supabase
        .from("friendships")
        .select("id", { count: "exact", head: true })
        .eq("addressee_id", user.id)
        .eq("status", "pending"),
    ]);

    const unread = unreadRes.count || 0;
    const pending = pendingRes.count || 0;
    setBadgeCount(unread + pending);
  };

  useEffect(() => {
    fetchBadgeCount();
  }, [user?.id, pathname]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("bottom-nav-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_messages", filter: `receiver_id=eq.${user.id}` },
        () => fetchBadgeCount()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships", filter: `addressee_id=eq.${user.id}` },
        () => fetchBadgeCount()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-pb bg-background/95 backdrop-blur-md border-t border-border/20`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          const showBadge = item.path === "/friends" && badgeCount > 0;
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              className="flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 tap-target focus-ring relative"
            >
              <div className={`relative flex items-center justify-center w-10 h-8 rounded-full transition-all duration-300 ${isActive ? 'bg-primary' : ''}`}>
                <Icon
                  className={`w-5 h-5 transition-colors duration-300 ${
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                  fill={isActive ? "currentColor" : "none"}
                  aria-hidden="true"
                />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 font-medium transition-colors duration-300 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
