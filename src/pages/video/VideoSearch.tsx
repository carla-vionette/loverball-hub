import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock, TrendingUp, Flame, ChevronRight, SlidersHorizontal, CheckCircle, Play, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MOCK_VIDEOS, type VideoItem } from "@/lib/mockVideoData";
import {
  PRO_TEAMS,
  COLLEGE_TEAMS,
  CREATOR_CHANNELS,
  LOVERBALL_CHANNELS,
  type DiscoverChannel,
} from "@/lib/discoverChannelData";
import ChannelCard from "@/components/video/ChannelCard";
import loverbballLogo from "@/assets/loverball-script-logo.png";

// ─── Constants ──────────────────────────────────────────
const ALL_CHANNELS = [...PRO_TEAMS, ...COLLEGE_TEAMS, ...CREATOR_CHANNELS, ...LOVERBALL_CHANNELS];

const SEARCH_FILTERS = ["All", "Channels", "Videos", "Playlists", "Live"] as const;
type SearchFilter = (typeof SEARCH_FILTERS)[number];

const DATE_FILTERS = ["Any time", "Today", "This Week", "This Month", "This Year"] as const;
const SORT_OPTIONS = ["Relevance", "Upload Date", "View Count", "Rating"] as const;

const TRENDING_SEARCHES = [
  "Lakers highlights",
  "basketball skills",
  "women's soccer",
  "workout routines",
  "game day vlogs",
  "LA derby",
  "WNBA playoffs",
  "sneaker drops",
];

const SUGGESTIONS_POOL = [
  "basketball highlights",
  "basketball training",
  "basketball shoes",
  "soccer drills",
  "soccer skills tutorial",
  "women's basketball",
  "women's sports culture",
  "workout routine beginner",
  "la lakers",
  "la dodgers",
  "la galaxy",
  "loverball originals",
  "game day vlog",
  "tailgate party",
  "nfl highlights",
  "nba top 10",
  "college football",
  "duke basketball",
  "ohio state",
];

const HISTORY_KEY = "lb-search-history";

// ─── Helpers ────────────────────────────────────────────
const formatViews = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const timeAgo = (index: number) => {
  const units = ["2 hours ago", "5 hours ago", "1 day ago", "2 days ago", "4 days ago", "1 week ago", "2 weeks ago", "3 weeks ago"];
  return units[index % units.length];
};

const loadHistory = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveHistory = (history: string[]) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
};

// ─── Highlight component ────────────────────────────────
const Highlight = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="text-primary font-semibold">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

// ─── Search Result Video Card ───────────────────────────
const SearchVideoCard = ({ video, query, index }: { video: VideoItem; query: string; index: number }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group flex gap-3 md:gap-4 cursor-pointer rounded-xl p-2 hover:bg-[hsl(var(--video-hover,0_0%_17%))] transition-colors"
      onClick={() => navigate(`/watch/channel/${video.channelName.toLowerCase().replace(/\s+/g, "-")}`)}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-[160px] md:w-[280px] aspect-video rounded-lg overflow-hidden bg-secondary">
        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          {video.duration}
        </span>
        <div className="absolute inset-0 bg-background/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
            <Play className="w-4 h-4 text-primary-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5">
        <h3 className="text-sm md:text-base font-bold text-foreground line-clamp-2 mb-1.5">
          <Highlight text={video.title} query={query} />
        </h3>

        <div className="flex items-center gap-2 mb-1.5">
          <img
            src={video.channelAvatar}
            alt={video.channelName}
            className="w-5 h-5 rounded-full object-cover flex-shrink-0"
          />
          <span className="text-xs text-muted-foreground truncate">
            <Highlight text={video.channelName} query={query} />
          </span>
          <CheckCircle className="w-3 h-3 text-primary flex-shrink-0" />
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{formatViews(video.views)} views</span>
          <span>·</span>
          <span>{timeAgo(parseInt(video.id.replace(/\D/g, "")) || 0)}</span>
        </div>

        <p className="hidden md:block text-xs text-muted-foreground mt-2 line-clamp-2">
          <Highlight text={`Watch ${video.title} on ${video.channelName}. ${video.category} content featuring the best of sports entertainment.`} query={query} />
        </p>

        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[10px] text-muted-foreground">👍 {formatViews(video.likes)}</span>
          <span className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            {video.category}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Skeleton Loaders ───────────────────────────────────
const ChannelRowSkeleton = () => (
  <div className="flex gap-4 overflow-hidden px-4 md:px-8">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="w-[180px] md:w-[200px] flex-shrink-0 rounded-xl bg-secondary animate-pulse">
        <div className="aspect-[4/3] bg-muted rounded-t-xl" />
        <div className="p-3 space-y-2">
          <div className="h-3 bg-muted rounded w-3/4" />
          <div className="h-2 bg-muted rounded w-1/2" />
          <div className="h-7 bg-muted rounded w-20" />
        </div>
      </div>
    ))}
  </div>
);

const VideoResultSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex gap-4 p-2 animate-pulse">
        <div className="w-[160px] md:w-[280px] aspect-video bg-secondary rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-secondary rounded w-3/4" />
          <div className="h-3 bg-secondary rounded w-1/2" />
          <div className="h-2 bg-secondary rounded w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Suggested Channels (for no-results) ────────────────
const SuggestedChannels = () => {
  const suggested = ALL_CHANNELS.slice(0, 6);
  return (
    <div className="mt-8">
      <h3 className="text-sm font-bold text-foreground mb-3 px-4 md:px-0">Suggested Channels</h3>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-0 pb-2">
        {suggested.map((ch) => (
          <ChannelCard key={ch.id} channel={ch} variant={ch.category === "creator" ? "creator" : "team"} />
        ))}
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────
const VideoSearch = () => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState<SearchFilter>("All");
  const [dateFilter, setDateFilter] = useState<string>("Any time");
  const [sortBy, setSortBy] = useState<string>("Relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [history, setHistory] = useState<string[]>(loadHistory);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Debounce
  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery("");
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Search logic
  const matchesQuery = useCallback(
    (text: string) => text.toLowerCase().includes(debouncedQuery.toLowerCase()),
    [debouncedQuery]
  );

  const channelResults = useMemo(() => {
    if (!debouncedQuery || filter === "Videos" || filter === "Playlists" || filter === "Live") return [];
    return ALL_CHANNELS.filter(
      (ch) =>
        matchesQuery(ch.name) ||
        matchesQuery(ch.description) ||
        matchesQuery(ch.sportBadge) ||
        (ch.tags && ch.tags.some(matchesQuery))
    );
  }, [debouncedQuery, filter, matchesQuery]);

  const videoResults = useMemo(() => {
    if (!debouncedQuery || filter === "Channels") return [];
    let results = MOCK_VIDEOS.filter(
      (v) =>
        matchesQuery(v.title) ||
        matchesQuery(v.channelName) ||
        matchesQuery(v.category)
    );

    // Sort
    if (sortBy === "View Count") results = [...results].sort((a, b) => b.views - a.views);
    if (sortBy === "Rating") results = [...results].sort((a, b) => b.likes - a.likes);

    return results;
  }, [debouncedQuery, filter, sortBy, matchesQuery]);

  const totalResults = channelResults.length + videoResults.length;

  // Suggestions
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return SUGGESTIONS_POOL.filter((s) => s.toLowerCase().includes(query.toLowerCase())).slice(0, 6);
  }, [query]);

  // History management
  const addToHistory = (term: string) => {
    const updated = [term, ...history.filter((h) => h !== term)].slice(0, 10);
    setHistory(updated);
    saveHistory(updated);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const removeFromHistory = (term: string) => {
    const updated = history.filter((h) => h !== term);
    setHistory(updated);
    saveHistory(updated);
  };

  const handleSearch = (term: string) => {
    setQuery(term);
    setShowSuggestions(false);
    addToHistory(term);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      handleSearch(query.trim());
    }
  };

  const showDropdown = focused && query.length === 0 && history.length > 0;
  const showSuggestionsDropdown = focused && query.length > 0 && suggestions.length > 0 && showSuggestions;

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      {/* ─── Sticky header ────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/20">
        <div className="px-4 md:px-8 py-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              autoFocus
              placeholder="Search videos, channels, topics..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                setFocused(true);
                setShowSuggestions(true);
              }}
              onBlur={() => setTimeout(() => {
                setFocused(false);
                setShowSuggestions(false);
              }, 200)}
              onKeyDown={handleKeyDown}
              className="w-full bg-secondary rounded-xl pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setDebouncedQuery("");
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Recent searches dropdown */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/30 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/20">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recent</span>
                    <button onClick={clearHistory} className="text-xs text-primary hover:underline">Clear all</button>
                  </div>
                  {history.map((term) => (
                    <div
                      key={term}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 cursor-pointer transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span
                        onClick={() => handleSearch(term)}
                        className="flex-1 text-sm text-foreground"
                      >
                        {term}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(term);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Suggestions dropdown */}
            <AnimatePresence>
              {showSuggestionsDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/30 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  {suggestions.map((s) => (
                    <div
                      key={s}
                      onClick={() => handleSearch(s)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 cursor-pointer transition-colors"
                    >
                      <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-foreground">
                        <Highlight text={s} query={query} />
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 px-4 md:px-8 pb-3 overflow-x-auto scrollbar-hide">
          {SEARCH_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
            >
              {f}
              {f === "Live" && (
                <span className="ml-1 text-[9px] opacity-60">Soon</span>
              )}
            </button>
          ))}

          <div className="w-px h-5 bg-border/30 mx-1 flex-shrink-0" />

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              showFilters ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            Filters
          </button>
        </div>

        {/* Expanded filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border/20"
            >
              <div className="px-4 md:px-8 py-3 flex flex-wrap gap-4">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Upload Date</span>
                  <div className="flex flex-wrap gap-1.5">
                    {DATE_FILTERS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDateFilter(d)}
                        className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                          dateFilter === d
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Sort By</span>
                  <div className="flex flex-wrap gap-1.5">
                    {SORT_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSortBy(s)}
                        className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                          sortBy === s
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ─── Content ──────────────────────────────────── */}
      <div className="px-4 md:px-8 py-4">
        {/* Empty state - trending & history */}
        {!debouncedQuery && !loading && (
          <div>
            {/* Trending */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Trending Searches</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((term, i) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="group flex items-center gap-2 px-4 py-2 bg-secondary text-muted-foreground text-xs rounded-full hover:bg-primary/10 hover:text-primary transition-all"
                  >
                    <Flame className="w-3 h-3 text-primary/70 group-hover:text-primary transition-colors" />
                    <span className="text-muted-foreground/50 font-bold mr-0.5">{i + 1}</span>
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Recommended channels */}
            <div>
              <h2 className="text-sm font-bold text-foreground mb-3">Explore Channels</h2>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {ALL_CHANNELS.slice(0, 8).map((ch) => (
                  <ChannelCard
                    key={ch.id}
                    channel={ch}
                    variant={ch.category === "creator" ? "creator" : ch.category === "loverball" ? "loverball" : "team"}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && debouncedQuery.length === 0 && query.length > 0 && (
          <div className="space-y-6">
            <ChannelRowSkeleton />
            <VideoResultSkeleton />
          </div>
        )}

        {/* Results */}
        {debouncedQuery && !loading && (
          <div>
            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-muted-foreground">
                {totalResults} result{totalResults !== 1 ? "s" : ""} for "<span className="text-foreground font-medium">{debouncedQuery}</span>"
              </p>
            </div>

            {totalResults === 0 ? (
              /* No results */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-lg font-bold text-foreground mb-1">No results for "{debouncedQuery}"</p>
                <p className="text-sm text-muted-foreground mb-6">Try different keywords or check your spelling</p>
                <SuggestedChannels />
              </motion.div>
            ) : (
              <div className="space-y-8">
                {/* Channel results */}
                {channelResults.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-bold text-foreground">Channels</h2>
                      {channelResults.length > 6 && (
                        <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                          See all <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                      {channelResults.slice(0, 10).map((ch) => (
                        <ChannelCard
                          key={ch.id}
                          channel={ch}
                          variant={ch.category === "creator" ? "creator" : ch.category === "loverball" ? "loverball" : "team"}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Video results */}
                {videoResults.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-bold text-foreground">Videos</h2>
                      <span className="text-[11px] text-muted-foreground">{videoResults.length} videos</span>
                    </div>
                    <div className="space-y-1">
                      {videoResults.map((v, i) => (
                        <SearchVideoCard key={v.id} video={v} query={debouncedQuery} index={i} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoSearch;
