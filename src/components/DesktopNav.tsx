import { User, Search, CalendarDays, Settings, ShoppingBag, Play } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import loverbballLogo from "@/assets/loverball-script-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

const DesktopNav = () => {
  const location = useLocation();
  const { isMember, isAdmin } = useAuth();
  const { hasUnread } = useUnreadMessages();
  
  const navItems = [
    { icon: Play, label: "For You", path: "/watch" },
    { icon: CalendarDays, label: "Events", path: "/events" },
    { icon: ShoppingBag, label: "Shop", path: "/shop" },
    { icon: User, label: "Profile", path: "/profile" },
    ...(isAdmin ? [
      { icon: Settings, label: "Admin", path: "/admin" },
    ] : []),
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-card/60 backdrop-blur-sm border-r border-border/20 flex-col z-50">
      <div className="p-6 border-b border-border/20 flex items-center justify-center">
        <img src={loverbballLogo} alt="Loverball" className="h-20 w-auto object-contain" />
      </div>
      
      <nav className="flex-1 py-6 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const showBadge = 'showBadge' in item && item.showBadge && hasUnread;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-6 py-3.5 mx-3 rounded-2xl transition-all duration-200 ${
                isActive 
                  ? "text-accent-foreground font-semibold bg-accent" 
                  : "text-foreground/50 hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-card" />
                )}
              </div>
              <span className="text-sm tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/20">
        <Link
          to="/search"
          className="flex items-center gap-4 px-6 py-3 mx-3 rounded-2xl text-foreground/40 hover:text-foreground hover:bg-secondary/50 transition-all duration-200"
        >
          <Search className="w-5 h-5" />
          <span className="text-sm tracking-wide">Search</span>
        </Link>
      </div>
    </aside>
  );
};

export default DesktopNav;
