import React, { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, Play, X, Volume2, VolumeX, CheckCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";

interface VideoWithChannel {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail: string | null;
  thumbnail_url: string | null;
  category: string | null;
  tags: string[] | null;
  created_at: string;
  channel: {
    id: string;
    channel_name: string;
    slug: string;
    avatar_url: string | null;
    verified: boolean;
    channel_type: string;
  } | null;
}

const CATS = ["For You", "Teams", "Creators", "Loverball"];

const Watch = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoWithChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [cat, setCat] = useState("For You");
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [muted, setMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const touchStartY = useRef<number>(0);

  // Fetch videos from database (only approved ones)
  useEffect(() => {
    fetchVideos();
  }, [cat]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("videos")
        .select(`
          id, title, description, video_url, thumbnail, thumbnail_url, category, tags, created_at,
          channel:creator_channels!videos_channel_id_fkey (
            id, channel_name, slug, avatar_url, verified, channel_type
          )
        `)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(50);

      // Filter by category tab
      if (cat === "Teams") {
        query = query.eq("creator_channels.channel_type", "team");
      } else if (cat === "Creators") {
        query = query.eq("creator_channels.channel_type", "creator");
      } else if (cat === "Loverball") {
        query = query.eq("creator_channels.channel_type", "loverball_official");
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter out entries where the join didn't match (for category filters)
      const filtered = (data || []).filter((v: any) => v.channel !== null) as VideoWithChannel[];
      setVideos(filtered);
      setActiveIdx(0);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's liked videos
  useEffect(() => {
    if (!user) return;
    supabase
      .from("video_likes")
      .select("video_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setLiked(new Set(data.map((l) => l.video_id)));
      });
  }, [user]);

  const toggleLike = async (videoId: string) => {
    if (!user) {
      toast.error("Sign in to like videos");
      return;
    }
    const isLiked = liked.has(videoId);
    setLiked((p) => {
      const s = new Set(p);
      if (isLiked) s.delete(videoId);
      else s.add(videoId);
      return s;
    });
    if (isLiked) {
      await supabase.from("video_likes").delete().eq("user_id", user.id).eq("video_id", videoId);
    } else {
      await supabase.from("video_likes").insert({ user_id: user.id, video_id: videoId });
    }
  };

  const toggleSave = (id: string) => {
    setSaved((p) => {
      const s = new Set(p);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const handleShare = async (video: VideoWithChannel) => {
    const url = `${window.location.origin}/watch/video/${video.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: video.title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  // Navigate between videos
  const nav = useCallback(
    (dir: "up" | "down") => {
      setActiveIdx((p) => {
        if (dir === "down") return Math.min(p + 1, videos.length - 1);
        return Math.max(p - 1, 0);
      });
    },
    [videos.length]
  );

  // Keyboard navigation in fullscreen
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

  // Touch swipe for fullscreen
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 60) {
      nav(diff > 0 ? "down" : "up");
    }
  };

  // Wheel scroll for fullscreen
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (Math.abs(e.deltaY) > 30) {
        nav(e.deltaY > 0 ? "down" : "up");
      }
    },
    [nav]
  );

  const activeVideo = videos[activeIdx] || null;

  // Show empty state with message when no videos
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Play className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-xl font-bold mb-2">No videos yet</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        Videos from approved teams, creators, and Loverball Official will appear here once published.
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader />
        <DesktopNav />
        <BottomNav />
        <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-6">
          <h1 className="font-condensed text-3xl font-bold uppercase tracking-wide mb-5">Watch</h1>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 -mx-5 px-5 mb-6">
            {CATS.map((c) => (
              <Badge
                key={c}
                variant={cat === c ? "default" : "outline"}
                className={`cursor-pointer px-5 py-2.5 text-sm rounded-full whitespace-nowrap transition-all ${
                  cat === c ? "bg-primary text-primary-foreground" : "hover:bg-secondary/50"
                }`}
                onClick={() => setCat(c)}
              >
                {c}
              </Badge>
            ))}
          </div>

          {videos.length === 0 ? (
            <EmptyState />
          ) : (
            /* Video Grid (TikTok-style vertical cards) */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {videos.map((v, idx) => (
                <div
                  key={v.id}
                  className="cursor-pointer group"
                  onClick={() => {
                    setActiveIdx(idx);
                    setIsFullscreen(true);
                  }}
                >
                  <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-muted">
                    {(v.thumbnail || v.thumbnail_url) ? (
                      <img
                        src={v.thumbnail || v.thumbnail_url || ""}
                        alt={v.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                        <Play className="w-8 h-8 text-white/60" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                      <p className="text-white text-xs font-bold line-clamp-2">{v.title}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-white/70 text-[10px] truncate">
                          {v.channel?.channel_name || "Unknown"}
                        </span>
                        {v.channel?.verified && (
                          <CheckCircle className="w-3 h-3 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Fullscreen TikTok-style Viewer */}
      <AnimatePresence>
        {isFullscreen && activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            {/* Video / Thumbnail */}
            {activeVideo.video_url ? (
              <video
                ref={(el) => {
                  if (el) videoRefs.current.set(activeVideo.id, el);
                }}
                src={activeVideo.video_url}
                className="absolute inset-0 w-full h-full object-contain"
                autoPlay
                loop
                muted={muted}
                playsInline
              />
            ) : (activeVideo.thumbnail || activeVideo.thumbnail_url) ? (
              <img
                src={activeVideo.thumbnail || activeVideo.thumbnail_url || ""}
                alt={activeVideo.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30" />
            )}

            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/20" />

            {/* Close button */}
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 rounded-full"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Mute toggle */}
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-4 left-4 z-10 text-white hover:bg-white/20 rounded-full"
              onClick={() => setMuted(!muted)}
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>

            {/* Right sidebar actions */}
            <div className="absolute right-4 bottom-32 z-10 flex flex-col items-center gap-6">
              {/* Channel avatar */}
              <a
                href={`/channel/${activeVideo.channel?.slug || ""}`}
                className="block"
                onClick={(e) => e.stopPropagation()}
              >
                <Avatar className="w-12 h-12 border-2 border-white">
                  <AvatarImage src={activeVideo.channel?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                    {activeVideo.channel?.channel_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
              </a>

              {/* Like */}
              <button className="flex flex-col items-center gap-1" onClick={() => toggleLike(activeVideo.id)}>
                <Heart className={`w-7 h-7 ${liked.has(activeVideo.id) ? "text-primary fill-primary" : "text-white"}`} />
                <span className="text-white text-xs font-bold">Like</span>
              </button>

              {/* Comment */}
              <button className="flex flex-col items-center gap-1">
                <MessageCircle className="w-7 h-7 text-white" />
                <span className="text-white text-xs font-bold">Comment</span>
              </button>

              {/* Share */}
              <button className="flex flex-col items-center gap-1" onClick={() => handleShare(activeVideo)}>
                <Share2 className="w-7 h-7 text-white" />
                <span className="text-white text-xs font-bold">Share</span>
              </button>

              {/* Save */}
              <button className="flex flex-col items-center gap-1" onClick={() => toggleSave(activeVideo.id)}>
                <Bookmark className={`w-7 h-7 ${saved.has(activeVideo.id) ? "text-primary fill-primary" : "text-white"}`} />
                <span className="text-white text-xs font-bold">Save</span>
              </button>
            </div>

            {/* Bottom creator info */}
            <div className="absolute bottom-8 left-4 right-20 z-10">
              <a
                href={`/channel/${activeVideo.channel?.slug || ""}`}
                className="flex items-center gap-2 mb-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Avatar className="w-10 h-10 border border-white/50">
                  <AvatarImage src={activeVideo.channel?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                    {activeVideo.channel?.channel_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1">
                  <span className="text-white font-bold text-sm">
                    {activeVideo.channel?.channel_name}
                  </span>
                  {activeVideo.channel?.verified && (
                    <CheckCircle className="w-4 h-4 text-primary" />
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-white/30 text-white text-xs ml-2 hover:bg-white/20 bg-transparent"
                >
                  Follow
                </Button>
              </a>
              <p className="text-white text-sm line-clamp-2">{activeVideo.title}</p>
              {activeVideo.description && (
                <p className="text-white/70 text-xs mt-1 line-clamp-1">{activeVideo.description}</p>
              )}
            </div>

            {/* Video position indicator */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center z-10">
              <span className="text-white/50 text-[10px]">
                {activeIdx + 1} / {videos.length}
              </span>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 15, ease: "linear" }}
                key={activeVideo.id}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Watch;
