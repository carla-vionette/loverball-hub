import { ReactNode, ElementType, CSSProperties } from "react";

interface DisplayHeadingProps {
  children: ReactNode;
  as?: ElementType;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  style?: CSSProperties;
}

const SIZE_CLS = {
  sm: "text-3xl md:text-4xl",
  md: "text-4xl md:text-5xl",
  lg: "text-5xl md:text-6xl lg:text-7xl",
  xl: "text-6xl md:text-7xl lg:text-8xl",
};

/** Editorial display heading: uppercase, tight tracking, line-height 0.95. */
export function DisplayHeading({
  children,
  as: Tag = "h1",
  size = "lg",
  className = "",
  style,
}: DisplayHeadingProps) {
  return (
    <Tag
      className={`font-display uppercase ${SIZE_CLS[size]} ${className}`}
      style={{
        lineHeight: 0.95,
        letterSpacing: "-0.02em",
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

export default DisplayHeading;
