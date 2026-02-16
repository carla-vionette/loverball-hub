import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users, Lock, Share2, X, CalendarPlus, Ticket } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

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
    price?: number | null;
  };
  onRSVP?: () => void;
  onCancelRSVP?: () => void;
  rsvpStatus?: string | null;
  isMember?: boolean;
  attendeeCount?: number;
  friendAttendees?: { name: string; initials: string }[];
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

// Mock friend data for social proof
const MOCK_FRIENDS = [
  { name: "Sarah M.", initials: "SM" },
  { name: "Jessica K.", initials: "JK" },
  { name: "Maria L.", initials: "ML" },
];

const EventCard = ({ event, onRSVP, onCancelRSVP, rsvpStatus, isMember, attendeeCount = 0, friendAttendees }: EventCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [addToCalendar, setAddToCalendar] = useState(true);

  const friends = friendAttendees || MOCK_FRIENDS;
  const totalAttendees = attendeeCount || Math.floor(Math.random() * 40) + 12;
  const spotsLeft = event.capacity ? Math.max(0, event.capacity - totalAttendees) : null;
  const isSoldOut = spotsLeft !== null && spotsLeft === 0;
  const price = (event as any).price ?? 0;
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `https://loverball-hub.lovable.app/event/${event.id}`;
    const eventDate = format(new Date(event.event_date), 'EEE, MMM d');
    const eventTime = event.event_time ? formatTime(event.event_time) : '';
    const formattedText = `${event.title} - ${eventDate}${eventTime ? ` @ ${eventTime}` : ''}\n${shareUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text: formattedText, url: shareUrl });
      } catch { copyToClipboard(formattedText); }
    } else {
      copyToClipboard(formattedText);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Link copied!", description: "Share this link with friends." });
  };

  const generateCalendarLinks = () => {
    const eventDate = new Date(event.event_date);
    let startDate = eventDate;
    let endDate = new Date(eventDate);
    
    if (event.event_time) {
      const [hours, minutes] = event.event_time.split(':');
      startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 2);
    } else {
      startDate.setHours(12, 0, 0, 0);
      endDate.setHours(14, 0, 0, 0);
    }
    
    const formatForGoogle = (date: Date) => date.toISOString().replace(/-|:|\.\d{3}/g, '');
    const formatForICS = (date: Date) => date.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, -1);
    
    const title = encodeURIComponent(event.title);
    const location = encodeURIComponent(`${event.venue_name || ''}${event.venue_name && event.city ? ', ' : ''}${event.city || ''}`);
    const details = encodeURIComponent(event.description || '');
    
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatForGoogle(startDate)}/${formatForGoogle(endDate)}&location=${location}&details=${details}`;
    
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Loverball//Event//EN\nBEGIN:VEVENT\nDTSTART:${formatForICS(startDate)}Z\nDTEND:${formatForICS(endDate)}Z\nSUMMARY:${event.title}\nDESCRIPTION:${event.description || ''}\nLOCATION:${event.venue_name || ''}${event.venue_name && event.city ? ', ' : ''}${event.city || ''}\nEND:VEVENT\nEND:VCALENDAR`;
    
    return { googleUrl, icsContent };
  };

  const handleAddToGoogleCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { googleUrl } = generateCalendarLinks();
    window.open(googleUrl, '_blank');
  };

  const handleDownloadICS = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { icsContent } = generateCalendarLinks();
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Calendar file downloaded!", description: "Open the .ics file to add to your calendar." });
  };

  const handleCardClick = () => navigate(`/event/${event.id}`);

  const handleRSVPClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmModal(true);
  };

  const handleConfirmRSVP = () => {
    onRSVP?.();
    if (addToCalendar) {
      const { googleUrl } = generateCalendarLinks();
      window.open(googleUrl, '_blank');
    }
    setShowConfirmModal(false);
  };

  const handleWaitlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({ title: "Added to waitlist!", description: "We'll notify you if a spot opens up." });
  };

  return (
    <>
      <Card 
        className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer rounded-2xl border-border/50 group"
        onClick={handleCardClick}
      >
        {/* Image */}
        <div className="relative h-48 bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
          {event.image_url ? (
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-16 h-16 text-primary/20" />
            </div>
          )}
          
          {/* Price Badge */}
          <div className="absolute top-3 left-3 flex gap-2">
            {event.event_type && (
              <Badge className="bg-primary text-primary-foreground rounded-full px-3">
                {eventTypeLabels[event.event_type] || event.event_type}
              </Badge>
            )}
            <Badge className={`rounded-full px-3 ${price === 0 ? "bg-emerald-600 text-white" : "bg-foreground/80 text-background"}`}>
              {price === 0 ? "FREE" : `$${price}`}
            </Badge>
          </div>
          
          {/* Visibility Badge */}
          {event.visibility !== 'public' && (
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-foreground/80 text-background border-0 rounded-full px-3">
                <Lock className="w-3 h-3 mr-1" />
                {event.visibility === 'members_only' ? 'Members Only' : 'Invite Only'}
              </Badge>
            </div>
          )}
          
          {/* Calendar Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button onClick={(e) => e.stopPropagation()} className="absolute bottom-3 right-14 w-9 h-9 rounded-full bg-background/90 hover:bg-background flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105" aria-label="Add to calendar">
                <CalendarPlus className="w-4 h-4 text-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background border-border z-50">
              <DropdownMenuItem onClick={handleAddToGoogleCalendar} className="cursor-pointer">Add to Google Calendar</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownloadICS(e as any); }} className="cursor-pointer">Add to Apple Calendar</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadICS} className="cursor-pointer">Download .ics file</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Share Button */}
          <button onClick={handleShare} className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-background/90 hover:bg-background flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105" aria-label="Share event">
            <Share2 className="w-4 h-4 text-foreground" />
          </button>
        </div>
        
        <CardHeader className="pb-2">
          <h3 className="text-lg font-sans font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary/70" />
              {format(new Date(event.event_date), 'MMM d, yyyy')}
            </span>
            {event.event_time && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary/70" />
                {formatTime(event.event_time)}
              </span>
            )}
          </div>
          
          {(event.venue_name || event.city) && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 flex-shrink-0 text-primary/70" />
              <span className="truncate">{event.venue_name}{event.venue_name && event.city ? ', ' : ''}{event.city}</span>
            </div>
          )}

          {/* Spots remaining / Sold out */}
          {spotsLeft !== null && (
            <div className="flex items-center gap-1.5 text-sm">
              <Ticket className="w-4 h-4 text-primary/70" />
              {isSoldOut ? (
                <span className="text-destructive font-medium">Sold out</span>
              ) : (
                <span className="text-muted-foreground"><span className="font-medium text-foreground">{spotsLeft}</span> spots left</span>
              )}
            </div>
          )}
          
          {event.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
          )}
          
          {event.sport_tags && event.sport_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {event.sport_tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs rounded-full px-2.5 border-primary/30 text-primary/80">{tag}</Badge>
              ))}
            </div>
          )}
        </CardContent>
        
        {/* Enhanced Social Proof */}
        <div className="px-6 pb-2">
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="flex items-center gap-3 cursor-default" onClick={(e) => e.stopPropagation()}>
                <div className="flex -space-x-2">
                  {friends.slice(0, 3).map((f, i) => (
                    <div key={i} className="w-7 h-7 rounded-full border-2 border-card bg-gradient-to-br from-primary/30 to-secondary/40 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-primary">{f.initials}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{friends.length} friends attending</p>
                  <p className="text-xs text-muted-foreground">{totalAttendees} members total</p>
                </div>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-56" align="start">
              <p className="text-sm font-medium mb-1">Friends going</p>
              <p className="text-sm text-muted-foreground">
                {friends.map(f => f.name).join(', ')}{friends.length > 3 ? ` and ${friends.length - 3} more` : ''} are going
              </p>
            </HoverCardContent>
          </HoverCard>
        </div>

        <CardFooter className="flex gap-2 pt-4 border-t border-border/50">
          {rsvpStatus ? (
            <>
              <Badge variant="secondary" className="flex-1 justify-center py-2.5 capitalize rounded-full bg-primary/10 text-primary">
                {rsvpStatus === 'attending' ? '✓ Attending' : rsvpStatus}
              </Badge>
              {onCancelRSVP && (
                <Button variant="outline" size="icon" className="shrink-0 rounded-full" onClick={(e) => { e.stopPropagation(); onCancelRSVP(); }} title="Cancel RSVP">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </>
          ) : isSoldOut ? (
            <Button onClick={handleWaitlist} variant="outline" className="w-full rounded-full">
              Join Waitlist
            </Button>
          ) : event.visibility === 'public' || isMember ? (
            <Button onClick={handleRSVPClick} className="w-full rounded-full" variant={event.visibility === 'invite_only' ? 'outline' : 'default'}>
              {event.visibility === 'invite_only' ? 'Request Invite' : 'RSVP'}
            </Button>
          ) : (
            <Button variant="outline" className="w-full rounded-full" disabled>Members Only</Button>
          )}
        </CardFooter>
      </Card>

      {/* RSVP Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Confirm RSVP</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {event.image_url && (
              <img src={event.image_url} alt={event.title} className="w-full h-32 object-cover rounded-lg" />
            )}
            <h3 className="font-semibold text-lg">{event.title}</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><Calendar className="w-4 h-4" />{format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}</p>
              {event.event_time && <p className="flex items-center gap-2"><Clock className="w-4 h-4" />{formatTime(event.event_time)}</p>}
              {(event.venue_name || event.city) && <p className="flex items-center gap-2"><MapPin className="w-4 h-4" />{event.venue_name}{event.venue_name && event.city ? ', ' : ''}{event.city}</p>}
            </div>
            {friends.length > 0 && (
              <div className="bg-primary/5 rounded-lg p-3">
                <p className="text-sm"><span className="font-medium">{friends.map(f => f.name).join(', ')}</span> will be there!</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox id="add-cal" checked={addToCalendar} onCheckedChange={(v) => setAddToCalendar(!!v)} />
              <label htmlFor="add-cal" className="text-sm">Add to Google Calendar</label>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)} className="rounded-full">Cancel</Button>
            <Button onClick={handleConfirmRSVP} className="rounded-full">Confirm RSVP</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventCard;
