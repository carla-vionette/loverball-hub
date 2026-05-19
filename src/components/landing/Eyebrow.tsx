import { ReactNode } from "react";

interface EyebrowProps {
  children: ReactNode;
  color?: "lime" | "pink" | "orange" | "muted";
  className?: string;
}

const COLOR_CLS: Record<NonNullable<EyebrowProps["color"]>, string> = {
  lime: "text-lime",
  pink: "text-pink",
  orange: "text-lb-orange",
  muted: "text-lb-muted",
};

export function Eyebrow({ children, color = "lime", className = "" }: EyebrowProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-condensed uppercase tracking-[0.2em] text-xs md:text-sm ${COLOR_CLS[color]} ${className}`}
    >
      <span className="inline-block h-px w-6 bg-current opacity-60" />
      {children}
    </span>
  );
}

export default Eyebrow;
