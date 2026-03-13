import { Badge } from "@/components/ui/badge";

const TAG_STYLES: Record<string, { emoji: string; className: string }> = {
  "Solo Friendly": { emoji: "👋", className: "bg-warning/15 text-warning border-warning/30" },
  "New Fans Welcome": { emoji: "⭐", className: "bg-primary/15 text-primary border-primary/30" },
  "Watch Party": { emoji: "📺", className: "bg-accent/15 text-accent border-accent/30" },
  "Traveling Fans": { emoji: "✈️", className: "bg-primary/15 text-primary border-primary/30" },
  "21+": { emoji: "🍷", className: "bg-destructive/15 text-destructive border-destructive/30" },
  "Free Entry": { emoji: "🎟️", className: "bg-success/15 text-success border-success/30" },
};

interface Props {
  tags: string[];
  size?: "sm" | "default";
  onTagClick?: (tag: string) => void;
}

const EventTagBadges = ({ tags, size = "default", onTagClick }: Props) => {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => {
        const style = TAG_STYLES[tag] || { emoji: "🏷️", className: "bg-muted text-muted-foreground border-border" };
        return (
          <Badge
            key={tag}
            variant="outline"
            className={`${style.className} ${size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5"} cursor-pointer hover:opacity-80 transition-opacity`}
            onClick={() => onTagClick?.(tag)}
          >
            {style.emoji} {tag}
          </Badge>
        );
      })}
    </div>
  );
};

export const ALL_EVENT_TAGS = [
  "Solo Friendly",
  "New Fans Welcome",
  "Watch Party",
  "Traveling Fans",
  "21+",
  "Free Entry",
];

export default EventTagBadges;
