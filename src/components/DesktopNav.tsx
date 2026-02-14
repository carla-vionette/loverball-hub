import { Home, Compass, MessageCircle, User, Search, Users, CalendarDays, Settings, ShoppingBag, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import loverbballLogo from "@/assets/loverball-logo-new.png";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

const DesktopNav = () => {
  const location = useLocation();
  const { isMember, isAdmin } = useAuth();
  const { hasUnread } = useUnreadMessages();
  
  const navItems = [
    { icon: Home, label: "For You", path: "/profile" },
    ...(isMember ? [
      { icon: Heart, label: "Network", path: "/network" },
    ] : []),
    { icon: CalendarDays, label: "Events", path: "/events" },
    { icon: ShoppingBag, label: "Shop", path: "/shop" },
    ...(isMember ? [
      { icon: Users, label: "Matches", path: "/members" },
      { icon: MessageCircle, label: "Messages", path: "/messages", showBadge: true },
    ] : []),
    { icon: User, label: "Profile", path: "/profile" },
    ...(isAdmin ? [
      { icon: Settings, label: "Admin", path: "/admin" },
    ] : []),
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-background border-r border-border/50 flex-col z-50">
      <div className="p-6 border-b border-border/50 flex items-center justify-center">
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
              className={`flex items-center gap-4 px-6 py-3.5 mx-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? "text-primary font-medium bg-primary/10" 
                  : "text-foreground/60 hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
                )}
              </div>
              <span className="text-sm tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <Link
          to="/search"
          className="flex items-center gap-4 px-6 py-3 mx-3 rounded-xl text-foreground/50 hover:text-foreground hover:bg-secondary/50 transition-all duration-200"
        >
          <Search className="w-5 h-5" />
          <span className="text-sm tracking-wide">Search</span>
        </Link>
      </div>
    </aside>
  );
};

export default DesktopNav;
