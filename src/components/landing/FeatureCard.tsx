import { ReactNode } from "react";

interface FeatureCardProps {
  icon?: ReactNode;
  title: string;
  body: string;
  accent?: "lime" | "pink" | "orange";
  className?: string;
}

const ACCENT_CLS = {
  lime: "text-lime",
  pink: "text-pink",
  orange: "text-lb-orange",
};

export function FeatureCard({ icon, title, body, accent = "lime", className = "" }: FeatureCardProps) {
  return (
    <div
      className={`group relative rounded-2xl border border-lb-border bg-lb-bg-secondary p-6 md:p-7 transition hover:border-white/20 ${className}`}
    >
      {icon && (
        <div className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-lb-bg-tertiary ${ACCENT_CLS[accent]}`}>
          {icon}
        </div>
      )}
      <h3 className="font-condensed uppercase tracking-tight text-2xl md:text-[28px] text-white leading-[0.95]">
        {title}
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-lb-muted font-body">{body}</p>
    </div>
  );
}

export default FeatureCard;
