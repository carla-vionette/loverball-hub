import { Link } from "react-router-dom";
import loverballLogo from "@/assets/loverball-logo.png";

const MobileHeader = () => {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 bg-background border-b border-border z-40 h-16 flex items-center justify-center">
      <Link to="/" className="flex items-center">
        <img 
          src={loverballLogo} 
          alt="Loverball" 
          className="h-14 w-auto object-contain mix-blend-multiply dark:mix-blend-normal" 
        />
      </Link>
    </header>
  );
};

export default MobileHeader;
