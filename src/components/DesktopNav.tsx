import React from "react";
import { User, Search, CalendarDays, Settings, ShoppingBag, Play, MessageCircle, Home, Compass, Newspaper, Heart, Bell } from "lucide-react";
import loverbballLogo from "@/assets/loverball-script-logo.png";

const DesktopNav = () => {
  const pathname = window.location.pathname;
  
  const mainNavItems = [
    { icon: Home, label: "For You", path: "/home" },
    { icon: Compass, label: "Discover", path: "/explore" },
    { icon: Heart, label: "Connect", path: "/discover" },
    { icon: Play, label: "Watch", path: "/watch" },
    { icon: Newspaper, label: "Feed", path: "/feed" },
    { icon: CalendarDays, label: "Events", path: "/events" },
    { icon: ShoppingBag, label: "Shop", path: "/shop" },
  ];

  const secondaryNavItems = [
    { icon: MessageCircle, label: "DMs", path: "/dms" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-background border-r border-border/20 flex-col z-50"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="p-4 border-b border-border/20 flex items-center justify-center">
        <a href="/" className="focus-ring rounded-lg" aria-label="Loverball home">
          <img src={loverbballLogo} alt="Loverball logo" className="h-20 w-auto object-contain" />
        </a>
      </div>
      
      <nav className="flex-1 py-3 flex flex-col" aria-label="Primary">
        <div className="space-y-0.5">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <a
                key={item.path}
                href={item.path}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 px-5 py-2.5 mx-3 rounded-xl transition-all duration-200 focus-ring ${
                  active 
                    ? "text-primary font-semibold bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm">{item.label}</span>
              </a>
            );
          })}
        </div>

        <div className="flex-1" />

        <div className="space-y-0.5 border-t border-border/20 pt-3">
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <a
                key={item.path}
                href={item.path}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={`flex items-center gap-3 px-5 py-2.5 mx-3 rounded-xl transition-all duration-200 focus-ring ${
                  active 
                    ? "text-primary font-semibold bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <span className="text-sm">{item.label}</span>
              </a>
            );
          })}

          <a
            href="/settings"
            className="flex items-center gap-3 px-5 py-2 mx-3 rounded-xl transition-all duration-200 focus-ring text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm">Notifications</span>
          </a>

          <a
            href="/settings"
            aria-current={isActive("/settings") ? "page" : undefined}
            className={`flex items-center gap-3 px-5 py-2.5 mx-3 rounded-xl transition-all duration-200 focus-ring ${
              isActive("/settings")
                ? "text-primary font-semibold bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Settings className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm">Settings</span>
          </a>
          <a
            href="/search"
            aria-label="Search"
            className={`flex items-center gap-3 px-5 py-2.5 mx-3 rounded-xl transition-all duration-200 focus-ring ${
              isActive("/search")
                ? "text-primary font-semibold bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Search className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm">Search</span>
          </a>
        </div>
      </nav>
    </aside>
  );
};

export default DesktopNav;