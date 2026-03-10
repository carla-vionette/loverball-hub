import React from "react";
import { User, CalendarDays, ShoppingBag, Play, Heart, Compass, Users, MessageCircle } from "lucide-react";

const BottomNav = () => {
  const pathname = window.location.pathname;
  const isWatchScreen = pathname === "/home";
  
  const navItems = [
    { icon: Play, label: "Watch", path: "/home" },
    { icon: Compass, label: "Discover", path: "/explore" },
    { icon: Heart, label: "Connect", path: "/discover" },
    { icon: ShoppingBag, label: "Shop", path: "/shop" },
    { icon: CalendarDays, label: "Events", path: "/events" },
    { icon: Users, label: "Friends", path: "/friends" },
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
          const isActive = pathname === item.path;
          
          return (
            <a
              key={item.path}
              href={item.path}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              className="flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 tap-target focus-ring"
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
              </div>
              <span className={`text-[10px] mt-1 font-medium ${
                isActive 
                  ? "text-primary" 
                  : isWatchScreen ? "text-white/40" : "text-muted-foreground"
              }`}>
                {item.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;