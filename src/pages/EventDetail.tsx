import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, Users, Lock, Share2, ArrowLeft, Loader2, Check, X, HelpCircle, Video, ExternalLink, Copy, Link2, MessageCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGestures } from "@/hooks/useGestures";
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
import EventComments from "@/components/EventComments";
import EventDiscussionPreview from "@/components/EventDiscussionPreview";
import SiteNav from "@/components/SiteNav";
import EventHostProfile from "@/components/EventHostProfile";
import Seo from "@/components/Seo";
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
  host_user_id?: string | null;
  co_host_ids?: string[] | null;
  rsvp_approval_required?: boolean | null;
  guest_visibility?: boolean | null;
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
  const isMobileDevice = useIsMobile();

  const goBack = useCallback(() => navigate(-1), [navigate]);

  // Swipe-right to go back on mobile
  const gestureRef = useGestures<HTMLDivElement>({
    onSwipeRight: goBack,
  }, { swipeThreshold: 60 });

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
      document.title = 'Loverball';
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
    return `https://www.loverball.com/e/${event?.id}`;
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

  if (!authLoading && !user) {
    const goingCount = attendeeCounts.yes;
    const preview = attendees.slice(0, 5);
    const gateRedirect = () => {
      sessionStorage.setItem('postAuthRedirect', `/event/${id}`);
    };
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <button onClick={() => navigate('/events')} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Events
            </button>
            <img src={loverballLogo} alt="Loverball" className="h-10" />
            <div className="w-12" />
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-5 space-y-5 pb-32">
          {/* Tile-level preview */}
          <div className="rounded-2xl overflow-hidden bg-card border border-border">
            {event.image_url ? (
              <div className="aspect-[16/10] bg-muted">
                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className={`aspect-[16/10] bg-gradient-to-br ${themeClass} flex items-center justify-center`}>
                <Calendar className="w-16 h-16 text-primary/30" />
              </div>
            )}
            <div className="p-5 space-y-2">
              {event.event_type && (
                <Badge className="bg-primary text-primary-foreground">{eventTypeLabels[event.event_type] || event.event_type}</Badge>
              )}
              <h1 className="font-display text-2xl uppercase tracking-tight leading-tight">{event.title}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {format(new Date(event.event_date), "EEE, MMM d, yyyy")}
                {event.event_time ? ` · ${formatTime(event.event_time)}` : ""}
              </p>
              {(event.venue_name || event.city) && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {event.venue_name}{event.venue_name && event.city ? ", " : ""}{event.city}
                </p>
              )}
            </div>
          </div>

          {/* Who's going teaser (blurred) */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Who's going
              </h2>
              <span className="text-xs text-muted-foreground">
                {goingCount > 0 ? `${goingCount} women going` : "Be one of the first"}
              </span>
            </div>
            <div className="relative">
              <div className="flex -space-x-2 blur-[6px] pointer-events-none select-none">
                {(preview.length > 0 ? preview : [1,2,3,4,5]).map((a: any, i) => (
                  <Avatar key={i} className="w-11 h-11 border-2 border-background">
                    <AvatarImage src={a?.profile?.profile_photo_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary">•</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          </div>

          {/* Chat teaser */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-primary" /> Event chat
            </h2>
            <div className="space-y-2">
              {["Who's pulling up early? 🙋‍♀️", "Anyone coming solo?", "Where are we meeting first?"].map((t) => (
                <div key={t} className="rounded-xl bg-muted/60 px-3 py-2 text-sm text-foreground/70 blur-[2px] select-none">
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Warm gate */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center space-y-3">
            <Lock className="w-6 h-6 mx-auto text-primary" />
            <p className="text-base font-semibold">Sign up to see who's going, join the chat, and connect before the event.</p>
            <p className="text-xs text-muted-foreground">Takes 10 seconds. It's free.</p>
            <div className="space-y-2 pt-1">
              <Button className="w-full rounded-full h-11" onClick={() => { gateRedirect(); navigate('/signup'); }}>
                Sign Up — It's Free
              </Button>
              <Button variant="outline" className="w-full rounded-full h-11" onClick={() => { gateRedirect(); navigate(`/auth?redirect=${encodeURIComponent(`/event/${id}`)}`); }}>
                I already have an account
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div ref={gestureRef} className="min-h-screen bg-background md:pt-20">
      <div className="hidden md:block"><SiteNav /></div>
      {event && (
        <Seo
          title={`${event.title} | Loverball`}
          description={(event.description || `${event.title} — Loverball event.`).slice(0, 158)}
          path={`/event/${event.id}`}
          image={event.image_url || undefined}
          type="event"
          jsonLd={{
            "@context": "https://schema.org",
            "@type": "Event",
            name: event.title,
            startDate: `${event.event_date}T${event.event_time || "00:00"}`,
            endDate: event.end_time ? `${event.event_date}T${event.end_time}` : undefined,
            eventStatus: "https://schema.org/EventScheduled",
            eventAttendanceMode:
              event.location_type === "virtual"
                ? "https://schema.org/OnlineEventAttendanceMode"
                : "https://schema.org/OfflineEventAttendanceMode",
            location: event.location_type === "virtual"
              ? { "@type": "VirtualLocation", url: event.virtual_link || "https://www.loverball.com" }
              : { "@type": "Place", name: event.venue_name || "TBA", address: event.city || "" },
            image: event.image_url ? [event.image_url] : undefined,
            description: event.description || event.title,
            organizer: { "@type": "Organization", name: "Loverball", url: "https://www.loverball.com/" },
          }}
        />
      )}
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
          <img src={loverballLogo} alt="Loverball" className="h-12 md:h-14" />
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {(() => {
        // Derive scene variant from event_type
        const variantMap: Record<string, 'external' | 'hosted' | 'cultural'> = {
          game: 'external', watch_party: 'external',
          networking: 'hosted', brunch: 'hosted', party: 'hosted',
          panel: 'cultural', salon: 'cultural', other: 'cultural',
        };
        const variant = variantMap[event.event_type || 'other'] || 'cultural';
        const heroClass =
          variant === 'external' ? 'bg-foreground text-background' :
          variant === 'hosted' ? 'bg-primary text-primary-foreground' :
          'bg-[hsl(173_58%_39%)] text-white';
        const eyebrowAccent =
          variant === 'external' ? 'text-primary' :
          variant === 'hosted' ? 'text-primary-foreground/90' :
          'text-white/90';
        const eyebrowLabel =
          variant === 'external' ? 'LIVE SPORTS · LA' :
          variant === 'hosted' ? 'HOSTED BY LOVERBALL' :
          'CULTURE · CURATED BY LOVERBALL';
        const isGoing = rsvpStatus === 'attending' || rsvpStatus === 'yes';
        const goingCount = attendeeCounts.yes;
        const capacityLeft = event.capacity ? event.capacity - goingCount : null;

        return (
        <main className="pt-16 pb-32">
          <div className="max-w-xl mx-auto px-4 py-4 space-y-3">
            {/* HERO CARD */}
            <div className={`relative overflow-hidden rounded-2xl p-4 ${heroClass}`}>
              <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-primary/20" />
              <div className="relative">
                <div className={`flex items-center gap-1.5 mb-2 ${eyebrowAccent}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
                  <span className="text-[10px] font-semibold tracking-[0.15em]">{eyebrowLabel}</span>
                </div>
                <h1 className="font-display text-2xl leading-tight mb-1">{event.title}</h1>
                <div className="text-xs opacity-90 mb-2 flex flex-wrap gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(new Date(event.event_date), 'EEE, MMM d')}{event.event_time ? ` · ${formatTime(event.event_time)}` : ''}</span>
                  {(event.venue_name || event.city) && (
                    <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.venue_name || event.city}</span>
                  )}
                </div>
                {variant === 'external' && (
                  <span className="inline-block bg-background/10 text-[10px] px-2 py-0.5 rounded">
                    External event · You bring the ticket
                  </span>
                )}
                {variant === 'hosted' && event.capacity && (
                  <span className="inline-block bg-background/10 text-[10px] px-2 py-0.5 rounded">
                    {goingCount} of {event.capacity} spots
                  </span>
                )}
              </div>
            </div>

            {/* GOING STATUS */}
            {user && isGoing && (
              <div className="rounded-xl bg-card border border-border/30 p-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[hsl(173_58%_39%)] flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">You're going</div>
                  <div className="text-xs text-muted-foreground">Tap edit to update your plans</div>
                </div>
                <button onClick={() => handleRSVP('no')} className="text-xs text-muted-foreground">Edit</button>
              </div>
            )}

            {/* HOSTED: host card + pitch quote */}
            {variant === 'hosted' && (
              <>
                {event.host_user_id && (
                  <div className="rounded-xl bg-card border border-border/30 p-3">
                    <EventHostProfile hostId={event.host_user_id} coHostIds={event.co_host_ids as string[] | undefined} />
                  </div>
                )}
                {event.description && (
                  <div className="rounded-xl bg-card border border-border/30 p-3">
                    <p className="font-serif italic text-sm leading-relaxed border-l-2 border-primary pl-3 whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* CULTURAL: venue partner + pitch */}
            {variant === 'cultural' && (
              <>
                {(event.venue_name || event.city) && (
                  <div className="rounded-xl bg-card border border-border/30 p-3 flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-[hsl(173_58%_39%)] shrink-0" />
                    <div className="flex-1 text-xs text-muted-foreground leading-snug">
                      At <span className="font-semibold text-foreground">{event.venue_name || event.city}</span>
                      {event.city && event.venue_name ? ` · ${event.city}` : ''}
                      {event.location_type !== 'virtual' && ' · you buy the ticket on their site'}
                    </div>
                    {event.location_map_url && (
                      <a href={event.location_map_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                      </a>
                    )}
                  </div>
                )}
                {event.description && (
                  <div className="rounded-xl bg-card border border-border/30 p-3">
                    <p className="font-serif italic text-sm leading-relaxed border-l-2 border-[hsl(173_58%_39%)] pl-3 whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* EXTERNAL: description (if any) */}
            {variant === 'external' && event.description && (
              <div className="rounded-xl bg-card border border-border/30 p-3">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            {/* WHO ELSE IS GOING */}
            <div className="rounded-xl bg-card border border-border/30 p-3">
              <div className="flex justify-between items-baseline mb-2.5">
                <span className="text-[10px] font-semibold tracking-[0.1em] text-muted-foreground">
                  {variant === 'hosted' ? 'GOING' : variant === 'cultural' ? 'GOING' : 'WHO ELSE IS GOING'}
                </span>
                <span className="text-[11px] font-semibold text-primary">
                  {variant === 'hosted' && event.capacity
                    ? `${goingCount} of ${event.capacity} spots`
                    : `${goingCount} member${goingCount === 1 ? '' : 's'}`}
                </span>
              </div>
              {attendees.length > 0 ? (
                <button onClick={() => setShowAttendeeList(true)} className="flex -space-x-1.5 mb-2">
                  {attendees.slice(0, 5).map((a) => (
                    <Avatar key={a.id} className="w-7 h-7 border-2 border-card">
                      <AvatarImage src={a.profile?.profile_photo_url || undefined} />
                      <AvatarFallback className="bg-primary/15 text-primary text-[10px]">
                        {a.profile?.name?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {attendees.length > 5 && (
                    <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-medium">
                      +{attendees.length - 5}
                    </div>
                  )}
                </button>
              ) : (
                <p className="text-xs text-muted-foreground mb-2">Be one of the first.</p>
              )}

              {/* Hosted: fan modes mix chips */}
              {variant === 'hosted' && goingCount > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(173_58%_39%)]/10 text-[hsl(173_58%_25%)]">Athletes</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">New converts</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Vibes</span>
                </div>
              )}
            </div>

            {/* Going chat → scrolls to Event chat below */}
            {isGoing && (
              <button
                onClick={() => document.getElementById('event-chat')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full text-left rounded-xl bg-card border border-border/30 p-3"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[hsl(173_58%_39%)] inline-block" />
                    <span className="text-xs font-semibold">Event chat</span>
                  </div>
                  <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <p className="text-xs italic text-muted-foreground">Jump into the conversation with everyone going.</p>
              </button>
            )}

            {/* HOSTED: pricing band */}
            {variant === 'hosted' && (
              <div className="rounded-xl bg-primary/10 p-3">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs font-semibold text-primary">
                    Your price · {userTier === 'community' || userTier === 'insider' ? 'All-Access' : 'Free tier'}
                  </span>
                  <span className="text-lg font-bold">
                    {userTier === 'community' || userTier === 'insider' ? '$25' : '$50'}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">All-Access $25 · Free tier $50</p>
              </div>
            )}

            {/* Supplementary: where to watch / sit / check-in */}
            {user && isGoing && (
              <div className="rounded-xl bg-card border border-border/30 p-3">
                <EventCheckIn eventId={event.id} eventDate={event.event_date} eventCity={event.city} />
              </div>
            )}
            {variant === 'external' && !event.venue_name && (
              <WhereToWatch eventCity={event.city} eventType={event.event_type} />
            )}
            <WhereToSit venueName={event.venue_name} eventType={event.event_type} />

            {/* You've met */}
            {user && isGoing && (
              <YouveMetCard />
            )}

            {/* Full who's going + comments below the fold */}
            {id && <WhosGoing eventId={id} refreshKey={guestRefreshKey} />}
            {id && <div id="event-chat"><EventComments eventId={id} /></div>}

            {/* Discussion board preview (mock data for design review) */}
            <EventDiscussionPreview />

            {/* Calendar */}
            {!isEventPast && (
              <Button variant="outline" size="sm" onClick={addToGoogleCalendar} className="w-full">
                <Calendar className="w-4 h-4 mr-2" /> Add to Google Calendar
              </Button>
            )}
          </div>
        </main>
        );
      })()}

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

              {/* Open public page (host email invites live there) */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setShowShareDialog(false); navigate(`/e/${event.id}`); }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open public page & send email invites
              </Button>
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

      {/* Floating back button — mobile only */}
      {isMobileDevice && (
        <button
          onClick={goBack}
          aria-label="Go back"
          className="fixed bottom-24 left-4 z-50 md:hidden flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default EventDetail;
