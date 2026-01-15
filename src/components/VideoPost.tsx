import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, Share2, Volume2, VolumeX, Send, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import WhistleIcon from "@/components/icons/WhistleIcon";
import { toast } from "sonner";

interface Comment {
  id: string;
  username: string;
  avatar?: string;
  text: string;
  timestamp: string;
}

interface VideoPostProps {
  videoUrl: string;
  username: string;
  userAvatar?: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
}

interface DoubleTapHeart {
  id: number;
  x: number;
  y: number;
}

const VideoPost = ({
  videoUrl,
  username,
  userAvatar,
  caption,
  likes,
  comments,
  shares,
  isLiked = false,
}: VideoPostProps) => {
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);
  const [commentCount, setCommentCount] = useState(comments);
  const [shareCount, setShareCount] = useState(shares);
  const [muted, setMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [commentList, setCommentList] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [doubleTapHearts, setDoubleTapHearts] = useState<DoubleTapHeart[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Autoplay muted (required by mobile browsers)
            video.muted = true;
            video.play().then(() => {
              // After autoplay starts, try to unmute after a brief delay if user has interacted
              if (hasInteracted) {
                setTimeout(() => {
                  video.muted = false;
                  setMuted(false);
                }, 100);
              }
            }).catch(() => {
              // If autoplay fails, ensure it's muted and retry
              video.muted = true;
              video.play();
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [hasInteracted]);

  // Handle first user interaction to enable unmuting
  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      const video = videoRef.current;
      if (video && !video.paused && muted) {
        video.muted = false;
        setMuted(false);
      }
    };

    // Listen for any user interaction
    window.addEventListener('touchstart', handleInteraction, { once: true });
    window.addEventListener('click', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, [muted]);

  const handleLike = useCallback(() => {
    if (liked) {
      setLiked(false);
      setLikeCount(prev => prev - 1);
    } else {
      setLiked(true);
      setLikeCount(prev => prev + 1);
    }
  }, [liked]);

  // Double-tap to like handler
  const handleDoubleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    // Get tap position
    let x: number, y: number;
    if ('touches' in e) {
      const touch = e.touches[0] || (e as React.TouchEvent).changedTouches[0];
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected!
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }

      // Add heart animation at tap location
      const heartId = Date.now();
      setDoubleTapHearts(prev => [...prev, { id: heartId, x, y }]);

      // Remove heart after animation
      setTimeout(() => {
        setDoubleTapHearts(prev => prev.filter(h => h.id !== heartId));
      }, 1000);

      // Like the video if not already liked
      if (!liked) {
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }

      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      
      // Set timeout for single tap (play/pause could go here)
      tapTimeoutRef.current = setTimeout(() => {
        tapTimeoutRef.current = null;
      }, DOUBLE_TAP_DELAY);
    }
  }, [liked]);

  const handleShare = async () => {
    const shareData = {
      title: `Video by ${username}`,
      text: caption,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        setShareCount(prev => prev + 1);
        toast.success("Thanks for sharing!");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareCount(prev => prev + 1);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      username: "You",
      text: newComment.trim(),
      timestamp: "Just now",
    };

    setCommentList(prev => [comment, ...prev]);
    setCommentCount(prev => prev + 1);
    setNewComment("");
    toast.success("Comment added!");
  };

  return (
    <div 
      className="relative h-screen w-full snap-start snap-always bg-black flex items-center justify-center"
      onClick={handleDoubleTap}
      onTouchEnd={handleDoubleTap}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="h-full w-auto max-w-full md:max-h-screen object-contain mt-14 md:mt-0 pointer-events-none"
        loop
        playsInline
        muted={muted}
      />
      
      {/* Double-tap heart animations */}
      {doubleTapHearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute pointer-events-none z-50 animate-double-tap-heart"
          style={{
            left: heart.x - 40,
            top: heart.y - 40,
          }}
        >
          <Heart className="w-20 h-20 text-primary fill-primary drop-shadow-lg" />
        </div>
      ))}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      
      {/* Video Info */}
      <div className="absolute bottom-32 md:bottom-6 left-4 right-20 text-white z-10 pointer-events-none">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage src={userAvatar} />
            <AvatarFallback>{username[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-semibold text-lg">{username}</span>
        </div>
        <p className="text-sm line-clamp-3">{caption}</p>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-20 md:top-6 right-4 flex flex-col items-center gap-6 z-10">
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1 transition-transform active:scale-90"
        >
          <WhistleIcon
            className="w-8 h-8 text-white"
            filled={liked}
          />
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
                        <AvatarImage src={comment.avatar} />
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
          <span className="text-white text-xs font-semibold">{shareCount}</span>
        </button>

        <button
          onClick={() => setMuted(!muted)}
          className="flex flex-col items-center gap-1 transition-transform active:scale-90 mt-4"
        >
          {muted ? (
            <VolumeX className="w-8 h-8 text-white" />
          ) : (
            <Volume2 className="w-8 h-8 text-white" />
          )}
        </button>
      </div>
    </div>
  );
};

export default VideoPost;
