import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, Play, ChevronUp, ChevronDown, X, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";

const CATS = ["For You", "Originals", "Creators", "Teams", "Live"];
const TYPES = ["All", "Scripted", "Unscripted"];

const REELS = [
  { id: "r1", title: "Top 10 WNBA Plays of the Week", creator: "Loverball Originals", thumb: "/images/all-stars-event.jpg", dur: "2:45", type: "Scripted", live: false, likes: 1240, comments: 89, verified: true },
  { id: "r2", title: "Behind the Scenes: Angel City FC Training", creator: "ACFC Media", thumb: "/images/angel-city-fc-opener.jpg", dur: "3:12", type: "Unscripted", live: false, likes: 890, comments: 45, verified: true },
  { id: "r3", title: "Game Day Fit Check 🔥", creator: "StyleOnTheSideline", thumb: "/images/women-panel-event.jpg", dur: "1:30", type: "Unscripted", live: false, likes: 2100, comments: 156, verified: false },
  { id: "r4", title: "Dodgers vs Yankees Watch Party Recap", creator: "LAFanGirls", thumb: "/images/reggaeton-superbowl-party.jpg", dur: "4:00", type: "Unscripted", live: false, likes: 670, comments: 34, verified: false },
  { id: "r5", title: "🔴 LIVE: Lakers Pre-Game Show", creator: "Loverball Live", thumb: "/images/la28-olympics-mixer.jpg", dur: "", type: "Scripted", live: true, likes: 3400, comments: 502, verified: true },
  { id: "r6", title: "My First Marathon: A Documentary", creator: "RunHerWay", thumb: "/images/life-basketball-sanaa.jpg", dur: "8:20", type: "Scripted", live: false, likes: 1560, comments: 78, verified: false },
  { id: "r7", title: "Tennis Drills for Beginners", creator: "CourtQueens", thumb: "/images/world-cup-la-preview.jpg", dur: "5:15", type: "Scripted", live: false, likes: 420, comments: 23, verified: true },
  { id: "r8", title: "Tailgate Cooking: Stadium Style 🌭", creator: "GameDayEats", thumb: "/images/reggaeton-superbowl-party.jpg", dur: "2:00", type: "Unscripted", live: false, likes: 980, comments: 67, verified: false },
];

