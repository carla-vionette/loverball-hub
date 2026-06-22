// Editorial palette + fonts shared by the marketing homepage sections.
// Mirrors the Deep Navy / Cream / Coral system already used on /.
export const C = {
  ink: "#0D0D0D",
  inkSoft: "#1A1A1A",
  inkRule: "rgba(245,240,232,0.14)",
  inkMuted: "#A8A29A",
  cream: "#F5F0E8",
  creamHi: "#FBF7EF",
  creamMuted: "#6B6B6B",
  rule: "rgba(13,13,13,0.12)",
  accent: "#E85D26",
};

export const fonts = {
  serif: "'Playfair Display', 'Tiempos Headline', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
  mono: "'Space Mono', ui-monospace, monospace",
  display: "'Anton', Impact, sans-serif",
};

export const Mono = ({
  children,
  color,
  size = 11,
}: {
  children: React.ReactNode;
  color?: string;
  size?: number;
}) => (
  <span
    style={{
      fontFamily: fonts.mono,
      fontSize: size,
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      color: color ?? C.creamMuted,
      fontWeight: 500,
    }}
  >
    {children}
  </span>
);
