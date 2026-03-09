import React from "react";
import { User, CalendarDays, ShoppingBag, Play, Heart, Compass } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { Skeleton } from "@/components/ui/skeleton";

const BottomNav = () => {
  const location = useLocation();
  const auth = useAuth();
  const loading = auth?.loading ?? false;
  const { hasUnread } = useUnreadMessages();
  const isWatchScreen = location.pathname === "/home";
  
  if (loading) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border/30 z-50 md:hidden" aria-label="Loading navigation">
        <div className="flex justify-around items-center h-16">
          {[...Array(6)].map((_, i) => (
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
    { icon: Play, label: "Watch", path: "/home" },
    { icon: Compass, label: "Discover", path: "/explore" },
    { icon: Heart, label: "Connect", path: "/discover" },
    { icon: ShoppingBag, label: "Shop", path: "/shop" },
    { icon: CalendarDays, label: "Events", path: "/events" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-pb ${
        isWatchScreen ? "bg-[#0A0A0A] border-t border-white/10" : "bg-background border-t border-border/30"
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-center h-16">
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
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 tap-target focus-ring`}
            >
              <div className="relative">
                <Icon 
                  className={`w-5 h-5 ${
                    isActive 
                      ? "text-primary" 
                      : isWatchScreen ? "text-white/40" : "text-muted-foreground"
                  }`}
                  fill={isActive ? "currentColor" : "none"}
                  aria-hidden="true"
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-background" aria-hidden="true" />
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${
                isActive 
                  ? "text-primary" 
                  : isWatchScreen ? "text-white/40" : "text-muted-foreground"
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
