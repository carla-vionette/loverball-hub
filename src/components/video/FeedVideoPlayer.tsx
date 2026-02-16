import { useRef, useEffect, useState, useCallback } from "react";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Bookmark, Send } from "lucide-react";
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

const MOCK_COMMENTS = [
  { name: "Grace Morgan", text: "Great point played!", avatar: "GM" },
  { name: "Luke Anderson", text: "Insane backhand shot!", avatar: "LA" },
  { name: "Ryan Mitchell", text: "Your style is perfect!", avatar: "RM" },
  { name: "Emma Collins", text: "She's on fire!", avatar: "EC" },
];

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
  const [commentText, setCommentText] = useState("");
  const [doubleTapSide, setDoubleTapSide] = useState<"left" | "right" | null>(null);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const playPauseTimeout = useRef<ReturnType<typeof setTimeout>>();

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
      // Don't handle taps on interactive elements
      const target = e.target as HTMLElement;
      if (target.closest("button") || target.closest("input")) return;

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

  const handleLike = () => {
    if (liked) { setLiked(false); setLikeCount((c) => c - 1); }
    else { setLiked(true); setLikeCount((c) => c + 1); }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: video.title, url: window.location.href }); } catch {}
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden select-none"
      onClick={handleTap}
    >
      {/* Video — force vertical crop */}
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

      {/* Center play button (large, translucent — like reference) */}
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

      {/* Top bar — Live badge, view count, mute/close */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4 pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Play className="w-3 h-3 text-white" fill="currentColor" />
            <span className="text-xs font-semibold text-white">{formatCount(video.views)}</span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
          className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

      {/* Right sidebar — avatar + actions */}
      <div className="absolute right-3 bottom-44 z-10 flex flex-col items-center gap-5 pointer-events-auto">
        {/* Creator avatar */}
        <div className="relative mb-2">
          <img
            src={video.channelAvatar}
            alt={video.channelName}
            className="w-12 h-12 rounded-full object-cover border-2 border-white/40"
          />
          {!following && (
            <button
              onClick={(e) => { e.stopPropagation(); setFollowing(true); }}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-accent flex items-center justify-center"
            >
              <span className="text-accent-foreground text-xs font-bold leading-none">+</span>
            </button>
          )}
        </div>

        {/* Heart */}
        <button onClick={(e) => { e.stopPropagation(); handleLike(); }} className="flex flex-col items-center gap-1">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${liked ? "bg-red-500/20" : "bg-white/10 backdrop-blur-sm"}`}>
            <Heart className={`w-6 h-6 ${liked ? "text-red-500" : "text-white"}`} fill={liked ? "currentColor" : "none"} />
          </div>
          <span className={`text-[11px] font-semibold ${liked ? "text-red-400" : "text-white/80"}`}>{formatCount(likeCount)}</span>
        </button>

        {/* Comments */}
        <button className="flex flex-col items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-[11px] font-semibold text-white/80">5421</span>
        </button>

        {/* Share */}
        <button onClick={(e) => { e.stopPropagation(); handleShare(); }} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-[11px] font-semibold text-white/80">{formatCount(Math.floor(video.views * 0.012))}</span>
        </button>

        {/* Bookmark */}
        <button onClick={(e) => { e.stopPropagation(); setBookmarked(!bookmarked); }} className="flex flex-col items-center gap-1">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${bookmarked ? "bg-accent/30" : "bg-white/10 backdrop-blur-sm"}`}>
            <Bookmark className={`w-6 h-6 ${bookmarked ? "text-accent" : "text-white"}`} fill={bookmarked ? "currentColor" : "none"} />
          </div>
        </button>
      </div>

      {/* Bottom-left: scrolling comments overlay */}
      <div className="absolute bottom-28 left-4 right-20 z-10 space-y-2.5 pointer-events-none">
        {MOCK_COMMENTS.map((comment, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 + 0.3 }}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-white">{comment.avatar}</span>
            </div>
            <div>
              <span className="text-xs font-bold text-white">{comment.name}</span>
              <p className="text-xs text-white/70">{comment.text}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom: comment input */}
      <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-auto">
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2.5">
          <input
            type="text"
            placeholder="Type your comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/40 outline-none"
          />
          <button
            onClick={(e) => { e.stopPropagation(); setCommentText(""); }}
            className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4 text-accent-foreground" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 h-0.5 bg-white/10">
        <div className="h-full bg-accent transition-[width] duration-100" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

export default FeedVideoPlayer;
