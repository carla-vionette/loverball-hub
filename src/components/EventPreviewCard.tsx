import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { parseEventDate } from '@/lib/eventDate';
import { handleEventImageError, resolveEventImage } from '@/lib/eventImage';

interface EventData {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  banner_image?: string | null;
  event_date: string;
  event_time: string | null;
  venue_name: string | null;
  city: string | null;
  event_type: string | null;
  sport_tags?: string[] | null;
}

interface EventPreviewCardProps {
  eventId: string;
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

const EventPreviewCard = ({ eventId }: EventPreviewCardProps) => {
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id, title, description, image_url, banner_image, event_date, event_time, venue_name, city, event_type, sport_tags')
          .eq('id', eventId)
          .maybeSingle();

        if (error || !data) {
          setError(true);
        } else {
          setEvent(data);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  if (loading) {
    return (
      <Card className="w-full max-w-sm overflow-hidden animate-pulse">
        <div className="h-24 bg-muted" />
        <CardContent className="p-3">
          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error || !event) {
    return null;
  }

  const eventImage = resolveEventImage(event);

  return (
    <Card 
      className="w-full max-w-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-border/50"
      onClick={() => navigate(`/event/${event.id}`)}
    >
      <div className="relative h-24 bg-gradient-to-br from-primary/20 to-accent/20">
        <img 
          src={eventImage}
          alt={event.title}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={handleEventImageError}
        />
        {event.event_type && (
          <Badge className="absolute top-2 left-2 text-xs bg-primary text-primary-foreground">
            {eventTypeLabels[event.event_type] || event.event_type}
          </Badge>
        )}
      </div>

      <CardContent className="p-3 space-y-1.5">
        <h4 className="font-semibold text-sm line-clamp-1">{event.title}</h4>
        
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3 flex-shrink-0" />
          <span>{format(parseEventDate(event.event_date), 'EEE, MMM d')}</span>
          {event.event_time && (
            <>
              <Clock className="w-3 h-3 flex-shrink-0 ml-2" />
              <span>{formatTime(event.event_time)}</span>
            </>
          )}
        </div>

        {(event.venue_name || event.city) && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">
              {event.venue_name}{event.venue_name && event.city ? ', ' : ''}{event.city}
            </span>
          </div>
        )}

        <p className="text-xs text-primary font-medium pt-1">
          Tap to view event →
        </p>
      </CardContent>
    </Card>
  );
};

export default EventPreviewCard;
