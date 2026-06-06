export type SportsFilter = "all" | "pro" | "college" | "womens" | "week";

const OPTIONS: { k: SportsFilter; label: string }[] = [
  { k: "all",     label: "All" },
  { k: "pro",     label: "Pro" },
  { k: "college", label: "College" },
  { k: "womens",  label: "Women's" },
  { k: "week",    label: "This Week" },
];

const SportsFilterBar = ({
  value,
  onChange,
}: {
  value: SportsFilter;
  onChange: (v: SportsFilter) => void;
}) => {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 -mx-5 px-5 mb-4">
      {OPTIONS.map((o) => {
        const active = value === o.k;
        return (
          <button
            key={o.k}
            type="button"
            onClick={() => onChange(o.k)}
            className="px-4 py-2 rounded-full whitespace-nowrap transition-all"
            style={{
              background: active ? "#E85D2F" : "rgba(20,20,21,0.6)",
              color: active ? "#FFFFFF" : "rgba(248,248,248,0.7)",
              border: active ? "1px solid #E85D2F" : "1px solid rgba(255,255,255,0.08)",
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
};

export default SportsFilterBar;
