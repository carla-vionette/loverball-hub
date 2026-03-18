import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Play, CalendarDays, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { icon: Home, path: "/home" },
  { icon: Compass, path: "/explore" },
  { icon: Play, path: "/watch" },
  { icon: CalendarDays, path: "/events" },
  { icon: User, path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const pathname = location.pathname;
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
    setBadgeCount((unreadRes.count || 0) + (pendingRes.count || 0));
  };

  useEffect(() => { fetchBadgeCount(); }, [user?.id, pathname]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("bottom-nav-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages", filter: `receiver_id=eq.${user.id}` }, () => fetchBadgeCount())
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships", filter: `addressee_id=eq.${user.id}` }, () => fetchBadgeCount())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-home-bg/95 backdrop-blur-md border-t border-border/20 safe-area-pb"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-col items-center justify-center flex-1 h-full transition-colors tap-target focus-ring"
            >
              <Icon
                className={`w-6 h-6 ${isActive ? "text-home-coral" : "text-muted-foreground/60"}`}
                fill={isActive ? "currentColor" : "none"}
                strokeWidth={isActive ? 2.5 : 1.5}
                aria-hidden="true"
              />
              {isActive && <span className="w-1 h-1 rounded-full bg-home-coral mt-1" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
