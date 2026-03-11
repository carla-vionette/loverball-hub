import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/cartStore";
import loverballLogo from "@/assets/loverball-new-l-logo.png";

const MobileHeader = () => {
  const navigate = useNavigate();
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    try {
      const items = useCartStore.getState().items;
      setTotalItems(items.reduce((sum, item) => sum + item.quantity, 0));
    } catch {
      setTotalItems(0);
    }
    const unsub = useCartStore.subscribe((state) => {
      setTotalItems(state.items.reduce((sum, item) => sum + item.quantity, 0));
    });
    return unsub;
  }, []);

  return (
    <header
      className="md:hidden fixed top-0 left-0 right-0 bg-background border-b border-border/20 z-40 px-4 py-3"
      role="banner"
    >
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center flex-shrink-0 focus-ring rounded-lg" aria-label="Loverball home">
          <img
            src={loverballLogo}
            alt="Loverball logo"
            className="h-12 w-auto object-contain"
          />
        </Link>

        <button
          onClick={() => navigate('/search')}
          className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-secondary border border-border/20 text-muted-foreground text-sm rounded-full hover:bg-muted transition-colors focus-ring tap-target"
          aria-label="Open search"
        >
          <Search className="w-4 h-4" aria-hidden="true" />
          <span>Search...</span>
        </button>

        <button
          onClick={() => navigate('/settings')}
          className="relative p-2.5 hover:bg-secondary rounded-full transition-colors focus-ring tap-target"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" aria-hidden="true" />
        </button>

        <button
          onClick={() => navigate('/shop')}
          className="relative p-2.5 hover:bg-secondary rounded-full transition-colors focus-ring tap-target"
          aria-label={`Shopping cart${totalItems > 0 ? `, ${totalItems} items` : ''}`}
        >
          <ShoppingCart className="w-5 h-5" aria-hidden="true" />
          {totalItems > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-accent text-accent-foreground" aria-hidden="true">
              {totalItems}
            </Badge>
          )}
        </button>
      </div>
    </header>
  );
};

export default MobileHeader;
