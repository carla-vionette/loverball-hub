import React from "react";
import { Search, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import NotificationBell from "@/components/NotificationBell";
import loverballLogo from "@/assets/loverball-new-l-logo.png";

const goTo = (path: string) => { window.location.href = path; };

const MobileHeader = () => {
  let totalItems = 0;
  try {
    const { useCartStore } = require("@/stores/cartStore");
    const items = useCartStore.getState().items;
    totalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  } catch {
    totalItems = 0;
  }

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
            className="h-10 w-auto object-contain"
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
        
        <NotificationBell />
        
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
