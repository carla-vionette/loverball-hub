import React, { useState, useMemo } from "react";
import { Search, Users, CheckCircle, Play, Eye } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";

const FEATURED_VIDEOS = [
  { id: "fv1", title: "Top 10 WNBA Plays This Week", channel: "Loverball Originals", views: "24.1K", gradient: "from-primary to-primary/70" },
  { id: "fv2", title: "Angel City FC Match Highlights", channel: "ACFC Media", views: "18.3K", gradient: "from-accent to-accent/70" },
  { id: "fv3", title: "Game Day Outfit Inspo 🔥", channel: "GameDayGirls", views: "12.7K", gradient: "from-primary/80 to-primary/40" },
  { id: "fv4", title: "LA28 Olympic Venue Tour", channel: "OlympicDreams", views: "9.8K", gradient: "from-accent/80 to-primary/60" },
  { id: "fv5", title: "Pre-Game Yoga Flow", channel: "FitFemmes", views: "7.2K", gradient: "from-primary to-accent/60" },
  { id: "fv6", title: "Soccer Skills Challenge", channel: "SoccerSisters", views: "15.4K", gradient: "from-accent to-primary/60" },
];

interface ChannelData {
  handle: string;
  name: string;
  category: string;
  followers: string;
  followerNum: number;
  description: string;
  trending?: boolean;
}

const CHANNELS: ChannelData[] = [
  { handle: "@CourtSideQueens", name: "CourtSide Queens", category: "Basketball", followers: "51.3K", followerNum: 51300, description: "Courtside perspectives on women's basketball", trending: true },
  { handle: "@WNBAHighlights", name: "WNBA Highlights", category: "WNBA", followers: "45.2K", followerNum: 45200, description: "Daily WNBA highlights and analysis", trending: true },
  { handle: "@GameDayGirls", name: "Game Day Girls", category: "Lifestyle", followers: "41.2K", followerNum: 41200, description: "Game day fashion, food & culture", trending: true },
  { handle: "@FitFemmes", name: "Fit Femmes", category: "Fitness", followers: "38.7K", followerNum: 38700, description: "Sports fitness and training content" },
  { handle: "@SoccerSisters", name: "Soccer Sisters", category: "Soccer", followers: "32.1K", followerNum: 32100, description: "Women's soccer coverage worldwide" },
  { handle: "@LoverballOriginals", name: "Loverball Originals", category: "Culture", followers: "28.5K", followerNum: 28500, description: "Original content from the Loverball team" },
  { handle: "@OlympicDreams", name: "Olympic Dreams", category: "Culture", followers: "27.9K", followerNum: 27900, description: "Road to LA28 and beyond" },
  { handle: "@NWSLWatch", name: "NWSL Watch", category: "Soccer", followers: "22.4K", followerNum: 22400, description: "All things NWSL" },
  { handle: "@TitleIXToday", name: "Title IX Today", category: "Culture", followers: "19.8K", followerNum: 19800, description: "Covering the evolution of women in sports" },
  { handle: "@ServeAndVolley", name: "Serve & Volley", category: "Tennis", followers: "15.6K", followerNum: 15600, description: "WTA and women's tennis coverage" },
];

const CATEGORIES = ["All", "Basketball", "Soccer", "WNBA", "Tennis", "Culture", "Lifestyle", "Fitness"];

const AVATAR_COLORS: Record<string, string> = {
  Basketball: "bg-accent",
  Soccer: "bg-primary",
  WNBA: "bg-accent",
  Tennis: "bg-primary",
  Culture: "bg-accent",
  Lifestyle: "bg-primary",
  Fitness: "bg-accent",
};

const FollowButton = () => {
  const [following, setFollowing] = useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); setFollowing(!following); }}
      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
        following
          ? "bg-secondary text-muted-foreground border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
          : "bg-accent text-accent-foreground hover:bg-accent/90"
      }`}
    >
      {following ? "Following" : "View Profile"}
    </button>
  );
};

const ChannelCard = ({ channel }: { channel: ChannelData }) => {
  const handleKey = channel.handle.replace("@", "");
  const goTo = (path: string) => { window.location.href = path; };
  return (
    <Card
      className="p-4 hover:shadow-md transition-all group cursor-pointer"
      onClick={() => goTo(`/channel/${handleKey}`)}
    >
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
            <Badge className="bg-accent/10 text-accent text-[10px] font-semibold border-0 rounded-full">
              {channel.category}
            </Badge>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" /> {channel.followers}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{channel.description}</p>
        </div>
        <div className="flex-shrink-0 pt-1">
          <FollowButton />
        </div>
      </div>
    </Card>
  );
};

const Explore = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const goTo = (path: string) => { window.location.href = path; };

  const filtered = useMemo(() => {
    return CHANNELS.filter(ch => {
      const matchesCategory = activeCategory === "All" || ch.category === activeCategory;
      const matchesSearch = !search || ch.name.toLowerCase().includes(search.toLowerCase()) || ch.handle.toLowerCase().includes(search.toLowerCase()) || ch.category.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const trending = CHANNELS.filter(ch => ch.trending);

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        <div className="max-w-3xl mx-auto px-5 md:px-10 py-6">
          <h1 className="font-display text-[28px] font-bold uppercase tracking-tight mb-5">Discover Elite Talent</h1>

          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-full bg-secondary border-border/20"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "border border-foreground/20 text-foreground hover:bg-secondary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Featured Videos */}
          {activeCategory === "All" && !search && (
            <section className="mb-8">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide mb-3">🎬 Featured Videos</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {FEATURED_VIDEOS.map(video => (
                  <div key={video.id} className="flex-shrink-0 w-[120px] cursor-pointer group">
                    <div className="relative w-[120px] h-[213px] rounded-xl overflow-hidden">
                      <div className={`w-full h-full bg-gradient-to-br ${video.gradient}`} />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                          <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2">
                        <span className="text-[10px] text-white/80 font-medium flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {video.views}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] font-semibold text-foreground mt-1.5 leading-tight line-clamp-2">{video.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{video.channel}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Trending Channels */}
          {activeCategory === "All" && !search && (
            <section className="mb-8">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide mb-3">🔥 Trending Channels</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {trending.map(ch => (
                  <Card key={ch.handle} className="flex-shrink-0 w-[200px] p-4 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex flex-col items-center text-center gap-2">
                      <Avatar className="w-14 h-14">
                        <AvatarFallback className={`${AVATAR_COLORS[ch.category] || "bg-primary"} text-white font-bold`}>
                          {ch.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center justify-center gap-1">
                          <h3 className="font-semibold text-sm truncate">{ch.name}</h3>
                          <CheckCircle className="w-3 h-3 text-primary" />
                        </div>
                        <p className="text-[11px] text-muted-foreground">{ch.followers} followers</p>
                      </div>
                      <Badge className="bg-accent/10 text-accent text-[10px] font-semibold border-0 rounded-full">{ch.category}</Badge>
                      <FollowButton />
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Browse Channels */}
          <section>
            <h2 className="font-display text-lg font-semibold uppercase tracking-wide mb-3">Browse Channels</h2>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No channels found</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filtered.map(ch => (
                  <ChannelCard key={ch.handle} channel={ch} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Explore;
