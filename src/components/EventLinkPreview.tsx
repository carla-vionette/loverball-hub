import { Calendar, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface EventLinkPreviewProps {
  event: {
    id: string;
    title: string;
    description?: string | null;
    image_url?: string | null;
    event_date: string;
    event_time?: string | null;
    venue_name?: string | null;
    city?: string | null;
  };
  className?: string;
  variant?: "horizontal" | "vertical";
}

/**
 * EventLinkPreview - Displays a rich link preview card for an event
 * Mirrors the Open Graph meta tags for consistent social sharing appearance
 */
const EventLinkPreview = ({ 
  event, 
  className = "", 
  variant = "horizontal" 
}: EventLinkPreviewProps) => {
  const navigate = useNavigate();

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  const truncatedDescription = event.description 
    ? event.description.substring(0, 150) + (event.description.length > 150 ? '...' : '')
    : null;

  const locationStr = [event.venue_name, event.city].filter(Boolean).join(', ');

  const handleClick = () => {
    navigate(`/event/${event.id}`);
  };

  if (variant === "vertical") {
    return (
      <article 
        onClick={handleClick}
        className={`group cursor-pointer rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all ${className}`}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      >
        {/* Image - 1.91:1 aspect ratio (OG standard) */}
        <div className="relative aspect-[1.91/1] bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
          {event.image_url ? (
            <img 
              src={event.image_url} 
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-16 h-16 text-primary/30" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          {/* Site name */}
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Loverball
          </p>

          {/* Title */}
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          {/* Description */}
          {truncatedDescription && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {truncatedDescription}
            </p>
          )}

          {/* Date/Time/Location meta */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(event.event_date), 'MMM d, yyyy')}
            </span>
            {event.event_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(event.event_time)}
              </span>
            )}
            {locationStr && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[150px]">{locationStr}</span>
              </span>
            )}
          </div>
        </div>
      </article>
    );
  }

  // Horizontal variant (like messaging app previews)
  return (
    <article 
      onClick={handleClick}
      className={`group cursor-pointer rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all flex ${className}`}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Image - Square thumbnail */}
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
        {event.image_url ? (
          <img 
            src={event.image_url} 
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-primary/30" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-3 sm:p-4 min-w-0 flex flex-col justify-center">
        {/* Site name */}
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
          Loverball
        </p>

        {/* Title */}
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors text-sm sm:text-base">
          {event.title}
        </h3>

        {/* Description */}
        {truncatedDescription && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-1">
            {truncatedDescription}
          </p>
        )}

        {/* Date meta */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(new Date(event.event_date), 'MMM d')}
          </span>
          {event.event_time && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(event.event_time)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default EventLinkPreview;
