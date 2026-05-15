import { Link } from 'react-router-dom';
import type { LBEvent } from '@/lib/lb';

function fmt(dt: string) {
  const d = new Date(dt);
  return d.toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: d.getMinutes() ? '2-digit' : undefined,
  });
}

export default function EventCard({ event, attendeeCount }: { event: LBEvent; attendeeCount?: number }) {
  return (
    <Link
      to={`/e/${event.slug}`}
      className="group flex gap-4 bg-card rounded-md border border-border overflow-hidden hover:shadow-md transition-shadow"
    >
      <div
        className="w-24 sm:w-32 aspect-square bg-muted flex-shrink-0 bg-cover bg-center"
        style={{ backgroundImage: event.hero_image_url ? `url(${event.hero_image_url})` : undefined }}
      />
      <div className="flex-1 py-3 pr-4 flex flex-col justify-center min-w-0">
        <div className="eyebrow text-primary">{event.pillar}</div>
        <h3 className="font-serif text-lg sm:text-xl text-foreground mt-1 leading-tight truncate">
          {event.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{fmt(event.starts_at)}</p>
        {(event.is_private ? event.neighborhood : event.venue_name) && (
          <p className="text-sm text-muted-foreground truncate">
            {event.is_private ? event.neighborhood : event.venue_name}
          </p>
        )}
        {typeof attendeeCount === 'number' && attendeeCount > 0 && (
          <p className="text-xs text-muted-foreground mt-1">{attendeeCount} going</p>
        )}
      </div>
    </Link>
  );
}
