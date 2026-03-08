import React, { useRef, useState, useEffect, useCallback } from "react";
import FeedVideoPlayer from "@/components/video/FeedVideoPlayer";
import { FEED_VIDEOS } from "@/lib/feedVideoData";
import BottomNav from "@/components/BottomNav";
import { Home as HomeIcon, Compass, Heart, Play, Newspaper, CalendarDays, ShoppingBag, User, Settings, Search, MessageCircle } from "lucide-react";
import loverballLogo from "@/assets/loverball-script-logo.png";

const sidebarLinks = [
  { icon: HomeIcon, label: "For You", path: "/home" },
  { icon: Compass, label: "Discover", path: "/explore" },
  { icon: Heart, label: "Connect", path: "/discover" },
  { icon: Play, label: "Watch", path: "/watch" },
  { icon: Newspaper, label: "Feed", path: "/feed" },
  { icon: CalendarDays, label: "Events", path: "/events" },
  { icon: ShoppingBag, label: "Shop", path: "/shop" },
];

const secondaryLinks = [
  { icon: MessageCircle, label: "DMs", path: "/dms" },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: Search, label: "Search", path: "/search" },
];

const goTo = (path: string) => { window.location.href = path; };

const HomeSidebar = () => (
  <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-card/60 backdrop-blur-sm border-r border-border/20 flex-col z-50">
    <div className="p-4 border-b border-border/20 flex items-center justify-center">
      <a href="/" className="rounded-lg">
        <img src={loverballLogo} alt="Loverball logo" className="h-20 w-auto object-contain" />
      </a>
    </div>
    <nav className="flex-1 py-3 flex flex-col">
      <div className="space-y-0.5">
        {sidebarLinks.map((item) => {
          const Icon = item.icon;
          const active = item.path === "/home";
          return (
            <a
              key={item.path}
              href={item.path}
              onClick={(e) => { e.preventDefault(); goTo(item.path); }}
              className={`flex items-center gap-3 px-5 py-2.5 mx-3 rounded-2xl transition-all duration-200 ${
                active
                  ? "text-accent-foreground font-semibold bg-accent"
                  : "text-foreground/50 hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm tracking-wide">{item.label}</span>
            </a>
          );
        })}
      </div>
      <div className="flex-1" />
      <div className="space-y-0.5 border-t border-border/20 pt-3">
        {secondaryLinks.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.path}
              href={item.path}
              onClick={(e) => { e.preventDefault(); goTo(item.path); }}
              className="flex items-center gap-3 px-5 py-2.5 mx-3 rounded-2xl transition-all duration-200 text-foreground/50 hover:text-foreground hover:bg-secondary/50"
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm tracking-wide">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  </aside>
);

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

  useEffect(() => {
    if (activeIndex >= videos.length - 2) {
      const shuffled = [...FEED_VIDEOS]
        .sort(() => Math.random() - 0.5)
        .map((v, i) => ({ ...v, id: `${v.id}_${videos.length + i}` }));
      setVideos((prev) => [...prev, ...shuffled]);
    }
  }, [activeIndex, videos.length]);

  return (
    <>
      <HomeSidebar />
      <div className="fixed inset-0 md:left-64 bg-black z-30">
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
        <BottomNav />
      </div>
    </>
  );
};

export default Home;
