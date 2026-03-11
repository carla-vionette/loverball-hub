import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchVideoById, fetchRelatedVideos } from '@/services/videoService';
import { getUserTier, canAccessTier } from '@/services/subscriptionService';
import { useAuth } from '@/hooks/useAuth';
import GatedContent from '@/components/GatedContent';
import type { VideoItem, SubscriptionPlan } from '@/types';

const VideoPlayerPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [video, setVideo] = useState<VideoItem | null>(null);
  const [related, setRelated] = useState<VideoItem[]>([]);
  const [userTier, setUserTier] = useState<SubscriptionPlan>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetchVideoById(id),
      user ? getUserTier(user.id) : Promise.resolve('free' as SubscriptionPlan),
    ])
      .then(([vid, tier]) => {
        setVideo(vid);
        setUserTier(tier);
        if (vid) {
          fetchRelatedVideos(vid.id, vid.category).then(setRelated);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, user]);

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Skeleton className="aspect-video rounded-xl mb-4" />
          <Skeleton className="h-8 w-1/2 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </AppLayout>
    );
  }

  if (!video) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Video not found.</p>
          <Link to="/videos">
            <Button variant="outline" className="mt-4">Back to Videos</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const hasAccess = canAccessTier(userTier, video.tier);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link to="/videos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Videos
        </Link>

        {/* Video Player */}
        {hasAccess ? (
          <div className="aspect-video bg-black rounded-xl overflow-hidden mb-6">
            <video
              src={video.video_url}
              controls
              className="w-full h-full"
              poster={video.thumbnail || undefined}
              preload="metadata"
            />
          </div>
        ) : (
          <GatedContent requiredTier={video.tier || 'pro'}>
            <div className="aspect-video bg-black rounded-xl overflow-hidden mb-6">
              <video
                src={video.video_url}
                className="w-full h-full"
                poster={video.thumbnail || undefined}
              />
            </div>
          </GatedContent>
        )}

        {/* Video info */}
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">
            {video.title}
          </h1>
          <div className="flex items-center gap-2 mb-4">
            {video.category && <Badge variant="secondary">{video.category}</Badge>}
            {video.tier && (
              <Badge variant="outline" className="capitalize">{video.tier}</Badge>
            )}
            {video.duration && (
              <span className="text-sm text-muted-foreground">{video.duration}</span>
            )}
          </div>
          {video.description && (
            <p className="text-muted-foreground leading-relaxed">{video.description}</p>
          )}
        </div>

        {/* Related Videos */}
        {related.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-bold uppercase mb-4">Related Videos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((rv) => (
                <Link key={rv.id} to={`/watch/video/${rv.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                    <div className="aspect-video bg-secondary relative">
                      {rv.thumbnail ? (
                        <img src={rv.thumbnail} alt={rv.title} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                      {rv.duration && (
                        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                          {rv.duration}
                        </span>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-semibold text-sm line-clamp-2">{rv.title}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default VideoPlayerPage;
