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
  const [manualPlay, setManualPlay] = useState(false);

  const connectionQuality = useConnectionQuality();
  const isSlowNetwork = connectionQuality === "slow" || connectionQuality === "offline";
  // On slow networks, don't autoplay — require manual tap
  const shouldAutoplay = isActive && !isSlowNetwork;

  const lastTapRef = useRef<number>(0);
  const playPauseTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (isActive && (shouldAutoplay || manualPlay)) {
      vid.play().catch(() => {});
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  }, [isActive, shouldAutoplay, manualPlay]);

  // Reset manual play when scrolling away
  useEffect(() => {
    if (!isActive) setManualPlay(false);
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
      {/* Video — full bleed; on slow connections, don't load video src until manual play */}
      <video
        ref={videoRef}
        src={isSlowNetwork && !manualPlay ? undefined : video.videoUrl}
        poster={video.thumbnail || undefined}
        loop
        playsInline
        muted={isMuted}
        preload={isActive && (shouldAutoplay || manualPlay) ? "metadata" : "none"}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Slow connection: show large play button overlay instead of autoplaying */}
      {isActive && isSlowNetwork && !manualPlay && (
        <button
          onClick={(e) => { e.stopPropagation(); setManualPlay(true); }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 gap-3"
          aria-label="Tap to play video"
        >
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/40">
            <Play className="w-10 h-10 text-white ml-1" fill="currentColor" />
          </div>
          <span className="text-white/70 text-xs font-medium">Tap to play • Slow connection</span>
        </button>
      )}

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

      {/* Cinematic vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(120% 80% at 50% 30%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />

      {/* Mute button — top right, glass pill */}
      <div className="absolute z-30 pointer-events-auto" style={{ top: "calc(env(safe-area-inset-top) + 86px)", right: 14 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(20,20,21,0.55)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" style={{ color: "#F8F8F8" }} /> : <Volume2 className="w-4 h-4" style={{ color: "#F8F8F8" }} />}
        </button>
      </div>

      {/* Bottom gradient for text legibility */}
      <div className="absolute inset-x-0 bottom-0 h-[55%] pointer-events-none" style={{ background: "linear-gradient(to top, rgba(10,10,11,0.92) 0%, rgba(10,10,11,0.5) 45%, rgba(10,10,11,0) 100%)" }} />

      {/* Right rail — compact editorial actions */}
      <div className="absolute right-3 z-10 flex flex-col items-center gap-4 pointer-events-auto" style={{ bottom: 132 }}>
        {/* Creator avatar — square portrait, editorial */}
        <button
          onClick={(e) => { e.stopPropagation(); if (!following) setFollowing(true); }}
          className="relative mb-1"
          aria-label={following ? video.channelName : `Follow ${video.channelName}`}
        >
          <div
            aria-label={video.channelName}
            className="w-10 h-12 flex items-center justify-center"
            style={{
              background: "#E85D2F",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.18)",
              color: "#fff",
              fontFamily: "'Anton', Impact, sans-serif",
              fontSize: 18,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            }}
          >
            {video.channelName?.charAt(0) ?? "L"}
          </div>
          {!following && (
            <span
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-[2px] rounded-sm leading-none"
              style={{
                background: "#E85D2F",
                color: "#fff",
                fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: 800,
                fontSize: 8,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Follow
            </span>
          )}
        </button>

        {[
          {
            key: "like",
            icon: <Heart className="w-[22px] h-[22px]" fill={liked ? "currentColor" : "none"} strokeWidth={1.75} style={{ color: liked ? "#E85D2F" : "#F8F8F8" }} />,
            count: likeCount,
            onClick: handleLike,
            label: liked ? "Unlike" : "Like",
          },
          {
            key: "comment",
            icon: <MessageCircle className="w-[22px] h-[22px]" strokeWidth={1.75} style={{ color: "#F8F8F8" }} />,
            count: commentCount + comments.length,
            onClick: () => setShowComments(!showComments),
            label: "Comments",
          },
          {
            key: "bookmark",
            icon: <Bookmark className="w-[22px] h-[22px]" fill={bookmarked ? "currentColor" : "none"} strokeWidth={1.75} style={{ color: bookmarked ? "#D88C5A" : "#F8F8F8" }} />,
            count: bookmarkCount,
            onClick: () => setBookmarked(!bookmarked),
            label: bookmarked ? "Remove bookmark" : "Bookmark",
          },
          {
            key: "share",
            icon: <Share2 className="w-[22px] h-[22px]" strokeWidth={1.75} style={{ color: "#F8F8F8" }} />,
            count: shareCount,
            onClick: handleShare,
            label: "Share",
          },
        ].map((a) => (
          <button
            key={a.key}
            onClick={(e) => { e.stopPropagation(); a.onClick(); }}
            className="flex flex-col items-center gap-1"
            aria-label={a.label}
          >
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(20,20,21,0.45)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}
            >
              {a.icon}
            </span>
            <span
              style={{
                fontFamily: "'Space Mono', ui-monospace, monospace",
                fontSize: 10,
                color: "rgba(248,248,248,0.85)",
                textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                letterSpacing: "0.04em",
              }}
            >
              {formatCount(a.count)}
            </span>
          </button>
        ))}
      </div>

      {/* Bottom left — editorial caption block */}
      <div className="absolute left-4 z-10 max-w-[72%] pointer-events-auto" style={{ bottom: 108 }}>
        {/* Eyebrow: tag + handle */}
        <div className="flex items-center gap-2 mb-2">
          {video.tags?.[0] && (
            <span
              className="px-2 py-[3px] rounded-full"
              style={{
                background: "rgba(232,93,47,0.14)",
                border: "1px solid rgba(232,93,47,0.35)",
                color: "#E85D2F",
                fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: 700,
                fontSize: 9,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              {video.tags[0]}
            </span>
          )}
          <span
            style={{
              fontFamily: "'Space Mono', ui-monospace, monospace",
              fontSize: 10,
              color: "rgba(248,248,248,0.55)",
              letterSpacing: "0.04em",
            }}
          >
            {handle}
          </span>
        </div>

        {/* Display title — Anton */}
        {video.title && (
          <h3
            className="line-clamp-2 mb-1.5"
            style={{
              fontFamily: "'Anton', Impact, sans-serif",
              fontSize: 22,
              lineHeight: 1.0,
              letterSpacing: "0.005em",
              color: "#F8F8F8",
              textTransform: "uppercase",
              textShadow: "0 2px 8px rgba(0,0,0,0.6)",
              margin: 0,
            }}
          >
            {video.title}
          </h3>
        )}

        {/* Channel + description — Playfair italic byline + Inter body */}
        <p
          className="mb-1"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: 13,
            color: "rgba(248,248,248,0.85)",
            textShadow: "0 1px 3px rgba(0,0,0,0.55)",
            margin: 0,
          }}
        >
          by {video.channelName}
        </p>
        <p
          className="line-clamp-2"
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 12.5,
            lineHeight: 1.45,
            color: "rgba(248,248,248,0.72)",
            textShadow: "0 1px 2px rgba(0,0,0,0.55)",
            margin: 0,
          }}
        >
          {video.description}
        </p>

        {/* Sound row */}
        <div className="flex items-center gap-1.5 mt-2 overflow-hidden">
          <Music className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(248,248,248,0.55)" }} />
          <p
            className="truncate"
            style={{
              fontFamily: "'Space Mono', ui-monospace, monospace",
              fontSize: 10,
              color: "rgba(248,248,248,0.55)",
              letterSpacing: "0.04em",
              margin: 0,
            }}
          >
            Original sound · {handle}
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
            className="absolute bottom-20 left-3 right-3 z-30 rounded-t-3xl max-h-[55vh] flex flex-col pointer-events-auto overflow-hidden"
            style={{ background: "rgba(20,20,21,0.92)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 16, letterSpacing: "0.04em", color: "#F8F8F8", textTransform: "uppercase" }}>
                Comments · {formatCount(commentCount + comments.length)}
              </span>
              <button onClick={() => setShowComments(false)} aria-label="Close comments"><X className="w-5 h-5" style={{ color: "rgba(248,248,248,0.55)" }} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 min-h-[100px]">
              {comments.length === 0 && (
                <p className="text-center py-6" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 13, color: "rgba(248,248,248,0.5)" }}>
                  No comments yet. Be the first.
                </p>
              )}
              {comments.map(c => (
                <div key={c.id} className="flex gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(232,93,47,0.18)", color: "#E85D2F", fontFamily: "'Anton', Impact, sans-serif", fontSize: 13 }}>Y</div>
                  <div>
                    <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700, fontSize: 11, color: "rgba(248,248,248,0.85)", letterSpacing: "0.02em" }}>{c.user}</span>
                    <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13, color: "rgba(248,248,248,0.78)", margin: 0 }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmitComment(); } }}
                className="flex-1 rounded-full px-4 py-2 outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#F8F8F8", fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13 }}
                onClick={(e) => e.stopPropagation()}
              />
              <button onClick={(e) => { e.stopPropagation(); handleSubmitComment(); }} aria-label="Send comment">
                <Send className="w-5 h-5" style={{ color: commentText.trim() ? "#E85D2F" : "rgba(248,248,248,0.3)" }} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar — hairline raspberry */}
      <div className="absolute bottom-0 left-0 right-0 z-40 h-[2px]" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full transition-[width] duration-100" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #E85D2F, #D88C5A)" }} />
      </div>
    </div>
  );
};

export default FeedVideoPlayer;
