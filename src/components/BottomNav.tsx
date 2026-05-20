import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { User, CalendarDays, Play, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { icon: Play, label: "Feed", path: "/feed", matches: ["/feed", "/home"] },
  { icon: CalendarDays, label: "Events", path: "/events", matches: ["/events", "/event/"] },
  { icon: Heart, label: "Club", path: "/club/xi", matches: ["/club/xi", "/club", "/members"] },
  { icon: User, label: "Profile", path: "/profile", matches: ["/profile"] },
];

const BottomNav = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { user } = useAuth();
  const [badgeCount, setBadgeCount] = useState(0);

  const fetchBadgeCount = async () => {
    if (!user) { setBadgeCount(0); return; }
    const [unreadRes, pendingRes] = await Promise.all([
      supabase.from("direct_messages").select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id).eq("read", false),
      supabase.from("friendships").select("id", { count: "exact", head: true })
        .eq("addressee_id", user.id).eq("status", "pending"),
    ]);
    setBadgeCount((unreadRes.count || 0) + (pendingRes.count || 0));
  };

  useEffect(() => { fetchBadgeCount(); }, [user?.id, pathname]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("bottom-nav-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages", filter: `receiver_id=eq.${user.id}` }, fetchBadgeCount)
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships", filter: `addressee_id=eq.${user.id}` }, fetchBadgeCount)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  return (
    <nav
      className="fixed bottom-3 left-3 right-3 z-50 md:hidden safe-area-pb"
      role="navigation"
      aria-label="Main navigation"
      style={{
        height: 64,
        background: "rgba(20, 20, 21, 0.72)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24,
        boxShadow: "0 12px 32px -8px rgba(0,0,0,0.6)",
      }}
    >
      <div className="relative flex justify-around items-center h-full max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.matches.some(m => pathname === m || (m.endsWith("/") && pathname.startsWith(m)));
          const showBadge = item.label === "Club" && badgeCount > 0;
          const color = isActive ? "#E6F25A" : "#E86BB0";
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              className="flex flex-col items-center justify-center flex-1 h-full tap-target focus-ring relative"
              style={{ color }}
            >
              <div className="relative flex items-center justify-center">
                <Icon className="w-[20px] h-[20px]" aria-hidden="true" fill={isActive ? "currentColor" : "none"} strokeWidth={isActive ? 2 : 1.75} />
                {showBadge && (
                  <span
                    className="absolute -top-1.5 -right-2.5 text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
                    style={{ background: "#F04E23", color: "#E6F25A" }}
                  >
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </div>
              <span
                className="mt-1"
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: "1.4px",
                  textTransform: "uppercase",
                }}
              >
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
