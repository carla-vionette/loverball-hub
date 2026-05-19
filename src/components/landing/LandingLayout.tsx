import { ReactNode } from "react";
import LandingNav from "./LandingNav";
import LandingFooter from "./LandingFooter";

interface LandingLayoutProps {
  children: ReactNode;
}

export function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="min-h-screen bg-lb-bg text-white font-body antialiased">
      <LandingNav />
      <main id="main-content">{children}</main>
      <LandingFooter />
    </div>
  );
}

export default LandingLayout;
