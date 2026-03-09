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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0A0A0A] border-t border-white/10"
      role="navigation"
      aria-label="Video navigation"
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              className="flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 tap-target focus-ring"
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? "text-primary" : "text-white/40"
                }`}
                fill={isActive ? "currentColor" : "none"}
                aria-hidden="true"
              />
              <span
                className={`text-[10px] mt-1 font-medium ${
                  isActive ? "text-primary" : "text-white/40"
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
