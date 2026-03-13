import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, Users, Lock, Share2, ArrowLeft, Loader2, Check, X, HelpCircle, Video, ExternalLink, Copy, Link2 } from "lucide-react";
import { format, differenceInDays, differenceInHours, differenceInMinutes, isPast } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import loverballLogo from "@/assets/loverball-script-logo.png";
import SharePreview from "@/components/SharePreview";
import WhosGoing from "@/components/WhosGoing";
import { trackEventRSVP, trackContentView } from "@/lib/analytics";
import EventCheckIn from "@/components/EventCheckIn";
import AttendeeListModal from "@/components/AttendeeListModal";
import GoingSoloToggle from "@/components/GoingSoloToggle";
import YouveMetCard from "@/components/YouveMetCard";
import WhereToWatch from "@/components/WhereToWatch";
import WhereToSit from "@/components/WhereToSit";
import EventTagBadges from "@/components/EventTagBadges";
import EarlyAccessBanner from "@/components/EarlyAccessBanner";
import LockedFeature from "@/components/LockedFeature";
import { getUserTier } from "@/services/subscriptionService";

interface Event {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  event_date: string;
  event_time?: string | null;
  end_time?: string | null;
  venue_name?: string | null;
  city?: string | null;
  event_type?: string | null;
  sport_tags?: string[] | null;
  visibility: string;
  capacity?: number | null;
  location_type?: string | null;
  virtual_link?: string | null;
  location_map_url?: string | null;
  rsvp_deadline?: string | null;
  theme?: string | null;
  event_tags?: string[] | null;
}

interface Attendee {
  id: string;
  user_id: string;
  status: string;
  profile: {
    name: string;
    profile_photo_url: string | null;
  } | null;
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

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isMember, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [rsvping, setRsvping] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [attendeeCounts, setAttendeeCounts] = useState({ yes: 0, maybe: 0, no: 0 });
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [guestRefreshKey, setGuestRefreshKey] = useState(0);
  const [showAttendeeList, setShowAttendeeList] = useState(false);
  const [userTier, setUserTier] = useState<string | null>(null);

  // Fetch user subscription tier
  useEffect(() => {
    if (user) {
      getUserTier(user.id).then(t => setUserTier(t)).catch(() => setUserTier('free'));
    } else {
      setUserTier('free');
    }
  }, [user]);

  // No longer redirect - allow guests to view event details
  // They will see "Sign in to RSVP" button at bottom

  // Update OG meta tags dynamically
  useEffect(() => {
    if (!event) return;

    const formatEventDate = () => {
      const date = new Date(event.event_date);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    };

    const description = event.description 
      ? event.description.substring(0, 150) + (event.description.length > 150 ? '...' : '')
      : `Join us on ${formatEventDate()}`;
    
    const imageUrl = event.image_url || '/og-image.png';
    const pageUrl = `${window.location.origin}/event/${event.id}`;

    // Update document title
    document.title = `${event.title} | Loverball`;

    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, isName = false) => {
      const attr = isName ? 'name' : 'property';
      let meta = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    updateMetaTag('og:title', `${event.title} | Loverball`);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', imageUrl.startsWith('http') ? imageUrl : `${window.location.origin}${imageUrl}`);
    updateMetaTag('og:url', pageUrl);
    updateMetaTag('og:type', 'website');
    updateMetaTag('twitter:card', 'summary_large_image', true);
    updateMetaTag('twitter:title', `${event.title} | Loverball`, true);
    updateMetaTag('twitter:description', description, true);
    updateMetaTag('twitter:image', imageUrl.startsWith('http') ? imageUrl : `${window.location.origin}${imageUrl}`, true);
    updateMetaTag('description', description, true);

    // Cleanup on unmount
    return () => {
      document.title = 'Loverball | Her Game. Her Community. Her Platform.';
    };
  }, [event]);

  // Fetch event for everyone (including guests)
  useEffect(() => {
    if (id) {
      fetchEvent();
      fetchAttendees();
    }
  }, [id]);

