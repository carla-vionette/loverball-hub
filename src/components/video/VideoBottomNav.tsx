import { Home, Compass, Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { icon: Home, label: "For You", path: "/watch" },
  { icon: Compass, label: "Discover", path: "/watch/discover" },
  { icon: Search, label: "Search", path: "/watch/search" },
];

const VideoBottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border/30 z-50 md:hidden safe-area-pb">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isUpload = item.label === "Upload";

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full transition-colors"
            >
              {isUpload ? (
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center -mt-3 shadow-lg shadow-primary/30">
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </div>
              ) : (
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                  fill={isActive ? "currentColor" : "none"}
                />
              )}
              <span
                className={`text-[10px] mt-1 ${
                  isActive ? "text-foreground font-medium" : "text-muted-foreground"
                } ${isUpload ? "mt-0.5" : ""}`}
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
