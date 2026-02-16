import { useState, useEffect, useCallback, useMemo } from "react";
import { Search as SearchIcon, X, Clock, TrendingUp, Users, Calendar, ShoppingBag, Play, ArrowRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const RECENT_SEARCHES_KEY = "loverball-recent-searches";
const MAX_RECENT = 8;

const TRENDING_SEARCHES = [
  "WNBA Watch Party",
  "Lakers",
  "Networking Events",
  "Angel City FC",
  "March Madness",
  "World Cup LA",
  "LA28 Olympics",
  "Run Club",
];

type SearchTab = "all" | "members" | "events" | "shop";

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
}

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [members, setMembers] = useState<MemberResult[]>([]);
  const [events, setEvents] = useState<EventResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
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

  // Execute search
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setMembers([]);
      setEvents([]);
      setHasSearched(false);
      return;
    }
    performSearch(debouncedQuery.trim());
  }, [debouncedQuery]);

  const performSearch = async (query: string) => {
    setIsLoading(true);
    setHasSearched(true);

    const q = `%${query}%`;

    const [membersRes, eventsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, city, primary_role, profile_photo_url, favorite_la_teams")
        .or(`name.ilike.${q},city.ilike.${q},primary_role.ilike.${q},bio.ilike.${q}`)
        .limit(20),
      supabase
        .from("events")
        .select("id, title, event_date, event_time, venue_name, city, image_url, event_type, sport_tags")
        .or(`title.ilike.${q},description.ilike.${q},venue_name.ilike.${q},city.ilike.${q}`)
        .order("event_date", { ascending: true })
        .limit(20),
    ]);

    setMembers(membersRes.data || []);
    setEvents(eventsRes.data || []);
    setIsLoading(false);
  };

  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const handleSearchSubmit = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) saveRecentSearch(query.trim());
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const removeRecentSearch = (query: string) => {
    const updated = recentSearches.filter((s) => s !== query);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const totalResults = members.length + events.length;

  const tabCounts = useMemo(
    () => ({
      all: totalResults,
      members: members.length,
      events: events.length,
      shop: 0,
    }),
    [members.length, events.length, totalResults]
  );

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pb-20 md:pb-8">
        <div className="container mx-auto px-4 pt-20 md:pt-6 py-6 max-w-3xl">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search events, members, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit(searchQuery)}
                className="pl-12 pr-12 h-12 text-base rounded-full"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setDebouncedQuery(""); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

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
                      {recentSearches.map((query) => (
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
                    {TRENDING_SEARCHES.map((query) => (
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
                    {(["all", "members", "events", "shop"] as SearchTab[]).map((tab) => (
                      <TabsTrigger key={tab} value={tab} className="flex-1 rounded-full capitalize text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {hasSearched && !isLoading && (
                          <span className="ml-1.5 text-xs text-muted-foreground">
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
                            Try a different search or browse categories below
                          </p>
                        </div>
                      )}

                      {/* All Tab */}
                      <TabsContent value="all" className="space-y-6 mt-0">
                        {members.length > 0 && (
                          <ResultSection
                            title="Members"
                            count={members.length}
                            onViewAll={() => setActiveTab("members")}
                          >
                            {members.slice(0, 4).map((m) => (
                              <MemberResultItem key={m.id} member={m} onClick={() => navigate(`/members/${m.id}`)} />
                            ))}
                          </ResultSection>
                        )}
                        {events.length > 0 && (
                          <ResultSection
                            title="Events"
                            count={events.length}
                            onViewAll={() => setActiveTab("events")}
                          >
                            {events.slice(0, 4).map((e) => (
                              <EventResultItem key={e.id} event={e} onClick={() => navigate(`/event/${e.id}`)} />
                            ))}
                          </ResultSection>
                        )}
                      </TabsContent>

                      {/* Members Tab */}
                      <TabsContent value="members" className="space-y-2 mt-0">
                        {members.length === 0 && hasSearched && (
                          <EmptyTabState label="members" />
                        )}
                        {members.map((m) => (
                          <MemberResultItem key={m.id} member={m} onClick={() => navigate(`/members/${m.id}`)} />
                        ))}
                      </TabsContent>

                      {/* Events Tab */}
                      <TabsContent value="events" className="space-y-2 mt-0">
                        {events.length === 0 && hasSearched && (
                          <EmptyTabState label="events" />
                        )}
                        {events.map((e) => (
                          <EventResultItem key={e.id} event={e} onClick={() => navigate(`/event/${e.id}`)} />
                        ))}
                      </TabsContent>

                      {/* Shop Tab */}
                      <TabsContent value="shop" className="mt-0">
                        <div className="text-center py-12">
                          <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">Shop search coming soon</p>
                          <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => navigate("/shop")}>
                            Browse Shop
                          </Button>
                        </div>
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
  title,
  count,
  onViewAll,
  children,
}: {
  title: string;
  count: number;
  onViewAll: () => void;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title} <span className="text-xs font-normal">({count})</span>
        </h3>
        {count > 4 && (
          <button onClick={onViewAll} className="text-xs text-primary hover:underline">
            View all
          </button>
        )}
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function MemberResultItem({ member, onClick }: { member: MemberResult; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
    >
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
        <Badge variant="outline" className="text-[10px] rounded-full shrink-0">
          {member.favorite_la_teams[0]}
        </Badge>
      )}
    </button>
  );
}

function EventResultItem({ event, onClick }: { event: EventResult; onClick: () => void }) {
  const eventDate = new Date(event.event_date);
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
    >
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
      {event.sport_tags && event.sport_tags.length > 0 && (
        <Badge variant="outline" className="text-[10px] rounded-full shrink-0">
          {event.sport_tags[0]}
        </Badge>
      )}
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
