import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Search as SearchIcon, X, Clock, TrendingUp, Users, Calendar,
  ShoppingBag, Play, ArrowRight, Mic, MicOff, SlidersHorizontal,
  MapPin, DollarSign, Timer, Tag,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { getProducts, type ShopifyProduct } from "@/lib/shopify";
import { cn } from "@/lib/utils";
import { SPORTS_OPTIONS } from "@/lib/onboardingOptions";
import { trackSearch } from "@/lib/analytics";

const RECENT_SEARCHES_KEY = "loverball-recent-searches";
const MAX_RECENT = 8;

const TRENDING_SEARCHES = [
  "WNBA Watch Party", "Lakers", "Networking Events", "Angel City FC",
  "March Madness", "World Cup LA", "LA28 Olympics", "Run Club",
];

type SearchTab = "all" | "members" | "events" | "videos" | "shop";

interface MemberResult {
  id: string;
  name: string;
  city: string | null;
  primary_role: string | null;
  profile_photo_url: string | null;
  favorite_la_teams: string[] | null;
}

interface EventResult {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  venue_name: string | null;
  city: string | null;
  image_url: string | null;
  event_type: string | null;
  sport_tags: string[] | null;
  price: number | null;
}

interface VideoResult {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  tags: string[] | null;
  channel_id: string;
  channel_name?: string;
}

interface ShopResult {
  id: string;
  title: string;
  handle: string;
  price: string;
  currency: string;
  imageUrl: string | null;
}

interface AdvancedFilters {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  priceMin: number;
  priceMax: number;
  videoMaxLength: number; // seconds
  sportFilter: string;
}

