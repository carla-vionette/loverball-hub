import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, Play, ChevronUp, ChevronDown, X, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";

const CATEGORIES = ["For You", "Originals", "Creators", "Teams", "Live"];
const TYPE_FILTERS = ["All", "Scripted", "Unscripted"];

const REELS = [
  { id: "r1", title: "Top 10 WNBA Plays of the Week", creator: "Loverball Originals", thumbnail: "/images/all-stars-event.jpg", duration: "2:45", type: "Scripted", isLive: false, likes: 1240, comments: 89, verified: true },
  { id: "r2", title: "Behind the Scenes: Angel City FC Training", creator: "ACFC Media", thumbnail: "/images/angel-city-fc-opener.jpg", duration: "3:12", type: "Unscripted", isLive: false, likes: 890, comments: 45, verified: true },
  { id: "r3", title: "Game Day Fit Check 🔥", creator: "StyleOnTheSideline", thumbnail: "/images/women-panel-event.jpg", duration: "1:30", type: "Unscripted", isLive: false, likes: 2100, comments: 156, verified: false },
  { id: "r4", title: "Dodgers vs Yankees Watch Party Recap", creator: "LAFanGirls", thumbnail: "/images/reggaeton-superbowl-party.jpg", duration: "4:00", type: "Unscripted", isLive: false, likes: 670, comments: 34, verified: false },
  { id: "r5", title: "🔴 LIVE: Lakers Pre-Game Show", creator: "Loverball Live", thumbnail: "/images/la28-olympics-mixer.jpg", duration: "", type: "Scripted", isLive: true, likes: 3400, comments: 502, verified: true },
  { id: "r6", title: "My First Marathon: A Documentary", creator: "RunHerWay", thumbnail: "/images/life-basketball-sanaa.jpg", duration: "8:20", type: "Scripted", isLive: false, likes: 1560, comments: 78, verified: false },
  { id: "r7", title: "Tennis Drills for Beginners", creator: "CourtQueens", thumbnail: "/images/world-cup-la-preview.jpg", duration: "5:15", type: "Scripted", isLive: false, likes: 420, comments: 23, verified: true },
  { id: "r8", title: "Tailgate Cooking: Stadium Style 🌭", creator: "GameDayEats", thumbnail: "/images/reggaeton-superbowl-party.jpg", duration: "2:00", type: "Unscripted", isLive: false, likes: 980, comments: 67, verified: false },
];

