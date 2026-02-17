import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Compass, Flame, Star, Trophy, GraduationCap, Users, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import ChannelRow from "@/components/video/ChannelRow";
import ChannelCard from "@/components/video/ChannelCard";
import { FollowButton } from "@/components/video/ChannelCard";
import { Skeleton } from "@/components/ui/skeleton";
import loverbballLogo from "@/assets/loverball-new-l-logo.png";
import {
  FEATURED_CHANNELS,
  PRO_TEAMS,
  COLLEGE_TEAMS,
  CREATOR_CHANNELS,
  LOVERBALL_CHANNELS,
  TRENDING_CHANNELS,
  RECOMMENDED_CHANNELS,
  DISCOVER_FILTERS,
  type DiscoverFilter,
} from "@/lib/discoverChannelData";

// ─── Skeleton Loader ────────────────────────────────────
const ChannelRowSkeleton = () => (
  <div className="mb-8">
    <div className="px-4 md:px-8 mb-3">
      <Skeleton className="h-5 w-40 bg-secondary" />
    </div>
    <div className="flex gap-4 px-4 md:px-8 overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[180px] md:w-[200px]">
          <Skeleton className="aspect-[4/3] rounded-t-xl bg-secondary" />
          <div className="p-3 space-y-2 bg-card rounded-b-xl border border-border/30 border-t-0">
            <Skeleton className="h-4 w-3/4 bg-secondary" />
            <Skeleton className="h-3 w-1/2 bg-secondary" />
            <Skeleton className="h-7 w-20 bg-secondary rounded-md" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Featured Hero ──────────────────────────────────────
const FeaturedHero = () => {
  const [index, setIndex] = useState(0);
  const featured = FEATURED_CHANNELS;

  // Auto-rotate every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % featured.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featured.length]);

  const current = featured[index];

  return (
    <div className="relative mx-4 md:mx-8 mb-8 rounded-xl overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="relative aspect-[16/9] md:aspect-[21/9]"
        >
          <img
            src={current.coverImage}
            alt={current.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />

          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
            <span className="inline-block bg-secondary text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded mb-3">
              Featured Channel
            </span>
            <h2 className="text-xl md:text-3xl font-bold text-foreground mb-2">{current.name}</h2>
            <p className="text-sm text-foreground/70 max-w-lg mb-4 line-clamp-2">{current.description}</p>
            <div className="flex items-center gap-3">
              <FollowButton />
              <span className="text-xs text-muted-foreground">{current.sportBadge}</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots indicator */}
      <div className="absolute bottom-3 right-4 flex gap-1.5">
        {featured.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === index ? "bg-primary" : "bg-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* Nav arrows */}
      <button
        onClick={() => setIndex((i) => (i - 1 + featured.length) % featured.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
      >
        <ChevronLeft className="w-4 h-4 text-foreground" />
      </button>
      <button
        onClick={() => setIndex((i) => (i + 1) % featured.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
      >
        <ChevronRight className="w-4 h-4 text-foreground" />
      </button>
    </div>
  );
};

// ─── Main Page ──────────────────────────────────────────
const VideoDiscover = () => {
  const [activeFilter, setActiveFilter] = useState<DiscoverFilter>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Simulate async load
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const showRow = useCallback(
    (cat: "pro" | "college" | "creator" | "all") => {
      if (activeFilter === "All") return true;
      if (activeFilter === "Sports Teams" && (cat === "pro" || cat === "all")) return true;
      if (activeFilter === "College Teams" && (cat === "college" || cat === "all")) return true;
      if (activeFilter === "Creators" && (cat === "creator" || cat === "all")) return true;
      if (activeFilter === "Following") return true; // show all for now
      return false;
    },
    [activeFilter]
  );

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border/20" style={{ padding: '16px 16px 12px' }}>
        <div className="flex items-center justify-between mb-3 md:px-4">
          <div className="flex items-center gap-2.5">
            <img src={loverbballLogo} alt="Loverball" className="h-12 w-auto object-contain" />
            
          </div>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <Search className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-3"
            >
              <input
                autoFocus
                type="text"
                placeholder="Search channels, teams, creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-secondary rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {DISCOVER_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeFilter === filter
                  ? filter === "All"
                    ? "bg-foreground text-background"
                    : "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="py-6">
        {isLoading ? (
          <>
            <ChannelRowSkeleton />
            <ChannelRowSkeleton />
            <ChannelRowSkeleton />
          </>
        ) : (
          <>
            {/* Featured Hero */}
            {activeFilter === "All" && <FeaturedHero />}

            {/* Professional Teams */}
            {showRow("pro") && (
              <ChannelRow
                title="Professional Teams"
                icon={<Trophy className="w-4 h-4 text-primary" />}
                onSeeAll={() => {}}
              >
                {PRO_TEAMS.filter(
                  (ch) =>
                    !searchQuery ||
                    ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    ch.sportBadge.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((ch) => (
                  <ChannelCard key={ch.id} channel={ch} variant="team" />
                ))}
              </ChannelRow>
            )}

            {/* College Teams */}
            {showRow("college") && (
              <ChannelRow
                title="College Teams (Division 1)"
                icon={<GraduationCap className="w-4 h-4 text-primary" />}
                onSeeAll={() => {}}
              >
                {COLLEGE_TEAMS.filter(
                  (ch) =>
                    !searchQuery ||
                    ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    ch.sportBadge.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    ch.conference?.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((ch) => (
                  <ChannelCard key={ch.id} channel={ch} variant="team" />
                ))}
              </ChannelRow>
            )}

            {/* Creator Channels */}
            {showRow("creator") && (
              <ChannelRow
                title="Creator Channels"
                icon={<Users className="w-4 h-4 text-primary" />}
                onSeeAll={() => {}}
              >
                {CREATOR_CHANNELS.filter(
                  (ch) =>
                    !searchQuery ||
                    ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    ch.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
                ).map((ch) => (
                  <ChannelCard key={ch.id} channel={ch} variant="creator" />
                ))}
              </ChannelRow>
            )}

            {/* Loverball Network */}
            {(activeFilter === "All" || activeFilter === "Following") && (
              <ChannelRow
                title="Loverball Network"
                icon={
                  <img src={loverbballLogo} alt="LB" className="w-4 h-4 object-contain" />
                }
                onSeeAll={() => {}}
              >
                {LOVERBALL_CHANNELS.map((ch) => (
                  <ChannelCard key={ch.id} channel={ch} variant="loverball" />
                ))}
              </ChannelRow>
            )}

            {/* Trending This Week */}
            {activeFilter === "All" && (
              <ChannelRow
                title="Trending This Week"
                icon={<Flame className="w-4 h-4 text-primary" />}
                onSeeAll={() => {}}
              >
                {TRENDING_CHANNELS.map((ch) => (
                  <ChannelCard key={ch.id} channel={ch} variant="trending" />
                ))}
              </ChannelRow>
            )}

            {/* Recommended For You */}
            {activeFilter === "All" && (
              <ChannelRow
                title="Recommended For You"
                icon={<Sparkles className="w-4 h-4 text-primary" />}
                onSeeAll={() => {}}
              >
                {RECOMMENDED_CHANNELS.map((ch) => (
                  <ChannelCard key={ch.id} channel={ch} variant="team" />
                ))}
              </ChannelRow>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VideoDiscover;
