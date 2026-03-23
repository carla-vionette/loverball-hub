import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface HorizontalShelfProps {
  title: string;
  emoji?: string;
  children: ReactNode;
  onViewAll?: () => void;
}

const HorizontalShelf = ({ title, emoji, children, onViewAll }: HorizontalShelfProps) => (
  <div className="space-y-2.5">
    <div className="flex items-center justify-between px-1">
      <h3 className="text-sm font-medium tracking-wider uppercase text-foreground/50 flex items-center gap-1.5">
        {emoji && <span>{emoji}</span>}
        {title}
      </h3>
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="text-xs text-primary flex items-center gap-0.5 hover:underline"
        >
          See all <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
      {children}
    </div>
  </div>
);

export default HorizontalShelf;
