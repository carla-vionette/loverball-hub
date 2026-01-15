import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users, Lock, Share2, ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import loverballLogo from "@/assets/loverball-logo-new.png";

interface Event {
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

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isMember } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [rsvping, setRsvping] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id]);

  useEffect(() => {
    if (user && id) {
      fetchRsvpStatus();
    }
  }, [user, id]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: "Event not found",
        description: "This event may have been removed.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      console.error('Error fetching RSVP status:', error);
    }
  };

  const handleRSVP = async () => {
    if (!user) {
      // Redirect to auth with return URL
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

    setRsvping(true);
    try {
      const status = event.visibility === 'invite_only' ? 'requested' : 'attending';
      
      const { error } = await supabase
        .from('event_rsvps')
        .upsert({
          event_id: event.id,
          user_id: user.id,
          status,
        });

      if (error) throw error;

      setRsvpStatus(status);

      toast({
        title: status === 'requested' ? 'Invite requested!' : 'RSVP confirmed!',
        description: status === 'requested' 
          ? 'The host will review your request.'
          : 'We\'ll see you there!',
      });
    } catch (error: any) {
      console.error('Error submitting RSVP:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit RSVP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRsvping(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title || 'Loverball Event',
          text: `Check out this event on Loverball: ${event?.title}`,
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

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

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
          <img src={loverballLogo} alt="Loverball" className="h-8" />
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="pt-16 pb-24">
        {/* Hero Image */}
        <div className="relative h-64 md:h-80 bg-gradient-to-br from-primary/20 to-accent/20">
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
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-10">
          <Card>
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
                    </span>
                  </div>
                )}
                
                {(event.venue_name || event.city) && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="w-5 h-5 flex-shrink-0" />
                    <span className="text-foreground font-medium">
                      {event.venue_name}{event.venue_name && event.city ? ', ' : ''}{event.city}
                    </span>
                  </div>
                )}
                
                {event.capacity && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Users className="w-5 h-5 flex-shrink-0" />
                    <span className="text-foreground font-medium">{event.capacity} spots available</span>
                  </div>
                )}
              </div>

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

              {/* Description */}
              {event.description && (
                <div className="prose prose-sm max-w-none mb-6">
                  <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              {/* CTA for non-logged in users */}
              {!user && (
                <div className="bg-pale-pink rounded-lg p-6 text-center mb-6">
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

      {/* Fixed Bottom RSVP Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
        <div className="max-w-4xl mx-auto">
          {rsvpStatus ? (
            <Badge 
              variant="secondary" 
              className="w-full justify-center py-3 text-base capitalize"
            >
              {rsvpStatus === 'attending' ? '✓ You\'re Attending' : rsvpStatus}
            </Badge>
          ) : !user ? (
            <Button 
              className="w-full py-6 text-base"
              onClick={() => navigate(`/auth?redirect=/event/${id}`)}
            >
              Sign In to RSVP
            </Button>
          ) : event.visibility === 'public' || isMember ? (
            <Button 
              onClick={handleRSVP} 
              className="w-full py-6 text-base"
              disabled={rsvping}
            >
              {rsvping ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : null}
              {event.visibility === 'invite_only' ? 'Request Invite' : 'RSVP Now'}
            </Button>
          ) : (
            <Button variant="outline" className="w-full py-6 text-base" disabled>
              Members Only Event
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
