import { User, CalendarDays, ShoppingBag, Play, Heart, MessageCircle, Home, Compass, Newspaper } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { Skeleton } from "@/components/ui/skeleton";

const BottomNav = () => {
  const location = useLocation();
  const { isMember, loading } = useAuth();
  const { hasUnread } = useUnreadMessages();
  
  // Show skeleton while loading
  if (loading) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 z-50 md:hidden" aria-label="Loading navigation">
        <div className="flex justify-around items-center h-16">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center justify-center flex-1 h-full gap-1">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="w-8 h-2 rounded" />
            </div>
          ))}
        </div>
      </nav>
    );
  }
  
  const navItems = [
    { icon: Home, label: "For You", path: "/home" },
    { icon: Compass, label: "Connect", path: "/discover" },
    { icon: MessageCircle, label: "DMs", path: "/dms", showBadge: true },
    { icon: ShoppingBag, label: "Shop", path: "/shop" },
    { icon: CalendarDays, label: "Events", path: "/events" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-pb px-3 pb-2"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-center h-16 bg-card/90 backdrop-blur-md rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-border/20 animate-fade-in">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const showBadge = 'showBadge' in item && item.showBadge && hasUnread;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              aria-label={`${item.label}${showBadge ? ', new messages' : ''}`}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 rounded-[2rem] mx-0.5 tap-target focus-ring ${
                isActive ? "bg-accent text-accent-foreground" : ""
              }`}
            >
              <div className="relative">
                <Icon 
                  className={`w-5 h-5 ${isActive ? "text-accent-foreground" : "text-foreground/40"}`}
                  fill={isActive ? "currentColor" : "none"}
                  aria-hidden="true"
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-card" aria-hidden="true" />
                )}
              </div>
              <span className={`text-[10px] tracking-wider mt-1 ${isActive ? "text-accent-foreground font-semibold" : "text-foreground/40"}`}>
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
