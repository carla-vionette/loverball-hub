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
import { Calendar, Clock, MapPin, Users, Lock, Share2, ArrowLeft, Loader2, Check, X, HelpCircle, Video, ExternalLink, Copy, Link2, MessageCircle, CalendarPlus, Settings, Mail, Smartphone } from "lucide-react";
import { downloadICS } from "@/lib/ics";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGestures } from "@/hooks/useGestures";
import { format, differenceInDays, differenceInHours, differenceInMinutes, isPast } from "date-fns";
import { parseEventDate } from "@/lib/eventDate";
import { motion, AnimatePresence } from "framer-motion";
import loverballLogo from "@/assets/loverball-script-logo.png";
import SharePreview from "@/components/SharePreview";

import WhosGoing from "@/components/WhosGoing";
import RsvpAvatarBar from "@/components/RsvpAvatarBar";
import { trackEventRSVP, trackContentView } from "@/lib/analytics";
import EventCheckIn from "@/components/EventCheckIn";
import AttendeeListModal from "@/components/AttendeeListModal";
import GoingSoloToggle from "@/components/GoingSoloToggle";
import YouveMetCard from "@/components/YouveMetCard";
import NearbySportsBars from "@/components/NearbySportsBars";
import WhereToSit from "@/components/WhereToSit";
import EventTagBadges from "@/components/EventTagBadges";
import EarlyAccessBanner from "@/components/EarlyAccessBanner";
import BetaTrialBanner from "@/components/BetaTrialBanner";
import LockedFeature from "@/components/LockedFeature";
import EventComments from "@/components/EventComments";

import EventHostProfile from "@/components/EventHostProfile";
import Seo from "@/components/Seo";
import DesktopNav from "@/components/DesktopNav";
import { getUserTier } from "@/services/subscriptionService";
import { buildShareSummary, buildSharePreviewDescription } from "@/lib/eventShare";
import { resolveEventImage, handleEventImageError } from "@/lib/eventImage";

