import { useRef, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Bookmark, Music, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { FeedVideoItem } from "@/lib/feedVideoData";
import { trackVideoProgress, trackVideoComplete } from "@/lib/analytics";
import { useConnectionQuality } from "@/hooks/useConnectionQuality";

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

  const lastTapRef = useRef<number>(0);
  const playPauseTimeout = useRef<ReturnType<typeof setTimeout>>();

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
      if (now - lastTapRef.current < 300) {
        // double tap = like
        if (!liked) { setLiked(true); setLikeCount(c => c + 1); }
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
        setTimeout(() => { if (lastTapRef.current === now) togglePlayPause(); }, 300);
      }
    },
    [togglePlayPause, liked]
  );

  const handleLike = () => {
    if (liked) { setLiked(false); setLikeCount(c => c - 1); }
    else { setLiked(true); setLikeCount(c => c + 1); }
  };

  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<{ id: string; text: string; user: string; time: string }[]>([]);
  const [showComments, setShowComments] = useState(false);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/home`;
    if (navigator.share) {
      try { await navigator.share({ title: video.title, url: shareUrl }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
      } catch {}
    }
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    setComments(prev => [...prev, { id: Date.now().toString(), text: commentText.trim(), user: "You", time: "now" }]);
    setCommentText("");
  };

  useEffect(() => {
    if (!isActive) return;
    const handleKey = (e: KeyboardEvent) => {
      const vid = videoRef.current;
      if (!vid) return;
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); togglePlayPause(); break;
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

  const handle = `@${video.channelName.toLowerCase().replace(/\s+/g, '')}`;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden select-none"
      onClick={handleTap}
      role="region"
      aria-label={`Video: ${video.title} by ${video.channelName}`}
    >
      {/* Video — full bleed */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        poster={video.thumbnail}
        loop
        playsInline
        muted={isMuted}
        preload={isActive ? "metadata" : "none"}
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isPlaying ? 'Playing' : 'Paused'}: {video.title} by {video.channelName}.
      </div>

      {/* Center play/pause overlay */}
      <AnimatePresence>
        {showPlayPause && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
          >
            <div className="w-16 h-16 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center">
              {isPlaying ? (
                <div className="flex gap-1">
                  <div className="w-1.5 h-6 bg-white rounded-full" />
                  <div className="w-1.5 h-6 bg-white rounded-full" />
                </div>
              ) : (
                <Play className="w-7 h-7 text-white ml-0.5" fill="currentColor" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mute button — top right, minimal */}
      <div className="absolute top-14 right-3 z-20 pointer-events-auto">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
          className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Bottom gradient for text legibility */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

      {/* Right sidebar — TikTok action buttons */}
      <div className="absolute right-2.5 bottom-36 z-10 flex flex-col items-center gap-5 pointer-events-auto">
        {/* Profile avatar */}
        <button
          onClick={(e) => { e.stopPropagation(); if (!following) setFollowing(true); }}
          className="relative mb-2"
          aria-label={following ? video.channelName : `Follow ${video.channelName}`}
        >
          <img
            src={video.channelAvatar}
            alt={video.channelName}
            loading="lazy"
            className="w-11 h-11 rounded-full object-cover border-2 border-white"
          />
          {!following && (
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold leading-none">+</span>
          )}
        </button>

        {/* Heart */}
        <button
          onClick={(e) => { e.stopPropagation(); handleLike(); }}
          className="flex flex-col items-center gap-0.5"
          aria-label={liked ? "Unlike" : "Like"}
        >
          <Heart
            className={`w-7 h-7 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] ${liked ? "text-red-500" : "text-white"}`}
            fill={liked ? "currentColor" : "none"}
            strokeWidth={2}
          />
          <span className="text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{formatCount(likeCount)}</span>
        </button>

        {/* Comment */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
          className="flex flex-col items-center gap-0.5"
          aria-label="Comments"
        >
          <MessageCircle className="w-7 h-7 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" strokeWidth={2} />
          <span className="text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{formatCount(commentCount + comments.length)}</span>
        </button>

        {/* Bookmark */}
        <button
          onClick={(e) => { e.stopPropagation(); setBookmarked(!bookmarked); }}
          className="flex flex-col items-center gap-0.5"
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
        >
          <Bookmark
            className={`w-7 h-7 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] ${bookmarked ? "text-yellow-400" : "text-white"}`}
            fill={bookmarked ? "currentColor" : "none"}
            strokeWidth={2}
          />
          <span className="text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{formatCount(bookmarkCount)}</span>
        </button>

        {/* Share */}
        <button
          onClick={(e) => { e.stopPropagation(); handleShare(); }}
          className="flex flex-col items-center gap-0.5"
          aria-label="Share"
        >
          <Share2 className="w-7 h-7 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" strokeWidth={2} />
          <span className="text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{formatCount(shareCount)}</span>
        </button>
      </div>

      {/* Bottom left — creator info + caption */}
      <div className="absolute left-3 bottom-24 z-10 max-w-[75%] pointer-events-auto">
        <p className="text-white font-bold text-[15px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] mb-0.5">
          {video.channelName}
        </p>
        <p className="text-white/90 text-[13px] leading-snug drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] line-clamp-2 mb-2.5">
          {video.description}
        </p>
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Music className="w-3 h-3 text-white/70 flex-shrink-0" />
          <p className="text-white/70 text-[11px] font-medium truncate">
            Original sound – {handle}
          </p>
        </div>
      </div>

      {/* Comments panel */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="absolute bottom-16 left-0 right-0 z-30 bg-black/95 backdrop-blur-md rounded-t-2xl max-h-[55vh] flex flex-col pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-white font-semibold text-sm">Comments ({formatCount(commentCount + comments.length)})</span>
              <button onClick={() => setShowComments(false)}><X className="w-5 h-5 text-white/60" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 min-h-[100px]">
              {comments.length === 0 && (
                <p className="text-white/40 text-sm text-center py-4">No comments yet. Be the first!</p>
              )}
              {comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">Y</div>
                  <div>
                    <span className="text-white/80 text-xs font-semibold">{c.user}</span>
                    <p className="text-white/70 text-sm">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmitComment(); } }}
                className="flex-1 bg-white/10 rounded-full px-4 py-2 text-white text-sm placeholder:text-white/40 outline-none"
                onClick={(e) => e.stopPropagation()}
              />
              <button onClick={(e) => { e.stopPropagation(); handleSubmitComment(); }}>
                <Send className={`w-5 h-5 ${commentText.trim() ? "text-primary" : "text-white/30"}`} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar — very thin at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-40 h-[2px] bg-white/10">
        <div className="h-full bg-white/80 transition-[width] duration-100" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

export default FeedVideoPlayer;
