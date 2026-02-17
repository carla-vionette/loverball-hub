import { useRef, useEffect, useState, useCallback } from "react";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Bookmark, ChevronLeft, Camera, Music, Send, SmilePlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { FeedVideoItem } from "@/lib/feedVideoData";
import { trackVideoProgress, trackVideoComplete } from "@/lib/analytics";

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

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (isActive) { vid.play().catch(() => {}); setIsPlaying(true); }
    else { vid.pause(); setIsPlaying(false); }
  }, [isActive]);

  useEffect(() => { if (videoRef.current) videoRef.current.muted = isMuted; }, [isMuted]);

  const milestonesTracked = useRef(new Set<number>());

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onTime = () => {
      if (!vid.duration) return;
      const pct = (vid.currentTime / vid.duration) * 100;
      setProgress(pct);
      [25, 50, 75, 100].forEach(m => {
        if (pct >= m && !milestonesTracked.current.has(m)) {
          milestonesTracked.current.add(m);
          if (m === 100) trackVideoComplete(video.id, video.tags?.[0]);
          else trackVideoProgress(video.id, m, video.tags?.[0]);
        }
      });
    };
    vid.addEventListener("timeupdate", onTime);
    return () => vid.removeEventListener("timeupdate", onTime);
  }, [video.id]);

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

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !videoRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;
    if (elapsed < 400 && Math.abs(dx) > 80 && Math.abs(dy) < 60) {
      const vid = videoRef.current;
      if (dx > 0) { vid.currentTime = Math.max(0, vid.currentTime - 10); setDoubleTapSide("left"); }
      else { vid.currentTime = Math.min(vid.duration || 0, vid.currentTime + 10); setDoubleTapSide("right"); }
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

  useEffect(() => {
    if (!isActive) return;
    const handleKey = (e: KeyboardEvent) => {
      const vid = videoRef.current;
      if (!vid) return;
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); togglePlayPause(); break;
        case 'ArrowLeft': e.preventDefault(); vid.currentTime = Math.max(0, vid.currentTime - 10); break;
        case 'ArrowRight': e.preventDefault(); vid.currentTime = Math.min(vid.duration || 0, vid.currentTime + 10); break;
        case 'm': e.preventDefault(); onToggleMute(); break;
        case 'l': e.preventDefault(); handleLike(); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isActive, togglePlayPause, onToggleMute, liked]);

  const commentCount = Math.floor(video.views * 0.02);
  const shareCount = Math.floor(video.views * 0.012);
  const bookmarkCount = Math.floor(video.views * 0.008);

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
      />

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isPlaying ? 'Playing' : 'Paused'}: {video.title} by {video.channelName}.
      </div>

      {/* Double-tap indicators */}
      <AnimatePresence>
        {doubleTapSide && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className={`absolute top-1/2 -translate-y-1/2 z-20 ${doubleTapSide === "left" ? "left-12" : "right-12"}`}
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

      {/* Top bar — back + mute/camera */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-12 pointer-events-auto">
        <button
          onClick={(e) => { e.stopPropagation(); window.history.back(); }}
          className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
          className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-4.5 h-4.5 text-white" /> : <Volume2 className="w-4.5 h-4.5 text-white" />}
        </button>
      </div>

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

      {/* Right sidebar — actions */}
      <div className="absolute right-3 bottom-64 z-10 flex flex-col items-center gap-5 pointer-events-auto">
        {/* Heart */}
        <button
          onClick={(e) => { e.stopPropagation(); handleLike(); }}
          className="flex flex-col items-center gap-1"
          aria-label={liked ? "Unlike" : "Like"}
        >
          <Heart className={`w-7 h-7 drop-shadow-lg ${liked ? "text-red-500" : "text-white"}`} fill={liked ? "currentColor" : "none"} />
          <span className={`text-[11px] font-bold ${liked ? "text-red-400" : "text-white"}`}>{formatCount(likeCount)}</span>
        </button>

        {/* Comment */}
        <button
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center gap-1"
          aria-label="Comments"
        >
          <MessageCircle className="w-7 h-7 text-white drop-shadow-lg" />
          <span className="text-[11px] font-bold text-white">{formatCount(commentCount)}</span>
        </button>

        {/* Bookmark */}
        <button
          onClick={(e) => { e.stopPropagation(); setBookmarked(!bookmarked); }}
          className="flex flex-col items-center gap-1"
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
        >
          <Bookmark className={`w-7 h-7 drop-shadow-lg ${bookmarked ? "text-accent" : "text-white"}`} fill={bookmarked ? "currentColor" : "none"} />
          <span className="text-[11px] font-bold text-white">{formatCount(bookmarkCount)}</span>
        </button>

        {/* Share */}
        <button
          onClick={(e) => { e.stopPropagation(); handleShare(); }}
          className="flex flex-col items-center gap-1"
          aria-label="Share"
        >
          <Share2 className="w-7 h-7 text-white drop-shadow-lg" />
          <span className="text-[11px] font-bold text-white">{formatCount(shareCount)}</span>
        </button>
      </div>

      {/* Bottom left — creator info */}
      <div className="absolute left-4 bottom-44 z-10 max-w-[70%] pointer-events-auto">
        {/* Creator row */}
        <div className="flex items-center gap-2.5 mb-2">
          <img
            src={video.channelAvatar}
            alt={video.channelName}
            className="w-10 h-10 rounded-full object-cover border-2 border-white/50"
          />
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">@{video.channelName.toLowerCase().replace(/\s+/g, '_')}</span>
            <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </span>
          </div>
          {!following && (
            <button
              onClick={(e) => { e.stopPropagation(); setFollowing(true); }}
              className="px-3 py-1 rounded-md bg-white/20 backdrop-blur-sm text-white text-xs font-semibold border border-white/30"
            >
              Follow
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-white/90 text-[13px] leading-snug mb-3 line-clamp-2">
          {video.description}
        </p>

        {/* Music pill */}
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 w-fit">
          <Music className="w-3.5 h-3.5 text-white/70" />
          <span className="text-white/80 text-[11px] font-medium">Loop Mode (instrumental)</span>
        </div>
      </div>

      {/* Bottom comment bar */}
      <div className="absolute bottom-24 left-4 right-4 z-20 flex items-center gap-2 pointer-events-auto safe-area-pb">
        <button onClick={(e) => e.stopPropagation()} className="w-9 h-9 flex items-center justify-center">
          <SmilePlus className="w-5 h-5 text-white/60" />
        </button>
        <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2.5 flex items-center">
          <input
            type="text"
            placeholder="Add a comment..."
            className="bg-transparent text-white text-sm placeholder:text-white/40 outline-none w-full"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <button onClick={(e) => e.stopPropagation()} className="w-9 h-9 flex items-center justify-center">
          <Send className="w-5 h-5 text-white/60" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 h-0.5 bg-white/10">
        <div className="h-full bg-white/70 transition-[width] duration-100" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

export default FeedVideoPlayer;