const Watch = () => {
  const [selectedCategory, setSelectedCategory] = useState("For You");
  const [selectedType, setSelectedType] = useState("All");
  const [viewingReel, setViewingReel] = useState<typeof REELS[0] | null>(null);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [muted, setMuted] = useState(false);

  const filtered = REELS.filter(r => selectedType === "All" || r.type === selectedType);

  const openReel = (reel: typeof REELS[0]) => {
    setViewingReel(reel);
    setCurrentReelIndex(filtered.findIndex(r => r.id === reel.id));
  };

  const navigateReel = useCallback((dir: "up" | "down") => {
    setCurrentReelIndex(prev => {
      const next = dir === "down" ? Math.min(prev + 1, filtered.length - 1) : Math.max(prev - 1, 0);
      setViewingReel(filtered[next]);
      return next;
    });
  }, [filtered]);

  useEffect(() => {
    if (!viewingReel) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") navigateReel("down");
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") navigateReel("up");
      if (e.key === "Escape") setViewingReel(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [viewingReel, navigateReel]);

  const toggleLike = (id: string) => setLiked(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleSave = (id: string) => setSaved(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader /><DesktopNav /><BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-6">
          <h1 className="font-condensed text-3xl font-bold uppercase tracking-wide mb-5">Watch</h1>

          {/* CATEGORY TABS */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 -mx-5 px-5 mb-3">
            {CATEGORIES.map(cat => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className={`cursor-pointer px-5 py-2.5 text-sm rounded-full whitespace-nowrap transition-all ${selectedCategory === cat ? "bg-primary text-primary-foreground" : "hover:bg-secondary/50"}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>

          {/* TYPE FILTER PILLS */}
          <div className="flex gap-2 mb-6">
            {TYPE_FILTERS.map(type => (
              <Badge
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                className={`cursor-pointer px-4 py-1.5 text-xs rounded-full whitespace-nowrap ${selectedType === type ? "bg-foreground text-background" : "hover:bg-secondary/50"}`}
                onClick={() => setSelectedType(type)}
              >
                {type}
              </Badge>
            ))}
          </div>

          {/* REELS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((reel) => (
              <Card
                key={reel.id}
                className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all border-border/30 relative"
                onClick={() => openReel(reel)}
              >
                <AspectRatio ratio={9 / 16}>
                  <img src={reel.thumbnail} alt={reel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-7 h-7 text-white ml-0.5" fill="white" />
                    </div>
                  </div>

                  {/* Duration / LIVE badge */}
                  {reel.isLive ? (
                    <Badge className="absolute top-2 left-2 bg-destructive text-white text-[10px] font-bold rounded-sm animate-pulse">
                      🔴 LIVE
                    </Badge>
                  ) : (
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                      {reel.duration}
                    </span>
                  )}

                  {/* Creator info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
                    <p className="text-white text-xs font-bold line-clamp-2">{reel.title}</p>
                    <p className="text-white/70 text-[10px] mt-0.5 flex items-center gap-1">
                      {reel.creator}
                      {reel.verified && <span className="text-primary">✓</span>}
                    </p>
                  </div>
                </AspectRatio>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* FULL-SCREEN REEL VIEWER */}
      <AnimatePresence>
        {viewingReel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          >
            <img src={viewingReel.thumbnail} alt={viewingReel.title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30" />

            {/* Close */}
            <Button size="icon" variant="ghost" className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 rounded-full" onClick={() => setViewingReel(null)}>
              <X className="w-6 h-6" />
            </Button>

            {/* Mute toggle */}
            <Button size="icon" variant="ghost" className="absolute top-4 left-4 z-10 text-white hover:bg-white/20 rounded-full" onClick={() => setMuted(!muted)}>
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>

            {/* Navigation arrows */}
            {currentReelIndex > 0 && (
              <Button size="icon" variant="ghost" className="absolute top-1/2 -translate-y-1/2 left-4 z-10 text-white hover:bg-white/20 rounded-full hidden md:flex" onClick={() => navigateReel("up")}>
                <ChevronUp className="w-6 h-6" />
              </Button>
            )}
            {currentReelIndex < filtered.length - 1 && (
              <Button size="icon" variant="ghost" className="absolute top-1/2 -translate-y-1/2 right-20 z-10 text-white hover:bg-white/20 rounded-full hidden md:flex" onClick={() => navigateReel("down")}>
                <ChevronDown className="w-6 h-6" />
              </Button>
            )}

            {/* Sidebar actions */}
            <div className="absolute right-4 bottom-32 z-10 flex flex-col items-center gap-6">
              <button className="flex flex-col items-center gap-1" onClick={() => toggleLike(viewingReel.id)}>
                <Heart className={`w-7 h-7 ${liked.has(viewingReel.id) ? "text-primary fill-primary" : "text-white"}`} />
                <span className="text-white text-xs font-bold">{(viewingReel.likes + (liked.has(viewingReel.id) ? 1 : 0)).toLocaleString()}</span>
              </button>
              <button className="flex flex-col items-center gap-1">
                <MessageCircle className="w-7 h-7 text-white" />
                <span className="text-white text-xs font-bold">{viewingReel.comments}</span>
              </button>
              <button className="flex flex-col items-center gap-1">
                <Share2 className="w-7 h-7 text-white" />
                <span className="text-white text-xs font-bold">Share</span>
              </button>
              <button className="flex flex-col items-center gap-1" onClick={() => toggleSave(viewingReel.id)}>
                <Bookmark className={`w-7 h-7 ${saved.has(viewingReel.id) ? "text-primary fill-primary" : "text-white"}`} />
                <span className="text-white text-xs font-bold">Save</span>
              </button>
            </div>

            {/* Creator info */}
            <div className="absolute bottom-8 left-4 right-20 z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                  {viewingReel.creator.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-bold text-sm flex items-center gap-1">
                    {viewingReel.creator}
                    {viewingReel.verified && <span className="text-primary">✓</span>}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="rounded-full border-white/30 text-white text-xs ml-2 hover:bg-white/20 bg-transparent">
                  Follow
                </Button>
              </div>
              <p className="text-white text-sm">{viewingReel.title}</p>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 15, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Watch;
