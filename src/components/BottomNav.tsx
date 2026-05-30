import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { User, CalendarDays, Play, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { icon: Play, label: "FEED", path: "/feed", matches: ["/feed", "/home", "/watch"] },
  { icon: CalendarDays, label: "Events", path: "/events", matches: ["/events", "/event/"] },
  { icon: Heart, label: "Club", path: "/club", matches: ["/club", "/members", "/friends", "/messages", "/dms"] },
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
      className="fixed bottom-4 left-4 right-4 z-50 lg:hidden safe-area-pb"
      role="navigation"
      aria-label="Main navigation"
      style={{
        height: 72,
        background: "#FFFFFF",
        border: "1px solid #E8E3DC",
        borderTop: "1px solid #E8E3DC",
        borderRadius: 28,
        boxShadow: "0 12px 32px -8px rgba(60,40,20,0.12)",
      }}
    >
      <div className="relative flex justify-around items-center h-full max-w-lg mx-auto px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.matches.some(m => pathname === m || (m.endsWith("/") && pathname.startsWith(m)));
          const showBadge = item.label === "Club" && badgeCount > 0;
          const color = isActive ? "#E85D2F" : "#9E9E9E";
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              className="flex flex-col items-center justify-center flex-1 h-full tap-target focus-ring relative gap-1.5"
              style={{ color }}
            >
              <div className="relative flex items-center justify-center">
                <Icon className="w-[22px] h-[22px]" aria-hidden="true" fill={isActive ? "currentColor" : "none"} strokeWidth={isActive ? 2 : 1.75} />
                {showBadge && (
                  <span
                    className="absolute -top-1.5 -right-2.5 text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
                    style={{ background: "#E85D2F", color: "#FFFFFF" }}
                  >
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 600,
                  fontSize: 11,
                  lineHeight: 1,
                  letterSpacing: "1.2px",
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
