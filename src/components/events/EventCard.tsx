import { useNavigate } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";
import RsvpControl from "./RsvpControl";
import { getEventDistanceMiles, formatMiles, type EventLike, type ViewerLike } from "@/lib/distance";
import { parseEventDate } from "@/lib/eventDate";
import { format } from "date-fns";

export type EventCategory = "external_sports" | "curated_culture" | "loverball_hosted";

export interface EventCardData extends EventLike {
  id: string;
  title: string;
  image_url?: string | null;
  banner_image?: string | null;
  event_date: string;
  event_time?: string | null;
  venue_name?: string | null;
  event_type?: string | null;
  category: EventCategory;
}

const THEME: Record<EventCategory, { color: string; label: string }> = {
  external_sports: { color: "#E85D2F", label: "Game" },
  curated_culture: { color: "#E85D2F", label: "Culture" },
  loverball_hosted: { color: "#E85D2F", label: "Loverball" },
};

function fmtTime(t?: string | null) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const d = new Date();
  d.setHours(parseInt(h, 10), parseInt(m, 10));
  return format(d, "h:mm a");
}

export default function EventCard({
  event,
  viewer,
  onChanged,
}: {
  event: EventCardData;
  viewer: ViewerLike | null;
  onChanged?: () => void;
}) {
  const navigate = useNavigate();
  const theme = THEME[event.category] ?? THEME.curated_culture;
  const distance = getEventDistanceMiles(event, viewer);
  const eventDate = parseEventDate(event.event_date);
  const dateLabel = format(eventDate, "EEE, MMM d");
  const image = event.image_url || event.banner_image;

  return (
    <article
      onClick={() => navigate(`/event/${event.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(`/event/${event.id}`);
      }}
      role="link"
      tabIndex={0}
      className="group relative bg-[#FAF5E9] rounded-2xl overflow-hidden border border-black/5 hover:border-black/20 transition-all cursor-pointer flex"
    >
      {/* Left accent bar */}
      <div className="w-1 flex-shrink-0" style={{ background: theme.color }} />

      <div className="flex-1 min-w-0 flex flex-col sm:flex-row">
        {/* Image */}
        <div className="w-full sm:w-40 h-32 sm:h-auto relative flex-shrink-0 overflow-hidden">
          {image ? (
            <img
              src={image}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, ${theme.color} 0%, ${theme.color}55 100%)`,
              }}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span
                className="inline-block mb-1.5"
                style={{
                  fontFamily: "'Space Mono', ui-monospace, monospace",
                  fontSize: 11,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: theme.color,
                }}
              >
                {theme.label}
              </span>
              <h3
                className="text-[#1A1A1A]"
                style={{
                  fontFamily: "'Anton', Impact, sans-serif",
                  fontWeight: 400,
                  fontSize: "clamp(20px, 2.6vw, 26px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.01em",
                  textTransform: "uppercase",
                }}
              >
                {event.title}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-['Inter'] text-[#1A1A1A]/60">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {dateLabel}
              {event.event_time ? ` · ${fmtTime(event.event_time)}` : ""}
            </span>
            {event.venue_name && (
              <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
                <MapPin className="w-3 h-3" /> {event.venue_name}
              </span>
            )}
            <span className="font-mono text-[#1A1A1A]/50">
              {distance != null ? formatMiles(distance) : "Watch only"}
            </span>
          </div>

          <div className="pt-1">
            <RsvpControl
              eventId={event.id}
              event={event}
              viewer={viewer}
              variant="compact"
              onChanged={onChanged}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
