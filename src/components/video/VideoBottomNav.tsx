import { Home, Compass, Search, User, ShoppingBag, CalendarDays } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { icon: Home, label: "For You", path: "/watch" },
  { icon: Compass, label: "Discover", path: "/watch/discover" },
  { icon: Search, label: "Search", path: "/watch/search" },
  { icon: CalendarDays, label: "Events", path: "/events" },
  { icon: ShoppingBag, label: "Shop", path: "/shop" },
  { icon: User, label: "Profile", path: "/profile" },
];

const VideoBottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-pb px-3 pb-2">
      <div className="flex justify-around items-center h-16 bg-card/90 backdrop-blur-md rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-border/20">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 rounded-2xl mx-0.5 ${
                isActive ? "bg-accent text-accent-foreground" : ""
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? "text-accent-foreground" : "text-foreground/40"
                }`}
                fill={isActive ? "currentColor" : "none"}
              />
              <span
                className={`text-[10px] mt-1 ${
                  isActive ? "text-accent-foreground font-semibold" : "text-foreground/40"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default VideoBottomNav;
