import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, MessageCircle } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import loverballLogo from "@/assets/loverball-new-l-logo.png";

const MobileHeader = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const hideGlobalSearch = pathname.startsWith('/members') || pathname.startsWith('/profile');
  const isClub = pathname.startsWith('/club');
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
      className="md:hidden fixed top-0 left-0 right-0 z-40 px-4 py-3"
      role="banner"
      style={{ background: "#FFFFFF", borderBottom: "1px solid #E8E3DC" }}
    >
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center flex-shrink-0 focus-ring rounded-lg" aria-label="Loverball home">
          <img
            src={loverballLogo}
            alt="Loverball logo"
            className="h-12 w-auto object-contain" loading="lazy" decoding="async" />
        </Link>

        {hideGlobalSearch ? (
          <div className="flex-1" />
        ) : (
          <button
            onClick={() => navigate(isClub ? '/friends' : '/search')}
            className="flex-1 flex items-center gap-2 px-4 py-2.5 text-sm rounded-full transition-all duration-300 focus-ring tap-target"
            style={{ background: "#FFFFFF", border: "1px solid #E8E3DC", color: "#6B6B6B" }}
            aria-label={isClub ? 'Search friends' : 'Open search'}
          >
            <Search className="w-4 h-4" aria-hidden="true" />
            <span>{isClub ? 'Search friends...' : 'Search...'}</span>
          </button>
        )}

        <button
          onClick={() => navigate('/messages')}
          className="relative p-2.5 rounded-full transition-all duration-300 focus-ring tap-target hover:bg-[#F5F1EA]"
          aria-label="Messages"
        >
          <MessageCircle className="w-5 h-5" style={{ color: "#1A1A1A" }} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};

export default MobileHeader;
