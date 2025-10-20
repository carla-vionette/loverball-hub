import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, User, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import loverballLogo from "@/assets/loverball-logo.png";

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/community", icon: Calendar, label: "Community" },
    { path: "/profile", icon: User, label: "Profile" },
    { path: "/messages", icon: MessageCircle, label: "Messages" },
  ];

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <img src={loverballLogo} alt="Loverball" className="h-16 object-contain" />
          </Link>
          
          <div className="flex gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
