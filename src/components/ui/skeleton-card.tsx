import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  variant?: "video" | "channel" | "event" | "member" | "product";
  className?: string;
}

/**
 * Pre-built skeleton loading cards matching each content type.
 */
const SkeletonCard = ({ variant = "video", className }: SkeletonCardProps) => {
  switch (variant) {
    case "video":
      return (
        <div className={cn("space-y-3", className)} aria-busy="true" aria-label="Loading video">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <div className="flex gap-3">
            <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </div>
      );

    case "channel":
      return (
        <div className={cn("flex items-center gap-3 p-3", className)} aria-busy="true" aria-label="Loading channel">
          <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      );

    case "event":
      return (
        <div className={cn("space-y-3", className)} aria-busy="true" aria-label="Loading event">
          <Skeleton className="aspect-[16/9] w-full rounded-lg" />
          <Skeleton className="h-5 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      );

    case "member":
      return (
        <div className={cn("flex flex-col items-center gap-3 p-4", className)} aria-busy="true" aria-label="Loading member">
          <Skeleton className="w-20 h-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      );

    case "product":
      return (
        <div className={cn("space-y-3", className)} aria-busy="true" aria-label="Loading product">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-16" />
        </div>
      );
  }
};

/** Multiple skeleton cards in a grid */
const SkeletonGrid = ({
  count = 6,
  variant = "video",
  columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
}: {
  count?: number;
  variant?: SkeletonCardProps["variant"];
  columns?: string;
}) => (
  <div className={cn("grid gap-4", columns)} aria-busy="true" role="status" aria-label="Loading content">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} variant={variant} />
    ))}
  </div>
);

export { SkeletonCard, SkeletonGrid };
