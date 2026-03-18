import { Link } from "react-router-dom";
import { format } from "date-fns";

interface EventFeedCardProps {
  id: string;
  title: string;
  eventDate: string;
  eventTime: string | null;
  venueName: string | null;
  city: string | null;
  slug: string | null;
}

const EventFeedCard = ({ id, title, eventDate, eventTime, venueName, city, slug }: EventFeedCardProps) => {
  const date = new Date(eventDate);
  const month = format(date, "MMM").toUpperCase();
  const day = format(date, "d");

  return (
    <Link
      to={slug ? `/event/${slug}` : `/event/${id}`}
      className="flex items-center gap-4 bg-card rounded-xl border border-border/20 border-l-4 border-l-primary p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Date badge */}
      <div className="shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
        <span className="text-[11px] font-display font-bold text-primary uppercase">{month}</span>
        <span className="text-xl font-display font-extrabold text-foreground leading-none">{day}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-display text-sm font-bold uppercase text-foreground leading-tight truncate">
          {title}
        </h4>
        <p className="text-xs text-muted-foreground font-body mt-0.5">
          {eventTime && `${eventTime} · `}{venueName || city || "Los Angeles"}
        </p>
      </div>

      {/* RSVP button */}
      <span className="shrink-0 px-4 py-1.5 rounded-full bg-primary text-primary-foreground font-body font-semibold text-xs uppercase">
        RSVP
      </span>
    </Link>
  );
};

export default EventFeedCard;
