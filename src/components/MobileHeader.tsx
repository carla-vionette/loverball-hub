import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/cartStore";
import NotificationBell from "@/components/NotificationBell";
import loverballLogo from "@/assets/loverball-new-l-logo.png";

const MobileHeader = () => {
  const navigate = useNavigate();
  const items = useCartStore(state => state.items);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header
      className="md:hidden fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md z-40 px-4 py-3"
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
          className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-card/80 border border-border/20 text-foreground/40 text-sm tracking-wide rounded-full hover:bg-card transition-colors focus-ring tap-target"
          aria-label="Open search"
        >
          <Search className="w-4 h-4" aria-hidden="true" />
          <span>Search...</span>
        </button>
        
        <NotificationBell />
        
        <button
          onClick={() => navigate('/shop')}
          className="relative p-2.5 hover:bg-card/80 rounded-full transition-colors focus-ring tap-target"
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
