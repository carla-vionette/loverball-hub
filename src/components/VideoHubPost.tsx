import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Eye, Share2, Volume2, VolumeX, Play, MessageCircle, Send } from 'lucide-react';
import { getVideoThumbnail } from '@/lib/videoUtils';
import WhistleIcon from '@/components/icons/WhistleIcon';

interface VideoHubPostProps {
  id: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  title: string;
  description: string | null;
  channelName: string;
  channelSlug: string;
  channelAvatar: string | null;
  likeCount: number;
  viewCount: number;
  tags: string[];
}

const VideoHubPost = ({
  id,
  videoUrl,
  thumbnailUrl,
  title,
  description,
  channelName,
  channelSlug,
  channelAvatar,
  likeCount: initialLikeCount,
  viewCount,
  tags
}: VideoHubPostProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentList, setCommentList] = useState<{ id: string; username: string; text: string; timestamp: string }[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentCount, setCommentCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, isMember } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user already liked this video
  useEffect(() => {
    if (user) {
      supabase
        .from('video_likes')
        .select('id')
        .eq('video_id', id)
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          setIsLiked(!!data);
        });
    }
  }, [user, id]);

  // IntersectionObserver for autoplay
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
            setIsPlaying(true);
            
            // Track view
            if (!hasViewed) {
              setHasViewed(true);
              supabase
                .from('video_views')
                .insert({ video_id: id, user_id: user?.id || null })
                .then(() => {});
            }
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.7 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [id, user, hasViewed]);

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
    const shareUrl = `${window.location.origin}/hub/video/${id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Check out this video from ${channelName} on Loverball!`,
          url: shareUrl
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: 'Link copied!' });
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    const comment = {
      id: Date.now().toString(),
      username: 'You',
      text: newComment.trim(),
      timestamp: 'Just now',
    };

    setCommentList(prev => [comment, ...prev]);
    setCommentCount(prev => prev + 1);
    setNewComment('');
    toast({ title: 'Comment added!' });
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const newMutedState = !videoRef.current.muted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Check if it's an embeddable URL (YouTube, Vimeo, TikTok)
  const isEmbeddable = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || 
                       videoUrl.includes('vimeo.com') || videoUrl.includes('tiktok.com');

  const getEmbedUrl = () => {
    if (videoUrl.includes('youtube.com/watch')) {
      const videoId = new URL(videoUrl).searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
    }
    if (videoUrl.includes('youtu.be')) {
      const videoId = videoUrl.split('/').pop();
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
    }
    if (videoUrl.includes('vimeo.com')) {
      const videoId = videoUrl.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1`;
    }
    return videoUrl;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100dvh-88px)] md:h-[calc(100dvh-40px)] bg-background snap-start snap-always"
    >
      {/* Side gradient overlays for polished look on desktop */}
      <div className="hidden md:block absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background via-background/60 to-transparent pointer-events-none z-[1]" />
      <div className="hidden md:block absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background via-background/60 to-transparent pointer-events-none z-[1]" />

      {/* Video or Embed */}
      {isEmbeddable ? (
        <iframe
          src={getEmbedUrl()}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            poster={getVideoThumbnail(thumbnailUrl, videoUrl)}
            className="w-full h-full object-cover"
            loop
            muted={isMuted}
            playsInline
            onClick={togglePlay}
          />
          
          {/* Play/Pause Overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Button
                variant="ghost"
                size="icon"
                className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30"
                onClick={togglePlay}
              >
                <Play className="w-8 h-8 text-white fill-white" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

      {/* Channel Info - Top */}
      <Link
        to={`/channel/${channelSlug}`}
        className="absolute top-4 left-4 flex items-center gap-3 z-10"
      >
        <Avatar className="w-10 h-10 border-2 border-white">
          <AvatarImage src={channelAvatar || ''} alt={channelName} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {channelName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium text-white drop-shadow-md">{channelName}</span>
      </Link>


      {/* Video Info - Bottom */}
      <div className="absolute bottom-4 left-4 right-20 z-10">
        <h3 className="font-semibold text-white text-lg drop-shadow-md line-clamp-2 mb-1">
          {title}
        </h3>
        {description && (
          <p className="text-white/80 text-sm drop-shadow-md line-clamp-2 mb-2">
            {description}
          </p>
        )}
        {tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs bg-white/20 text-white border-0">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons - Right Side */}
      <div className="absolute top-1/3 md:top-auto md:bottom-24 right-4 flex flex-col items-center gap-6 z-10">
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1 transition-transform active:scale-90"
        >
          <WhistleIcon className="w-8 h-8 text-white" filled={isLiked} />
          <span className="text-white text-xs font-semibold">{likeCount}</span>
        </button>

        {/* Comment Button with Sheet */}
        <Sheet open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center gap-1 transition-transform active:scale-90">
              <MessageCircle className="w-8 h-8 text-white" />
              <span className="text-white text-xs font-semibold">{commentCount}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
            <SheetHeader className="border-b pb-3">
              <SheetTitle className="text-center">{commentCount} Comments</SheetTitle>
            </SheetHeader>
            
            <ScrollArea className="flex-1 h-[calc(70vh-140px)] py-4">
              {commentList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                  <p>No comments yet</p>
                  <p className="text-sm">Be the first to comment!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {commentList.map((comment) => (
                    <div key={comment.id} className="flex gap-3 px-1">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback>{comment.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{comment.username}</span>
                          <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                        </div>
                        <p className="text-sm mt-0.5">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            {/* Comment Input */}
            <form onSubmit={handleAddComment} className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!newComment.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>

        {/* Share Button */}
        <button 
          onClick={handleShare}
          className="flex flex-col items-center gap-1 transition-transform active:scale-90"
        >
          <Share2 className="w-8 h-8 text-white" />
        </button>

        <button
          onClick={toggleMute}
          className="flex flex-col items-center gap-1 transition-transform active:scale-90 mt-4"
        >
          {isMuted ? (
            <VolumeX className="w-8 h-8 text-white" />
          ) : (
            <Volume2 className="w-8 h-8 text-white" />
          )}
        </button>

        <div className="flex flex-col items-center">
          <Eye className="w-5 h-5 text-white/70" />
          <span className="text-white/70 text-xs">{viewCount}</span>
        </div>
      </div>
    </div>
  );
};

export default VideoHubPost;
