import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Search, Users, CheckCircle, Play, Eye, ChevronLeft, ChevronRight, TrendingUp, Clock, Star, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { DISCOVER_VIDEOS, DISCOVER_CATEGORIES, type DiscoverVideo } from "@/lib/discoverVideoData";

const formatViews = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

// ─── Channel Data ───
interface ChannelData {
  handle: string;
  name: string;
  category: string;
  followers: string;
  followerNum: number;
  description: string;
  trending?: boolean;
  recentlyActive?: boolean;
}

const CHANNELS: ChannelData[] = [
  { handle: "@CourtSideQueens", name: "CourtSide Queens", category: "Basketball", followers: "51.3K", followerNum: 51300, description: "Courtside perspectives on women's basketball", trending: true },
  { handle: "@WNBAHighlights", name: "WNBA Highlights", category: "WNBA", followers: "45.2K", followerNum: 45200, description: "Daily WNBA highlights and analysis", trending: true },
  { handle: "@GameDayGirls", name: "Game Day Girls", category: "Lifestyle", followers: "41.2K", followerNum: 41200, description: "Game day fashion, food & culture", trending: true },
  { handle: "@FitFemmes", name: "Fit Femmes", category: "Fitness", followers: "38.7K", followerNum: 38700, description: "Sports fitness and training content", recentlyActive: true },
  { handle: "@SoccerSisters", name: "Soccer Sisters", category: "Soccer", followers: "32.1K", followerNum: 32100, description: "Women's soccer coverage worldwide", recentlyActive: true },
  { handle: "@LoverballOriginals", name: "Loverball Originals", category: "Culture", followers: "28.5K", followerNum: 28500, description: "Original content from the Loverball team", trending: true },
  { handle: "@OlympicDreams", name: "Olympic Dreams", category: "Culture", followers: "27.9K", followerNum: 27900, description: "Road to LA28 and beyond" },
  { handle: "@NWSLWatch", name: "NWSL Watch", category: "Soccer", followers: "22.4K", followerNum: 22400, description: "All things NWSL", recentlyActive: true },
  { handle: "@TitleIXToday", name: "Title IX Today", category: "Culture", followers: "19.8K", followerNum: 19800, description: "Covering the evolution of women in sports" },
  { handle: "@ServeAndVolley", name: "Serve & Volley", category: "Tennis", followers: "15.6K", followerNum: 15600, description: "WTA and women's tennis coverage" },
  { handle: "@StrongGirlSummer", name: "Strong Girl Summer", category: "Fitness", followers: "48.1K", followerNum: 48100, description: "Women athlete workout routines", trending: true, recentlyActive: true },
  { handle: "@CourtVision", name: "Court Vision", category: "Basketball", followers: "18.3K", followerNum: 18300, description: "Basketball strategy & game breakdowns" },
];

const AVATAR_COLORS: Record<string, string> = {
  Basketball: "bg-accent", Soccer: "bg-primary", WNBA: "bg-accent",
  Tennis: "bg-primary", Culture: "bg-accent", Lifestyle: "bg-primary", Fitness: "bg-accent",
};

// ─── Scroll Row ───
const ScrollRow = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const check = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", check); ro.disconnect(); };
  }, [check]);

  const scroll = (dir: "left" | "right") => {
    ref.current?.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  };

  return (
    <div className={`relative group ${className}`}>
      {canLeft && (
        <button onClick={() => scroll("left")} className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-card/90 border border-border/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
      )}
      {canRight && (
        <button onClick={() => scroll("right")} className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-card/90 border border-border/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
          <ChevronRight className="w-4 h-4 text-foreground" />
        </button>
      )}
      <div ref={ref} className="flex gap-3 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
        {children}
      </div>
    </div>
  );
};

// ─── Follow Button ───
const FollowButton = ({ compact = false }: { compact?: boolean }) => {
  const [following, setFollowing] = useState(false);
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFollowing(!following); }}
      className={`rounded-full text-xs font-semibold transition-all duration-200 ${compact ? "px-3 py-1" : "px-4 py-1.5"} ${
        following
          ? "bg-secondary text-muted-foreground border border-border"
          : "bg-accent text-accent-foreground hover:bg-accent/90"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
};

// ─── Video Card ───
const VideoCard = ({ video }: { video: DiscoverVideo }) => (
  <div
    className="flex-shrink-0 w-[130px] cursor-pointer group"
    onClick={() => { window.location.href = `/watch/video/${video.id}`; }}
    role="link"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === "Enter") window.location.href = `/watch/video/${video.id}`; }}
  >
    <div className="relative w-[130px] h-[231px] rounded-xl overflow-hidden">
      {video.thumbnail ? (
        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover pointer-events-none" />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${video.gradient} pointer-events-none`} />
      )}
      <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/20 transition-colors flex items-center justify-center pointer-events-none">
        <div className="w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-background/40 transition-colors">
          <Play className="w-4 h-4 text-background ml-0.5" fill="currentColor" />
        </div>
      </div>
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
        <span className="text-[10px] text-background/80 font-medium flex items-center gap-1">
          <Eye className="w-3 h-3" /> {formatViews(video.views)}
        </span>
        <span className="text-[10px] text-background/80 bg-foreground/40 px-1.5 py-0.5 rounded-full">{video.duration}</span>
      </div>
    </div>
    <p className="text-[11px] font-semibold text-foreground mt-1.5 leading-tight line-clamp-2">{video.title}</p>
    <p className="text-[10px] text-muted-foreground truncate">{video.channel}</p>
  </div>
);

