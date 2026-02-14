import { Home, Compass, Search, User, Tv, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import loverbballLogo from "@/assets/loverball-logo-new.png";

const navItems = [
  { icon: Home, label: "For You", path: "/watch" },
  { icon: Compass, label: "Discover", path: "/watch/discover" },
  { icon: Search, label: "Search", path: "/watch/search" },
  { icon: User, label: "Profile", path: "/watch/profile" },
];

const VideoSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-60 bg-background border-r border-border/30 flex-col z-50">
      {/* Logo */}
      <div className="p-5 border-b border-border/30 flex items-center gap-3">
        <Tv className="w-6 h-6 text-primary" />
        <span className="text-lg font-bold tracking-tight text-foreground">
          LB <span className="text-primary">Watch</span>
        </span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-6 py-3 mx-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "text-foreground font-medium bg-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Back to main app */}
      <div className="p-4 border-t border-border/30">
        <Link
          to="/profile"
          className="flex items-center gap-3 px-6 py-3 mx-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back to App</span>
        </Link>
      </div>
    </aside>
  );
};

export default VideoSidebar;
