import { useRef, useEffect, useState, useCallback } from "react";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { FeedVideoItem } from "@/lib/feedVideoData";

interface FeedVideoPlayerProps {
  video: FeedVideoItem;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

const formatCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const FeedVideoPlayer = ({ video, isActive, isMuted, onToggleMute }: FeedVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPlayPause, setShowPlayPause] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [following, setFollowing] = useState(video.isFollowing ?? false);
  const [likeCount, setLikeCount] = useState(video.likes);
  
  const [doubleTapSide, setDoubleTapSide] = useState<"left" | "right" | null>(null);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const playPauseTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Swipe gesture tracking
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (isActive) { vid.play().catch(() => {}); setIsPlaying(true); }
    else { vid.pause(); setIsPlaying(false); }
  }, [isActive]);

  useEffect(() => { if (videoRef.current) videoRef.current.muted = isMuted; }, [isMuted]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onTime = () => { if (vid.duration) setProgress((vid.currentTime / vid.duration) * 100); };
    vid.addEventListener("timeupdate", onTime);
    return () => vid.removeEventListener("timeupdate", onTime);
  }, []);

  const togglePlayPause = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) { vid.play().catch(() => {}); setIsPlaying(true); }
    else { vid.pause(); setIsPlaying(false); }
    setShowPlayPause(true);
    if (playPauseTimeout.current) clearTimeout(playPauseTimeout.current);
    playPauseTimeout.current = setTimeout(() => setShowPlayPause(false), 800);
  }, []);

  const handleTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button") || target.closest("input") || target.closest("a")) return;

      const now = Date.now();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const clientX = "touches" in e ? e.changedTouches[0].clientX : e.clientX;
      const relX = clientX - rect.left;
      const isLeft = relX < rect.width / 3;
      const isRight = relX > (rect.width * 2) / 3;

      if (now - lastTapRef.current.time < 300) {
        const vid = videoRef.current;
        if (!vid) return;
        if (isLeft) { vid.currentTime = Math.max(0, vid.currentTime - 10); setDoubleTapSide("left"); }
        else if (isRight) { vid.currentTime = Math.min(vid.duration || 0, vid.currentTime + 10); setDoubleTapSide("right"); }
        setTimeout(() => setDoubleTapSide(null), 600);
        lastTapRef.current = { time: 0, x: 0 };
      } else {
        lastTapRef.current = { time: now, x: relX };
        setTimeout(() => { if (lastTapRef.current.time === now) togglePlayPause(); }, 300);
      }
    },
    [togglePlayPause]
  );

  // Horizontal swipe for seek
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !videoRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;
    
    // Only horizontal swipes (fast, minimal vertical)
    if (elapsed < 400 && Math.abs(dx) > 80 && Math.abs(dy) < 60) {
      const vid = videoRef.current;
      if (dx > 0) {
        vid.currentTime = Math.max(0, vid.currentTime - 10);
        setDoubleTapSide("left");
      } else {
        vid.currentTime = Math.min(vid.duration || 0, vid.currentTime + 10);
        setDoubleTapSide("right");
      }
      setTimeout(() => setDoubleTapSide(null), 600);
    }
    touchStartRef.current = null;
  }, []);

  const handleLike = () => {
    if (liked) { setLiked(false); setLikeCount((c) => c - 1); }
    else { setLiked(true); setLikeCount((c) => c + 1); }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: video.title, url: window.location.href }); } catch {}
    }
  };

  // Keyboard controls when active
  useEffect(() => {
    if (!isActive) return;
    const handleKey = (e: KeyboardEvent) => {
      const vid = videoRef.current;
      if (!vid) return;
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          vid.currentTime = Math.max(0, vid.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          vid.currentTime = Math.min(vid.duration || 0, vid.currentTime + 10);
          break;
        case 'm':
          e.preventDefault();
          onToggleMute();
          break;
        case 'l':
          e.preventDefault();
          handleLike();
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isActive, togglePlayPause, onToggleMute, liked]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden select-none"
      onClick={handleTap}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label={`Video: ${video.title} by ${video.channelName}`}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        poster={video.thumbnail}
        loop
        playsInline
        muted={isMuted}
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover bg-black"
        aria-label={`${video.title} video`}
      />

      {/* Screen reader status */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isPlaying ? 'Playing' : 'Paused'}: {video.title} by {video.channelName}. 
        {isMuted ? 'Audio muted.' : 'Audio on.'}
        {liked ? 'Liked.' : ''}
      </div>

      {/* Double-tap indicators */}
      <AnimatePresence>
        {doubleTapSide && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className={`absolute top-1/2 -translate-y-1/2 z-20 ${doubleTapSide === "left" ? "left-12" : "right-12"}`}
            aria-hidden="true"
          >
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium">
              {doubleTapSide === "left" ? "−10s" : "+10s"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center play/pause overlay */}
      <AnimatePresence>
        {showPlayPause && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
            aria-hidden="true"
          >
            <div className="w-20 h-20 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center">
              {isPlaying ? (
                <div className="flex gap-1.5">
                  <div className="w-2 h-7 bg-white rounded-full" />
                  <div className="w-2 h-7 bg-white rounded-full" />
                </div>
              ) : (
                <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar — view count */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center px-4 pt-4 pointer-events-auto">
        <div className="bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5" aria-label={`${formatCount(video.views)} views`}>
          <Play className="w-3 h-3 text-white" fill="currentColor" aria-hidden="true" />
          <span className="text-xs font-semibold text-white">{formatCount(video.views)}</span>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" aria-hidden="true" />

      {/* Right sidebar — avatar + actions */}
      <div className="absolute right-3 bottom-44 z-10 flex flex-col items-center gap-5 pointer-events-auto" role="toolbar" aria-label="Video actions">
        {/* Creator avatar */}
        <div className="relative mb-2">
          <img
            src={video.channelAvatar}
            alt={`${video.channelName} profile photo`}
            className="w-12 h-12 rounded-full object-cover border-2 border-white/40"
          />
          {!following && (
            <button
              onClick={(e) => { e.stopPropagation(); setFollowing(true); }}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-accent flex items-center justify-center focus-ring"
              aria-label={`Follow ${video.channelName}`}
            >
              <span className="text-accent-foreground text-xs font-bold leading-none" aria-hidden="true">+</span>
            </button>
          )}
        </div>

        {/* Heart */}
        <button
          onClick={(e) => { e.stopPropagation(); handleLike(); }}
          className="flex flex-col items-center gap-1 tap-target focus-ring rounded-full"
          aria-label={liked ? `Unlike, ${formatCount(likeCount)} likes` : `Like, ${formatCount(likeCount)} likes`}
          aria-pressed={liked}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${liked ? "bg-red-500/20" : "bg-white/10 backdrop-blur-sm"}`}>
            <Heart className={`w-6 h-6 ${liked ? "text-red-500" : "text-white"}`} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
          </div>
          <span className={`text-[11px] font-semibold ${liked ? "text-red-400" : "text-white/80"}`} aria-hidden="true">{formatCount(likeCount)}</span>
        </button>

        {/* Share */}
        <button
          onClick={(e) => { e.stopPropagation(); handleShare(); }}
          className="flex flex-col items-center gap-1 tap-target focus-ring rounded-full"
          aria-label="Share video"
        >
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <span className="text-[11px] font-semibold text-white/80" aria-hidden="true">{formatCount(Math.floor(video.views * 0.012))}</span>
        </button>

        {/* Bookmark */}
        <button
          onClick={(e) => { e.stopPropagation(); setBookmarked(!bookmarked); }}
          className="flex flex-col items-center gap-1 tap-target focus-ring rounded-full"
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark video"}
          aria-pressed={bookmarked}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${bookmarked ? "bg-accent/30" : "bg-white/10 backdrop-blur-sm"}`}>
            <Bookmark className={`w-6 h-6 ${bookmarked ? "text-accent" : "text-white"}`} fill={bookmarked ? "currentColor" : "none"} aria-hidden="true" />
          </div>
        </button>

        {/* Mute */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
          className="flex flex-col items-center gap-1 tap-target focus-ring rounded-full"
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          aria-pressed={isMuted}
        >
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            {isMuted ? <VolumeX className="w-5 h-5 text-white" aria-hidden="true" /> : <Volume2 className="w-5 h-5 text-white" aria-hidden="true" />}
          </div>
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 h-1 bg-white/10" role="progressbar" aria-label="Video progress" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-accent transition-[width] duration-100" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

export default FeedVideoPlayer;
