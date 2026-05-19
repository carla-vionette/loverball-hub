interface LiveTickerProps {
  items: { label: string; value: string }[];
  className?: string;
}

export function LiveTicker({ items, className = "" }: LiveTickerProps) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <span className="inline-flex items-center gap-2 rounded-full bg-lb-orange/15 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-lb-orange font-condensed">
        <span className="relative inline-block h-2 w-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-lb-orange opacity-60" />
          <span className="absolute inset-0 rounded-full bg-lb-orange" />
        </span>
        Live
      </span>
      {items.map((it, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-2 rounded-full border border-lb-border bg-lb-bg-secondary px-3 py-1 text-xs text-lb-muted font-condensed uppercase tracking-[0.18em]"
        >
          <span className="text-white">{it.label}</span>
          <span className="text-lime">{it.value}</span>
        </span>
      ))}
    </div>
  );
}

export default LiveTicker;
