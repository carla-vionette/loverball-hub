import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import loverballLogo from "@/assets/loverball-logo-new.png";

const MobileHeader = () => {
  const navigate = useNavigate();

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
      </div>
    </header>
  );
};

export default MobileHeader;
