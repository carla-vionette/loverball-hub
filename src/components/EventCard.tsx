import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users, Lock, Share2, X } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description?: string | null;
    image_url?: string | null;
    event_date: string;
    event_time?: string | null;
    venue_name?: string | null;
    city?: string | null;
    event_type?: string | null;
    sport_tags?: string[] | null;
    visibility: string;
    capacity?: number | null;
  };
  onRSVP?: () => void;
  onCancelRSVP?: () => void;
  rsvpStatus?: string | null;
  isMember?: boolean;
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

const EventCard = ({ event, onRSVP, onCancelRSVP, rsvpStatus, isMember }: EventCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/event/${event.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out this event on Loverball: ${event.title}`,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Link copied!",
      description: "Share this link with friends.",
    });
  };

  const handleCardClick = () => {
    navigate(`/event/${event.id}`);
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20">
        {event.image_url ? (
          <img 
            src={event.image_url} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-16 h-16 text-primary/30" />
          </div>
        )}
        
        {/* Visibility Badge */}
        {event.visibility !== 'public' && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-black/60 text-white border-0">
              <Lock className="w-3 h-3 mr-1" />
              {event.visibility === 'members_only' ? 'Members Only' : 'Invite Only'}
            </Badge>
          </div>
        )}
        
        {/* Event Type */}
        {event.event_type && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary text-white">
              {eventTypeLabels[event.event_type] || event.event_type}
            </Badge>
          </div>
        )}
        
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md transition-colors"
          aria-label="Share event"
        >
          <Share2 className="w-4 h-4 text-foreground" />
        </button>
      </div>
      
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold text-foreground line-clamp-2">
          {event.title}
        </h3>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Date & Time */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {format(new Date(event.event_date), 'MMM d, yyyy')}
          </span>
          {event.event_time && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTime(event.event_time)}
            </span>
          )}
        </div>
        
        {/* Location */}
        {(event.venue_name || event.city) && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {event.venue_name}{event.venue_name && event.city ? ', ' : ''}{event.city}
            </span>
          </div>
        )}
        
        {/* Capacity */}
        {event.capacity && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{event.capacity} spots</span>
          </div>
        )}
        
        {/* Description */}
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}
        
        {/* Sport Tags */}
        {event.sport_tags && event.sport_tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.sport_tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2">
        {rsvpStatus ? (
          <>
            <Badge 
              variant="secondary" 
              className="flex-1 justify-center py-2 capitalize"
            >
              {rsvpStatus === 'attending' ? '✓ Attending' : rsvpStatus}
            </Badge>
            {onCancelRSVP && (
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelRSVP();
                }}
                title="Cancel RSVP"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </>
        ) : event.visibility === 'public' || isMember ? (
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onRSVP?.();
            }} 
            className="w-full"
            variant={event.visibility === 'invite_only' ? 'outline' : 'default'}
          >
            {event.visibility === 'invite_only' ? 'Request Invite' : 'RSVP'}
          </Button>
        ) : (
          <Button variant="outline" className="w-full" disabled>
            Members Only
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default EventCard;
