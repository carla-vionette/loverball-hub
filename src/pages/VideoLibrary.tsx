import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Play, Lock } from 'lucide-react';
import { fetchVideos } from '@/services/videoService';
import { VIDEO_CATEGORIES, type VideoItem, type ContentTier } from '@/types';
import GatedContent from '@/components/GatedContent';

const tierColors: Record<ContentTier, string> = {
  free: 'bg-green-500/10 text-green-600',
  pro: 'bg-primary/10 text-primary',
  premium: 'bg-purple-500/10 text-purple-600',
};

const VideoLibrary = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  useEffect(() => {
    fetchVideos()
      .then(setVideos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return videos.filter((v) => {
      if (categoryFilter !== 'all' && v.category !== categoryFilter) return false;
      if (tierFilter !== 'all' && v.tier !== tierFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!v.title.toLowerCase().includes(q) && !(v.description || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [videos, search, categoryFilter, tierFilter]);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight mb-6">
          Video Library
        </h1>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search videos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {VIDEO_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No videos found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((video) => (
              <Link key={video.id} to={`/watch/${video.id}`}>
                <Card className="overflow-hidden group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                  <div className="relative aspect-video bg-secondary">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                    )}
                    {video.tier !== 'free' && (
                      <div className="absolute top-2 right-2">
                        <Badge className={tierColors[video.tier]}>
                          {video.tier === 'premium' && <Lock className="w-3 h-3 mr-1" />}
                          {video.tier.toUpperCase()}
                        </Badge>
                      </div>
                    )}
                    {video.duration && (
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                        {video.duration}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-2">{video.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      {video.category && (
                        <Badge variant="secondary" className="text-xs">{video.category}</Badge>
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