// ─── Channel Card ───
const ChannelCard = ({ channel }: { channel: ChannelData }) => (
  <a href={`/channel/${channel.handle.replace("@", "")}`} className="block">
    <Card className="p-4 hover:shadow-md transition-all group cursor-pointer">
      <div className="flex items-start gap-3">
        <Avatar className="w-12 h-12 flex-shrink-0">
          <AvatarFallback className={`${AVATAR_COLORS[channel.category] || "bg-primary"} text-white font-bold text-sm`}>
            {channel.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-semibold text-sm text-foreground truncate">{channel.name}</h3>
            <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground mb-1.5">{channel.handle}</p>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-accent/10 text-accent text-[10px] font-semibold border-0 rounded-full">{channel.category}</Badge>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> {channel.followers}</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{channel.description}</p>
        </div>
        <div className="flex-shrink-0 pt-1">
          <FollowButton />
        </div>
      </div>
    </Card>
  </a>
);

// ─── Compact Creator Card ───
const CreatorCard = ({ channel }: { channel: ChannelData }) => (
  <a href={`/channel/${channel.handle.replace("@", "")}`} className="flex-shrink-0 w-[160px] block">
    <Card className="p-3 hover:shadow-md transition-all cursor-pointer h-full">
      <div className="flex flex-col items-center text-center gap-2">
        <Avatar className="w-14 h-14">
          <AvatarFallback className={`${AVATAR_COLORS[channel.category] || "bg-primary"} text-white font-bold`}>
            {channel.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center justify-center gap-1">
            <h3 className="font-semibold text-xs truncate">{channel.name}</h3>
            <CheckCircle className="w-3 h-3 text-primary" />
          </div>
          <p className="text-[10px] text-muted-foreground">{channel.followers} followers</p>
        </div>
        <Badge className="bg-accent/10 text-accent text-[10px] font-semibold border-0 rounded-full">{channel.category}</Badge>
        <FollowButton compact />
      </div>
    </Card>
  </a>
);

// ─── Main Page ───
const Explore = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredVideos = useMemo(() => {
    return DISCOVER_VIDEOS.filter(v => {
      const matchCat = activeCategory === "All" || v.category === activeCategory;
      const matchSearch = !search || v.title.toLowerCase().includes(search.toLowerCase()) || v.channel.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  const filteredChannels = useMemo(() => {
    return CHANNELS.filter(ch => {
      const matchCat = activeCategory === "All" || ch.category === activeCategory;
      const matchSearch = !search || ch.name.toLowerCase().includes(search.toLowerCase()) || ch.handle.toLowerCase().includes(search.toLowerCase()) || ch.category.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  const trendingVideos = DISCOVER_VIDEOS.filter(v => v.trending);
  const recentVideos = [...DISCOVER_VIDEOS].sort((a, b) => b.addedDate.localeCompare(a.addedDate)).slice(0, 8);
  const popularCreators = CHANNELS.filter(ch => ch.trending).sort((a, b) => b.followerNum - a.followerNum);

  const isFiltering = search || activeCategory !== "All";

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        <div className="max-w-3xl mx-auto px-5 md:px-10 py-6">
          <h1 className="font-display text-[28px] font-bold uppercase tracking-tight mb-5">Discover</h1>

          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search videos & channels..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-full bg-secondary border-border/20"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground">✕</button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
            {DISCOVER_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm scale-105"
                    : "border border-foreground/20 text-foreground hover:bg-secondary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Filtered Results */}
          {isFiltering ? (
            <>
              {/* Filtered Videos */}
              {filteredVideos.length > 0 && (
                <section className="mb-8">
                  <h2 className="font-display text-lg font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Play className="w-4 h-4 text-accent" /> Videos {activeCategory !== "All" && `— ${activeCategory}`}
                  </h2>
                  <ScrollRow>
                    {filteredVideos.map(v => <VideoCard key={v.id} video={v} />)}
                  </ScrollRow>
                </section>
              )}

              {/* Filtered Channels */}
              {filteredChannels.length > 0 && (
                <section className="mb-8">
                  <h2 className="font-display text-lg font-semibold uppercase tracking-wide mb-3">Channels</h2>
                  <div className="grid gap-3">
                    {filteredChannels.map(ch => <ChannelCard key={ch.handle} channel={ch} />)}
                  </div>
                </section>
              )}

              {filteredVideos.length === 0 && filteredChannels.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No results found</p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Featured Videos */}
              <section className="mb-8">
                <h2 className="font-display text-lg font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-accent" /> Featured Videos
                </h2>
                <ScrollRow>
                  {DISCOVER_VIDEOS.slice(0, 8).map(v => <VideoCard key={v.id} video={v} />)}
                </ScrollRow>
              </section>

              {/* Trending Now */}
              <section className="mb-8">
                <h2 className="font-display text-lg font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-destructive" /> Trending Now
                </h2>
                <ScrollRow>
                  {trendingVideos.map(v => <VideoCard key={v.id} video={v} />)}
                </ScrollRow>
              </section>

              {/* Popular Creators */}
              <section className="mb-8">
                <h2 className="font-display text-lg font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Popular Creators
                </h2>
                <ScrollRow>
                  {popularCreators.map(ch => <CreatorCard key={ch.handle} channel={ch} />)}
                </ScrollRow>
              </section>

              {/* Recently Added */}
              <section className="mb-8">
                <h2 className="font-display text-lg font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" /> Recently Added
                </h2>
                <ScrollRow>
                  {recentVideos.map(v => <VideoCard key={v.id} video={v} />)}
                </ScrollRow>
              </section>

              {/* Browse All Channels */}
              <section>
                <h2 className="font-display text-lg font-semibold uppercase tracking-wide mb-3">Browse Channels</h2>
                <div className="grid gap-3">
                  {CHANNELS.slice(0, 6).map(ch => <ChannelCard key={ch.handle} channel={ch} />)}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Explore;
