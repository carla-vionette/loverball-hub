import { ReactNode } from "react";

type MarkerColor = "lime" | "pink" | "orange";

const COLOR_MAP: Record<MarkerColor, string> = {
  lime: "#E6F25A",
  pink: "#E86BB0",
  orange: "#F04E23",
};

interface MarkerProps {
  children: ReactNode;
  color?: MarkerColor;
  className?: string;
}

/** Highlighter marker — paints a colored bar behind the text. */
export function Marker({ children, color = "lime", className = "" }: MarkerProps) {
  const bg = COLOR_MAP[color];
  return (
    <span
      className={`relative inline-block ${className}`}
      style={{
        backgroundImage: `linear-gradient(transparent 55%, ${bg} 55%, ${bg} 92%, transparent 92%)`,
        backgroundRepeat: "no-repeat",
        color: color === "lime" ? "#0a0a0a" : "#ffffff",
        padding: "0 .12em",
      }}
    >
      {children}
    </span>
  );
}

export default Marker;
