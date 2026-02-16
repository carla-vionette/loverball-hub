import { Home, Compass, Search, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import scriptLogo from "@/assets/loverball-script-logo.png";

const navItems = [
  { icon: Home, label: "For You", path: "/watch" },
  { icon: Compass, label: "Discover", path: "/watch/discover" },
  { icon: Search, label: "Search", path: "/watch/search" },
];

const VideoSidebar = () => {
  const location = useLocation();

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 h-screen w-60 bg-card/60 backdrop-blur-sm border-r border-border/20 flex-col z-50"
      role="navigation"
      aria-label="Video navigation"
    >
      {/* Logo */}
      <div className="p-5 border-b border-border/20 flex items-center gap-3">
        <Link to="/" className="focus-ring rounded-lg" aria-label="Loverball home">
          <img src={scriptLogo} alt="Loverball logo" className="h-12" />
        </Link>
        <span className="text-sm font-medium text-foreground/50" aria-hidden="true">Watch</span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-6 space-y-1" aria-label="Watch sections">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-4 px-6 py-3 mx-3 rounded-2xl transition-all duration-200 focus-ring ${
                isActive
                  ? "text-accent-foreground font-semibold bg-accent"
                  : "text-foreground/50 hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Back to main app */}
      <div className="p-4 border-t border-border/20">
        <Link
          to="/profile"
          aria-label="Back to main app"
          className="flex items-center gap-3 px-6 py-3 mx-0 rounded-2xl text-foreground/40 hover:text-foreground hover:bg-secondary/50 transition-all duration-200 focus-ring"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm">Back to App</span>
        </Link>
      </div>
    </aside>
  );
};

export default VideoSidebar;
