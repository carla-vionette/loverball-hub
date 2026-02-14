import { useRef, useEffect, useState, useCallback } from "react";
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal, Volume2, VolumeX, Maximize, Play, Pause } from "lucide-react";
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
  const [disliked, setDisliked] = useState(false);
  const [following, setFollowing] = useState(video.isFollowing ?? false);
  const [likeCount, setLikeCount] = useState(video.likes);
  const [showShareModal, setShowShareModal] = useState(false);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const [doubleTapSide, setDoubleTapSide] = useState<"left" | "right" | null>(null);
  const playPauseTimeout = useRef<ReturnType<typeof setTimeout>>();

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

  // Progress tracking
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onTime = () => {
      if (vid.duration) setProgress((vid.currentTime / vid.duration) * 100);
    };
    vid.addEventListener("timeupdate", onTime);
    return () => vid.removeEventListener("timeupdate", onTime);
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
        // Double tap
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
        // Delay single tap to distinguish from double tap
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
    if (liked) {
      setLiked(false);
      setLikeCount((c) => c - 1);
    } else {
      setLiked(true);
      setDisliked(false);
      setLikeCount((c) => c + 1);
    }
  };

  const handleDislike = () => {
    if (disliked) {
      setDisliked(false);
    } else {
      setDisliked(true);
      if (liked) {
        setLiked(false);
        setLikeCount((c) => c - 1);
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: video.description,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      setShowShareModal(true);
    }
  };

  const handleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const vid = videoRef.current;
    if (!vid || !vid.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    vid.currentTime = pct * vid.duration;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-background overflow-hidden select-none"
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
        className="absolute inset-0 w-full h-full object-contain bg-background"
      />

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
            <div className="bg-foreground/20 backdrop-blur-sm rounded-full px-4 py-2 text-foreground text-sm font-medium">
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
            <div className="w-16 h-16 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center">
              {isPlaying ? (
                <Pause className="w-7 h-7 text-foreground" fill="currentColor" />
              ) : (
                <Play className="w-7 h-7 text-foreground ml-1" fill="currentColor" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background/90 via-background/30 to-transparent pointer-events-none" />

      {/* Channel info + description — bottom left */}
      <div className="absolute bottom-16 left-4 right-20 z-10 pointer-events-auto">
        <div className="flex items-center gap-2.5 mb-3">
          <img
            src={video.channelAvatar}
            alt={video.channelName}
            className="w-10 h-10 rounded-full object-cover border-2 border-foreground/20"
          />
          <span className="text-sm font-bold text-foreground">{video.channelName}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFollowing(!following);
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              following
                ? "bg-secondary text-muted-foreground"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {following ? "Following" : "Follow"}
          </button>
        </div>
        <h3 className="text-base font-bold text-foreground leading-tight mb-1">{video.title}</h3>
        <p className="text-xs text-foreground/70 line-clamp-2">{video.description}</p>
        <div className="flex items-center gap-2 mt-2 text-[10px] text-foreground/50">
          {video.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      </div>

      {/* Action sidebar — right */}
      <div className="absolute right-3 bottom-24 z-10 flex flex-col items-center gap-5 pointer-events-auto">
        {/* Like */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLike();
          }}
          className="flex flex-col items-center gap-1"
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
              liked ? "bg-blue-500/20" : "bg-foreground/10 backdrop-blur-sm"
            }`}
          >
            <ThumbsUp
              className={`w-5 h-5 ${liked ? "text-blue-400" : "text-foreground"}`}
              fill={liked ? "currentColor" : "none"}
            />
          </div>
          <span className={`text-[10px] font-medium ${liked ? "text-blue-400" : "text-foreground/70"}`}>
            {formatCount(likeCount)}
          </span>
        </button>

        {/* Dislike */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDislike();
          }}
          className="flex flex-col items-center gap-1"
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
              disliked ? "bg-red-500/20" : "bg-foreground/10 backdrop-blur-sm"
            }`}
          >
            <ThumbsDown
              className={`w-5 h-5 ${disliked ? "text-red-400" : "text-foreground"}`}
              fill={disliked ? "currentColor" : "none"}
            />
          </div>
        </button>

        {/* Share */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleShare();
          }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-11 h-11 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-5 h-5 text-foreground" />
          </div>
          <span className="text-[10px] text-foreground/70">Share</span>
        </button>

        {/* Mute */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-11 h-11 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center">
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-foreground" />
            ) : (
              <Volume2 className="w-5 h-5 text-foreground" />
            )}
          </div>
        </button>

        {/* Fullscreen */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleFullscreen();
          }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-11 h-11 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center">
            <Maximize className="w-5 h-5 text-foreground" />
          </div>
        </button>

        {/* More */}
        <button
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-11 h-11 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center">
            <MoreHorizontal className="w-5 h-5 text-foreground" />
          </div>
        </button>
      </div>

      {/* Progress bar — bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 bg-foreground/10 z-20 cursor-pointer pointer-events-auto"
        onClick={(e) => {
          e.stopPropagation();
          handleProgressClick(e);
        }}
      >
        <div
          className="h-full bg-primary transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Share Modal (fallback for non-native) */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-end justify-center bg-background/60 backdrop-blur-sm pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              setShowShareModal(false);
            }}
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
                      if (platform === "Copy Link") {
                        navigator.clipboard?.writeText(window.location.href);
                      }
                      setShowShareModal(false);
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Share2 className="w-4 h-4 text-foreground" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{platform}</span>
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
