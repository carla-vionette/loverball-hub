import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, PictureInPicture2,
  ChevronLeft, MoreVertical, Loader2, Rewind, FastForward,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────
interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onBack?: () => void;
  onEnded?: () => void;
  onProgress?: (percent: number) => void;
  /** Feed mode = simplified overlay; standalone = full controls */
  mode?: "feed" | "standalone";
  className?: string;
}

export interface VideoPlayerHandle {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  toggleMute: () => void;
  getVideoElement: () => HTMLVideoElement | null;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const QUALITY_OPTIONS = ["Auto", "1080p", "720p", "480p", "360p"];
const CONTROLS_TIMEOUT = 3000;
const MILESTONE_EVENTS = [25, 50, 75, 100];

// ─── Helpers ────────────────────────────────────────────
const formatTime = (s: number) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

// ─── Component ──────────────────────────────────────────
const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  (
    {
      src,
      poster,
      title,
      autoPlay = false,
      muted: initialMuted = false,
      loop = false,
      onBack,
      onEnded,
      onProgress,
      mode = "standalone",
      className = "",
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const controlsTimer = useRef<ReturnType<typeof setTimeout>>();
    const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

    // State
    const [playing, setPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(initialMuted);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [progress, setProgress] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [quality, setQuality] = useState("Auto");
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [isPiP, setIsPiP] = useState(false);
    const [doubleTapSide, setDoubleTapSide] = useState<"left" | "right" | null>(null);
    const [showPlayPause, setShowPlayPause] = useState(false);
    const [seeking, setSeeking] = useState(false);
    const [seekPreview, setSeekPreview] = useState(0);
    const milestonesHit = useRef(new Set<number>());

    // ─── Imperative Handle ──────────────────────────────
    useImperativeHandle(ref, () => ({
      play: () => videoRef.current?.play(),
      pause: () => videoRef.current?.pause(),
      seek: (t: number) => { if (videoRef.current) videoRef.current.currentTime = t; },
      toggleMute: () => setIsMuted((m) => !m),
      getVideoElement: () => videoRef.current,
    }));

    // ─── Controls visibility ────────────────────────────
    const resetControlsTimer = useCallback(() => {
      setShowControls(true);
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
      if (playing) {
        controlsTimer.current = setTimeout(() => setShowControls(false), CONTROLS_TIMEOUT);
      }
    }, [playing]);

    useEffect(() => {
      if (!playing) setShowControls(true);
      else resetControlsTimer();
    }, [playing, resetControlsTimer]);

    // ─── Video Events ───────────────────────────────────
    useEffect(() => {
      const vid = videoRef.current;
      if (!vid) return;

      const onPlay = () => setPlaying(true);
      const onPause = () => setPlaying(false);
      const onLoadedMeta = () => {
        setDuration(vid.duration);
        setLoading(false);
      };
      const onWaiting = () => setLoading(true);
      const onCanPlay = () => setLoading(false);
      const onTimeUpdate = () => {
        setCurrentTime(vid.currentTime);
        const pct = vid.duration ? (vid.currentTime / vid.duration) * 100 : 0;
        setProgress(pct);
        onProgress?.(pct);

        // Milestone tracking
        for (const m of MILESTONE_EVENTS) {
          if (pct >= m && !milestonesHit.current.has(m)) {
            milestonesHit.current.add(m);
            // Could dispatch analytics event here
          }
        }
      };
      const onProgress_ = () => {
        if (vid.buffered.length > 0) {
          setBuffered((vid.buffered.end(vid.buffered.length - 1) / vid.duration) * 100);
        }
      };
      const onEnded_ = () => {
        setPlaying(false);
        onEnded?.();
      };

      vid.addEventListener("play", onPlay);
      vid.addEventListener("pause", onPause);
      vid.addEventListener("loadedmetadata", onLoadedMeta);
      vid.addEventListener("waiting", onWaiting);
      vid.addEventListener("canplay", onCanPlay);
      vid.addEventListener("timeupdate", onTimeUpdate);
      vid.addEventListener("progress", onProgress_);
      vid.addEventListener("ended", onEnded_);

      return () => {
        vid.removeEventListener("play", onPlay);
        vid.removeEventListener("pause", onPause);
        vid.removeEventListener("loadedmetadata", onLoadedMeta);
        vid.removeEventListener("waiting", onWaiting);
        vid.removeEventListener("canplay", onCanPlay);
        vid.removeEventListener("timeupdate", onTimeUpdate);
        vid.removeEventListener("progress", onProgress_);
        vid.removeEventListener("ended", onEnded_);
      };
    }, [onEnded, onProgress]);

    // ─── Sync muted / volume ────────────────────────────
    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.muted = isMuted;
        videoRef.current.volume = volume;
      }
    }, [isMuted, volume]);

