import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, User, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import loverballLogo from "@/assets/loverball-script-logo.png";

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/community", icon: Calendar, label: "Community" },
    { path: "/profile", icon: User, label: "Profile" },
    { path: "/messages", icon: MessageCircle, label: "Messages" },
  ];

  return (
    <nav className="bg-card border-b border-border/50 sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <img src={loverballLogo} alt="Loverball" className="h-16 object-contain" />
          </Link>
          
          <div className="flex gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 text-sm font-bold tracking-wider uppercase",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground/70 hover:bg-primary/5 hover:text-primary"
                  )}
                >
                  <Icon className="w-4 h-4" />
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
