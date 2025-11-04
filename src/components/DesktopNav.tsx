import { Home, Compass, MapPin, MessageCircle, User, Search, Calendar, ShoppingBag } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import loverbballLogo from "@/assets/loverball-logo.png";

const DesktopNav = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: "Following", path: "/following" },
    { icon: Compass, label: "For You", path: "/" },
    { icon: Calendar, label: "Gather", path: "/gather" },
    { icon: MapPin, label: "Local", path: "/local" },
    { icon: ShoppingBag, label: "Boutique", path: "/shop" },
    { icon: MessageCircle, label: "Inbox", path: "/messages" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-background border-r border-border flex-col z-50">
      <div className="p-6 border-b border-border flex items-center justify-center">
        <img src={loverbballLogo} alt="Loverball" className="h-28 w-auto object-contain mix-blend-multiply dark:mix-blend-normal" />
      </div>
      
      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                isActive 
                  ? "text-primary font-semibold bg-primary/10" 
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-lg">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Link
          to="/search"
          className="flex items-center gap-4 px-6 py-3 text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <Search className="w-6 h-6" />
          <span>Search</span>
        </Link>
      </div>
    </aside>
  );
};

export default DesktopNav;
