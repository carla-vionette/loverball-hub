import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import StatsTicker from "@/components/StatsTicker";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Play, Heart, Eye, ChevronRight } from 'lucide-react';
import VideoHubPost from '@/components/VideoHubPost';

interface CreatorChannel {
  id: string;
  channel_name: string;
  slug: string;
  description: string | null;
  sport_focus: string | null;
  avatar_url: string | null;
  owner_user_id: string;
}

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  tags: string[];
  channel_id: string;
  published_at: string;
  channel: CreatorChannel;
  like_count: number;
  view_count: number;
}

const VideoHub = () => {
  const [channels, setChannels] = useState<CreatorChannel[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isMember } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [channelsRes, videosRes] = await Promise.all([
        supabase
          .from('creator_channels')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false }),
        supabase
          .from('videos')
          .select(`
            *,
            channel:creator_channels!inner(*)
          `)
          .eq('is_published', true)
          .order('published_at', { ascending: false })
          .limit(20)
      ]);

      if (channelsRes.error) throw channelsRes.error;
      if (videosRes.error) throw videosRes.error;

      setChannels(channelsRes.data || []);

      // Get like and view counts for each video
      const videosWithCounts = await Promise.all(
        (videosRes.data || []).map(async (video) => {
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
      console.error('Error fetching video hub data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-foreground">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />
      
      <div className="fixed top-16 md:top-0 left-0 right-0 md:left-64 z-30">
        <StatsTicker />
      </div>

      <main className="md:ml-64 pt-[92px] md:pt-[48px] pb-20 md:pb-8">
        {/* Hero Section */}
        <section className="px-4 py-8 text-center bg-gradient-to-b from-primary/20 to-transparent">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Loverball Video Hub
          </h1>
          <p className="text-muted-foreground text-lg mb-6 max-w-xl mx-auto">
            Curated channels from approved creators in the women's sports community
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button asChild variant="outline">
              <Link to="#channels">Browse Channels</Link>
            </Button>
            {isMember && (
              <Button asChild>
                <Link to="/apply-creator">Apply to Be a Creator</Link>
              </Button>
            )}
            {!user && (
              <Button asChild>
                <Link to="/auth">Sign In to Apply</Link>
              </Button>
            )}
          </div>
        </section>

        {/* Featured Channels Carousel */}
        {channels.length > 0 && (
          <section id="channels" className="px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Featured Channels</h2>
              <Link to="/channels" className="text-primary text-sm flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-4 pb-4">
                {channels.map((channel) => (
                  <Link
                    key={channel.id}
                    to={`/channel/${channel.slug}`}
                    className="shrink-0 w-40"
                  >
                    <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors">
                      <CardContent className="p-4 text-center">
                        <Avatar className="w-16 h-16 mx-auto mb-3">
                          <AvatarImage src={channel.avatar_url || ''} alt={channel.channel_name} />
                          <AvatarFallback className="bg-primary/20 text-primary text-lg">
                            {channel.channel_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-medium text-foreground truncate">
                          {channel.channel_name}
                        </h3>
                        {channel.sport_focus && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {channel.sport_focus}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>
        )}

        {/* Video Feed */}
        <section className="px-0">
          {videos.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No videos yet</h3>
              <p className="text-muted-foreground mb-6">
                Be one of the first creators to share content!
              </p>
              {isMember && (
                <Button asChild>
                  <Link to="/apply-creator">Apply to Create a Channel</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="snap-y snap-mandatory">
              {videos.map((video) => (
                <VideoHubPost
                  key={video.id}
                  id={video.id}
                  videoUrl={video.video_url}
                  thumbnailUrl={video.thumbnail_url}
                  title={video.title}
                  description={video.description}
                  channelName={video.channel.channel_name}
                  channelSlug={video.channel.slug}
                  channelAvatar={video.channel.avatar_url}
                  likeCount={video.like_count}
                  viewCount={video.view_count}
                  tags={video.tags}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default VideoHub;
