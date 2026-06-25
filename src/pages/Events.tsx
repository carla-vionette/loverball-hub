import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveArea } from "@/hooks/useActiveArea";
import { useNetworkQuality } from "@/hooks/useNetworkQuality";
import AppLayout from "@/components/layout/AppLayout";
import Seo from "@/components/Seo";
import EventCard, { type EventCardData, type EventCategory } from "@/components/events/EventCard";
import GameFeedCard, { type FeedGame } from "@/components/events/GameFeedCard";
import { teamsForArea } from "@/lib/metroTeams";
import { parseEventDate } from "@/lib/eventDate";
import { format } from "date-fns";
import { Search } from "lucide-react";
import {
  isInVenueRadius,
  getEventDistanceMiles,
  type ViewerLike,
} from "@/lib/distance";

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

const FILTERS: { key: "all" | EventCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "external_sports", label: "Sports" },
  { key: "curated_culture", label: "Culture" },
  { key: "loverball_hosted", label: "Loverball" },
];

// A Loverball-hosted event is any human-hosted event that lives on the
// platform (watch parties, panels, salons, parties, networking, member-only).
// Sports games coming from the scoreboard are 'game'.
function categoryFor(e: Pick<DbEvent, "event_type" | "tier" | "visibility">): EventCategory {
  if (e.event_type === "game") return "external_sports";
  // Anything member-tier or members_only is a Loverball-hosted event.
  if (e.tier === "member" || e.visibility === "members_only") return "loverball_hosted";
  if (
    e.event_type === "watch_party" ||
    e.event_type === "party" ||
    e.event_type === "networking" ||
    e.event_type === "salon" ||
    e.event_type === "panel"
  ) {
    return "loverball_hosted";
  }
  return "curated_culture";
}

type ViewMode = "feed" | "calendar";

export default function Events() {
  const { user } = useAuth();
  const { active: activeArea } = useActiveArea();
  const { isSlow, saveData } = useNetworkQuality();
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [games, setGames] = useState<FeedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | EventCategory>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("feed");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Debounce search input
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

  const cards = useMemo<EventCardData[]>(() => {
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
      category: categoryFor(e),
    }));
  }, [events]);

  // Apply category filter
  const filteredCards = useMemo(() => {
    return cards.filter((c) => (filter === "all" ? true : c.category === filter));
  }, [cards, filter]);

  // Apply search
  const searchedCards = useMemo(() => {
    if (!searchQuery) return filteredCards;
    return filteredCards.filter((c) => {
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
  }, [filteredCards, searchQuery]);

  const sortedCards = useMemo(() => {
    return [...searchedCards].sort((a, b) => {
      const aIn = isInVenueRadius(a, viewer) ? 0 : 1;
      const bIn = isInVenueRadius(b, viewer) ? 0 : 1;
      if (aIn !== bIn) return aIn - bIn;
      const da = getEventDistanceMiles(a, viewer);
      const db = getEventDistanceMiles(b, viewer);
      if (da != null && db != null && da !== db) return da - db;
      return a.event_date.localeCompare(b.event_date);
    });
  }, [searchedCards, viewer]);

  const visibleGames = useMemo(() => {
    if (filter !== "all" && filter !== "external_sports") return [] as FeedGame[];
    const list = !searchQuery
      ? games
      : games.filter((g) => {
          const hay = [g.homeTeam?.name ?? "", g.awayTeam?.name ?? "", g.venue ?? ""]
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

  const isEmpty = sortedCards.length === 0 && visibleGames.length === 0;

  // Group by date for calendar view
  const groupedByDate = useMemo(() => {
    const groups = new Map<string, EventCardData[]>();
    for (const c of sortedCards) {
      const key = c.event_date;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [sortedCards]);

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
            Events
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
              <>What's on around <span className="font-semibold text-[#1A1A1A]">{cityLabel}</span>.</>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/40" aria-hidden />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search events, venues, teams…"
              className="w-full h-11 pl-10 pr-4 rounded-full bg-white border border-[#E8E3DC] text-sm font-['Inter'] text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:border-[#E85D2F] transition-colors"
            />
          </div>

          {/* View toggle */}
          <div className="mt-4 inline-flex rounded-full bg-white border border-[#E8E3DC] p-1">
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

          <div className="mt-4 flex gap-2 overflow-x-auto -mx-1 px-1 scrollbar-hide">
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
                {searchQuery
                  ? `No events match "${searchInput}".`
                  : filter !== "all"
                    ? `No ${FILTERS.find((f) => f.key === filter)?.label} events yet.`
                    : "No upcoming events yet."}
              </p>
              <p className="text-sm font-['Inter'] text-[#1A1A1A]/50">
                {searchQuery
                  ? "Try a different search or clear filters."
                  : "Check back soon — new games and parties get added every week."}
              </p>
            </div>
          ) : viewMode === "calendar" ? (
            <div className="space-y-6">
              {groupedByDate.map(([dateKey, items]) => {
                const d = parseEventDate(dateKey);
                return (
                  <section key={dateKey}>
                    <div className="flex items-baseline gap-3 mb-3 pb-2 border-b border-[#1A1A1A]/10">
                      <div
                        style={{
                          fontFamily: "'Anton', Impact, sans-serif",
                          fontSize: 28,
                          lineHeight: 1,
                          color: "#E85D2F",
                        }}
                      >
                        {format(d, "d")}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Space Mono', ui-monospace, monospace",
                          fontSize: 11,
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          color: "#1A1A1A",
                        }}
                      >
                        {format(d, "EEE · MMM yyyy")}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {items.map((c) => (
                        <EventCard
                          key={c.id}
                          event={c}
                          viewer={viewer}
                          onChanged={() => setRefreshKey((k) => k + 1)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleGames.map((g) => (
                <GameFeedCard key={`game:${g.id}`} game={g} />
              ))}
              {sortedCards.map((c) => (
                <EventCard
                  key={c.id}
                  event={c}
                  viewer={viewer}
                  onChanged={() => setRefreshKey((k) => k + 1)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </AppLayout>
  );
}
