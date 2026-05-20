import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, ArrowRight } from "lucide-react";

interface NextEvent {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  venue_name: string | null;
  city: string | null;
}

const formatDate = (date: string, time: string | null) => {
  const d = new Date(`${date}T${time || "00:00"}`);
  const day = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  if (!time) return day;
  const t = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} · ${t}`;
};

const WhatsHappeningNow = () => {
  const [event, setEvent] = useState<NextEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("events")
        .select("id, title, event_date, event_time, venue_name, city")
        .eq("status", "published")
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .order("event_time", { ascending: true })
        .limit(1)
        .maybeSingle();
      setEvent(data as NextEvent | null);
      setLoading(false);
    })();
  }, []);

  if (loading || !event) return null;

  const location = [event.venue_name, event.city].filter(Boolean).join(" · ");

  return (
    <section className="max-w-7xl mx-auto mt-16 px-5 md:px-10">
      <p
        className="mb-4"
        style={{
          fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
          fontSize: 11,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#FF4D3A",
          fontWeight: 700,
        }}
      >
        What's Happening Now
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Next event */}
        <Link
          to={`/event/${event.id}`}
          className="group rounded-[20px] p-6 border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#FF4D3A]/40 transition-all"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF4D3A] animate-pulse" />
            <span
              className="text-[10px] tracking-[0.2em] uppercase text-[#FF4D3A] font-semibold"
              style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace" }}
            >
              Next Event
            </span>
          </div>
          <h3
            className="text-xl md:text-2xl text-white leading-tight mb-3 line-clamp-2"
            style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600 }}
          >
            {event.title}
          </h3>
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{formatDate(event.event_date, event.event_time)}</span>
            </div>
            {location && (
              <div className="flex items-center gap-2 text-sm text-white/70">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-[#FF4D3A] group-hover:gap-2 transition-all">
            See event <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>
    </section>
  );
};

export default WhatsHappeningNow;
