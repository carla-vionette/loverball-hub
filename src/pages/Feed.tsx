import { useRef, useState, useEffect, useCallback } from "react";
import FeedVideoPlayer from "@/components/video/FeedVideoPlayer";
import { FEED_VIDEOS, type FeedVideoItem } from "@/lib/feedVideoData";
import BottomNav from "@/components/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { Play } from "lucide-react";
import Seo from "@/components/Seo";
import loverballLogo from "@/assets/loverball-script-logo.png";
import FeedStoriesPanel from "@/components/FeedStoriesPanel";

type FeedTab = "foryou" | "following" | "stories";

const FeedSkeleton = () => (
  <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-4 snap-start">
    <div className="relative w-full h-full">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      {/* Fake action sidebar */}
      <div className="absolute right-3 bottom-36 flex flex-col items-center gap-5">
        <Skeleton className="w-11 h-11 rounded-full bg-white/10" />
        <Skeleton className="w-7 h-7 rounded-full bg-white/10" />
        <Skeleton className="w-7 h-7 rounded-full bg-white/10" />
        <Skeleton className="w-7 h-7 rounded-full bg-white/10" />
        <Skeleton className="w-7 h-7 rounded-full bg-white/10" />
      </div>
      {/* Fake bottom text */}
      <div className="absolute left-3 bottom-24 space-y-2">
        <Skeleton className="h-4 w-28 bg-white/10 rounded" />
        <Skeleton className="h-3 w-48 bg-white/10 rounded" />
        <Skeleton className="h-3 w-36 bg-white/10 rounded" />
      </div>
      {/* Center spinner */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
      </div>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-4 snap-start">
    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
      <Play className="w-10 h-10 text-white/40" />
    </div>
    <h2 className="text-white text-lg font-semibold">No videos yet</h2>
      <p className="text-white/50 text-sm text-center max-w-[260px]">
        Videos from creators you follow will appear here. Explore the Feed to discover content.
      </p>
  </div>
);

const Feed = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialTab: FeedTab =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("tab") === "stories"
      ? "stories"
      : "foryou";
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [activeTab, setActiveTab] = useState<FeedTab>(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const videoRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Separate feeds
  const forYouVideos = FEED_VIDEOS;
  const followingVideos = FEED_VIDEOS.filter((v) => v.isFollowing);

  const [videos, setVideos] = useState<FeedVideoItem[]>(forYouVideos);

  // Simulate initial load
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  // Switch tabs
  useEffect(() => {
    setActiveIndex(0);
    setVideos(activeTab === "following" ? followingVideos : forYouVideos);
    containerRef.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [activeTab]);

  // IntersectionObserver
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
  }, [videos]);

  const setVideoRef = useCallback((el: HTMLDivElement | null, index: number) => {
    if (el) {
      videoRefs.current.set(index, el);
      observerRef.current?.observe(el);
    }
  }, []);

  // Infinite scroll for "For You"
  useEffect(() => {
    if (activeTab !== "foryou") return;
    if (activeIndex >= videos.length - 2) {
      const shuffled = [...FEED_VIDEOS]
        .sort(() => Math.random() - 0.5)
        .map((v, i) => ({ ...v, id: `${v.id}_${videos.length + i}` }));
      setVideos((prev) => [...prev, ...shuffled]);
    }
  }, [activeIndex, videos.length, activeTab]);

  // Preload next video
  useEffect(() => {
    const nextVideo = videos[activeIndex + 1];
    if (nextVideo?.videoUrl) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "video";
      link.href = nextVideo.videoUrl;
      link.setAttribute("data-feed-preload", "true");
      // Remove old preload links
      document.querySelectorAll('link[data-feed-preload]').forEach((el) => el.remove());
      document.head.appendChild(link);
      return () => { link.remove(); };
    }
  }, [activeIndex, videos]);

  const currentVideos = videos;
  const isEmpty = !isLoading && currentVideos.length === 0;

  return (
    <>
      <div className="fixed inset-0 bg-black z-30">

      <Seo
        title="Video Feed | Loverball"
        description="Watch the latest women's sports videos, highlights, and creator content — the Loverball immersive feed."
        path="/feed"
      />
      <h1 className="sr-only">Loverball Video Feed</h1>
      {/* Editorial masthead */}
      <div className="absolute top-0 left-0 right-0 z-40 pointer-events-auto">
        <div
          className="pt-[max(env(safe-area-inset-top),12px)] pb-3 px-5"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,10,11,0.85) 0%, rgba(10,10,11,0.55) 60%, rgba(10,10,11,0) 100%)",
          }}
        >
          <div className="flex items-end justify-between mb-2.5">
            <div className="flex items-baseline gap-2">
              <span
                style={{
                  fontFamily: "'Space Mono', ui-monospace, monospace",
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  color: "#E8276F",
                  textTransform: "uppercase",
                }}
              >
                {"\n"}
              </span>
              <span
                style={{
                  fontFamily: "'Space Mono', ui-monospace, monospace",
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  color: "rgba(248,248,248,0.5)",
                  textTransform: "uppercase",
                }}
              >
                THE FEED
              </span>
            </div>
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: 13,
                color: "rgba(248,248,248,0.55)",
              }}
            >
              dispatches
            </span>
          </div>

          <div className="flex items-center justify-between">
            <a
              href="/"
              aria-label="Back to Loverball home"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8276F] rounded"
            >
              <img
                src={loverballLogo}
                alt="Loverball — back to home"
                className="h-10 sm:h-14 md:h-20 w-auto object-contain brightness-0 invert"
              />
            </a>

            <div className="flex items-center gap-1 p-1 rounded-full" style={{ background: "rgba(20,20,21,0.6)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
              {[
                { key: "following" as const, label: "Following" },
                { key: "foryou" as const, label: "For You" },
                { key: "stories" as const, label: "Stories" },
              ].map((t) => {
                const active = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className="px-3 py-1 rounded-full transition-all"
                    style={{
                      background: active ? "#E8276F" : "transparent",
                      color: active ? "#fff" : "rgba(248,248,248,0.65)",
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontWeight: 700,
                      fontSize: 11,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hairline rule */}
          <div className="mt-2.5 h-px w-full" style={{ background: "rgba(255,255,255,0.08)" }} />
        </div>
      </div>

      {/* Video container */}
      {activeTab === "stories" ? (
        <FeedStoriesPanel />
      ) : (
        <div
          ref={containerRef}
          className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        >
          {isLoading ? (
            <>
              <FeedSkeleton />
              <FeedSkeleton />
            </>
          ) : isEmpty ? (
            <EmptyState />
          ) : (
            currentVideos.map((video, index) => (
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
            ))
          )}
        </div>
      )}

      {/* Bottom nav (mobile only) */}
      <BottomNav />
    </div>
    </>
  );
};

export default Feed;