interface Event {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  banner_image?: string | null;
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
  valentines: 'from-[#E85D2F]/30 to-[#E85D2F]/15',
  sports: 'from-orange-500/20 to-white/20',
  elegant: 'from-purple-500/20 to-indigo-500/20',
  summer: 'from-cyan-500/20 to-blue-500/20',
  night: 'from-slate-800/80 to-slate-900/80',
};

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isMember, isAdmin, loading: authLoading } = useAuth();
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

  const goBack = useCallback(() => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/events');
    }
  }, [navigate]);

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
      const date = parseEventDate(event.event_date);
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
    
    const imageUrl = resolveEventImage(event);
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

  // Fetch event for everyone (including guests); attendee list only for signed-in users
  useEffect(() => {
    if (id) {
      fetchEvent();
      if (user) fetchAttendees();
    }
  }, [id, user]);

  // Only fetch RSVP status for authenticated users
  useEffect(() => {
    if (user && id) {
      fetchRsvpStatus();
    }
  }, [user, id]);

  // Resume any pending RSVP intent after the user authenticates.
  useEffect(() => {
    if (!user || !id || authLoading) return;
    let intent: { eventId?: string; status?: 'yes' | 'maybe' | 'no'; ts?: number } | null = null;
    try {
      const raw = sessionStorage.getItem('lb-pending-rsvp');
      if (raw) intent = JSON.parse(raw);
    } catch {}
    if (!intent || intent.eventId !== id || !intent.status) return;
    // Expire intents older than 30 minutes
    if (intent.ts && Date.now() - intent.ts > 30 * 60 * 1000) {
      sessionStorage.removeItem('lb-pending-rsvp');
      return;
    }
    sessionStorage.removeItem('lb-pending-rsvp');
    // Defer until event is loaded so handleRSVP can validate
    const t = setTimeout(() => handleRSVP(intent!.status as 'yes' | 'maybe' | 'no'), 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id, authLoading, event]);


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
      // True total = count of all confirmed RSVP records, regardless of profile presence
      const [rsvpCountRes, guestsRes] = await Promise.all([
        supabase
          .from('event_rsvps')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', id)
          .in('status', ['attending', 'confirmed']),
        // Avatar previews — left join so attendees without a profile row still surface
        supabase
          .from('event_guests')
          .select(`
            id,
            user_id,
            status,
            profile:profiles (
              name,
              profile_photo_url
            )
          `)
          .eq('event_id', id)
          .eq('status', 'going')
          .limit(20),
      ]);

      const transformedData = (guestsRes.data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        status: item.status,
        profile: {
          name: item.profile?.name || 'Member',
          profile_photo_url: item.profile?.profile_photo_url || null,
        },
      }));

      setAttendees(transformedData);
      // Prefer authoritative RSVP count; fall back to guest preview length if count failed
      const trueTotal = rsvpCountRes.count ?? transformedData.length;
      setAttendeeCounts({ yes: trueTotal, maybe: 0, no: 0 });
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
    console.log('[RSVP] submit start', { status, eventId: id, hasUser: !!user, isMember });

    // Guest flow: do NOT redirect into member-only UI. Keep the user on this
    // page with a safe local success state and offer a non-blocking sign-up
    // prompt. Persist pending intent so we can sync on sign-in later.
    if (!user) {
      try {
        sessionStorage.setItem(
          'lb-pending-rsvp',
          JSON.stringify({ eventId: id, status, ts: Date.now() })
        );
      } catch {}
      const dbStatus = status === 'yes' ? 'attending' : status === 'maybe' ? 'waitlisted' : 'canceled';
      setRsvpStatus(dbStatus);
      if (status === 'yes') {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      toast({
        title: status === 'yes' ? "🎉 You're going!" : status === 'maybe' ? "Marked as interested" : "Next time",
        description: status === 'yes' ? "Sign up free to lock in your spot and get reminders." : undefined,
      });
      console.log('[RSVP] guest local success', { dbStatus });
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

      console.log('[RSVP] success response', { eventId: event.id, dbStatus, userId: user.id });
      setRsvpStatus(dbStatus);
      fetchAttendees();
      setGuestRefreshKey((k) => k + 1);
      trackEventRSVP(event.id, dbStatus, event.title);

      if (status === 'yes') {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      toast({
        title: status === 'yes' ? "🎉 You're going!" : status === 'maybe' ? "Marked as interested" : "Next time",
        description: status === 'yes' ? "We'll see you there!" : undefined,
      });

      // Note: previously we auto-navigated incomplete profiles to /onboarding
      // which could produce a white screen for brand-new accounts. We now
      // stay on the event page; users can finish their profile from the
      // dedicated onboarding entry point.
    } catch (error: any) {
      console.error('[RSVP] failure', { message: error?.message, code: error?.code });
      toast({
        title: 'Error',
        description: 'Failed to submit RSVP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRsvping(false);
    }
  };

  // Diagnostic: log every render that reflects a new RSVP status.
  useEffect(() => {
    if (rsvpStatus !== null) {
      console.log('[RSVP] render after status update', { rsvpStatus, hasUser: !!user });
    }
  }, [rsvpStatus, user]);


  // Share the canonical loverball.com/e/:id URL for copy/web shares — the
  // public event page emits per-route OG meta via <Seo/> for JS-executing
  // crawlers (Twitter, Slack, FB).
  const getShareUrl = () => {
    if (!event?.id) return `https://www.loverball.com/e/`;
    return `https://www.loverball.com/e/${event.id}`;
  };

  // For SMS/iMessage previews, share the edge-function URL. It returns a tiny
  // HTML doc with the event's cover image as og:image (non-JS crawler friendly)
  // and redirects real browsers to /e/:id.
  const getSmsShareUrl = () => {
    if (!event?.id) return getShareUrl();
    // `v` busts iMessage/WhatsApp link-preview caches when the cover image changes.
    return `https://nfjavjfxgxrpvieinpdp.supabase.co/functions/v1/event-og-meta?id=${event.id}&v=2`;
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleNativeShare = async () => {
    if (!event) return;
    const shareUrl = getShareUrl();
    const summary = buildShareSummary(event);

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `${summary}\n\n${shareUrl}`,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error
      }
    }
  };

  const copyToClipboard = () => {
    if (!event) return;
    const shareUrl = getShareUrl();
    const summary = buildShareSummary(event);
    navigator.clipboard.writeText(`${summary}\n\n${shareUrl}`);
    toast({
      title: "Copied!",
      description: "Event summary and link copied to clipboard.",
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
    <div ref={gestureRef} className="min-h-screen bg-background">
      {event && (
        <Seo
          title={`${event.title} · Loverball`}
          description={buildSharePreviewDescription(event).slice(0, 200)}
          path={`/e/${event.id}`}
          image={resolveEventImage(event)}
          imageAlt={`${event.title} — Loverball event cover`}
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
            image: [resolveEventImage(event)],
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

      {/* Desktop global nav — keeps FEED/Events/Club/Profile reachable */}
      <DesktopNav />

      {/* Mobile-only event header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <img src={loverballLogo} alt="Loverball" className="h-12 md:h-14" loading="lazy" decoding="async" />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                downloadICS({
                  title: event.title,
                  description: event.description || "",
                  location: [event.venue_name, event.city].filter(Boolean).join(", "),
                  url: window.location.href,
                  date: event.event_date,
                  time: event.event_time,
                  endTime: event.end_time,
                  uid: `${event.id}@loverball`,
                })
              }
              aria-label="Add to calendar"
              title="Add to calendar"
            >
              <CalendarPlus className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              aria-label="Share event"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
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
        <main className="pt-16 md:pt-4 pb-32">
          <div className="max-w-xl mx-auto px-4 py-4 space-y-3">
            <BetaTrialBanner />
            {/* HERO CARD */}
            <div className={`relative overflow-hidden rounded-2xl p-4 ${heroClass}`}>
              <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-primary/20" />
              {/* Desktop share button */}
              <button
                onClick={handleShare}
                className="hidden md:flex absolute top-4 right-4 z-10 w-9 h-9 rounded-full items-center justify-center transition-colors bg-background/20 hover:bg-background/40 border border-white/20"
                aria-label="Share event"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <div className="relative">
                <div className={`flex items-center gap-1.5 mb-2 ${eyebrowAccent}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
                  <span className="text-[10px] font-semibold tracking-[0.15em]">{eyebrowLabel}</span>
                </div>
                <h1 className="font-display text-2xl leading-tight mb-1">{event.title}</h1>
                <div className="text-xs opacity-90 mb-2 flex flex-wrap gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(parseEventDate(event.event_date), 'EEE, MMM d')}{event.event_time ? ` · ${formatTime(event.event_time)}` : ''}</span>
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
            {isGoing && (
              <div className="rounded-xl bg-card border border-border/30 p-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[hsl(173_58%_39%)] flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">You're going</div>
                  <div className="text-xs text-muted-foreground">
                    {user ? 'Tap edit to update your plans' : 'Sign up free to lock in your spot.'}
                  </div>
                </div>
                {user ? (
                  <button onClick={() => handleRSVP('no')} className="text-xs text-muted-foreground">Edit</button>
                ) : (
                  <Button
                    size="sm"
                    className="rounded-full h-8 text-xs"
                    onClick={() => navigate(`/auth?mode=signup&redirect=${encodeURIComponent(`/event/${id}`)}`)}
                  >
                    Sign up
                  </Button>
                )}
              </div>
            )}

            {/* HOSTED: host card + pitch quote */}
            {variant === 'hosted' && (
              <>
                {event.host_user_id && (
                  <div className="rounded-xl bg-card border border-border/30 p-3">
                    <EventHostProfile hostId={event.host_user_id} coHostIds={event.co_host_ids as string[] | undefined} />
                    {user && (isAdmin || user.id === event.host_user_id || (event.co_host_ids || []).includes(user.id)) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => navigate(`/admin/events/${event.id}/edit`)}
                      >
                        <Settings className="w-3.5 h-3.5 mr-2" />
                        Dashboard
                      </Button>
                    )}
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

            {/* RSVP AVATAR BAR — social proof near action (gated for guests) */}
            <div className="rounded-xl bg-card border border-border/30 p-3">
              <div className="flex justify-between items-baseline mb-2.5">
                <span className="text-[10px] font-semibold tracking-[0.1em] text-muted-foreground">
                  {variant === 'hosted' ? 'GOING' : variant === 'cultural' ? 'GOING' : 'WHO ELSE IS GOING'}
                </span>
                <span className="text-[11px] font-semibold text-primary">
                  {user
                    ? (variant === 'hosted' && event.capacity
                        ? `${goingCount} of ${event.capacity} spots`
                        : `${goingCount} member${goingCount === 1 ? '' : 's'}`)
                    : 'Members only'}
                </span>
              </div>
              {user ? (
                <>
                  <RsvpAvatarBar
                    attendees={attendees
                      .filter((a) => a.profile)
                      .map((a) => ({
                        id: a.user_id,
                        name: a.profile!.name,
                        profile_photo_url: a.profile!.profile_photo_url,
                      }))}
                    totalCount={goingCount}
                    maxAvatars={5}
                    size="md"
                    onViewAllClick={() => setShowAttendeeList(true)}
                  />

                  {/* Hosted: fan modes mix chips */}
                  {variant === 'hosted' && goingCount > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-2.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(173_58%_39%)]/10 text-[hsl(173_58%_25%)]">Athletes</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">New converts</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Vibes</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="relative">
                  <div className="flex -space-x-2 blur-[6px] pointer-events-none select-none mb-3">
                    {[0,1,2,3,4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-primary/20 border-2 border-background" />
                    ))}
                  </div>
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center space-y-2">
                    <Lock className="w-4 h-4 mx-auto text-primary" />
                    <p className="text-xs font-semibold">Sign up to see who's going</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 rounded-full h-9 text-xs"
                        onClick={() => navigate(`/auth?mode=signup&redirect=${encodeURIComponent(`/event/${id}`)}`)}
                      >
                        Sign up — free
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-full h-9 text-xs"
                        onClick={() => navigate(`/auth?mode=signin&redirect=${encodeURIComponent(`/event/${id}`)}`)}
                      >
                        Sign in
                      </Button>

                    </div>
                  </div>
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
            {(event.event_type === 'watch_party' || event.location_type === 'virtual') &&
              !event.title.toLowerCase().includes('fifa world cup') && (
              <NearbySportsBars
                eventLat={(event as any).location_lat ?? null}
                eventLng={(event as any).location_lng ?? null}
              />
            )}
            <WhereToSit venueName={event.venue_name} eventType={event.event_type} />

            {/* You've met */}
            {user && isGoing && (
              <YouveMetCard />
            )}

            {/* Full who's going + comments below the fold */}
            {id && user && <WhosGoing eventId={id} refreshKey={guestRefreshKey} />}
            {id && user && <div id="event-chat"><EventComments eventId={id} /></div>}
            {id && !user && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center space-y-3">
                <Lock className="w-6 h-6 mx-auto text-primary" />
                <p className="text-base font-semibold">Sign up to see who's going and join the chat</p>
                <p className="text-xs text-muted-foreground">Free · takes 10 seconds</p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    className="rounded-full h-11"
                    onClick={() => navigate(`/auth?mode=signup&redirect=${encodeURIComponent(`/event/${id}`)}`)}
                  >
                    Sign Up — Free
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full h-11"
                    onClick={() => navigate(`/auth?mode=signin&redirect=${encodeURIComponent(`/event/${id}`)}`)}
                  >
                    Sign In
                  </Button>
                </div>

              </div>
            )}

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
                  I'm Going {rsvpStatus === 'attending' || rsvpStatus === 'yes' ? '✓' : ''}
                </Button>
                <Button
                  variant={rsvpStatus === 'maybe' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => handleRSVP('maybe')}
                  disabled={rsvping}
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Interested {rsvpStatus === 'maybe' ? '✓' : ''}
                </Button>
                <Button
                  variant={rsvpStatus === 'no' ? 'destructive' : 'outline'}
                  className="flex-1"
                  onClick={() => handleRSVP('no')}
                  disabled={rsvping}
                >
                  <X className="w-4 h-4 mr-2" />
                  Next Time
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
                  I'm Going
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 py-6"
                  onClick={() => handleRSVP('maybe')}
                  disabled={rsvping}
                >
                  <HelpCircle className="w-5 h-5 mr-2" />
                  Interested
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 py-6"
                  onClick={() => handleRSVP('no')}
                  disabled={rsvping}
                >
                  <X className="w-5 h-5 mr-2" />
                  Next Time
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
            <div className="flex gap-2">
              <Button className="flex-1 py-6" onClick={() => handleRSVP('yes')}>
                <Check className="w-5 h-5 mr-2" /> I'm Going
              </Button>
              <Button variant="outline" className="flex-1 py-6" onClick={() => handleRSVP('maybe')}>
                <HelpCircle className="w-5 h-5 mr-2" /> Interested
              </Button>
              <Button variant="outline" className="flex-1 py-6" onClick={() => handleRSVP('no')}>
                <X className="w-5 h-5 mr-2" /> Next Time
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-2">
              Sign up takes 10 seconds — we'll bring you back here.
            </p>
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
                description={buildSharePreviewDescription(event)}
                imageUrl={resolveEventImage(event)}
                eventDate={format(parseEventDate(event.event_date), "EEE, MMM d, yyyy")}
                eventTime={event.event_time ? formatTime(event.event_time) : null}
                venue={event.venue_name || null}
                city={event.city || null}
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
                <Button 
                  variant="outline" 
                  className="flex-1"
                  asChild
                >
                  <a
                    href={`mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(buildShareSummary(event) + "\n\n" + getShareUrl())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  asChild
                >
                  <a
                    href={`sms:?&body=${encodeURIComponent(buildShareSummary(event) + "\n\n" + getSmsShareUrl())}`}
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Text
                  </a>
                </Button>
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
