import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import FeedVideoPlayer from "@/components/video/FeedVideoPlayer";
import { FEED_VIDEOS } from "@/lib/feedVideoData";

const VideoFeed = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [videos, setVideos] = useState(FEED_VIDEOS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const videoRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Intersection Observer for detecting which video is in view
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const idx = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(idx)) setActiveIndex(idx);
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.6,
      }
    );

    return () => observerRef.current?.disconnect();
  }, []);

  // Observe video elements
  const setVideoRef = useCallback((el: HTMLDivElement | null, index: number) => {
    if (el) {
      videoRefs.current.set(index, el);
      observerRef.current?.observe(el);
    }
  }, []);

  // Infinite scroll — load more when near end
  useEffect(() => {
    if (activeIndex >= videos.length - 2) {
      // Shuffle and append more videos
      const shuffled = [...FEED_VIDEOS]
        .sort(() => Math.random() - 0.5)
        .map((v, i) => ({
          ...v,
          id: `${v.id}_${videos.length + i}`,
        }));
      setVideos((prev) => [...prev, ...shuffled]);
    }
  }, [activeIndex, videos.length]);

  // Pull to refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    const shuffled = [...FEED_VIDEOS].sort(() => Math.random() - 0.5);
    setTimeout(() => {
      setVideos(shuffled);
      setActiveIndex(0);
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <div className="video-theme fixed inset-0 bg-background z-50 flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-background/80 to-transparent pointer-events-auto">
        <Link to="/watch" className="w-9 h-9 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <h1 className="text-sm font-bold text-foreground tracking-wider uppercase">Feed</h1>
        <button
          onClick={handleRefresh}
          className={`w-9 h-9 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center ${
            isRefreshing ? "animate-spin" : ""
          }`}
        >
          <RefreshCw className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* Snap scroll container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      >
        {videos.map((video, index) => (
          <div
            key={video.id}
            ref={(el) => setVideoRef(el, index)}
            data-index={index}
            className="h-screen w-full snap-start snap-always"
          >
            <FeedVideoPlayer
              video={video}
              isActive={index === activeIndex}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(!isMuted)}
            />
          </div>
        ))}
      </div>

      {/* Refreshing indicator */}
      {isRefreshing && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-card px-4 py-2 rounded-full flex items-center gap-2"
        >
          <RefreshCw className="w-3 h-3 text-primary animate-spin" />
          <span className="text-xs text-foreground">Refreshing...</span>
        </motion.div>
      )}
    </div>
  );
};

export default VideoFeed;
