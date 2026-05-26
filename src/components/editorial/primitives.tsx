import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { C, fonts } from "@/lib/editorialTheme";

/* ────────────────────────────────────────────────────────────
   Loverball Editorial Primitives
   Single source of truth for the dark marketing system.
   ──────────────────────────────────────────────────────────── */

/* ===== Headings ===== */

export const H1 = ({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <h1
    className={className}
    style={{
      fontFamily: "'Anton', Impact, sans-serif",
      fontWeight: 400,
      fontSize: "clamp(48px, 8vw, 112px)",
      lineHeight: 0.92,
      letterSpacing: "-0.02em",
      color: C.text,
      textTransform: "uppercase",
      ...style,
    }}
  >
    {children}
  </h1>
);

export const H2 = ({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <h2
    className={className}
    style={{
      fontFamily: fonts.serif,
      fontStyle: "italic",
      fontWeight: 500,
      fontSize: "clamp(36px, 5vw, 64px)",
      lineHeight: 1.0,
      letterSpacing: "-0.02em",
      color: C.text,
      ...style,
    }}
  >
    {children}
  </h2>
);

/* Intermediate heading — used for card titles, subheads, H3 content.
   Slightly heavier serif, no italic, tighter line-height so it bridges
   the display style and the body copy. */
export const H3 = ({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <h3
    className={className}
    style={{
      fontFamily: fonts.serif,
      fontStyle: "italic",
      fontWeight: 500,
      fontSize: 26,
      lineHeight: 1.15,
      letterSpacing: "-0.015em",
      color: C.text,
      ...style,
    }}
  >
    {children}
  </h3>
);

/* ===== Body / utility text ===== */

export const Body = ({ children, className = "", muted = false, size = 16, style }: { children: React.ReactNode; className?: string; muted?: boolean; size?: number; style?: React.CSSProperties }) => (
  <p
    className={className}
    style={{
      fontFamily: fonts.sans,
      fontSize: size,
      lineHeight: 1.65,
      color: muted ? C.muted : C.text,
      fontWeight: 400,
      ...style,
    }}
  >
    {children}
  </p>
);

export const Slug = ({ children, color = C.raspberry }: { children: React.ReactNode; color?: string }) => (
  <span style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color }}>{children}</span>
);

export const Mono = ({ children, color = C.muted, size = 11 }: { children: React.ReactNode; color?: string; size?: number }) => (
  <span style={{ fontFamily: fonts.mono, fontSize: size, letterSpacing: "0.14em", textTransform: "uppercase", color }}>{children}</span>
);

/* ===== Buttons — three variants, only three ===== */

const BTN_BASE: React.CSSProperties = {
  fontFamily: fonts.mono,
  fontSize: 12,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  fontWeight: 500,
  borderRadius: 999,
  padding: "16px 26px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  transition: "all 180ms ease",
  cursor: "pointer",
};

type BtnProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  to?: string;
  href?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
};

const renderBtn = (inner: React.ReactNode, props: BtnProps, style: React.CSSProperties, hoverClass: string) => {
  if (props.to) return <Link to={props.to} style={style} className={hoverClass}>{inner}</Link>;
  if (props.href) return <a href={props.href} target="_blank" rel="noopener noreferrer" style={style} className={hoverClass}>{inner}</a>;
  return (
    <button type={props.type ?? "button"} onClick={props.onClick} disabled={props.disabled} style={{ ...style, opacity: props.disabled ? 0.5 : 1 }} className={hoverClass}>
      {inner}
    </button>
  );
};

export const PrimaryBtn = (props: BtnProps) => renderBtn(
  props.children,
  props,
  { ...BTN_BASE, background: C.raspberry, color: "#fff", border: "none", boxShadow: "0 8px 24px -10px rgba(212,83,126,0.55)", ...props.style },
  `hover:opacity-95 hover:-translate-y-0.5 active:scale-[0.98] ${props.className ?? ""}`
);

export const SecondaryBtn = (props: BtnProps) => renderBtn(
  props.children,
  props,
  { ...BTN_BASE, background: "transparent", color: C.text, border: `1px solid ${C.borderStrong}`, padding: "15px 25px", ...props.style },
  `hover:bg-white/5 active:scale-[0.98] ${props.className ?? ""}`
);

export const TertiaryLink = ({ children, to, onClick, color = C.raspberry, className = "" }: { children: React.ReactNode; to?: string; onClick?: () => void; color?: string; className?: string }) => {
  const style: React.CSSProperties = {
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color,
    borderBottom: `1px solid ${color}`,
    paddingBottom: 2,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    transition: "opacity 160ms ease",
  };
  const inner = <>{children} <ArrowRight size={12} /></>;
  if (to) return <Link to={to} style={style} className={`hover:opacity-80 ${className}`}>{inner}</Link>;
  return <button onClick={onClick} style={style} className={`hover:opacity-80 ${className}`}>{inner}</button>;
};
