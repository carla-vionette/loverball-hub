import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveArea } from "@/hooks/useActiveArea";
import AppLayout from "@/components/layout/AppLayout";
import Seo from "@/components/Seo";
import EventCard, { type EventCardData, type EventCategory } from "@/components/events/EventCard";
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
  location_lat: number | null;
  location_lng: number | null;
  host_user_id: string | null;
  status: string;
  visibility: string;
}

const FILTERS: { key: "all" | EventCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "external_sports", label: "Sports" },
  { key: "curated_culture", label: "Culture" },
  { key: "loverball_hosted", label: "Loverball" },
];

function categoryFor(e: Pick<DbEvent, "event_type" | "host_user_id">): EventCategory {
  if (e.event_type === "game") return "external_sports";
  if (e.event_type === "watch_party" || e.event_type === "panel" || e.event_type === "salon")
    return "curated_culture";
  return "loverball_hosted";
}

export default function Events() {
  const { user } = useAuth();
  const { active: activeArea } = useActiveArea();
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | EventCategory>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const viewer: ViewerLike | null = activeArea
    ? { lat: activeArea.lat ?? null, lng: activeArea.lng ?? null, city: activeArea.city ?? null }
    : null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("events")
        .select(
          "id, title, description, image_url, banner_image, event_date, event_time, venue_name, city, event_type, location_lat, location_lng, host_user_id, status, visibility",
        )
        .eq("status", "published")
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(120);
      if (cancelled) return;
      if (!error && data) setEvents(data as DbEvent[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = useMemo<EventCardData[]>(() => {
    return events
      .map((e) => ({
        id: e.id,
        title: e.title,
        image_url: e.image_url,
        banner_image: e.banner_image,
        event_date: e.event_date,
        event_time: e.event_time,
        venue_name: e.venue_name,
        city: e.city,
        location_lat: e.location_lat,
        location_lng: e.location_lng,
        event_type: e.event_type,
        category: categoryFor(e),
      }))
      .filter((c) => (filter === "all" ? true : c.category === filter));
  }, [events, filter]);

  // Sort: in-radius first, then by date.
  const sorted = useMemo(() => {
    return [...cards].sort((a, b) => {
      const aIn = isInVenueRadius(a, viewer) ? 0 : 1;
      const bIn = isInVenueRadius(b, viewer) ? 0 : 1;
      if (aIn !== bIn) return aIn - bIn;
      // Then by distance asc (null last), then by date
      const da = getEventDistanceMiles(a, viewer);
      const db = getEventDistanceMiles(b, viewer);
      if (da != null && db != null && da !== db) return da - db;
      return a.event_date.localeCompare(b.event_date);
    });
  }, [cards, viewer]);

  const cityLabel = activeArea?.city || "your city";

  return (
    <AppLayout>
      <Seo title="Events | Loverball" description="Sports games, watch parties, and Loverball events near you." path="/events" />
      <div className="min-h-screen bg-[#FAF5E9] text-[#1A1A1A]">
        <header className="px-5 pt-8 pb-4 max-w-3xl mx-auto">
          <div className="flex items-baseline justify-between gap-2">
            <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl text-[#1A1A1A]">
              Events
            </h1>
          </div>
          <p className="mt-1 text-sm font-['Inter'] text-[#1A1A1A]/60">
            {activeArea?.city ? (
              <>What's on around <span className="font-semibold text-[#1A1A1A]">{cityLabel}</span>.</>
            ) : user ? (
              <>Add your zip in your profile to see what's near you.</>
            ) : (
              <>Sign in to see what's near you.</>
            )}
          </p>

          <div className="mt-5 flex gap-2 overflow-x-auto -mx-1 px-1 scrollbar-hide">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold font-['Inter'] uppercase tracking-wider border transition-colors ${
                  filter === f.key
                    ? "bg-[#1A1A1A] text-[#FAF5E9] border-[#1A1A1A]"
                    : "bg-transparent text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </header>

        <main className="px-5 pb-20 max-w-3xl mx-auto">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-36 rounded-2xl bg-black/5 animate-pulse" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-20 space-y-2">
              <p className="font-['Playfair_Display'] italic text-xl text-[#1A1A1A]/60">
                No events {filter !== "all" ? `in ${FILTERS.find((f) => f.key === filter)?.label}` : "near you"} yet.
              </p>
              <p className="text-sm font-['Inter'] text-[#1A1A1A]/50">
                Check back soon — new games and parties get added every week.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((c) => (
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
