import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveArea } from "@/hooks/useActiveArea";
import { useNetworkQuality } from "@/hooks/useNetworkQuality";
import AppLayout from "@/components/layout/AppLayout";
import Seo from "@/components/Seo";
import EventCard, { type EventCardData } from "@/components/events/EventCard";
import GameFeedCard, { type FeedGame } from "@/components/events/GameFeedCard";
import EventCalendar from "@/components/events/EventCalendar";
import { teamsForArea } from "@/lib/metroTeams";
import {
  isInVenueRadius,
  getEventDistanceMiles,
  type ViewerLike,
} from "@/lib/distance";
import {
  BADGE_LABELS,
  BUCKET_LABELS,
  bucketForDate,
  classifyEvent,
  getEventBadges,
  matchesFilter,
  type EventFilter,
  type DateBucket,
} from "@/lib/eventClassification";

interface DbEvent {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  banner_image: string | null;
  event_date: string;
  event_time: string | null;
  venue_name: string | null;
  city: string | null;
  event_type: string | null;
  tier: string | null;
  visibility: string;
  location_lat: number | null;
  location_lng: number | null;
  host_user_id: string | null;
  status: string;
  sport_tags?: string[] | null;
  event_tags?: string[] | null;
}

const FILTERS: { key: EventFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "external_sports", label: "Sports" },
  { key: "curated_culture", label: "Culture" },
  { key: "loverball_hosted", label: "Loverball" },
];

type ViewMode = "feed" | "calendar";

