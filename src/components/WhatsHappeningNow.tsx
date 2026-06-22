import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, MapPin, ArrowRight, Users, Play } from "lucide-react";
import { fonts } from "@/components/home/_theme";

interface NextEvent {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  venue_name: string | null;
  city: string | null;
}

interface ClubActivity {
  pendingMatches: number;
  recentMatches: number;
  city: string | null;
}

interface LatestVideo {
  id: string;
  title: string;
  category: string | null;
  creator: string | null;
}

const formatDate = (date: string, time: string | null) => {
  const d = new Date(`${date}T${time || "00:00"}`);
  const day = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  if (!time) return day;
  const t = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} · ${t}`;
};

const WhatsHappeningNow = () => {
  const { user } = useAuth();
  const [event, setEvent] = useState<NextEvent | null>(null);
  const [club, setClub] = useState<ClubActivity | null>(null);
  const [video, setVideo] = useState<LatestVideo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().split("T")[0];
      const eventPromise = supabase
        .from("events")
        .select("id, title, event_date, event_time, venue_name, city")
        .eq("status", "published")
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .order("event_time", { ascending: true })
        .limit(1)
        .maybeSingle();

      const [{ data: eventData }] = await Promise.all([eventPromise]);
      setEvent(eventData as NextEvent | null);

      if (user) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const pendingRes: any = await (supabase as any)
          .from("matches")
          .select("id", { count: "exact", head: true })
          .eq("addressee_id", user.id)
          .eq("status", "pending");
        const recentRes: any = await (supabase as any)
          .from("matches")
          .select("id", { count: "exact", head: true })
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
          .gte("created_at", sevenDaysAgo);
        const profileRes = await supabase
          .from("profiles")
          .select("city")
          .eq("id", user.id)
          .maybeSingle();
        setClub({
          pendingMatches: pendingRes.count ?? 0,
          recentMatches: recentRes.count ?? 0,
          city: (profileRes.data as any)?.city ?? null,
        });
      }

      const videoRes: any = await (supabase as any)
        .from("videos")
        .select("id, title, category, creator_channels(channel_name)")
        .eq("is_published", true)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (videoRes?.data) {
        setVideo({
          id: videoRes.data.id,
          title: videoRes.data.title,
          category: videoRes.data.category ?? null,
          creator: videoRes.data.creator_channels?.channel_name ?? null,
        });
      }

      setLoading(false);
    })();
  }, [user]);

  if (loading) return null;

  const location = event ? [event.venue_name, event.city].filter(Boolean).join(" · ") : "";

  const clubMessage = club
    ? club.pendingMatches > 0
      ? `${club.pendingMatches} new fan match${club.pendingMatches === 1 ? "" : "es"} waiting`
      : club.recentMatches > 0
        ? club.city
          ? `Your ${club.city} crew has new activity`
          : "Your crew has new activity"
        : null
    : null;

  if (!event && !clubMessage && !video) return null;

  return (
    <section className="max-w-7xl mx-auto mt-16 px-5 md:px-10">
      <p
        className="mb-4"
        style={{
          fontFamily: fonts.sans,
          fontSize: 12,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#E85D2F",
          fontWeight: 700,
        }}
      >
        What's happening now
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Next event */}
        {event && (
          <Link
            to={`/event/${event.id}`}
            className="group rounded-[20px] p-6 transition-all"
            style={{ background: "#FFFFFF", border: "1px solid #E8E3DC", color: "#1A1A1A" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E85D2F] animate-pulse" />
              <span
                className="text-[10px] tracking-[0.08em] uppercase text-[#E85D2F] font-semibold"
                style={{ fontFamily: fonts.sans }}
              >
                Next event
              </span>
            </div>
            <h3
              className="text-xl md:text-2xl leading-tight mb-3 line-clamp-2"
              style={{ fontFamily: "'Anton', Impact, sans-serif", fontWeight: 600, color: "#1A1A1A" }}
            >
              {event.title}
            </h3>
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-2 text-sm" style={{ color: "#6B6B6B" }}>
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{formatDate(event.event_date, event.event_time)}</span>
              </div>
              {location && (
                <div className="flex items-center gap-2 text-sm" style={{ color: "#6B6B6B" }}>
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{location}</span>
                </div>
              )}
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-[#E85D2F] group-hover:gap-2 transition-all">
              See event <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        )}


        {/* Card 2: Club activity */}
        {clubMessage && (
          <Link
            to="/club"
            className="group rounded-[20px] p-6 transition-all"
            style={{ background: "#FFFFFF", border: "1px solid #E8E3DC", color: "#1A1A1A" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E85D2F] animate-pulse" />
              <span
                className="text-[10px] tracking-[0.08em] uppercase text-[#E85D2F] font-semibold"
                style={{ fontFamily: fonts.sans }}
              >
                The Club
              </span>
            </div>
            <h3
              className="text-xl md:text-2xl leading-tight mb-3 line-clamp-3"
              style={{ fontFamily: "'Anton', Impact, sans-serif", fontWeight: 600, color: "#1A1A1A" }}
            >
              {clubMessage}
            </h3>
            <div className="flex items-center gap-2 text-sm mb-4" style={{ color: "#6B6B6B" }}>
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Fan matches & crews</span>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-[#E85D2F] group-hover:gap-2 transition-all">
              Go to Club <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        )}

        {/* Card 3: Latest video */}
        {video && (
          <Link
            to="/feed"
            className="group rounded-[20px] p-6 transition-all"
            style={{ background: "#FFFFFF", border: "1px solid #E8E3DC", color: "#1A1A1A" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E85D2F] animate-pulse" />
              <span
                className="text-[10px] tracking-[0.08em] uppercase text-[#E85D2F] font-semibold"
                style={{ fontFamily: fonts.sans }}
              >
                {video.category ? video.category : "New on feed"}
              </span>
            </div>
            <h3
              className="text-xl md:text-2xl leading-tight mb-3 line-clamp-3"
              style={{ fontFamily: "'Anton', Impact, sans-serif", fontWeight: 600, color: "#1A1A1A" }}
            >
              {video.title}
            </h3>
            {video.creator && (
              <div className="flex items-center gap-2 text-sm mb-4" style={{ color: "#6B6B6B" }}>
                <Play className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{video.creator}</span>
              </div>
            )}
            <span className="inline-flex items-center gap-1 text-sm font-medium text-[#E85D2F] group-hover:gap-2 transition-all">
              Open Feed <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

        )}
      </div>
    </section>
  );
};

export default WhatsHappeningNow;
