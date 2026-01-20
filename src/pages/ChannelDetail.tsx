import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Play, Plus, Heart, Eye, ArrowLeft } from 'lucide-react';

interface CreatorChannel {
  id: string;
  channel_name: string;
  slug: string;
  description: string | null;
  sport_focus: string | null;
  avatar_url: string | null;
  owner_user_id: string;
  social_links: unknown;
}

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  tags: string[];
  published_at: string;
  like_count: number;
  view_count: number;
}

const ChannelDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [channel, setChannel] = useState<CreatorChannel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const { user } = useAuth();

  const isOwner = user && channel && user.id === channel.owner_user_id;

  useEffect(() => {
    if (slug) {
      fetchChannel();
    }
  }, [slug]);

  const fetchChannel = async () => {
    try {
      const { data: channelData, error: channelError } = await supabase
        .from('creator_channels')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'approved')
        .single();

      if (channelError) throw channelError;
      setChannel(channelData);

      // Fetch channel videos
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('channel_id', channelData.id)
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (videosError) throw videosError;

      // Get like and view counts
      const videosWithCounts = await Promise.all(
        (videosData || []).map(async (video) => {
          const [likesRes, viewsRes] = await Promise.all([
            supabase
              .from('video_likes')
              .select('id', { count: 'exact', head: true })
              .eq('video_id', video.id),
            supabase
              .from('video_views')
              .select('id', { count: 'exact', head: true })
              .eq('video_id', video.id)
          ]);

          return {
            ...video,
            like_count: likesRes.count || 0,
            view_count: viewsRes.count || 0
          };
        })
      );

      setVideos(videosWithCounts);
    } catch (error) {
      console.error('Error fetching channel:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = () => {
    // Stub for now - just toggle state
    setIsFollowing(!isFollowing);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader />
        <DesktopNav />
        <BottomNav />
        <main className="md:ml-64 pt-16 md:pt-0 pb-20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Channel not found</h1>
            <p className="text-muted-foreground mb-4">This channel doesn't exist or isn't approved yet.</p>
            <Button asChild>
              <Link to="/hub">Back to Video Hub</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-20 md:pb-8">
        {/* Back button */}
        <div className="px-4 pt-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/hub">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Hub
            </Link>
          </Button>
        </div>

        {/* Channel Header */}
        <div className="px-4 py-6 border-b border-border">
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={channel.avatar_url || ''} alt={channel.channel_name} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                {channel.channel_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{channel.channel_name}</h1>
              {channel.sport_focus && (
                <Badge variant="secondary" className="mt-1">
                  {channel.sport_focus}
                </Badge>
              )}
              {channel.description && (
                <p className="text-muted-foreground mt-2 line-clamp-3">
                  {channel.description}
                </p>
              )}
              <div className="flex gap-2 mt-4">
                {!isOwner && (
                  <Button
                    variant={isFollowing ? 'outline' : 'default'}
                    onClick={handleFollow}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                )}
                {isOwner && (
                  <Button asChild>
                    <Link to="/upload-video">
                      <Plus className="w-4 h-4 mr-2" />
                      Upload Video
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Videos Grid */}
        <div className="px-4 py-6">
          <h2 className="text-lg font-semibold mb-4">
            Videos ({videos.length})
          </h2>

          {videos.length === 0 ? (
            <div className="text-center py-12">
              <Play className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No videos yet</h3>
              <p className="text-muted-foreground text-sm">
                {isOwner ? "Upload your first video to get started!" : "Check back soon for new content."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {videos.map((video) => (
                <Link
                  key={video.id}
                  to={`/hub/video/${video.id}`}
                  className="group"
                >
                  <Card className="overflow-hidden border-border/50 hover:border-primary/50 transition-colors">
                    <div className="relative aspect-[9/16] bg-muted">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      {video.duration_seconds && (
                        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                          {formatDuration(video.duration_seconds)}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2 mb-2">
                        {video.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" /> {video.like_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {video.view_count}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChannelDetail;
