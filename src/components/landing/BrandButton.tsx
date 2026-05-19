import { ReactNode, forwardRef, ButtonHTMLAttributes } from "react";
import { Link } from "react-router-dom";

type Variant = "primary" | "ghost" | "lime" | "pink";

interface CommonProps {
  children: ReactNode;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  className?: string;
  fullWidth?: boolean;
}

const VARIANT_CLS: Record<Variant, string> = {
  primary:
    "bg-lb-orange text-white hover:brightness-110 active:brightness-95 border border-transparent",
  ghost:
    "bg-transparent text-white border border-lb-border hover:bg-white/5",
  lime: "bg-lime text-black hover:brightness-105 border border-transparent",
  pink: "bg-pink text-white hover:brightness-110 border border-transparent",
};

const SIZE_CLS = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-sm md:text-base",
};

function base(variant: Variant, size: "sm" | "md" | "lg", full: boolean, extra: string) {
  return [
    "inline-flex items-center justify-center gap-2",
    "font-condensed uppercase tracking-[0.18em] font-semibold",
    "rounded-full transition select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/70 focus-visible:ring-offset-2 focus-visible:ring-offset-lb-bg",
    SIZE_CLS[size],
    VARIANT_CLS[variant],
    full ? "w-full" : "",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

interface AnchorButtonProps extends CommonProps {
  to: string;
  href?: never;
  onClick?: never;
  type?: never;
}

interface LinkOutProps extends CommonProps {
  href: string;
  to?: never;
  onClick?: never;
  type?: never;
}

interface NativeButtonProps
  extends CommonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps | "ref"> {
  to?: never;
  href?: never;
}

type BrandButtonProps = AnchorButtonProps | LinkOutProps | NativeButtonProps;

export const BrandButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, BrandButtonProps>(
  function BrandButton(props, ref) {
    const { children, variant = "primary", size = "md", className = "", fullWidth = false } = props;
    const cls = base(variant, size, fullWidth, className);

    if ("to" in props && props.to) {
      return (
        <Link to={props.to} className={cls}>
          {children}
        </Link>
      );
    }
    if ("href" in props && props.href) {
      return (
        <a href={props.href} className={cls}>
          {children}
        </a>
      );
    }
    const { onClick, type = "button", ...rest } = props as NativeButtonProps;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        onClick={onClick}
        className={cls}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

export default BrandButton;