const Watch = () => {
  const [cat, setCat] = useState("For You");
  const [type, setType] = useState("All");
  const [viewing, setViewing] = useState<typeof REELS[0] | null>(null);
  const [reelIdx, setReelIdx] = useState(0);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [muted, setMuted] = useState(false);

  const filtered = REELS.filter(r => {
    const typeMatch = type === "All" || r.type === type;
    if (cat === "For You") return typeMatch;
    if (cat === "Originals") return typeMatch && r.creator.toLowerCase().includes("loverball");
    if (cat === "Creators") return typeMatch && !r.creator.toLowerCase().includes("loverball") && !r.live;
    if (cat === "Teams") return typeMatch && (r.title.toLowerCase().includes("lakers") || r.title.toLowerCase().includes("dodgers") || r.title.toLowerCase().includes("angel city") || r.title.toLowerCase().includes("fc") || r.title.toLowerCase().includes("wnba"));
    if (cat === "Live") return typeMatch && r.live;
    return typeMatch;
  });

  const openReel = (r: typeof REELS[0]) => {
    setViewing(r);
    setReelIdx(filtered.findIndex(x => x.id === r.id));
  };

  const nav = useCallback((dir: "up" | "down") => {
    setReelIdx(p => {
      const n = dir === "down" ? Math.min(p + 1, filtered.length - 1) : Math.max(p - 1, 0);
      setViewing(filtered[n]);
      return n;
    });
  }, [filtered]);

  useEffect(() => {
    if (!viewing) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") nav("down");
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") nav("up");
      if (e.key === "Escape") setViewing(null);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [viewing, nav]);

  const toggle = (id: string, set: React.Dispatch<React.SetStateAction<Set<string>>>) =>
    set(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader /><DesktopNav /><BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-6">
          <h1 className="font-condensed text-3xl font-bold uppercase tracking-wide mb-5">Watch</h1>

          {/* CATEGORY TABS */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 -mx-5 px-5 mb-3">
            {CATS.map(c => (
              <Badge key={c} variant={cat === c ? "default" : "outline"} className={`cursor-pointer px-5 py-2.5 text-sm rounded-full whitespace-nowrap transition-all ${cat === c ? "bg-primary text-primary-foreground" : "hover:bg-secondary/50"}`} onClick={() => setCat(c)}>
                {c}
              </Badge>
            ))}
          </div>

          {/* TYPE PILLS */}
          <div className="flex gap-2 mb-6">
            {TYPES.map(t => (
              <Badge key={t} variant={type === t ? "default" : "outline"} className={`cursor-pointer px-4 py-1.5 text-xs rounded-full whitespace-nowrap ${type === t ? "bg-foreground text-background" : "hover:bg-secondary/50"}`} onClick={() => setType(t)}>
                {t}
              </Badge>
            ))}
          </div>

          {/* REELS GRID */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Play className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No videos match this filter. Try another category.</p>
            </div>
          ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(r => (
              <Card key={r.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all border-border/30 relative" onClick={() => openReel(r)}>
                <AspectRatio ratio={9 / 16}>
                  <img src={r.thumb} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-card/30 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-7 h-7 text-card ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                  {r.live ? (
                    <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-sm animate-pulse">🔴 LIVE</Badge>
                  ) : (
                    <span className="absolute bottom-2 right-2 bg-foreground/70 text-background text-[10px] px-1.5 py-0.5 rounded font-bold font-sans">{r.dur}</span>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/60 to-transparent p-3 pt-8">
                    <p className="text-card text-xs font-bold line-clamp-2 font-sans">{r.title}</p>
                    <p className="text-card/70 text-[10px] mt-0.5 flex items-center gap-1 font-sans">
                      {r.creator}
                      {r.verified && <span className="text-primary">✓</span>}
                    </p>
                  </div>
                </AspectRatio>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* FULL-SCREEN VIEWER */}
      <AnimatePresence>
        {viewing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-foreground flex items-center justify-center">
            <img src={viewing.thumb} alt={viewing.title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-foreground/30" />

            <Button size="icon" variant="ghost" className="absolute top-4 right-4 z-10 text-card hover:bg-card/20 rounded-full" onClick={() => setViewing(null)}>
              <X className="w-6 h-6" />
            </Button>
            <Button size="icon" variant="ghost" className="absolute top-4 left-4 z-10 text-card hover:bg-card/20 rounded-full" onClick={() => setMuted(!muted)}>
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>

            {reelIdx > 0 && (
              <Button size="icon" variant="ghost" className="absolute top-1/2 -translate-y-1/2 left-4 z-10 text-card hover:bg-card/20 rounded-full hidden md:flex" onClick={() => nav("up")}>
                <ChevronUp className="w-6 h-6" />
              </Button>
            )}
            {reelIdx < filtered.length - 1 && (
              <Button size="icon" variant="ghost" className="absolute top-1/2 -translate-y-1/2 right-20 z-10 text-card hover:bg-card/20 rounded-full hidden md:flex" onClick={() => nav("down")}>
                <ChevronDown className="w-6 h-6" />
              </Button>
            )}

            {/* Sidebar */}
            <div className="absolute right-4 bottom-32 z-10 flex flex-col items-center gap-6">
              <button className="flex flex-col items-center gap-1" onClick={() => toggle(viewing.id, setLiked)}>
                <Heart className={`w-7 h-7 ${liked.has(viewing.id) ? "text-primary fill-primary" : "text-card"}`} />
                <span className="text-card text-xs font-bold font-sans">{(viewing.likes + (liked.has(viewing.id) ? 1 : 0)).toLocaleString()}</span>
              </button>
              <button className="flex flex-col items-center gap-1">
                <MessageCircle className="w-7 h-7 text-card" />
                <span className="text-card text-xs font-bold font-sans">{viewing.comments}</span>
              </button>
              <button className="flex flex-col items-center gap-1">
                <Share2 className="w-7 h-7 text-card" />
                <span className="text-card text-xs font-bold font-sans">Share</span>
              </button>
              <button className="flex flex-col items-center gap-1" onClick={() => toggle(viewing.id, setSaved)}>
                <Bookmark className={`w-7 h-7 ${saved.has(viewing.id) ? "text-primary fill-primary" : "text-card"}`} />
                <span className="text-card text-xs font-bold font-sans">Save</span>
              </button>
            </div>

            {/* Creator info */}
            <div className="absolute bottom-8 left-4 right-20 z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm font-sans">
                  {viewing.creator.charAt(0)}
                </div>
                <p className="text-card font-bold text-sm flex items-center gap-1 font-sans">
                  {viewing.creator}
                  {viewing.verified && <span className="text-primary">✓</span>}
                </p>
                <Button size="sm" variant="outline" className="rounded-full border-card/30 text-card text-xs ml-2 hover:bg-card/20 bg-transparent">Follow</Button>
              </div>
              <p className="text-card text-sm font-sans">{viewing.title}</p>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-card/20">
              <motion.div className="h-full bg-primary" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 15, ease: "linear" }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Watch;