const DEFAULT_FILTERS: AdvancedFilters = {
  dateFrom: undefined,
  dateTo: undefined,
  priceMin: 0,
  priceMax: 500,
  videoMaxLength: 600,
  sportFilter: "",
};

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [members, setMembers] = useState<MemberResult[]>([]);
  const [events, setEvents] = useState<EventResult[]>([]);
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [shopItems, setShopItems] = useState<ShopResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AdvancedFilters>(DEFAULT_FILTERS);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load recent searches
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Autocomplete suggestions
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const allSuggestions = [
      ...TRENDING_SEARCHES.filter(s => s.toLowerCase().includes(q)),
      ...recentSearches.filter(s => s.toLowerCase().includes(q)),
      ...SPORTS_OPTIONS.filter(s => s !== "Other" && s.toLowerCase().includes(q)),
    ];
    const unique = [...new Set(allSuggestions)].slice(0, 6);
    setSuggestions(unique);
    setShowSuggestions(unique.length > 0);
  }, [searchQuery, recentSearches]);

  // Execute search
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setMembers([]);
      setEvents([]);
      setVideos([]);
      setShopItems([]);
      setHasSearched(false);
      return;
    }
    performSearch(debouncedQuery.trim());
  }, [debouncedQuery, filters]);

  const performSearch = async (query: string) => {
    setIsLoading(true);
    setHasSearched(true);
    setShowSuggestions(false);

    const q = `%${query}%`;

    const membersPromise = supabase
      .from("profiles")
      .select("id, name, city, primary_role, profile_photo_url, favorite_la_teams")
      .or(`name.ilike.${q},city.ilike.${q},primary_role.ilike.${q},bio.ilike.${q}`)
      .limit(20);

    let eventsQuery = supabase
      .from("events")
      .select("id, title, event_date, event_time, venue_name, city, image_url, event_type, sport_tags, price")
      .or(`title.ilike.${q},description.ilike.${q},venue_name.ilike.${q},city.ilike.${q}`)
      .order("event_date", { ascending: true });

    if (filters.dateFrom) {
      eventsQuery = eventsQuery.gte("event_date", format(filters.dateFrom, "yyyy-MM-dd"));
    }
    if (filters.dateTo) {
      eventsQuery = eventsQuery.lte("event_date", format(filters.dateTo, "yyyy-MM-dd"));
    }
    if (filters.sportFilter) {
      eventsQuery = eventsQuery.contains("sport_tags", [filters.sportFilter]);
    }

    const eventsPromise = eventsQuery.limit(20);

    let videosQuery = supabase
      .from("videos")
      .select("id, title, description, thumbnail_url, duration_seconds, tags, channel_id")
      .eq("is_published", true)
      .or(`title.ilike.${q},description.ilike.${q}`);

    if (filters.videoMaxLength < 600) {
      videosQuery = videosQuery.lte("duration_seconds", filters.videoMaxLength);
    }
    if (filters.sportFilter) {
      videosQuery = videosQuery.contains("tags", [filters.sportFilter]);
    }

    const videosPromise = videosQuery.limit(20);

    let shopPromise: Promise<ShopResult[]>;
    try {
      shopPromise = getProducts(20, query).then(products =>
        products
          .filter(p => {
            const price = parseFloat(p.node.priceRange.minVariantPrice.amount);
            return price >= filters.priceMin && price <= filters.priceMax;
          })
          .map(p => ({
            id: p.node.id,
            title: p.node.title,
            handle: p.node.handle,
            price: p.node.priceRange.minVariantPrice.amount,
            currency: p.node.priceRange.minVariantPrice.currencyCode,
            imageUrl: p.node.images.edges[0]?.node.url || null,
          }))
      ).catch(() => [] as ShopResult[]);
    } catch {
      shopPromise = Promise.resolve([]);
    }

    const [membersRes, eventsRes, videosRes, shopRes] = await Promise.all([
      membersPromise, eventsPromise, videosPromise, shopPromise,
    ]);

    setMembers(membersRes.data || []);

    // Apply price filter on events client-side
    let filteredEvents = eventsRes.data || [];
    if (filters.priceMin > 0 || filters.priceMax < 500) {
      filteredEvents = filteredEvents.filter(e => {
        const p = e.price ?? 0;
        return p >= filters.priceMin && p <= filters.priceMax;
      });
    }
    setEvents(filteredEvents);

    // Enrich videos with channel names
    const channelIds = [...new Set((videosRes.data || []).map(v => v.channel_id))];
    let channelMap: Record<string, string> = {};
    if (channelIds.length > 0) {
      const { data: channels } = await supabase
        .from("creator_channels")
        .select("id, channel_name")
        .in("id", channelIds);
      channels?.forEach(c => { channelMap[c.id] = c.channel_name; });
    }
    setVideos((videosRes.data || []).map(v => ({ ...v, channel_name: channelMap[v.channel_id] })));
    setShopItems(shopRes);
    setIsLoading(false);

    // Track search query and zero-result searches
    const total = (membersRes.data?.length || 0) + filteredEvents.length + (videosRes.data?.length || 0) + shopRes.length;
    trackSearch(query, total, activeTab);
  };

  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const handleSearchSubmit = (query: string) => {
    setSearchQuery(query);
    setShowSuggestions(false);
    if (query.trim()) saveRecentSearch(query.trim());
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const removeRecentSearch = (query: string) => {
    const updated = recentSearches.filter(s => s !== query);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  // Voice search
  const toggleVoiceSearch = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setSearchQuery(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  const hasVoiceSupport = typeof window !== "undefined" && (
    !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition
  );

  const totalResults = members.length + events.length + videos.length + shopItems.length;
  const hasActiveFilters = filters.dateFrom || filters.dateTo || filters.priceMin > 0 ||
    filters.priceMax < 500 || filters.videoMaxLength < 600 || filters.sportFilter;

  const tabCounts = useMemo(
    () => ({
      all: totalResults,
      members: members.length,
      events: events.length,
      videos: videos.length,
      shop: shopItems.length,
    }),
    [members.length, events.length, videos.length, shopItems.length, totalResults]
  );

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pb-20 md:pb-8">
        <div className="container mx-auto px-4 pt-20 md:pt-6 py-6 max-w-3xl">
          {/* Search Bar */}
          <div className="mb-4 relative">
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search members, events, videos, shop..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearchSubmit(searchQuery);
                    if (e.key === "Escape") setShowSuggestions(false);
                  }}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="pl-12 pr-20 h-12 text-base rounded-full"
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {hasVoiceSupport && (
                    <button
                      onClick={toggleVoiceSearch}
                      className={cn(
                        "p-1.5 rounded-full transition-colors",
                        isListening
                          ? "bg-accent text-accent-foreground animate-pulse"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      aria-label="Voice search"
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  )}
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(""); setDebouncedQuery(""); setShowSuggestions(false); }}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <Button
                variant={hasActiveFilters ? "default" : "outline"}
                size="icon"
                className="h-12 w-12 rounded-full flex-shrink-0"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="w-5 h-5" />
              </Button>
            </div>

            {/* Autocomplete Suggestions */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 right-14 z-50 mt-1 bg-card border border-border/50 rounded-2xl shadow-lg overflow-hidden"
                >
                  {suggestions.map(s => (
                    <button
                      key={s}
                      onClick={() => handleSearchSubmit(s)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/50 transition-colors flex items-center gap-3"
                    >
                      <SearchIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{s}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Advanced Filters</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setFilters(DEFAULT_FILTERS)}
                    >
                      Reset
                    </Button>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Event Date Range
                    </label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1 rounded-full text-xs justify-start">
                            {filters.dateFrom ? format(filters.dateFrom, "MMM d") : "From"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarPicker
                            mode="single"
                            selected={filters.dateFrom}
                            onSelect={(d) => setFilters(p => ({ ...p, dateFrom: d || undefined }))}
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1 rounded-full text-xs justify-start">
                            {filters.dateTo ? format(filters.dateTo, "MMM d") : "To"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarPicker
                            mode="single"
                            selected={filters.dateTo}
                            onSelect={(d) => setFilters(p => ({ ...p, dateTo: d || undefined }))}
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" /> Price Range: ${filters.priceMin} – ${filters.priceMax}
                    </label>
                    <Slider
                      value={[filters.priceMin, filters.priceMax]}
                      onValueChange={([min, max]) => setFilters(p => ({ ...p, priceMin: min, priceMax: max }))}
                      min={0}
                      max={500}
                      step={10}
                    />
                  </div>

                  {/* Video Length */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5" /> Max Video Length: {filters.videoMaxLength >= 600 ? "Any" : `${Math.floor(filters.videoMaxLength / 60)}min`}
                    </label>
                    <Slider
                      value={[filters.videoMaxLength]}
                      onValueChange={([v]) => setFilters(p => ({ ...p, videoMaxLength: v }))}
                      min={30}
                      max={600}
                      step={30}
                    />
                  </div>

                  {/* Sport Filter */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" /> Sport / Category
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        variant={!filters.sportFilter ? "default" : "outline"}
                        className="cursor-pointer rounded-full text-xs px-3 py-1"
                        onClick={() => setFilters(p => ({ ...p, sportFilter: "" }))}
                      >
                        All
                      </Badge>
                      {SPORTS_OPTIONS.filter(s => s !== "Other").slice(0, 12).map(sport => (
                        <Badge
                          key={sport}
                          variant={filters.sportFilter === sport ? "default" : "outline"}
                          className="cursor-pointer rounded-full text-xs px-3 py-1"
                          onClick={() => setFilters(p => ({ ...p, sportFilter: p.sportFilter === sport ? "" : sport }))}
                        >
                          {sport}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {!hasSearched && !searchQuery ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Recent Searches
                      </h3>
                      <button onClick={clearRecentSearches} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map(query => (
                        <div key={query} className="flex items-center gap-3 group">
                          <button
                            onClick={() => handleSearchSubmit(query)}
                            className="flex-1 flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
                          >
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{query}</span>
                          </button>
                          <button
                            onClick={() => removeRecentSearch(query)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Trending */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4" /> Trending
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_SEARCHES.map(query => (
                      <button
                        key={query}
                        onClick={() => handleSearchSubmit(query)}
                        className="px-4 py-2 rounded-full bg-secondary/60 text-sm text-foreground hover:bg-secondary transition-colors"
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Browse Categories */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Browse
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Users, label: "Members", route: "/members" },
                      { icon: Calendar, label: "Events", route: "/events" },
                      { icon: ShoppingBag, label: "Shop", route: "/shop" },
                      { icon: Play, label: "Watch", route: "/watch" },
                    ].map(({ icon: Icon, label, route }) => (
                      <button
                        key={label}
                        onClick={() => navigate(route)}
                        className="flex items-center gap-3 p-4 rounded-2xl bg-card hover:bg-secondary/50 transition-colors text-left group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-foreground">{label}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </section>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SearchTab)}>
                  <TabsList className="w-full bg-secondary/40 rounded-full p-1 mb-4">
                    {(["all", "members", "events", "videos", "shop"] as SearchTab[]).map(tab => (
                      <TabsTrigger
                        key={tab}
                        value={tab}
                        className="flex-1 rounded-full capitalize text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {hasSearched && !isLoading && (
                          <span className="ml-1 text-[10px] text-muted-foreground">
                            {tabCounts[tab]}
                          </span>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex gap-3 p-3">
                          <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {hasSearched && totalResults === 0 && (
                        <div className="text-center py-16">
                          <SearchIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                          <p className="text-lg font-medium text-foreground">No results found</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Try a different search or adjust your filters
                          </p>
                          {hasActiveFilters && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3 rounded-full"
                              onClick={() => setFilters(DEFAULT_FILTERS)}
                            >
                              Clear Filters
                            </Button>
                          )}
                        </div>
                      )}

                      {/* All Tab */}
                      <TabsContent value="all" className="space-y-6 mt-0">
                        {members.length > 0 && (
                          <ResultSection title="Members" count={members.length} onViewAll={() => setActiveTab("members")}>
                            {members.slice(0, 3).map(m => (
                              <MemberResultItem key={m.id} member={m} onClick={() => navigate(`/members/${m.id}`)} />
                            ))}
                          </ResultSection>
                        )}
                        {events.length > 0 && (
                          <ResultSection title="Events" count={events.length} onViewAll={() => setActiveTab("events")}>
                            {events.slice(0, 3).map(e => (
                              <EventResultItem key={e.id} event={e} onClick={() => navigate(`/event/${e.id}`)} />
                            ))}
                          </ResultSection>
                        )}
                        {videos.length > 0 && (
                          <ResultSection title="Videos" count={videos.length} onViewAll={() => setActiveTab("videos")}>
                            {videos.slice(0, 3).map(v => (
                              <VideoResultItem key={v.id} video={v} formatDuration={formatDuration} onClick={() => navigate(`/watch/${v.id}`)} />
                            ))}
                          </ResultSection>
                        )}
                        {shopItems.length > 0 && (
                          <ResultSection title="Shop" count={shopItems.length} onViewAll={() => setActiveTab("shop")}>
                            {shopItems.slice(0, 3).map(s => (
                              <ShopResultItem key={s.id} item={s} onClick={() => navigate(`/product/${s.handle}`)} />
                            ))}
                          </ResultSection>
                        )}
                      </TabsContent>

                      {/* Members Tab */}
                      <TabsContent value="members" className="space-y-2 mt-0">
                        {members.length === 0 && hasSearched && <EmptyTabState label="members" />}
                        {members.map(m => (
                          <MemberResultItem key={m.id} member={m} onClick={() => navigate(`/members/${m.id}`)} />
                        ))}
                      </TabsContent>

                      {/* Events Tab */}
                      <TabsContent value="events" className="space-y-2 mt-0">
                        {events.length === 0 && hasSearched && <EmptyTabState label="events" />}
                        {events.map(e => (
                          <EventResultItem key={e.id} event={e} onClick={() => navigate(`/event/${e.id}`)} />
                        ))}
                      </TabsContent>

                      {/* Videos Tab */}
                      <TabsContent value="videos" className="space-y-2 mt-0">
                        {videos.length === 0 && hasSearched && <EmptyTabState label="videos" />}
                        {videos.map(v => (
                          <VideoResultItem key={v.id} video={v} formatDuration={formatDuration} onClick={() => navigate(`/watch/${v.id}`)} />
                        ))}
                      </TabsContent>

                      {/* Shop Tab */}
                      <TabsContent value="shop" className="space-y-2 mt-0">
                        {shopItems.length === 0 && hasSearched && <EmptyTabState label="shop items" />}
                        {shopItems.map(s => (
                          <ShopResultItem key={s.id} item={s} onClick={() => navigate(`/product/${s.handle}`)} />
                        ))}
                      </TabsContent>
                    </>
                  )}
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

// --- Sub-components ---

function ResultSection({
  title, count, onViewAll, children,
}: {
  title: string; count: number; onViewAll: () => void; children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title} <span className="text-xs font-normal">({count})</span>
        </h3>
        {count > 3 && (
          <button onClick={onViewAll} className="text-xs text-primary hover:underline">View all</button>
        )}
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function MemberResultItem({ member, onClick }: { member: MemberResult; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left">
      <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
        {member.profile_photo_url ? (
          <img src={member.profile_photo_url} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg font-bold text-muted-foreground">{member.name.charAt(0)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {[member.primary_role, member.city].filter(Boolean).join(" · ") || "Member"}
        </p>
      </div>
      {member.favorite_la_teams && member.favorite_la_teams.length > 0 && (
        <Badge variant="outline" className="text-[10px] rounded-full shrink-0">{member.favorite_la_teams[0]}</Badge>
      )}
    </button>
  );
}

function EventResultItem({ event, onClick }: { event: EventResult; onClick: () => void }) {
  const eventDate = new Date(event.event_date);
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left">
      <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <Calendar className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {format(eventDate, "MMM d, yyyy")}
          {event.venue_name ? ` · ${event.venue_name}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {event.price != null && event.price > 0 && (
          <Badge variant="secondary" className="text-[10px] rounded-full">${event.price}</Badge>
        )}
        {event.sport_tags && event.sport_tags.length > 0 && (
          <Badge variant="outline" className="text-[10px] rounded-full">{event.sport_tags[0]}</Badge>
        )}
      </div>
    </button>
  );
}

function VideoResultItem({
  video, formatDuration, onClick,
}: {
  video: VideoResult; formatDuration: (s: number | null) => string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left">
      <div className="w-14 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 relative">
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <Play className="w-4 h-4 text-muted-foreground" />
        )}
        {video.duration_seconds && (
          <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] px-1 rounded">
            {formatDuration(video.duration_seconds)}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{video.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {video.channel_name || "Channel"}
          {video.tags && video.tags.length > 0 ? ` · ${video.tags[0]}` : ""}
        </p>
      </div>
    </button>
  );
}

function ShopResultItem({ item, onClick }: { item: ShopResult; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left">
      <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <ShoppingBag className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground">${parseFloat(item.price).toFixed(2)} {item.currency}</p>
      </div>
    </button>
  );
}

function EmptyTabState({ label }: { label: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-muted-foreground">No {label} matched your search</p>
    </div>
  );
}

export default Search;
