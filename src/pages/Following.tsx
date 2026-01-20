import { useState, useEffect } from 'react';
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import VideoPost from "@/components/VideoPost";
import VideoHubPost from "@/components/VideoHubPost";
import LASportsTicker from "@/components/LASportsTicker";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import christineVideo from "@/assets/christine-video.mov";
import colorCoverageVideo from "@/assets/color-coverage-video.mp4";
import playMeVideo from "@/assets/play-me-video.mp4";
import risingStarsVideo from "@/assets/rising-stars-video.mp4";
import matchPointVideo from "@/assets/match-point-video.mp4";

interface StoryHubVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  tags: string[];
  channel: {
    channel_name: string;
    slug: string;
    avatar_url: string | null;
  };
  like_count: number;
  view_count: number;
}

const Following = () => {
  const [storyHubVideos, setStoryHubVideos] = useState<StoryHubVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Static videos for the feed
  const staticVideos = [
    {
      id: 1,
      videoUrl: playMeVideo,
      username: "TeamDynamics",
      userAvatar: "",
      caption: "Play Me - An inspiring story about teamwork and determination on the court! 🏀 #TeamSpirit #BasketballLife",
      likes: 8924,
      comments: 567,
      shares: 423,
    },
    {
      id: 2,
      videoUrl: risingStarsVideo,
      username: "YouthSports",
      userAvatar: "",
      caption: "Rising Stars - Watch the next generation shine on the court! 🌟🏀 #RisingStars #YouthBasketball #FutureChampions",
      likes: 5234,
      comments: 312,
      shares: 189,
    },
    {
      id: 3,
      videoUrl: colorCoverageVideo,
      username: "Larissa_Bball",
      userAvatar: "",
      caption: "Larissa on the court with the Falcons. 🏀 #Basketball #Falcons #WomenInSports",
      likes: 2847,
      comments: 156,
      shares: 89,
    },
    {
      id: 4,
      videoUrl: matchPointVideo,
      username: "CourtSide",
      userAvatar: "",
      caption: "Match Point - Charlie and Katarina compete for love and glory on the tennis court 🎾❤️ #MatchPoint #Tennis #SportsRomance",
      likes: 3842,
      comments: 298,
      shares: 176,
    },
    {
      id: 5,
      videoUrl: christineVideo,
      username: "thechristinewang",
      userAvatar: "",
      caption: "Christine sharing her sports journey and inspiring others to stay active! 🏀⚽️ #SportsLife #Inspiration #WomenInSports",
      likes: 3547,
      comments: 234,
      shares: 156,
    },
  ];

  useEffect(() => {
    fetchStoryHubVideos();
  }, []);

  const fetchStoryHubVideos = async () => {
    try {
      const { data: videosData, error } = await supabase
        .from('videos')
        .select(`
          id,
          title,
          description,
          video_url,
          thumbnail_url,
          tags,
          creator_channels!inner(
            channel_name,
            slug,
            avatar_url
          )
        `)
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching videos:', error);
        setLoading(false);
        return;
      }

      // Transform and get like/view counts for each video
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

          // Handle the channel data - it comes as an object from the join
          const channelData = video.creator_channels as { channel_name: string; slug: string; avatar_url: string | null };

          return {
            id: video.id,
            title: video.title,
            description: video.description,
            video_url: video.video_url,
            thumbnail_url: video.thumbnail_url,
            tags: video.tags || [],
            channel: {
              channel_name: channelData?.channel_name || 'Unknown',
              slug: channelData?.slug || '',
              avatar_url: channelData?.avatar_url || null
            },
            like_count: likesRes.count || 0,
            view_count: viewsRes.count || 0
          };
        })
      );

      setStoryHubVideos(videosWithCounts);
    } catch (error) {
      console.error('Error fetching Story Hub videos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Interleave Story Hub videos with static videos - memoize to prevent recalculation
  const combinedFeed = (() => {
    const combined: React.ReactNode[] = [];
    let staticIndex = 0;
    let hubIndex = 0;

    // First show Story Hub videos, then static videos
    while (hubIndex < storyHubVideos.length || staticIndex < staticVideos.length) {
      // Add a Story Hub video
      if (hubIndex < storyHubVideos.length) {
        const video = storyHubVideos[hubIndex];
        combined.push(
          <VideoHubPost
            key={`hub-${video.id}`}
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
            tags={video.tags || []}
          />
        );
        hubIndex++;
      }
      
      // Add a static video after every 2 hub videos (or always if no hub videos)
      if (staticIndex < staticVideos.length && (hubIndex % 2 === 0 || storyHubVideos.length === 0)) {
        const video = staticVideos[staticIndex];
        combined.push(
          <VideoPost key={`static-${video.id}`} {...video} />
        );
        staticIndex++;
      }
    }

    return combined;
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />
      
      {/* Sticky LA Sports Ticker */}
      <div className="fixed top-16 md:top-0 left-0 right-0 md:left-64 z-30">
        <LASportsTicker />
      </div>
      
      {/* Video Feed - Full screen vertical scroll */}
      <main className="md:ml-64 h-[100dvh] overflow-y-scroll snap-y snap-mandatory pt-[88px] md:pt-[40px]">
        {combinedFeed.length > 0 ? (
          combinedFeed
        ) : (
          <div className="h-[calc(100dvh-120px)] flex items-center justify-center">
            <div className="text-center px-6">
              <h2 className="text-2xl font-bold mb-2 text-foreground">No content yet</h2>
              <p className="text-muted-foreground">Check back soon for videos from Story Hub creators</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Following;
