import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import loverballLogo from "@/assets/loverball-logo.png";

const MobileHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 bg-background border-b border-border z-40 px-4 py-2">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center flex-shrink-0">
          <img 
            src={loverballLogo} 
            alt="Loverball" 
            className="h-12 w-auto object-contain mix-blend-multiply dark:mix-blend-normal" 
          />
        </Link>
        
        <button
          onClick={() => navigate('/search')}
          className="flex-1 flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-muted-foreground text-sm"
        >
          <Search className="w-4 h-4" />
          <span>Search...</span>
        </button>
      </div>
    </header>
  );
};

export default MobileHeader;
