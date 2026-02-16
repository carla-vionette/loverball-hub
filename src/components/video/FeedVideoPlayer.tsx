import { useRef, useEffect, useState, useCallback } from "react";
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal, Volume2, VolumeX, Maximize, Play, Pause, Bookmark, PictureInPicture2 } from "lucide-react";
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

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const FeedVideoPlayer = ({ video, isActive, isMuted, onToggleMute }: FeedVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showPlayPause, setShowPlayPause] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [following, setFollowing] = useState(video.isFollowing ?? false);
  const [likeCount, setLikeCount] = useState(video.likes);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loading, setLoading] = useState(true);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const [doubleTapSide, setDoubleTapSide] = useState<"left" | "right" | null>(null);
  const playPauseTimeout = useRef<ReturnType<typeof setTimeout>>();
  const milestonesHit = useRef(new Set<number>());

  // Auto-play/pause based on active state
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (isActive) {
      vid.play().catch(() => {});
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  // Mute sync
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  // Playback speed sync
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  // Progress & buffering tracking
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onTime = () => {
      if (vid.duration) {
        const pct = (vid.currentTime / vid.duration) * 100;
        setProgress(pct);
        setCurrentTime(vid.currentTime);
        // Milestone tracking
        for (const m of [25, 50, 75, 100]) {
          if (pct >= m && !milestonesHit.current.has(m)) {
            milestonesHit.current.add(m);
          }
        }
      }
    };
    const onMeta = () => { setDuration(vid.duration); setLoading(false); };
    const onBuffer = () => {
      if (vid.buffered.length > 0) setBuffered((vid.buffered.end(vid.buffered.length - 1) / vid.duration) * 100);
    };
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    vid.addEventListener("timeupdate", onTime);
    vid.addEventListener("loadedmetadata", onMeta);
    vid.addEventListener("progress", onBuffer);
    vid.addEventListener("waiting", onWaiting);
    vid.addEventListener("canplay", onCanPlay);
    return () => {
      vid.removeEventListener("timeupdate", onTime);
      vid.removeEventListener("loadedmetadata", onMeta);
      vid.removeEventListener("progress", onBuffer);
      vid.removeEventListener("waiting", onWaiting);
      vid.removeEventListener("canplay", onCanPlay);
    };
  }, []);

  const togglePlayPause = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().catch(() => {});
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
    setShowPlayPause(true);
    if (playPauseTimeout.current) clearTimeout(playPauseTimeout.current);
    playPauseTimeout.current = setTimeout(() => setShowPlayPause(false), 800);
  }, []);

  const handleTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
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
        if (isLeft) {
          vid.currentTime = Math.max(0, vid.currentTime - 10);
          setDoubleTapSide("left");
        } else if (isRight) {
          vid.currentTime = Math.min(vid.duration || 0, vid.currentTime + 10);
          setDoubleTapSide("right");
        }
        setTimeout(() => setDoubleTapSide(null), 600);
        lastTapRef.current = { time: 0, x: 0 };
      } else {
        lastTapRef.current = { time: now, x: relX };
        setTimeout(() => {
          if (lastTapRef.current.time === now) {
            togglePlayPause();
          }
        }, 300);
      }
    },
    [togglePlayPause]
  );

  const handleLike = () => {
    if (liked) { setLiked(false); setLikeCount((c) => c - 1); }
    else { setLiked(true); setDisliked(false); setLikeCount((c) => c + 1); }
  };
  const handleDislike = () => {
    if (disliked) setDisliked(false);
    else { setDisliked(true); if (liked) { setLiked(false); setLikeCount((c) => c - 1); } }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: video.title, text: video.description, url: window.location.href }); } catch {}
    } else setShowShareModal(true);
  };

  const handleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const handlePiP = async () => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await vid.requestPictureInPicture();
    } catch {}
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const vid = videoRef.current;
    if (!vid || !vid.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    vid.currentTime = pct * vid.duration;
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden select-none"
      onClick={handleTap}
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
        className="absolute inset-0 w-full h-full object-contain bg-black"
      />

      {/* Loading spinner */}
      <AnimatePresence>
        {loading && isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Double-tap indicators */}
      <AnimatePresence>
        {doubleTapSide && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className={`absolute top-1/2 -translate-y-1/2 z-20 ${
              doubleTapSide === "left" ? "left-12" : "right-12"
            }`}
          >
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium font-sans">
              {doubleTapSide === "left" ? "−10s" : "+10s"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play/Pause indicator */}
      <AnimatePresence>
        {showPlayPause && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {isPlaying ? (
                <Pause className="w-7 h-7 text-white" fill="currentColor" />
              ) : (
                <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

      {/* Channel info + description — bottom left */}
      <div className="absolute bottom-20 left-4 right-20 z-10 pointer-events-auto">
        <div className="flex items-center gap-2.5 mb-3">
          <img
            src={video.channelAvatar}
            alt={video.channelName}
            className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
          />
          <span className="text-sm font-bold text-white font-sans">{video.channelName}</span>
          <button
            onClick={(e) => { e.stopPropagation(); setFollowing(!following); }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors font-sans ${
              following ? "bg-white/20 text-white" : "bg-accent text-accent-foreground"
            }`}
          >
            {following ? "Following" : "Follow"}
          </button>
        </div>
        <h3 className="text-base font-bold text-white leading-tight mb-1">{video.title}</h3>
        <p className="text-xs text-white/70 line-clamp-2 font-sans">{video.description}</p>
        <div className="flex items-center gap-2 mt-2 text-[10px] text-white/50 font-sans">
          {video.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      </div>

      {/* Action sidebar — right */}
      <div className="absolute right-3 bottom-24 z-10 flex flex-col items-center gap-4 pointer-events-auto">
        {/* Like */}
        <button onClick={(e) => { e.stopPropagation(); handleLike(); }} className="flex flex-col items-center gap-1">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${liked ? "bg-accent/30" : "bg-white/10 backdrop-blur-sm"}`}>
            <ThumbsUp className={`w-5 h-5 ${liked ? "text-accent" : "text-white"}`} fill={liked ? "currentColor" : "none"} />
          </div>
          <span className={`text-[10px] font-medium font-sans ${liked ? "text-accent" : "text-white/70"}`}>{formatCount(likeCount)}</span>
        </button>

        {/* Dislike */}
        <button onClick={(e) => { e.stopPropagation(); handleDislike(); }} className="flex flex-col items-center gap-1">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${disliked ? "bg-destructive/20" : "bg-white/10 backdrop-blur-sm"}`}>
            <ThumbsDown className={`w-5 h-5 ${disliked ? "text-destructive" : "text-white"}`} fill={disliked ? "currentColor" : "none"} />
          </div>
        </button>

        {/* Share */}
        <button onClick={(e) => { e.stopPropagation(); handleShare(); }} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] text-white/70 font-sans">Share</span>
        </button>

        {/* Bookmark */}
        <button onClick={(e) => { e.stopPropagation(); setBookmarked(!bookmarked); }} className="flex flex-col items-center gap-1">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${bookmarked ? "bg-accent/30" : "bg-white/10 backdrop-blur-sm"}`}>
            <Bookmark className={`w-5 h-5 ${bookmarked ? "text-accent" : "text-white"}`} fill={bookmarked ? "currentColor" : "none"} />
          </div>
          <span className="text-[10px] text-white/70 font-sans">Save</span>
        </button>

        {/* Mute */}
        <button onClick={(e) => { e.stopPropagation(); onToggleMute(); }} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
          </div>
        </button>

        {/* Speed */}
        <div className="relative">
          <button onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); }} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <span className="text-xs font-bold text-white font-sans">{playbackSpeed}x</span>
            </div>
          </button>
          <AnimatePresence>
            {showSpeedMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-full mr-2 bottom-0 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-1 min-w-[80px] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {PLAYBACK_SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setPlaybackSpeed(s); setShowSpeedMenu(false); }}
                    className={`w-full text-center px-3 py-2 text-xs rounded-xl transition-colors font-sans ${
                      playbackSpeed === s ? "bg-accent/30 text-accent font-bold" : "text-white hover:bg-white/10"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PiP */}
        {document.pictureInPictureEnabled && (
          <button onClick={(e) => { e.stopPropagation(); handlePiP(); }} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <PictureInPicture2 className="w-5 h-5 text-white" />
            </div>
          </button>
        )}

        {/* Fullscreen */}
        <button onClick={(e) => { e.stopPropagation(); handleFullscreen(); }} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Maximize className="w-5 h-5 text-white" />
          </div>
        </button>
      </div>

      {/* Progress bar — bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-auto px-0">
        {/* Time display */}
        <div className="flex items-center justify-between px-4 pb-1">
          <span className="text-[10px] text-white/50 font-mono font-sans">{formatTime(currentTime)}</span>
          <span className="text-[10px] text-white/50 font-mono font-sans">{formatTime(duration)}</span>
        </div>
        <div
          className="h-1.5 bg-white/10 cursor-pointer group"
          onClick={(e) => { e.stopPropagation(); handleProgressClick(e); }}
        >
          {/* Buffered */}
          <div className="absolute bottom-0 h-1.5 bg-white/20 rounded-none" style={{ width: `${buffered}%` }} />
          {/* Progress */}
          <div className="absolute bottom-0 h-1.5 bg-accent transition-[width] duration-100" style={{ width: `${progress}%` }} />
          {/* Handle */}
          <div
            className="absolute bottom-0 w-3 h-3 bg-accent rounded-full -translate-x-1/2 -translate-y-[3px] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            style={{ left: `${progress}%` }}
          />
        </div>
      </div>

      {/* Share Modal (fallback) */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-end justify-center bg-background/60 backdrop-blur-sm pointer-events-auto"
            onClick={(e) => { e.stopPropagation(); setShowShareModal(false); }}
          >
            <motion.div
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              className="w-full max-w-md bg-card rounded-t-2xl p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-muted rounded-full mx-auto" />
              <h3 className="text-base font-bold text-foreground text-center">Share Video</h3>
              <div className="grid grid-cols-4 gap-4">
                {["Copy Link", "Twitter", "Instagram", "Messages"].map((platform) => (
                  <button
                    key={platform}
                    onClick={() => {
                      if (platform === "Copy Link") navigator.clipboard?.writeText(window.location.href);
                      setShowShareModal(false);
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Share2 className="w-4 h-4 text-foreground" />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-sans">{platform}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeedVideoPlayer;
