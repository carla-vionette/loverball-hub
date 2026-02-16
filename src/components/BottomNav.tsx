import { Home, Users, MessageCircle, User, CalendarDays, ShoppingBag, Play } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { Skeleton } from "@/components/ui/skeleton";

const BottomNav = () => {
  const location = useLocation();
  const { isMember, loading } = useAuth();
  const { hasUnread } = useUnreadMessages();
  
  // Show skeleton while loading
  if (loading) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 z-50 md:hidden">
        <div className="flex justify-around items-center h-16">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center justify-center flex-1 h-full gap-1">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="w-8 h-2 rounded" />
            </div>
          ))}
        </div>
      </nav>
    );
  }
  
  // Build nav items - member-only items show once auth is loaded
  const navItems = [
    { icon: Home, label: "Home", path: "/profile" },
    { icon: CalendarDays, label: "Events", path: "/events" },
    { icon: Play, label: "Watch", path: "/watch" },
    { icon: ShoppingBag, label: "Shop", path: "/shop" },
    ...(isMember ? [
      { icon: Users, label: "Members", path: "/members" },
    ] : []),
    ...(isMember ? [
      { icon: MessageCircle, label: "Chat", path: "/messages", showBadge: true },
    ] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 z-50 md:hidden safe-area-pb">
      <div className="flex justify-around items-center h-16 animate-fade-in">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const showBadge = 'showBadge' in item && item.showBadge && hasUnread;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors rounded-lg mx-1 ${
                isActive ? "bg-primary/10" : ""
              }`}
            >
              <div className="relative">
                <Icon 
                  className={`w-5 h-5 ${isActive ? "text-primary" : "text-foreground/50"}`}
                  fill={isActive ? "currentColor" : "none"}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
                )}
              </div>
              <span className={`text-[10px] tracking-wider mt-1 ${isActive ? "text-primary font-medium" : "text-foreground/50"}`}>
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
