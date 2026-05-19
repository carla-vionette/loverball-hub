interface StatsMarqueeProps {
  items: string[];
  color?: "lime" | "pink" | "orange";
  speedSec?: number;
  className?: string;
}

const BG: Record<NonNullable<StatsMarqueeProps["color"]>, string> = {
  lime: "bg-lime text-black",
  pink: "bg-pink text-white",
  orange: "bg-lb-orange text-white",
};

export function StatsMarquee({ items, color = "lime", speedSec = 40, className = "" }: StatsMarqueeProps) {
  const doubled = [...items, ...items];
  return (
    <div className={`relative overflow-hidden border-y border-lb-border ${BG[color]} ${className}`}>
      <div
        className="flex w-max items-center gap-12 whitespace-nowrap py-4"
        style={{ animation: `lb-marquee ${speedSec}s linear infinite` }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="font-condensed uppercase tracking-[0.18em] text-sm md:text-base">
            {item}
            <span className="mx-6 inline-block opacity-60">★</span>
          </span>
        ))}
      </div>
      <style>{`
        @keyframes lb-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

export default StatsMarquee;