    useEffect(() => {
      if (videoRef.current) videoRef.current.playbackRate = playbackSpeed;
    }, [playbackSpeed]);

    // ─── Fullscreen ─────────────────────────────────────
    useEffect(() => {
      const onChange = () => setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener("fullscreenchange", onChange);
      return () => document.removeEventListener("fullscreenchange", onChange);
    }, []);

    const toggleFullscreen = () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current?.requestFullscreen?.();
      }
    };

    // ─── PiP ────────────────────────────────────────────
    const togglePiP = async () => {
      const vid = videoRef.current;
      if (!vid) return;
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          setIsPiP(false);
        } else {
          await vid.requestPictureInPicture();
          setIsPiP(true);
        }
      } catch {}
    };

    // ─── Play/Pause ─────────────────────────────────────
    const togglePlay = useCallback(() => {
      const vid = videoRef.current;
      if (!vid) return;
      if (vid.paused) vid.play().catch(() => {});
      else vid.pause();

      setShowPlayPause(true);
      setTimeout(() => setShowPlayPause(false), 800);
    }, []);

    // ─── Tap / Double-tap handler ───────────────────────
    const handleTap = useCallback(
      (e: React.MouseEvent) => {
        // Don't handle taps on controls
        if ((e.target as HTMLElement).closest("[data-controls]")) return;

        const now = Date.now();
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const relX = e.clientX - rect.left;
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
              if (mode === "standalone") {
                resetControlsTimer();
              } else {
                togglePlay();
              }
            }
          }, 300);
        }
      },
      [togglePlay, resetControlsTimer, mode]
    );

    // ─── Progress bar seek ──────────────────────────────
    const handleProgressInteraction = (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      const vid = videoRef.current;
      const bar = progressRef.current;
      if (!vid || !bar || !vid.duration) return;

      const rect = bar.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      vid.currentTime = pct * vid.duration;
    };

    const handleProgressHover = (e: React.MouseEvent) => {
      const bar = progressRef.current;
      if (!bar || !duration) return;
      const rect = bar.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setSeekPreview(pct * duration);
      setSeeking(true);
    };

    // ─── Keyboard controls ──────────────────────────────
    useEffect(() => {
      const handleKey = (e: KeyboardEvent) => {
        const vid = videoRef.current;
        if (!vid) return;
        switch (e.key) {
          case " ":
          case "k":
            e.preventDefault();
            togglePlay();
            break;
          case "f":
            toggleFullscreen();
            break;
          case "m":
            setIsMuted((m) => !m);
            break;
          case "ArrowLeft":
            vid.currentTime = Math.max(0, vid.currentTime - 10);
            break;
          case "ArrowRight":
            vid.currentTime = Math.min(vid.duration, vid.currentTime + 10);
            break;
          case "ArrowUp":
            e.preventDefault();
            setVolume((v) => Math.min(1, v + 0.1));
            break;
          case "ArrowDown":
            e.preventDefault();
            setVolume((v) => Math.max(0, v - 0.1));
            break;
        }
      };
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }, [togglePlay]);

    // Close menus on outside click
    useEffect(() => {
      if (!showSpeedMenu && !showQualityMenu && !showMoreMenu) return;
      const close = () => { setShowSpeedMenu(false); setShowQualityMenu(false); setShowMoreMenu(false); };
      const timer = setTimeout(() => document.addEventListener("click", close, { once: true }), 0);
      return () => clearTimeout(timer);
    }, [showSpeedMenu, showQualityMenu, showMoreMenu]);

    return (
      <div
        ref={containerRef}
        className={`relative bg-background overflow-hidden select-none group ${className}`}
        onClick={handleTap}
        onMouseMove={mode === "standalone" ? resetControlsTimer : undefined}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          playsInline
          autoPlay={autoPlay}
          muted={isMuted}
          loop={loop}
          preload="metadata"
          className="absolute inset-0 w-full h-full object-contain bg-background"
        />

        {/* Loading spinner */}
        <AnimatePresence>
          {loading && playing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
            >
              <Loader2 className="w-10 h-10 text-foreground animate-spin" />
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
              className={`absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none ${
                doubleTapSide === "left" ? "left-12" : "right-12"
              }`}
            >
              <div className="bg-foreground/20 backdrop-blur-sm rounded-full px-5 py-3 flex items-center gap-2">
                {doubleTapSide === "left" ? <Rewind className="w-4 h-4 text-foreground" /> : <FastForward className="w-4 h-4 text-foreground" />}
                <span className="text-foreground text-sm font-bold">{doubleTapSide === "left" ? "10s" : "10s"}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Play/Pause flash indicator */}
        <AnimatePresence>
          {showPlayPause && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
            >
              <div className="w-16 h-16 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center">
                {playing ? (
                  <Pause className="w-7 h-7 text-foreground" fill="currentColor" />
                ) : (
                  <Play className="w-7 h-7 text-foreground ml-1" fill="currentColor" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Controls Overlay (standalone mode) ────── */}
        {mode === "standalone" && (
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                data-controls
                className="absolute inset-0 z-10"
              >
                {/* Gradient overlays */}
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background/70 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />

                {/* Top bar */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3">
                  {onBack && (
                    <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="w-9 h-9 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center hover:bg-foreground/20 transition-colors">
                      <ChevronLeft className="w-5 h-5 text-foreground" />
                    </button>
                  )}
                  <div className="flex-1 mx-3 truncate">
                    {title && <h3 className="text-sm font-bold text-foreground truncate font-sans">{title}</h3>}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMoreMenu(!showMoreMenu); }}
                    className="w-9 h-9 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center hover:bg-foreground/20 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-foreground" />
                  </button>
                </div>

                {/* Center play button */}
                <button
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-foreground/20 backdrop-blur-md flex items-center justify-center hover:bg-foreground/30 transition-colors"
                >
                  {playing ? (
                    <Pause className="w-7 h-7 text-foreground" fill="currentColor" />
                  ) : (
                    <Play className="w-7 h-7 text-foreground ml-1" fill="currentColor" />
                  )}
                </button>

                {/* Skip buttons */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                  }}
                  className="absolute top-1/2 left-[20%] -translate-y-1/2 w-10 h-10 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center hover:bg-foreground/20 transition-colors"
                >
                  <SkipBack className="w-4 h-4 text-foreground" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (videoRef.current) videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 10);
                  }}
                  className="absolute top-1/2 right-[20%] -translate-y-1/2 w-10 h-10 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center hover:bg-foreground/20 transition-colors"
                >
                  <SkipForward className="w-4 h-4 text-foreground" />
                </button>

                {/* Bottom controls */}
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 space-y-2">
                  {/* Progress bar */}
                  <div
                    ref={progressRef}
                    className="relative h-6 flex items-center cursor-pointer group/progress"
                    onClick={(e) => { e.stopPropagation(); handleProgressInteraction(e); }}
                    onMouseMove={handleProgressHover}
                    onMouseLeave={() => setSeeking(false)}
                  >
                    <div className="absolute inset-x-0 h-1 group-hover/progress:h-1.5 bg-foreground/20 rounded-full transition-all">
                      {/* Buffered */}
                      <div className="absolute h-full bg-foreground/30 rounded-full" style={{ width: `${buffered}%` }} />
                      {/* Progress */}
                      <div className="absolute h-full bg-primary rounded-full transition-[width] duration-75" style={{ width: `${progress}%` }} />
                    </div>
                    {/* Seek handle */}
                    <div
                      className="absolute w-3 h-3 bg-primary rounded-full -translate-x-1/2 opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg"
                      style={{ left: `${progress}%` }}
                    />
                    {/* Seek preview time */}
                    {seeking && (
                      <div
                        className="absolute -top-8 -translate-x-1/2 bg-foreground/80 text-background text-[10px] font-mono font-bold px-2 py-1 rounded pointer-events-none"
                        style={{ left: `${(seekPreview / duration) * 100}%` }}
                      >
                        {formatTime(seekPreview)}
                      </div>
                    )}
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center gap-3">
                    {/* Time */}
                    <span className="text-xs text-foreground/80 font-mono tabular-nums whitespace-nowrap font-sans">
                      {formatTime(currentTime)} <span className="text-foreground/40">/</span> {formatTime(duration)}
                    </span>

                    <div className="flex-1" />

                    {/* Speed */}
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false); }}
                        className="text-xs text-foreground/80 hover:text-foreground font-bold px-2 py-1 rounded hover:bg-foreground/10 transition-colors font-sans"
                      >
                        {playbackSpeed === 1 ? "1x" : `${playbackSpeed}x`}
                      </button>
                      <AnimatePresence>
                        {showSpeedMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full right-0 mb-2 bg-card/95 backdrop-blur-xl border border-border/30 rounded-xl p-1 min-w-[100px] shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {PLAYBACK_SPEEDS.map((s) => (
                              <button
                                key={s}
                                onClick={() => { setPlaybackSpeed(s); setShowSpeedMenu(false); }}
                                className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors font-sans ${
                                  playbackSpeed === s
                                    ? "bg-primary/20 text-primary font-bold"
                                    : "text-foreground hover:bg-foreground/10"
                                }`}
                              >
                                {s}x
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Quality */}
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false); }}
                        className="text-xs text-foreground/80 hover:text-foreground font-bold px-2 py-1 rounded hover:bg-foreground/10 transition-colors font-sans"
                      >
                        {quality === "Auto" ? "HD" : quality}
                      </button>
                      <AnimatePresence>
                        {showQualityMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full right-0 mb-2 bg-card/95 backdrop-blur-xl border border-border/30 rounded-xl p-1 min-w-[110px] shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {QUALITY_OPTIONS.map((q) => (
                              <button
                                key={q}
                                onClick={() => { setQuality(q); setShowQualityMenu(false); }}
                                className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors font-sans ${
                                  quality === q
                                    ? "bg-primary/20 text-primary font-bold"
                                    : "text-foreground hover:bg-foreground/10"
                                }`}
                              >
                                {q}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Volume */}
                    <div className="group/vol relative flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                        className="p-1 hover:bg-foreground/10 rounded transition-colors"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-4 h-4 text-foreground/80" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-foreground/80" />
                        )}
                      </button>
                      <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-200">
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={isMuted ? 0 : volume}
                          onChange={(e) => {
                            e.stopPropagation();
                            setVolume(parseFloat(e.target.value));
                            if (parseFloat(e.target.value) > 0) setIsMuted(false);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full accent-primary h-1 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* PiP */}
                    {document.pictureInPictureEnabled && (
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePiP(); }}
                        className={`p-1 rounded transition-colors ${
                          isPiP ? "bg-primary/20 text-primary" : "hover:bg-foreground/10 text-foreground/80"
                        }`}
                      >
                        <PictureInPicture2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Fullscreen */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                      className="p-1 hover:bg-foreground/10 rounded transition-colors"
                    >
                      {isFullscreen ? (
                        <Minimize className="w-4 h-4 text-foreground/80" />
                      ) : (
                        <Maximize className="w-4 h-4 text-foreground/80" />
                      )}
                    </button>
                  </div>
                </div>

                {/* More menu */}
                <AnimatePresence>
                  {showMoreMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-14 right-4 bg-card/95 backdrop-blur-xl border border-border/30 rounded-xl p-2 min-w-[180px] shadow-2xl z-30"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button onClick={togglePiP} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-foreground hover:bg-foreground/10 rounded-lg transition-colors font-sans">
                        <PictureInPicture2 className="w-4 h-4" /> Picture-in-Picture
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-foreground hover:bg-foreground/10 rounded-lg transition-colors font-sans">
                        <Settings className="w-4 h-4" /> Playback Settings
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
