import { cn } from "@/lib/utils";

interface FeedFilterChipsProps {
  filters: string[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const FeedFilterChips = ({ filters, activeFilter, onFilterChange }: FeedFilterChipsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          className={cn(
            "shrink-0 px-4 py-1.5 rounded-full text-sm font-body font-medium transition-colors",
            activeFilter === filter
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {filter}
        </button>
      ))}
    </div>
  );
};

export default FeedFilterChips;
