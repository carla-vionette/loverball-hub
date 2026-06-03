import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tv, MapPin, Calendar, Users, ArrowRight, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveArea } from "@/hooks/useActiveArea";
import AreaSelector from "@/components/AreaSelector";

interface WatchEvent {
  id: string;
  slug: string | null;
  title: string;
  event_date: string;
  event_time: string | null;
  venue_name: string | null;
  city: string | null;
  event_type: string | null;
  sport_tags: string[] | null;
  event_tags: string[] | null;
  image_url: string | null;
  rsvp_count?: number;
}

interface Props {
  eventCity?: string | null;
  eventType?: string | null;
  /** Optional: exclude this event id (e.g. when shown on its own detail page) */
  excludeEventId?: string;
  /** Max items to render (default 6) */
  limit?: number;
}

const RELEVANT_TAGS = [
  "watch-party",
  "watch_party",
  "bar",
  "venue",
  "fifa",
  "wnba",
  "womens-sports",
  "womens_sports",
  "soccer",
  "basketball",
  "football",
  "tennis",
];

function formatDate(d: string) {
  const date = new Date(`${d}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tmw = new Date(today);
  tmw.setDate(tmw.getDate() + 1);
  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === tmw.getTime()) return "Tomorrow";
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(t: string | null) {
  if (!t) return null;
  const [h, m] = t.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m), 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const WhereToWatch = ({ excludeEventId, limit = 6 }: Props) => {
  const { active: activeArea, isOverriding, home } = useActiveArea();
  const [events, setEvents] = useState<WatchEvent[] | null>(null);
  const [loading, setLoading] = useState(true);

  const activeCity = activeArea?.city?.toLowerCase().trim() || null;
  const activeZip = activeArea?.zip || null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("events")
        .select("id, slug, title, event_date, event_time, venue_name, city, event_type, sport_tags, event_tags, image_url")
        .gte("event_date", today)
        .eq("visibility", "public")
        .order("event_date", { ascending: true })
        .limit(60);

      if (cancelled) return;

      const filtered = (data || []).filter((e: any) => {
        if (excludeEventId && e.id === excludeEventId) return false;
        const type = (e.event_type || "").toLowerCase();
        const isWatchRelated =
          type === "watch_party" ||
          type === "watch-party" ||
          [...(e.sport_tags || []), ...(e.event_tags || [])]
            .map((t: string) => (t || "").toLowerCase().trim())
            .some((t) => RELEVANT_TAGS.includes(t));
        if (!isWatchRelated) return false;

        // Area filter: city-level match when an active area is set.
        // Events without a city are treated as national reach and always shown.
        if (activeCity && e.city) {
          return e.city.toLowerCase().includes(activeCity);
        }
        return true;
      });

      // Get RSVP counts for visible items
      const sliced = filtered.slice(0, limit);
      const ids = sliced.map((e) => e.id);
      let countsById: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: rsvps } = await supabase
          .from("event_rsvps")
          .select("event_id")
          .in("event_id", ids)
          .in("status", ["going", "confirmed", "approved"]);
        for (const r of rsvps || []) {
          countsById[r.event_id] = (countsById[r.event_id] || 0) + 1;
        }
      }

      setEvents(sliced.map((e) => ({ ...e, rsvp_count: countsById[e.id] || 0 })) as WatchEvent[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [excludeEventId, limit, activeCity]);

  return (
    <Card className="mt-6 border-primary/20">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Tv className="w-4 h-4 text-primary" />
          Where to Watch
        </CardTitle>
        <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1">
          <Link to="/events">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : !events || events.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Tv className="w-10 h-10 text-primary/50 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">
              No upcoming watch parties
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Check back soon or browse all events to find your next game day.
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild size="sm" variant="default">
                <Link to="/events">Browse events</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/club">Join the club</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((e) => {
              const tag = e.event_type || e.sport_tags?.[0] || e.event_tags?.[0] || null;
              const time = formatTime(e.event_time);
              const href = `/event/${e.slug || e.id}`;
              return (
                <Link
                  key={e.id}
                  to={href}
                  className="flex items-stretch gap-3 p-3 rounded-xl border border-border/40 hover:bg-muted/50 hover:border-primary/30 transition-colors min-h-[5rem]"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                    {e.image_url ? (
                      <img
                        src={e.image_url}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(ev) => {
                          (ev.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <Tv className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-sm text-foreground line-clamp-2 flex-1">
                        {e.title}
                      </span>
                      {tag && (
                        <Badge className="bg-accent/15 text-accent text-[10px] border-0 shrink-0 capitalize">
                          {tag.replace(/[-_]/g, " ")}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(e.event_date)}{time ? ` · ${time}` : ""}
                      </span>
                      {(e.venue_name || e.city) && (
                        <span className="flex items-center gap-1 min-w-0">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {[e.venue_name, e.city].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                      )}
                      {e.rsvp_count ? (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {e.rsvp_count}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhereToWatch;
