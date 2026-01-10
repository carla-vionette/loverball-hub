import { Home, Users, MessageCircle, User, CalendarDays, ShoppingBag, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const BottomNav = () => {
  const location = useLocation();
  const { isMember } = useAuth();
  
  const navItems = [
    { icon: Home, label: "Home", path: "/following" },
    { icon: CalendarDays, label: "Events", path: "/events" },
    { icon: ShoppingBag, label: "Shop", path: "/shop" },
    ...(isMember ? [
      { icon: Heart, label: "Network", path: "/network" },
      { icon: MessageCircle, label: "Chat", path: "/messages" },
    ] : []),
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full"
            >
              <Icon 
                className={`w-6 h-6 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                fill={isActive ? "currentColor" : "none"}
              />
              <span className={`text-xs mt-1 ${isActive ? "text-primary font-semibold" : "text-muted-foreground"}`}>
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
