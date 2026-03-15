import { useRef, useState, useEffect, useCallback } from "react";
import FeedVideoPlayer from "@/components/video/FeedVideoPlayer";
import { FEED_VIDEOS } from "@/lib/feedVideoData";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";

const Explore = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [videos, setVideos] = useState(FEED_VIDEOS);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const videoRefs = useRef<Map<number, HTMLDivElement>>(new Map());

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
      { root: containerRef.current, threshold: 0.6 }
    );
    return () => observerRef.current?.disconnect();
  }, []);

  const setVideoRef = useCallback((el: HTMLDivElement | null, index: number) => {
    if (el) {
      videoRefs.current.set(index, el);
      observerRef.current?.observe(el);
    }
  }, []);

  // Infinite scroll
  useEffect(() => {
    if (activeIndex >= videos.length - 2) {
      const shuffled = [...FEED_VIDEOS]
        .sort(() => Math.random() - 0.5)
        .map((v, i) => ({ ...v, id: `${v.id}_${videos.length + i}` }));
      setVideos((prev) => [...prev, ...shuffled]);
    }
  }, [activeIndex, videos.length]);

  return (
    <div className="fixed inset-0 bg-black z-30 md:left-64">
      {/* Desktop nav for sidebar */}
      <DesktopNav />

      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
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

      {/* Bottom nav overlays video */}
      <BottomNav />
    </div>
  );
};

export default Explore;