  // Only fetch RSVP status for authenticated users
  useEffect(() => {
    if (user && id) {
      fetchRsvpStatus();
    }
  }, [user, id]);

  // Countdown timer
  useEffect(() => {
    if (!event) return;
    
    const eventDateTime = new Date(`${event.event_date}T${event.event_time || '00:00'}`);
    
    const updateCountdown = () => {
      const now = new Date();
      if (isPast(eventDateTime)) {
        setCountdown({ days: 0, hours: 0, minutes: 0 });
        return;
      }
      
      setCountdown({
        days: differenceInDays(eventDateTime, now),
        hours: differenceInHours(eventDateTime, now) % 24,
        minutes: differenceInMinutes(eventDateTime, now) % 60,
      });
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [event]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setEvent(data);
      if (data) trackContentView("event", data.id, data.title);
    } catch (error) {
      toast({
        title: "Event not found",
        description: "This event may have been removed.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendees = async () => {
    if (!id) return;
    
    try {
      // Use event_guests table which has a proper FK to profiles
      const { data, error } = await supabase
        .from('event_guests')
        .select(`
          id,
          user_id,
          status,
          profile:profiles!inner (
            name,
            profile_photo_url
          )
        `)
        .eq('event_id', id)
        .eq('status', 'going')
        .limit(20);

      if (error) throw error;
      
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        status: item.status,
        profile: item.profile ? {
          name: item.profile.name,
          profile_photo_url: item.profile.profile_photo_url,
        } : null
      }));
      
      setAttendees(transformedData);
      setAttendeeCounts({ yes: transformedData.length, maybe: 0, no: 0 });
    } catch (error) {
      // Silently handle attendee fetch errors
    }
  };

  const fetchRsvpStatus = async () => {
    if (!user || !id) return;

    try {
      const { data } = await supabase
        .from('event_rsvps')
        .select('status')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      setRsvpStatus(data?.status || null);
    } catch (error) {
      // Silently handle RSVP status fetch errors
    }
  };

  const handleRSVP = async (status: 'yes' | 'maybe' | 'no') => {
    if (!user) {
      navigate(`/auth?redirect=/event/${id}`);
      return;
    }

    if (!event) return;

    if (!isMember && event.visibility !== 'public') {
      toast({
        title: 'Members only',
        description: 'This event is only open to Loverball members.',
        variant: 'destructive',
      });
      return;
    }

    // Check RSVP deadline
    if (event.rsvp_deadline && isPast(new Date(event.rsvp_deadline))) {
      toast({
        title: 'RSVPs closed',
        description: 'The RSVP deadline has passed.',
        variant: 'destructive',
      });
      return;
    }

    setRsvping(true);
    try {
      const dbStatus = status === 'yes' ? 'attending' : status === 'maybe' ? 'waitlisted' : 'canceled';
      
      const { error } = await supabase
        .from('event_rsvps')
        .upsert(
          {
            event_id: event.id,
            user_id: user.id,
            status: dbStatus,
          },
          { onConflict: 'event_id,user_id' }
        );

      if (error) throw error;

      // Also upsert into event_guests table for the "Who's Going" feature
      if (status === 'yes') {
        await supabase
          .from('event_guests')
          .upsert(
            { event_id: event.id, user_id: user.id, status: 'going' },
            { onConflict: 'event_id,user_id' }
          );
      } else {
        // Remove from event_guests if not going
        await supabase
          .from('event_guests')
          .delete()
          .eq('event_id', event.id)
          .eq('user_id', user.id);
      }

      setRsvpStatus(dbStatus);
      fetchAttendees();
      setGuestRefreshKey((k) => k + 1);
      trackEventRSVP(event.id, dbStatus, event.title);

      if (status === 'yes') {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      toast({
        title: status === 'yes' ? "🎉 You're going!" : status === 'maybe' ? "Marked as maybe" : "RSVP updated",
        description: status === 'yes' ? "We'll see you there!" : undefined,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to submit RSVP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRsvping(false);
    }
  };

  // Use the published app URL for sharing
  // Rich link previews require server-side OG tags which SPAs can't provide directly
  // For now, use the direct event URL - users will see the event page
  const getShareUrl = () => {
    return `https://loverball-hub.lovable.app/event/${event?.id}`;
  };

  const getFormattedShareText = () => {
    if (!event) return '';
    const eventDate = format(new Date(event.event_date), 'EEE, MMM d');
    const eventTime = event.event_time ? formatTime(event.event_time) : '';
    const shareUrl = getShareUrl();
    return `${event.title} - ${eventDate} @ ${eventTime}\n${shareUrl}`;
  };

  const getShareDescription = () => {
    if (!event) return '';
    return event.description 
      ? event.description.substring(0, 150) + (event.description.length > 150 ? '...' : '')
      : `Join us on ${format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}`;
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleNativeShare = async () => {
    const shareUrl = getShareUrl();
    const formattedText = getFormattedShareText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title || 'Loverball Event',
          text: formattedText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error
      }
    }
  };

  const copyToClipboard = () => {
    const formattedText = getFormattedShareText();
    navigator.clipboard.writeText(formattedText);
    toast({
      title: "Copied!",
      description: "Event details copied to clipboard.",
    });
    setShowShareDialog(false);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  const addToGoogleCalendar = () => {
    if (!event) return;
    const startDate = new Date(`${event.event_date}T${event.event_time || '00:00'}`);
    const endDate = event.end_time 
      ? new Date(`${event.event_date}T${event.end_time}`)
      : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.set('action', 'TEMPLATE');
    url.searchParams.set('text', event.title);
    url.searchParams.set('dates', `${format(startDate, "yyyyMMdd'T'HHmmss")}/${format(endDate, "yyyyMMdd'T'HHmmss")}`);
    if (event.venue_name) url.searchParams.set('location', `${event.venue_name}${event.city ? ', ' + event.city : ''}`);
    if (event.description) url.searchParams.set('details', event.description);
    
    window.open(url.toString(), '_blank');
  };

  const eventDateTime = event ? new Date(`${event.event_date}T${event.event_time || '00:00'}`) : null;
  const isEventPast = eventDateTime ? isPast(eventDateTime) : false;
  const themeClass = themeStyles[event?.theme || 'default'] || themeStyles.default;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Event not found</h1>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="text-8xl"
            >
              🎉
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <img src={loverballLogo} alt="Loverball" className="h-10 md:h-14" />
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="pt-16 pb-32">
        {/* Hero Image */}
        <div className={`relative h-72 md:h-96 bg-gradient-to-br ${themeClass}`}>
          {event.image_url ? (
            <img 
              src={event.image_url} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-24 h-24 text-primary/30" />
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {event.event_type && (
              <Badge className="bg-primary text-white">
                {eventTypeLabels[event.event_type] || event.event_type}
              </Badge>
            )}
            {event.visibility !== 'public' && (
              <Badge variant="secondary" className="bg-black/60 text-white border-0">
                <Lock className="w-3 h-3 mr-1" />
                {event.visibility === 'members_only' ? 'Members Only' : 'Invite Only'}
              </Badge>
            )}
            {event.location_type === 'virtual' && (
              <Badge variant="secondary" className="bg-blue-500/80 text-white border-0">
                <Video className="w-3 h-3 mr-1" />
                Virtual
              </Badge>
            )}
          </div>

          {/* Countdown Timer */}
          {!isEventPast && (countdown.days > 0 || countdown.hours > 0 || countdown.minutes > 0) && (
            <div className="absolute bottom-4 right-4">
              <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white flex gap-3">
                {countdown.days > 0 && (
                  <div className="text-center">
                    <p className="text-xl font-bold">{countdown.days}</p>
                    <p className="text-xs text-white/70">days</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-xl font-bold">{countdown.hours}</p>
                  <p className="text-xs text-white/70">hrs</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{countdown.minutes}</p>
                  <p className="text-xs text-white/70">min</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-10">
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <h1 className="text-2xl md:text-3xl font-bold mb-4">{event.title}</h1>
              
              {/* Event Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="w-5 h-5 flex-shrink-0" />
                  <span className="text-foreground font-medium">
                    {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                
                {event.event_time && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="w-5 h-5 flex-shrink-0" />
                    <span className="text-foreground font-medium">
                      {formatTime(event.event_time)}
                      {event.end_time && ` - ${formatTime(event.end_time)}`}
                    </span>
                  </div>
                )}
                
                {(event.venue_name || event.city) && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="w-5 h-5 flex-shrink-0" />
                    {event.venue_name?.toLowerCase().includes('weplay') ? (
                      <a 
                        href="https://www.weplaystudios.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary font-medium hover:underline flex items-center gap-1"
                      >
                        {event.venue_name}{event.venue_name && event.city ? ', ' : ''}{event.city}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-foreground font-medium">
                        {event.venue_name}{event.venue_name && event.city ? ', ' : ''}{event.city}
                      </span>
                    )}
                  </div>
                )}

                {event.location_type === 'virtual' && event.virtual_link && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Video className="w-5 h-5 flex-shrink-0" />
                    <a 
                      href={event.virtual_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-medium hover:underline"
                    >
                      Join Virtual Event
                    </a>
                  </div>
                )}
                
                {event.capacity && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Users className="w-5 h-5 flex-shrink-0" />
                    <span className="text-foreground font-medium">
                      {attendeeCounts.yes} going · {event.capacity - attendeeCounts.yes} spots left
                    </span>
                  </div>
                )}
              </div>

              {/* Early Access Banner */}
              {user && (
                <EarlyAccessBanner
                  userTier={userTier}
                  eventDate={event.event_date}
                  eventTime={event.event_time}
                  isExclusive={event.visibility === 'members_only'}
                />
              )}

              {/* Check-In Button */}
              {user && (rsvpStatus === 'attending' || rsvpStatus === 'yes') && (
                <div className="mb-6">
                  <EventCheckIn
                    eventId={event.id}
                    eventDate={event.event_date}
                    eventCity={event.city}
                  />
                </div>
              )}

              {/* Going Solo Toggle */}
              {user && (rsvpStatus === 'attending' || rsvpStatus === 'yes') && event && (
                <div className="mb-6">
                  <GoingSoloToggle eventId={event.id} />
                </div>
              )}

              {/* Attendee Avatars - clickable to open full list */}
              {attendees.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    {attendeeCounts.yes} going{attendeeCounts.maybe > 0 ? ` · ${attendeeCounts.maybe} maybe` : ''}
                  </p>
                  <button onClick={() => setShowAttendeeList(true)} className="flex -space-x-2 hover:opacity-80 transition-opacity">
                    {attendees.slice(0, 8).map((attendee) => (
                      <Avatar key={attendee.id} className="w-10 h-10 border-2 border-background">
                        <AvatarImage src={attendee.profile?.profile_photo_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {attendee.profile?.name?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {attendees.length > 8 && (
                      <div className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-sm font-medium">
                        +{attendees.length - 8}
                      </div>
                    )}
                  </button>
                  <p className="text-xs text-primary mt-1 cursor-pointer" onClick={() => setShowAttendeeList(true)}>
                    View all attendees →
                  </p>
                </div>
              )}

              {/* Sport Tags */}
              {event.sport_tags && event.sport_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {event.sport_tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Event Tags (Solo Friendly, 21+, etc.) */}
              {event.event_tags && event.event_tags.length > 0 && (
                <div className="mb-6">
                  <EventTagBadges tags={event.event_tags} />
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div className="prose prose-sm max-w-none mb-6">
                  <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              {/* Where to Watch */}
              <WhereToWatch eventCity={event.city} eventType={event.event_type} />

              {/* Where to Sit */}
              <WhereToSit venueName={event.venue_name} eventType={event.event_type} />

              {/* Who's Going Section */}
              {id && <WhosGoing eventId={id} refreshKey={guestRefreshKey} />}

              {/* You've Met Suggestions */}
              {user && (
                <div className="mt-6">
                  <YouveMetCard />
                </div>
              )}

              {/* Map Embed */}
              {event.location_map_url && (
                <div className="mb-6 rounded-lg overflow-hidden border">
                  <iframe
                    src={event.location_map_url}
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}

              {/* Add to Calendar */}
              {!isEventPast && (
                <div className="mb-6">
                  <Button variant="outline" size="sm" onClick={addToGoogleCalendar}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Add to Google Calendar
                  </Button>
                </div>
              )}

              {/* CTA for non-logged in users */}
              {!user && (
                <div className="bg-pale-pink rounded-lg p-6 text-center">
                  <h3 className="text-lg font-semibold mb-2">Join Loverball to RSVP</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect with women who share your passion for sports.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => navigate(`/auth?redirect=/event/${id}`)}>
                      Sign In
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`/auth?redirect=/event/${id}`)}>
                      Join Now
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Fixed Bottom RSVP Buttons */}
      {user && !isEventPast && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
          <div className="max-w-4xl mx-auto">
            {rsvpStatus ? (
              <div className="flex gap-2">
                <Button
                  variant={rsvpStatus === 'attending' || rsvpStatus === 'yes' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => handleRSVP('yes')}
                  disabled={rsvping}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Going {rsvpStatus === 'attending' || rsvpStatus === 'yes' ? '✓' : ''}
                </Button>
                <Button
                  variant={rsvpStatus === 'maybe' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => handleRSVP('maybe')}
                  disabled={rsvping}
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Maybe {rsvpStatus === 'maybe' ? '✓' : ''}
                </Button>
                <Button
                  variant={rsvpStatus === 'no' ? 'destructive' : 'outline'}
                  className="flex-1"
                  onClick={() => handleRSVP('no')}
                  disabled={rsvping}
                >
                  <X className="w-4 h-4 mr-2" />
                  Can't Go
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  className="flex-1 py-6"
                  onClick={() => handleRSVP('yes')}
                  disabled={rsvping}
                >
                  {rsvping ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
                  Going
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 py-6"
                  onClick={() => handleRSVP('maybe')}
                  disabled={rsvping}
                >
                  <HelpCircle className="w-5 h-5 mr-2" />
                  Maybe
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 py-6"
                  onClick={() => handleRSVP('no')}
                  disabled={rsvping}
                >
                  <X className="w-5 h-5 mr-2" />
                  Can't Go
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sign in prompt for guests */}
      {!user && !isEventPast && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
          <div className="max-w-4xl mx-auto">
            <Button 
              className="w-full py-6 text-base"
              onClick={() => navigate(`/auth?redirect=/event/${id}`)}
            >
              Sign In to RSVP
            </Button>
          </div>
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Event
            </DialogTitle>
          </DialogHeader>
          
          {event && (
            <div className="space-y-4">
              <SharePreview
                title={`${event.title} | Loverball`}
                description={getShareDescription()}
                imageUrl={event.image_url}
              />
              
              {/* Share Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => copyToClipboard()}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                {typeof navigator.share === 'function' && (
                  <Button 
                    className="flex-1"
                    onClick={handleNativeShare}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                )}
              </div>
              
              {/* Share URL Preview */}
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Link2 className="w-3 h-3" />
                  Share URL
                </p>
                <p className="text-xs font-mono text-foreground break-all">
                  {getShareUrl()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Attendee List Modal */}
      {id && (
        <AttendeeListModal
          eventId={id}
          open={showAttendeeList}
          onOpenChange={setShowAttendeeList}
        />
      )}
    </div>
  );
};

export default EventDetail;
