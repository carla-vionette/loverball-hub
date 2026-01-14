import { Home, Compass, MessageCircle, User, Search, Users, CalendarDays, Settings, ShoppingBag, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import loverbballLogo from "@/assets/loverball-logo-new.png";
import { useAuth } from "@/hooks/useAuth";

const DesktopNav = () => {
  const location = useLocation();
  const { isMember, isAdmin } = useAuth();
  
  const navItems = [
    { icon: Home, label: "For You", path: "/following" },
    { icon: CalendarDays, label: "Events", path: "/events" },
    { icon: ShoppingBag, label: "Shop", path: "/shop" },
    ...(isMember ? [
      { icon: Heart, label: "Network", path: "/network" },
      { icon: Users, label: "Members", path: "/members" },
      { icon: MessageCircle, label: "Messages", path: "/messages" },
    ] : []),
    { icon: User, label: "Profile", path: "/profile" },
    ...(isAdmin ? [
      { icon: Settings, label: "Admin", path: "/admin" },
    ] : []),
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-background border-r border-border flex-col z-50">
      <div className="p-6 border-b border-border flex items-center justify-center">
        <img src={loverbballLogo} alt="Loverball" className="h-20 w-auto object-contain" />
      </div>
      
      <nav className="flex-1 py-6 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-6 py-3.5 transition-colors ${
                isActive 
                  ? "text-primary font-medium border-r-2 border-primary bg-pale-pink" 
                  : "text-foreground/70 hover:text-foreground hover:bg-pale-pink/50"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Link
          to="/search"
          className="flex items-center gap-4 px-6 py-3 text-foreground/60 hover:text-foreground hover:bg-pale-pink/50 transition-colors"
        >
          <Search className="w-5 h-5" />
          <span className="text-sm tracking-wide">Search</span>
        </Link>
      </div>
    </aside>
  );
};

export default DesktopNav;
