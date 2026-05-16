import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { User, CalendarDays, Play, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { icon: Play, label: "Feed", path: "/feed", matches: ["/feed", "/home"] },
  { icon: CalendarDays, label: "Scene", path: "/events", matches: ["/events", "/event/"] },
  { icon: Heart, label: "Club", path: "/members", matches: ["/members"] },
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
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-pb"
      role="navigation"
      aria-label="Main navigation"
      style={{
        height: 70,
        background: "linear-gradient(to top, #050505 60%, rgba(5,5,5,0.85) 100%)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="relative flex justify-around items-center h-full max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.matches.some(m => pathname === m || (m.endsWith("/") && pathname.startsWith(m)));
          const showBadge = item.path === "/members" && badgeCount > 0;
          const color = isActive ? "#e8276f" : "rgba(255,255,255,0.5)";
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
                <Icon className="w-5 h-5" aria-hidden="true" fill={isActive ? "currentColor" : "none"} />
                {showBadge && (
                  <span
                    className="absolute -top-1.5 -right-2.5 text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
                    style={{ background: "#e8276f", color: "#fff" }}
                  >
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </div>
              <span
                className="mt-1"
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 800,
                  fontSize: 10,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
        <span
          className="absolute right-3 bottom-1.5 pointer-events-none"
          style={{
            color: "#d88c5a",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 800,
            fontSize: 8,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            opacity: 0.7,
          }}
        >
          Vol. 1
        </span>
      </div>
    </nav>
  );
};

export default BottomNav;
