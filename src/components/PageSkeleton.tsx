import { Skeleton } from "@/components/ui/skeleton";

interface PageSkeletonProps {
  variant?: "cards" | "list" | "profile" | "feed";
  count?: number;
}

/**
 * Reusable page-level skeleton loader. 
 * Use instead of a single spinner for better perceived performance.
 */
const PageSkeleton = ({ variant = "cards", count = 6 }: PageSkeletonProps) => {
  if (variant === "profile") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="flex items-start gap-4">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-60" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-3 px-4 py-4 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="w-11 h-11 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "feed") {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center animate-pulse">
        <div className="w-full max-w-md space-y-4 px-4">
          <Skeleton className="aspect-[9/16] rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  // cards (default)
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 py-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square rounded-2xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
};

export default PageSkeleton;
