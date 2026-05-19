interface StatCardProps {
  value: string;
  label: string;
  accent?: "lime" | "pink" | "orange" | "white";
  className?: string;
}

const ACCENT: Record<NonNullable<StatCardProps["accent"]>, string> = {
  lime: "text-lime",
  pink: "text-pink",
  orange: "text-lb-orange",
  white: "text-white",
};

export function StatCard({ value, label, accent = "lime", className = "" }: StatCardProps) {
  return (
    <div className={`rounded-2xl border border-lb-border bg-lb-bg-secondary p-5 md:p-6 ${className}`}>
      <div className={`font-display text-4xl md:text-5xl leading-[0.95] ${ACCENT[accent]}`}>{value}</div>
      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-lb-muted font-condensed">{label}</div>
    </div>
  );
}

export default StatCard;
