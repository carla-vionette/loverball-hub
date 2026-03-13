import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Play, Lock } from 'lucide-react';
import { fetchVideos, VIDEO_CATEGORIES } from '@/services/videoService';
import type { VideoItem, ContentTier } from '@/types';

const TIER_COLORS: Record<string, string> = {
  free: 'bg-green-500/10 text-green-600',
  pro: 'bg-primary/10 text-primary',
  premium: 'bg-accent/10 text-accent',
};

const VideoLibrary = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');

  useEffect(() => {
    fetchVideos()
      .then(setVideos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = videos;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(v => v.title.toLowerCase().includes(q) || v.description?.toLowerCase().includes(q));
    }
    if (categoryFilter) {
      result = result.filter(v => v.category === categoryFilter);
    }
    if (tierFilter) {
      result = result.filter(v => v.tier === tierFilter);
    }
    return result;
  }, [videos, search, categoryFilter, tierFilter]);

  const categories = useMemo(() => {
    const cats = new Set(videos.map(v => v.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [videos]);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black uppercase tracking-tight mb-4">Video Library</h1>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <Button
                size="sm"
                variant={categoryFilter === '' ? 'default' : 'outline'}
                onClick={() => setCategoryFilter('')}
              >
                All
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat}
                  size="sm"
                  variant={categoryFilter === cat ? 'default' : 'outline'}
                  onClick={() => setCategoryFilter(cat)}
                  className="whitespace-nowrap"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Tier filter */}
          <div className="flex gap-2 mt-3">
            {['', 'free', 'pro', 'premium'].map(tier => (
              <Button
                key={tier}
                size="sm"
                variant={tierFilter === tier ? 'default' : 'ghost'}
                onClick={() => setTierFilter(tier)}
                className="text-xs capitalize"
              >
                {tier || 'All Tiers'}
              </Button>
            ))}
          </div>
        </div>

        {/* Video Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No videos found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((video) => (
              <Link key={video.id} to={`/watch/video/${video.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
                  <div className="aspect-video bg-secondary relative">
                    {video.thumbnail ? (
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* Duration */}
                    {video.duration && (
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                        {video.duration}
                      </span>
                    )}
                    {/* Tier badge */}
                    {video.tier && video.tier !== 'free' && (
                      <span className="absolute top-2 right-2">
                        <Lock className="w-4 h-4 text-white drop-shadow-lg" />
                      </span>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2">{video.title}</h3>
                    <div className="flex items-center gap-2">
                      {video.category && (
                        <Badge variant="secondary" className="text-xs">{video.category}</Badge>
                      )}
                      {video.tier && (
                        <Badge className={`text-xs capitalize ${TIER_COLORS[video.tier] || ''}`} variant="outline">
                          {video.tier}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default VideoLibrary;
