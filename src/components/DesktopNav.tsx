import { User, Search, CalendarDays, Settings, ShoppingBag, Play, Heart, MessageCircle, Home, Compass, Newspaper } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import loverbballLogo from "@/assets/loverball-script-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import NotificationBell from "@/components/NotificationBell";

const DesktopNav = () => {
  const location = useLocation();
  const { isMember, isAdmin } = useAuth();
  const { hasUnread } = useUnreadMessages();
  
  const navItems = [
    { icon: Home, label: "For You", path: "/home" },
    { icon: Compass, label: "Discover", path: "/discover" },
    { icon: Play, label: "Watch", path: "/watch" },
    { icon: Newspaper, label: "Feed", path: "/feed" },
    { icon: CalendarDays, label: "Events", path: "/events" },
    { icon: MessageCircle, label: "DMs", path: "/dms", showBadge: true },
    { icon: ShoppingBag, label: "Shop", path: "/shop" },
    { icon: User, label: "Profile", path: "/profile" },
    ...(isAdmin ? [
      { icon: Settings, label: "Admin", path: "/admin" },
    ] : []),
  ];

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-card/60 backdrop-blur-sm border-r border-border/20 flex-col z-50"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="p-6 border-b border-border/20 flex items-center justify-center">
        <Link to="/" className="focus-ring rounded-lg" aria-label="Loverball home">
          <img src={loverbballLogo} alt="Loverball logo" className="h-32 w-auto object-contain" />
        </Link>
      </div>
      
      <nav className="flex-1 py-6 overflow-y-auto" aria-label="Primary">
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
              className={`flex items-center gap-4 px-6 py-3.5 mx-3 rounded-2xl transition-all duration-200 focus-ring ${
                isActive 
                  ? "text-accent-foreground font-semibold bg-accent" 
                  : "text-foreground/50 hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" aria-hidden="true" />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-card" aria-hidden="true" />
                )}
              </div>
              <span className="text-sm tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/20 space-y-1">
        <div className="flex items-center gap-4 px-6 py-2 mx-3">
          <NotificationBell />
          <span className="text-sm tracking-wide text-foreground/50" aria-hidden="true">Notifications</span>
        </div>
        <Link
          to="/settings"
          aria-current={location.pathname === "/settings" ? "page" : undefined}
          className={`flex items-center gap-4 px-6 py-3 mx-3 rounded-2xl transition-all duration-200 focus-ring ${
            location.pathname === "/settings"
              ? "text-accent-foreground font-semibold bg-accent"
              : "text-foreground/50 hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          <Settings className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm tracking-wide">Settings</span>
        </Link>
        <Link
          to="/search"
          aria-label="Search"
          className="flex items-center gap-4 px-6 py-3 mx-3 rounded-2xl text-foreground/40 hover:text-foreground hover:bg-secondary/50 transition-all duration-200 focus-ring"
        >
          <Search className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm tracking-wide">Search</span>
        </Link>
      </div>
    </aside>
  );
};

export default DesktopNav;
