import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Play } from "lucide-react";
import { useConnectionQuality } from "@/hooks/useConnectionQuality";

interface LazyVideoProps {
  src: string;
  poster?: string;
  className?: string;
  wrapperClassName?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  /** Preload strategy — defaults to connection-aware */
  preload?: "none" | "metadata" | "auto";
}

/**
 * Connection-aware lazy video player.
 * - On slow connections: shows poster + play button, loads video only on tap.
 * - On fast connections: preloads metadata for quick start.
 * - Uses IntersectionObserver to defer loading until in viewport.
 */
const LazyVideo = ({
  src,
  poster,
  className,
  wrapperClassName,
  autoPlay = false,
  muted = true,
  loop = false,
  controls = true,
  preload,
}: LazyVideoProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [error, setError] = useState(false);
  const quality = useConnectionQuality();

  // Connection-aware preload strategy
  const effectivePreload = preload ?? (
    quality === "slow" || quality === "offline" ? "none" :
    quality === "medium" ? "metadata" :
    "metadata"
  );

  // On slow connections, don't auto-load video — wait for user tap
  const slowConnection = quality === "slow" || quality === "offline";

  // IntersectionObserver: only render video when near viewport
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { rootMargin: "200px 0px", threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto-trigger load on fast connections when visible
  useEffect(() => {
    if (isVisible && !slowConnection) {
      setShouldLoad(true);
    }
  }, [isVisible, slowConnection]);

  const handlePlay = () => {
    setShouldLoad(true);
    // Small delay to let video element mount, then play
    setTimeout(() => {
      videoRef.current?.play().catch(() => {});
    }, 100);
  };

  return (
    <div
      ref={wrapperRef}
      className={cn("relative overflow-hidden bg-black", wrapperClassName)}
    >
      {/* Skeleton while not visible */}
      {!isVisible && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}

      {/* Poster + play button on slow connections */}
      {isVisible && !shouldLoad && (
        <button
          onClick={handlePlay}
          className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/20 z-10 cursor-pointer group"
          aria-label="Play video"
        >
          {poster && (
            <img
              src={poster}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          )}
          <div className="relative z-10 w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-7 h-7 text-black ml-1" />
          </div>
        </button>
      )}

      {/* Video element — only rendered when should load */}
      {isVisible && shouldLoad && !error && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          preload={effectivePreload}
          autoPlay={autoPlay && !slowConnection}
          muted={muted}
          loop={loop}
          controls={controls}
          playsInline
          onLoadedData={() => setIsLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
        />
      )}

      {/* Loading spinner while video is loading */}
      {shouldLoad && !isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-sm">Video unavailable</span>
        </div>
      )}
    </div>
  );
};

export { LazyVideo };
