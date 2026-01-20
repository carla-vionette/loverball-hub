import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Heart, Share2, Eye, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { getVideoThumbnail } from '@/lib/videoUtils';

interface VideoData {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  tags: string[];
  published_at: string;
  channel: {
    id: string;
    channel_name: string;
    slug: string;
    avatar_url: string | null;
  };
}

const HubVideoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  
  const { user, isMember } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchVideo();
      trackView();
    }
  }, [id]);

  const fetchVideo = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          channel:creator_channels!inner(id, channel_name, slug, avatar_url)
        `)
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      setVideo(data);

      // Get counts
      const [likesRes, viewsRes, userLikeRes] = await Promise.all([
        supabase
          .from('video_likes')
          .select('id', { count: 'exact', head: true })
          .eq('video_id', id),
        supabase
          .from('video_views')
          .select('id', { count: 'exact', head: true })
          .eq('video_id', id),
        user
          ? supabase
              .from('video_likes')
              .select('id')
              .eq('video_id', id)
              .eq('user_id', user.id)
              .maybeSingle()
          : Promise.resolve({ data: null })
      ]);

      setLikeCount(likesRes.count || 0);
      setViewCount(viewsRes.count || 0);
      setIsLiked(!!userLikeRes.data);
    } catch (error) {
      console.error('Error fetching video:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackView = async () => {
    if (!id) return;
    await supabase
      .from('video_views')
      .insert({ video_id: id, user_id: user?.id || null });
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!isMember) {
      toast({ title: 'Members only', description: 'You need to be a member to like videos' });
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', id)
          .eq('user_id', user.id);
        setLikeCount((prev) => prev - 1);
      } else {
        await supabase
          .from('video_likes')
          .insert({ video_id: id, user_id: user.id });
        setLikeCount((prev) => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: video?.title,
          text: `Check out this video from ${video?.channel.channel_name} on Loverball!`,
          url: shareUrl
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: 'Link copied!' });
    }
  };

  const isEmbeddable = video?.video_url?.includes('youtube.com') || 
                       video?.video_url?.includes('youtu.be') || 
                       video?.video_url?.includes('vimeo.com');

  const getEmbedUrl = () => {
    if (!video?.video_url) return '';
    
    if (video.video_url.includes('youtube.com/watch')) {
      const videoId = new URL(video.video_url).searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
    }
    if (video.video_url.includes('youtu.be')) {
      const videoId = video.video_url.split('/').pop();
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
    }
    if (video.video_url.includes('vimeo.com')) {
      const videoId = video.video_url.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1`;
    }
    return video.video_url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader />
        <DesktopNav />
        <BottomNav />
        <main className="md:ml-64 pt-16 md:pt-0 pb-20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Video not found</h1>
            <p className="text-muted-foreground mb-4">This video doesn't exist or has been removed.</p>
            <Button asChild>
              <Link to="/hub">Back to Video Hub</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-foreground">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-20 md:pb-8">
        {/* Back button */}
        <div className="px-4 pt-4">
          <Button variant="ghost" size="sm" className="text-white" asChild>
            <Link to="/hub">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Hub
            </Link>
          </Button>
        </div>

        {/* Video Player */}
        <div className="relative w-full max-w-3xl mx-auto aspect-[9/16] md:aspect-video bg-black">
          {isEmbeddable ? (
            <iframe
              src={getEmbedUrl()}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={video.video_url}
              poster={getVideoThumbnail(video.thumbnail_url, video.video_url)}
              className="w-full h-full object-contain"
              controls
              autoPlay
              muted={isMuted}
              playsInline
            />
          )}
        </div>

        {/* Video Info */}
        <div className="px-4 py-6 max-w-3xl mx-auto">
          {/* Channel */}
          <Link
            to={`/channel/${video.channel.slug}`}
            className="flex items-center gap-3 mb-4"
          >
            <Avatar className="w-10 h-10">
              <AvatarImage src={video.channel.avatar_url || ''} alt={video.channel.channel_name} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {video.channel.channel_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-white hover:underline">
              {video.channel.channel_name}
            </span>
          </Link>

          {/* Title */}
          <h1 className="text-xl font-bold text-white mb-2">{video.title}</h1>

          {/* Tags */}
          {video.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {video.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          {video.description && (
            <p className="text-muted-foreground mb-6">{video.description}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className={`gap-2 ${isLiked ? 'text-red-500' : 'text-white'}`}
              onClick={handleLike}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              {likeCount}
            </Button>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="w-5 h-5" />
              <span>{viewCount} views</span>
            </div>

            <Button variant="ghost" className="gap-2 text-white ml-auto" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
              Share
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HubVideoDetail;
