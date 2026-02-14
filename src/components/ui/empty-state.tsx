import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Reusable empty state with icon, title, description, and optional CTA.
 * Accessible and responsive.
 */
const EmptyState = ({ icon: Icon, title, description, action, className }: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center py-16 px-6 text-center gap-4",
      className
    )}
    role="status"
    aria-label={title}
  >
    {Icon && (
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <Icon className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
      </div>
    )}
    <h3 className="text-lg font-semibold text-foreground font-sans">{title}</h3>
    {description && (
      <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
    )}
    {action && (
      <Button onClick={action.onClick} size="sm" aria-label={action.label}>
        {action.label}
      </Button>
    )}
  </div>
);

export { EmptyState };
