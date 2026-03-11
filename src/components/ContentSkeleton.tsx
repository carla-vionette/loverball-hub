import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface ContentSkeletonProps {
  type?: 'cards' | 'list' | 'detail';
  count?: number;
}

const ContentSkeleton = ({ type = 'cards', count = 6 }: ContentSkeletonProps) => {
  if (type === 'detail') {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="aspect-video w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-video w-full" />
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ContentSkeleton;
