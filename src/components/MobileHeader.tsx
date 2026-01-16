import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/cartStore";
import loverballLogo from "@/assets/loverball-logo-new.png";

const MobileHeader = () => {
  const navigate = useNavigate();
  const items = useCartStore(state => state.items);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-border/50 z-40 px-4 py-3">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center flex-shrink-0">
          <img 
            src={loverballLogo} 
            alt="Loverball" 
            className="h-14 w-auto object-contain"
          />
        </Link>
        
        <button
          onClick={() => navigate('/search')}
          className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-secondary/50 border border-border/50 text-foreground/60 text-sm tracking-wide rounded-full hover:bg-secondary transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>Search...</span>
        </button>
        
        <button
          onClick={() => navigate('/shop')}
          className="relative p-2 hover:bg-secondary/50 rounded-full transition-colors"
        >
          <ShoppingCart className="w-5 h-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
              {totalItems}
            </Badge>
          )}
        </button>
      </div>
    </header>
  );
};

export default MobileHeader;
