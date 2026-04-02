import { Link } from "react-router-dom";
import GlobalSearch from "@/components/GlobalSearch";
import loverballLogo from "@/assets/loverball-script-logo.png";

const DesktopTopBar = () => {
  return (
    <header
      className="hidden md:flex sticky top-0 z-[1000] items-center justify-between px-8 h-20 bg-[rgba(247,246,242,0.92)] backdrop-blur-[10px] border-b border-[rgba(40,37,29,0.08)]"
      role="banner"
      aria-label="Desktop top bar"
    >
      <Link to="/" className="flex items-center focus-ring rounded-lg" aria-label="Loverball home">
        <img
          src={loverballLogo}
          alt="Loverball logo"
          className="w-[120px] h-auto object-contain brightness-0 invert"
        />
      </Link>
      <div className="w-72">
        <GlobalSearch />
      </div>
    </header>
  );
};

export default DesktopTopBar;
