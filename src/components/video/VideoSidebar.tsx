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
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-60 bg-card/60 backdrop-blur-sm border-r border-border/20 flex-col z-50">
      {/* Logo */}
      <div className="p-5 border-b border-border/20 flex items-center gap-3">
        <img src={scriptLogo} alt="Loverball" className="h-12" />
        <span className="text-sm font-medium text-foreground/50">Watch</span>
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
              className={`flex items-center gap-4 px-6 py-3 mx-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? "text-accent-foreground font-semibold bg-accent"
                  : "text-foreground/50 hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Back to main app */}
      <div className="p-4 border-t border-border/20">
        <Link
          to="/profile"
          className="flex items-center gap-3 px-6 py-3 mx-0 rounded-2xl text-foreground/40 hover:text-foreground hover:bg-secondary/50 transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back to App</span>
        </Link>
      </div>
    </aside>
  );
};

export default VideoSidebar;
