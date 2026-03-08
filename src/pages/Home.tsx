import { useRef, useState, useEffect, useCallback } from "react";
import FeedVideoPlayer from "@/components/video/FeedVideoPlayer";
import { FEED_VIDEOS } from "@/lib/feedVideoData";
import BottomNav from "@/components/BottomNav";
import { Home as HomeIcon, Compass, Heart, Play, CalendarDays, ShoppingBag, User } from "lucide-react";

const desktopNavItems = [
  { icon: HomeIcon, label: "For You", path: "/home", active: true },
  { icon: Compass, label: "Discover", path: "/explore" },
  { icon: Heart, label: "Connect", path: "/discover" },
  { icon: CalendarDays, label: "Events", path: "/events" },
  { icon: ShoppingBag, label: "Shop", path: "/shop" },
  { icon: User, label: "Profile", path: "/profile" },
];

const Home = () => {
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
    <div className="fixed inset-0 bg-black z-30">
      {/* "Watch" label */}
      <div className="absolute top-12 left-0 right-0 z-30 flex justify-center pointer-events-none">
        <h1 className="text-white text-sm font-bold tracking-wider uppercase drop-shadow-lg">Watch</h1>
      </div>

      <div
        ref={containerRef}
        className="h-full pb-20 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
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

      {/* Mobile: standard BottomNav */}
      <BottomNav />

      {/* Desktop: always-visible bottom nav (since BottomNav is md:hidden) */}
      <nav
        className="hidden md:block fixed bottom-0 left-0 right-0 z-50 px-3 pb-2"
        role="navigation"
        aria-label="Desktop navigation"
      >
        <div className="flex justify-around items-center h-16 bg-card/90 backdrop-blur-md rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-border/20 max-w-2xl mx-auto">
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = !!item.active;
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => { e.preventDefault(); window.location.href = item.path; }}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 rounded-[2rem] mx-0.5 ${
                  isActive ? "bg-accent text-accent-foreground" : ""
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? "text-accent-foreground" : "text-foreground/40"}`}
                  fill={isActive ? "currentColor" : "none"}
                />
                <span className={`text-[10px] tracking-wider mt-1 ${isActive ? "text-accent-foreground font-semibold" : "text-foreground/40"}`}>
                  {item.label}
                </span>
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Home;
