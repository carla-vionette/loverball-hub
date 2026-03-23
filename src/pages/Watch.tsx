import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, Play, ChevronUp, ChevronDown, X, Volume2, VolumeX, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { supabase } from "@/integrations/supabase/client";

interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail: string | null;
  creator_name: string | null;
  likes_count: number;
  comments_count: number;
  channel: {
    name: string;
    handle: string;
    avatar_url: string | null;
    is_verified: boolean;
  } | null;
}

const Watch = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [muted, setMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from("videos")
      .select(`
        id, title, description, video_url, thumbnail, creator_name,
        likes_count, comments_count,
        channel:channels!videos_channel_id_fkey (
          name, handle, avatar_url, is_verified
        )
      `)
      .eq("approval_status" as any, "approved")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setVideos(
        (data as any[]).map((v) => ({
          id: v.id,
          title: v.title,
          description: v.description,
          video_url: v.video_url,
          thumbnail: v.thumbnail,
          creator_name: v.creator_name,
          likes_count: v.likes_count || 0,
          comments_count: v.comments_count || 0,
          channel: v.channel
            ? { name: v.channel.name, handle: v.channel.handle, avatar_url: v.channel.avatar_url, is_verified: v.channel.is_verified }
            : null,
        }))
      );
    }
    setLoading(false);
  };

  const toggle = (id: string, set: React.Dispatch<React.SetStateAction<Set<string>>>) =>
    set((p) => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const nav = useCallback(
    (dir: "up" | "down") => {
      setCurrentIdx((p) => {
        const n = dir === "down" ? Math.min(p + 1, videos.length - 1) : Math.max(p - 1, 0);
        return n;
      });
    },
    [videos.length]
  );

  const openFullscreen = (idx: number) => {
    setCurrentIdx(idx);
    setIsFullscreen(true);
  };

  useEffect(() => {
    if (!isFullscreen) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") nav("down");
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") nav("up");
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [isFullscreen, nav]);

  // Handle scroll-based navigation in fullscreen
  useEffect(() => {
    if (!isFullscreen || !containerRef.current) return;
    let touchStartY = 0;
    const el = containerRef.current;

    const onTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      const diff = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 60) nav(diff > 0 ? "down" : "up");
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) > 30) nav(e.deltaY > 0 ? "down" : "up");
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
    };
  }, [isFullscreen, nav]);

  const current = videos[currentIdx];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader /><DesktopNav /><BottomNav />
        <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </main>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader /><DesktopNav /><BottomNav />
        <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
          <div className="max-w-6xl mx-auto px-5 md:px-10 py-6">
            <h1 className="font-condensed text-3xl font-bold uppercase tracking-wide mb-5">Watch</h1>
            <div className="text-center py-20">
              <Play className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No videos yet. Check back soon!</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader /><DesktopNav /><BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-6">
          <h1 className="font-condensed text-3xl font-bold uppercase tracking-wide mb-5">Watch</h1>

          {/* VIDEO GRID */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map((v, idx) => (
              <div
                key={v.id}
                className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all border border-border/30 rounded-xl relative"
                onClick={() => openFullscreen(idx)}
              >
                <div className="relative aspect-[9/16]">
                  {v.thumbnail ? (
                    <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center">
                      <Play className="w-10 h-10 text-white/60" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-card/30 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-7 h-7 text-card ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/60 to-transparent p-3 pt-8">
                    <p className="text-card text-xs font-bold line-clamp-2">{v.title}</p>
                    <p className="text-card/70 text-[10px] mt-0.5 flex items-center gap-1">
                      {v.channel?.name || v.creator_name || "Loverball"}
                      {v.channel?.is_verified && <CheckCircle className="w-3 h-3 text-primary" />}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* FULL-SCREEN TIKTOK-STYLE VIEWER */}
      <AnimatePresence>
        {isFullscreen && current && (
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          >
            {/* Video / Thumbnail background */}
            {current.video_url ? (
              <video
                ref={(el) => { if (el) videoRefs.current[current.id] = el; }}
                src={current.video_url}
                className="absolute inset-0 w-full h-full object-contain"
                autoPlay
                loop
                muted={muted}
                playsInline
              />
            ) : current.thumbnail ? (
              <img src={current.thumbnail} alt={current.title} className="absolute inset-0 w-full h-full object-contain" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-accent/40" />
            )}
            <div className="absolute inset-0 bg-black/20" />

            {/* Close button */}
            <Button size="icon" variant="ghost" className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 rounded-full" onClick={() => setIsFullscreen(false)}>
              <X className="w-6 h-6" />
            </Button>

            {/* Mute toggle */}
            <Button size="icon" variant="ghost" className="absolute top-4 left-4 z-10 text-white hover:bg-white/20 rounded-full" onClick={() => setMuted(!muted)}>
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>

            {/* Nav arrows (desktop) */}
            {currentIdx > 0 && (
              <Button size="icon" variant="ghost" className="absolute top-1/2 -translate-y-1/2 left-4 z-10 text-white hover:bg-white/20 rounded-full hidden md:flex" onClick={() => nav("up")}>
                <ChevronUp className="w-6 h-6" />
              </Button>
            )}
            {currentIdx < videos.length - 1 && (
              <Button size="icon" variant="ghost" className="absolute top-1/2 -translate-y-1/2 right-20 z-10 text-white hover:bg-white/20 rounded-full hidden md:flex" onClick={() => nav("down")}>
                <ChevronDown className="w-6 h-6" />
              </Button>
            )}

            {/* Sidebar actions */}
            <div className="absolute right-4 bottom-32 z-10 flex flex-col items-center gap-6">
              <button className="flex flex-col items-center gap-1" onClick={() => toggle(current.id, setLiked)}>
                <Heart className={`w-7 h-7 ${liked.has(current.id) ? "text-primary fill-primary" : "text-white"}`} />
                <span className="text-white text-xs font-bold">{(current.likes_count + (liked.has(current.id) ? 1 : 0)).toLocaleString()}</span>
              </button>
              <button className="flex flex-col items-center gap-1">
                <MessageCircle className="w-7 h-7 text-white" />
                <span className="text-white text-xs font-bold">{current.comments_count}</span>
              </button>
              <button
                className="flex flex-col items-center gap-1"
                onClick={async () => {
                  const url = `${window.location.origin}/watch`;
                  if (navigator.share) { try { await navigator.share({ title: current.title, url }); } catch {} }
                  else { await navigator.clipboard.writeText(url); toast.success("Link copied!"); }
                }}
              >
                <Share2 className="w-7 h-7 text-white" />
                <span className="text-white text-xs font-bold">Share</span>
              </button>
              <button className="flex flex-col items-center gap-1" onClick={() => toggle(current.id, setSaved)}>
                <Bookmark className={`w-7 h-7 ${saved.has(current.id) ? "text-primary fill-primary" : "text-white"}`} />
                <span className="text-white text-xs font-bold">Save</span>
              </button>
            </div>

            {/* Creator info */}
            <div className="absolute bottom-8 left-4 right-20 z-10">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="w-10 h-10 border-2 border-white/30">
                  <AvatarImage src={current.channel?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                    {(current.channel?.name || current.creator_name || "L").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1">
                  <a
                    href={current.channel ? `/channel/${current.channel.handle}` : "#"}
                    className="text-white font-bold text-sm hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {current.channel?.name || current.creator_name || "Loverball"}
                  </a>
                  {current.channel?.is_verified && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
                </div>
                <Button size="sm" variant="outline" className="rounded-full border-white/30 text-white text-xs ml-2 hover:bg-white/20 bg-transparent">Follow</Button>
              </div>
              <p className="text-white text-sm">{current.title}</p>
              {current.description && (
                <p className="text-white/70 text-xs mt-1 line-clamp-2">{current.description}</p>
              )}
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <motion.div className="h-full bg-primary" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 15, ease: "linear" }} key={current.id} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Watch;
