import { Link } from "react-router-dom";
import logo from "@/assets/loverball-logo-new.png";

export function Brand({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`} aria-label="Loverball home">
      <img src={logo} alt="Loverball" className="h-8 w-auto md:h-9" />
    </Link>
  );
}

export default Brand;