export default function Events() {
  const { user } = useAuth();
  const { active: activeArea } = useActiveArea();
  const { isSlow, saveData } = useNetworkQuality();
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [games, setGames] = useState<FeedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<EventFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("feed");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [, setRefreshKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [searchInput]);

  const viewer: ViewerLike | null = activeArea
    ? { lat: activeArea.lat ?? null, lng: activeArea.lng ?? null, city: activeArea.city ?? null }
    : null;

  const teams = useMemo(() => teamsForArea(activeArea), [activeArea]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("events")
        .select(
          "id, title, description, image_url, banner_image, event_date, event_time, venue_name, city, event_type, tier, visibility, sport_tags, event_tags, location_lat, location_lng, host_user_id, status",
        )
        .eq("status", "published")
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(200);
      if (cancelled) return;
      if (!error && data) setEvents(data as DbEvent[]);
    })();
    return () => { cancelled = true; };
  }, []);

  const fetchingRef = useRef(false);
  const fetchGames = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const { data, error } = await supabase.functions.invoke("sports-scoreboard", {
        body: { sports: "all", dateRange: "upcoming", teams },
      });
      if (!error && data) {
        const d = data as { live?: FeedGame[]; scheduled?: FeedGame[]; final?: FeedGame[] };
        const merged: FeedGame[] = [
          ...(d.live ?? []),
          ...(d.scheduled ?? []),
          ...(d.final ?? []),
        ];
        const seen = new Set<string>();
        setGames(merged.filter((g) => g && g.id && !seen.has(g.id) && (seen.add(g.id), true)));
      }
    } finally {
      fetchingRef.current = false;
    }
  }, [teams]);

  const hasLive = useMemo(() => games.some((g) => g.status === "live"), [games]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await fetchGames();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fetchGames]);

  useEffect(() => {
    if (saveData) return;
    const baseInterval = hasLive ? 30_000 : 120_000;
    const interval = isSlow ? baseInterval * 3 : baseInterval;
    const tick = () => {
      if (document.visibilityState === "visible") fetchGames();
    };
    const timer = window.setInterval(tick, interval);
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchGames();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchGames, hasLive, isSlow, saveData]);

  // Normalize DB events into card data once.
  const allCards = useMemo<EventCardData[]>(() => {
    return events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      image_url: e.image_url,
      banner_image: e.banner_image,
      event_date: e.event_date,
      event_time: e.event_time,
      venue_name: e.venue_name,
      city: e.city,
      location_lat: e.location_lat,
      location_lng: e.location_lng,
      event_type: e.event_type,
      sport_tags: e.sport_tags,
      event_tags: e.event_tags,
      category: classifyEvent(e),
    }));
  }, [events]);

  // Look up the underlying DbEvent for badge computation.
  const eventsById = useMemo(() => {
    const m = new Map<string, DbEvent>();
    for (const e of events) m.set(e.id, e);
    return m;
  }, [events]);

  const badgesFor = useCallback(
    (c: EventCardData): string[] => {
      const src = eventsById.get(c.id);
      if (!src) return [];
      return getEventBadges(src).map((b) => BADGE_LABELS[b]);
    },
    [eventsById],
  );

  // Filter + search pipeline — single derived dataset reused everywhere.
  const filteredCards = useMemo(() => {
    return allCards.filter((c) => {
      const src = eventsById.get(c.id);
      if (!src) return false;
      if (!matchesFilter(src, filter)) return false;
      if (!searchQuery) return true;
      const hay = [
        c.title,
        c.description ?? "",
        c.venue_name ?? "",
        c.city ?? "",
        ...(c.sport_tags ?? []),
        ...(c.event_tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(searchQuery);
    });
  }, [allCards, eventsById, filter, searchQuery]);

  const sortedCards = useMemo(() => {
    return [...filteredCards].sort((a, b) => {
      const aIn = isInVenueRadius(a, viewer) ? 0 : 1;
      const bIn = isInVenueRadius(b, viewer) ? 0 : 1;
      if (aIn !== bIn) return aIn - bIn;
      const da = getEventDistanceMiles(a, viewer);
      const db = getEventDistanceMiles(b, viewer);
      if (da != null && db != null && da !== db) return da - db;
      return a.event_date.localeCompare(b.event_date);
    });
  }, [filteredCards, viewer]);

  const visibleGames = useMemo(() => {
    if (filter !== "all" && filter !== "external_sports") return [] as FeedGame[];
    const list = !searchQuery
      ? games
      : games.filter((g) => {
          const hay = [
            g.homeTeam?.name ?? "",
            g.awayTeam?.name ?? "",
            g.venue ?? "",
            g.sportLabel ?? "",
          ]
            .join(" ")
            .toLowerCase();
          return hay.includes(searchQuery);
        });
    return [...list].sort((a, b) => {
      const liveDiff = (a.status === "live" ? 0 : 1) - (b.status === "live" ? 0 : 1);
      if (liveDiff !== 0) return liveDiff;
      const ta = a.startTime ? new Date(a.startTime).getTime() : Infinity;
      const tb = b.startTime ? new Date(b.startTime).getTime() : Infinity;
      return ta - tb;
    });
  }, [games, filter, searchQuery]);

  // Bucket events by date for Feed view.
  const bucketedFeed = useMemo(() => {
    const map: Record<DateBucket, EventCardData[]> = { today: [], this_week: [], later: [] };
    for (const c of sortedCards) map[bucketForDate(c.event_date)].push(c);
    return map;
  }, [sortedCards]);

  const isEmpty = sortedCards.length === 0 && visibleGames.length === 0;

  // Empty-state copy
  const emptyState = useMemo(() => {
    if (searchQuery) {
      return {
        heading: `No matches for "${searchInput}".`,
        body: "Try a different search or clear filters to widen the lens.",
      };
    }
    if (filter === "loverball_hosted") {
      return {
        heading: "No Loverball events on the schedule yet.",
        body: "New watch parties and salons drop weekly — keep an eye out.",
      };
    }
    if (filter !== "all") {
      const label = FILTERS.find((f) => f.key === filter)?.label ?? "this category";
      return {
        heading: `Nothing in ${label} right now.`,
        body: "Check All to see everything happening this week.",
      };
    }
    return {
      heading: "Calendar's quiet.",
      body: "Check back soon — games and parties get added every week.",
    };
  }, [searchQuery, searchInput, filter]);

  const cityLabel = activeArea?.city || "your city";
  const needsZip = !!user && !activeArea?.zip;

  return (
    <AppLayout>
      <Seo title="Events | Loverball" description="Sports games, watch parties, and Loverball events near you." path="/events" />
      <div className="min-h-screen bg-[#FAF7F2] text-[#1A1A1A]">
        <header className="px-5 pt-8 pb-4 max-w-3xl mx-auto">
          <span
            className="block"
            style={{
              fontFamily: "'Space Mono', ui-monospace, monospace",
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#E85D2F",
            }}
          >
            Events {activeArea?.city ? `· ${cityLabel}` : ""}
          </span>
          <h1
            className="mt-2"
            style={{
              fontFamily: "'Anton', Impact, sans-serif",
              fontWeight: 400,
              fontSize: "clamp(40px, 7vw, 80px)",
              lineHeight: 0.92,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              color: "#1A1A1A",
            }}
          >
            What's <span style={{ color: "#E85D2F" }}>on.</span>
          </h1>
          <p className="mt-2 text-sm font-['Inter'] text-[#1A1A1A]/60">
            {activeArea?.city ? (
              <>Games, watch parties, and Loverball nights around <span className="font-semibold text-[#1A1A1A]">{cityLabel}</span>.</>
            ) : user ? (
              <>Tell us where you are to see what's near you.</>
            ) : (
              <>Sign in to see what's near you.</>
            )}
          </p>

          {needsZip && (
            <Link
              to="/settings?tab=location"
              className="mt-4 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-[#E85D2F]/30 bg-[#E85D2F]/5 hover:bg-[#E85D2F]/10 transition-colors"
            >
              <div className="min-w-0">
                <div
                  style={{
                    fontFamily: "'Space Mono', ui-monospace, monospace",
                    fontSize: 10,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "#E85D2F",
                  }}
                >
                  Set your area
                </div>
                <div className="text-sm font-['Inter'] text-[#1A1A1A] mt-0.5">
                  Add your ZIP code in Settings to see events near you.
                </div>
              </div>
              <span
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                style={{ background: "#E85D2F", fontFamily: "'Space Mono', ui-monospace, monospace", letterSpacing: "0.1em" }}
              >
                OPEN
              </span>
            </Link>
          )}

          {/* Search */}
          <div className="mt-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/40" aria-hidden />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search events, venues, teams, or cities"
              className="w-full h-11 pl-11 pr-11 rounded-full bg-white border border-[#E8E3DC] text-sm font-['Inter'] text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:border-[#E85D2F] transition-colors"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-[#1A1A1A]/60 hover:bg-black/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View toggle + filter chips */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full bg-white border border-[#E8E3DC] p-1">
              {(["feed", "calendar"] as ViewMode[]).map((m) => {
                const active = viewMode === m;
                return (
                  <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    aria-pressed={active}
                    className="px-4 py-1.5 rounded-full text-xs uppercase tracking-wider transition-all"
                    style={{
                      fontFamily: "'Space Mono', ui-monospace, monospace",
                      background: active ? "#1A1A1A" : "transparent",
                      color: active ? "#FAF7F2" : "#1A1A1A",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {m === "feed" ? "Feed" : "Calendar"}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 overflow-x-auto -mx-1 px-1 scrollbar-hide flex-1 min-w-0">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    aria-pressed={active}
                    className="shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-xs uppercase tracking-wider transition-all"
                    style={{
                      fontFamily: "'Space Mono', ui-monospace, monospace",
                      background: active ? "#E85D2F" : "#FFFFFF",
                      color: active ? "#FFFFFF" : "#1A1A1A",
                      border: `1px solid ${active ? "#E85D2F" : "#E8E3DC"}`,
                      boxShadow: active ? "0 4px 14px -4px rgba(232, 93, 47, 0.5)" : "none",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <main className="px-5 pb-20 max-w-3xl mx-auto">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-36 rounded-2xl bg-black/5 animate-pulse" />
              ))}
            </div>
          ) : isEmpty ? (
            <div className="text-center py-20 space-y-2">
              <p className="font-['Playfair_Display'] italic text-xl text-[#1A1A1A]/60">
                {emptyState.heading}
              </p>
              <p className="text-sm font-['Inter'] text-[#1A1A1A]/50">{emptyState.body}</p>
              {(searchQuery || filter !== "all") && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    setFilter("all");
                  }}
                  className="mt-3 inline-block px-4 py-2 rounded-full bg-[#1A1A1A] text-[#FAF7F2] text-xs"
                  style={{ fontFamily: "'Space Mono', ui-monospace, monospace", letterSpacing: "0.18em", textTransform: "uppercase" }}
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : viewMode === "calendar" ? (
            <EventCalendar
              events={sortedCards}
              viewer={viewer}
              badgesFor={badgesFor}
              onChanged={() => setRefreshKey((k) => k + 1)}
            />
          ) : (
            <FeedView
              buckets={bucketedFeed}
              games={visibleGames}
              viewer={viewer}
              badgesFor={badgesFor}
              onChanged={() => setRefreshKey((k) => k + 1)}
            />
          )}
        </main>
      </div>
    </AppLayout>
  );
}

function SectionHeading({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1A1A]/10">
      <span
        style={{
          fontFamily: "'Space Mono', ui-monospace, monospace",
          fontSize: 11,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#1A1A1A",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'Space Mono', ui-monospace, monospace",
          fontSize: 11,
          color: "#1A1A1A",
          opacity: 0.5,
        }}
      >
        {count}
      </span>
    </div>
  );
}

function FeedView({
  buckets,
  games,
  viewer,
  badgesFor,
  onChanged,
}: {
  buckets: Record<DateBucket, EventCardData[]>;
  games: FeedGame[];
  viewer: ViewerLike | null;
  badgesFor: (c: EventCardData) => string[];
  onChanged: () => void;
}) {
  const order: DateBucket[] = ["today", "this_week", "later"];
  return (
    <div className="space-y-7">
      {games.length > 0 && (
        <section>
          <SectionHeading label="Live & Upcoming Games" count={games.length} />
          <div className="space-y-3">
            {games.map((g) => (
              <GameFeedCard key={`game:${g.id}`} game={g} />
            ))}
          </div>
        </section>
      )}
      {order.map((key) => {
        const items = buckets[key];
        if (items.length === 0) return null;
        return (
          <section key={key}>
            <SectionHeading label={BUCKET_LABELS[key]} count={items.length} />
            <div className="space-y-3">
              {items.map((c) => (
                <EventCard
                  key={c.id}
                  event={c}
                  viewer={viewer}
                  badges={badgesFor(c)}
                  onChanged={onChanged}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
