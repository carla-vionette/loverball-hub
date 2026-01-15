import { Calendar, Clock, MapPin, Lock, Video, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface EventData {
  title: string;
  description: string;
  image_url: string;
  event_date: string;
  event_time: string;
  end_time: string;
  venue_name: string;
  city: string;
  event_type: string;
  visibility: string;
  capacity: string;
  location_type: string;
  virtual_link: string;
  location_map_url: string;
  theme: string;
}

const eventTypeLabels: Record<string, string> = {
  panel: 'Panel',
  watch_party: 'Watch Party',
  brunch: 'Brunch',
  salon: 'Salon',
  party: 'Party',
  networking: 'Networking',
  game: 'Game Day',
  other: 'Event'
};

const themeStyles: Record<string, string> = {
  default: 'from-primary/20 to-accent/20',
  valentines: 'from-pink-500/30 to-red-500/30',
  sports: 'from-orange-500/20 to-yellow-500/20',
  elegant: 'from-purple-500/20 to-indigo-500/20',
  summer: 'from-cyan-500/20 to-blue-500/20',
  night: 'from-slate-800/80 to-slate-900/80',
};

interface EventPreviewProps {
  event: EventData;
}

export const EventPreview = ({ event }: EventPreviewProps) => {
  const themeClass = themeStyles[event.theme] || themeStyles.default;

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  return (
    <div className="bg-background rounded-lg overflow-hidden shadow-lg border border-border h-full flex flex-col">
      {/* Preview Header */}
      <div className="bg-muted px-4 py-2 border-b border-border flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Live Preview</span>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className={`relative h-48 bg-gradient-to-br ${themeClass}`}>
          {event.image_url ? (
            <img 
              src={event.image_url} 
              alt={event.title || "Event"}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-16 h-16 text-foreground/20" />
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            {event.event_type && (
              <Badge className="bg-primary text-primary-foreground text-xs">
                {eventTypeLabels[event.event_type] || event.event_type}
              </Badge>
            )}
            {event.visibility !== 'public' && (
              <Badge variant="secondary" className="bg-black/60 text-white border-0 text-xs">
                <Lock className="w-3 h-3 mr-1" />
                {event.visibility === 'members_only' ? 'Members Only' : 'Invite Only'}
              </Badge>
            )}
            {event.location_type === 'virtual' && (
              <Badge variant="secondary" className="bg-blue-500/80 text-white border-0 text-xs">
                <Video className="w-3 h-3 mr-1" />
                Virtual
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <h2 className="text-xl font-bold text-foreground">
            {event.title || "Event Title"}
          </h2>
          
          {/* Event Details */}
          <div className="space-y-2">
            {event.event_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-foreground">
                  {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
            )}
            
            {event.event_time && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-foreground">
                  {formatTime(event.event_time)}
                  {event.end_time && ` - ${formatTime(event.end_time)}`}
                </span>
              </div>
            )}
            
            {(event.venue_name || event.city) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="text-foreground">
                  {event.venue_name}{event.venue_name && event.city ? ', ' : ''}{event.city}
                </span>
              </div>
            )}

            {event.location_type === 'virtual' && event.virtual_link && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Video className="w-4 h-4" />
                <span className="text-primary">Virtual Event Link</span>
              </div>
            )}

            {event.capacity && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span className="text-foreground">{event.capacity} spots</span>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Map Embed Preview */}
          {event.location_map_url && event.location_type !== 'virtual' && (
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground mb-2">Map will display here</p>
              <div className="bg-muted rounded-lg h-24 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </div>
          )}

          {/* RSVP Buttons Preview */}
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground mb-2">RSVP Buttons</p>
            <div className="flex gap-2">
              <button className="flex-1 py-2 px-3 text-sm rounded-lg bg-primary text-primary-foreground font-medium">
                Yes
              </button>
              <button className="flex-1 py-2 px-3 text-sm rounded-lg bg-muted text-foreground font-medium">
                Maybe
              </button>
              <button className="flex-1 py-2 px-3 text-sm rounded-lg bg-muted text-foreground font-medium">
                No
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
