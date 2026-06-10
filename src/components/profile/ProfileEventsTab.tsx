import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { parseEventDate } from "@/lib/eventDate";
import { handleEventImageError, resolveEventImage } from "@/lib/eventImage";

interface RSVPEvent {
  id: string;
  status: string;
  event: {
    id: string;
    title: string;
    description?: string | null;
    event_date: string;
    event_time: string | null;
    venue_name: string | null;
    city: string | null;
    image_url: string | null;
    banner_image?: string | null;
    event_type?: string | null;
    sport_tags?: string[] | null;
  };
}

const ProfileEventsTab = ({
  rsvpEvents,
  onNavigate,
}: {
  rsvpEvents: RSVPEvent[];
  onNavigate: (path: string) => void;
}) => {
  const upcoming = rsvpEvents.filter(
    (r) => parseEventDate(r.event.event_date) >= new Date()
  );
  const past = rsvpEvents.filter(
    (r) => parseEventDate(r.event.event_date) < new Date()
  );

  if (rsvpEvents.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No events yet"
        description="RSVP to events to see them here"
        action={{ label: "Browse Events", onClick: () => onNavigate("/events") }}
      />
    );
  }

  const renderList = (items: RSVPEvent[], label: string) =>
    items.length > 0 ? (
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
          {label}
        </h4>
        {items.map((rsvp) => {
          const eventImage = resolveEventImage(rsvp.event);
          return (
            <Card
              key={rsvp.id}
              className="p-3 flex items-center gap-3 cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => onNavigate(`/event/${rsvp.event.id}`)}
            >
              <img
                src={eventImage}
                alt={rsvp.event.title}
                className="w-14 h-14 rounded-lg object-cover shrink-0"
                loading="lazy"
                decoding="async"
                onError={handleEventImageError}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground line-clamp-1">
                  {rsvp.event.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {rsvp.event.venue_name || rsvp.event.city || "TBD"} ·{" "}
                  {format(parseEventDate(rsvp.event.event_date), "MMM d, yyyy")}
                </p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize shrink-0">
                {rsvp.status}
              </span>
            </Card>
          );
        })}
      </div>
    ) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {renderList(upcoming, "Upcoming")}
      {renderList(past, "Past")}
    </motion.div>
  );
};

export default ProfileEventsTab;
