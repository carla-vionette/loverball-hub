import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import DesktopNav from '@/components/DesktopNav';
import MobileHeader from '@/components/MobileHeader';
import EventCard from '@/components/EventCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, MapPin, Users, Clock } from 'lucide-react';

// Sample events images
import wnbaWatchParty from "@/assets/wnba-watch-party.jpg";
import brunchBasketball from "@/assets/brunch-basketball.jpg";
import sunsetVolleyball from "@/assets/sunset-volleyball.jpg";
import fieldDay from "@/assets/field-day.jpg";
import marchMadnessParty from "@/assets/march-madness-party.jpg";
import brunchRunClub from "@/assets/brunch-run-club.jpg";

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

// Sample events for showcase when no DB events exist
const sampleEvents = [
  {
    id: "sample-1",
    title: "WNBA Finals Watch Party",
    type: "Watch Party",
    date: "March 15, 2025",
    time: "7:00 PM",
    location: "Brooklyn Sports Bar",
    city: "Brooklyn, NY",
    attendees: 24,
    maxAttendees: 30,
    image: wnbaWatchParty,
    hostName: "Sarah M.",
  },
  {
    id: "sample-2",
    title: "Sunday Brunch & Basketball Talk",
    type: "Brunch",
    date: "March 17, 2025",
    time: "11:00 AM",
    location: "The Garden Cafe",
    city: "Austin, TX",
    attendees: 12,
    maxAttendees: 15,
    image: brunchBasketball,
    hostName: "Emma J.",
  },
  {
    id: "sample-3",
    title: "Sunset Picnic & Volleyball",
    type: "Picnic",
    date: "March 20, 2025",
    time: "5:30 PM",
    location: "Riverside Park",
    city: "Chicago, IL",
    attendees: 18,
    maxAttendees: 25,
    image: sunsetVolleyball,
    hostName: "Lisa C.",
  },
  {
    id: "sample-4",
    title: "Field Day: Soccer & Basketball",
    type: "Field Day",
    date: "March 22, 2025",
    time: "10:00 AM",
    location: "Central Sports Complex",
    city: "Seattle, WA",
    attendees: 32,
    maxAttendees: 40,
    image: fieldDay,
    hostName: "Maya P.",
  },
  {
    id: "sample-5",
    title: "Women's March Madness Watch Party",
    type: "Watch Party",
    date: "March 24, 2025",
    time: "6:00 PM",
    location: "The Sports Lounge",
    city: "Denver, CO",
    attendees: 28,
    maxAttendees: 35,
    image: marchMadnessParty,
    hostName: "Rachel K.",
  },
  {
    id: "sample-6",
    title: "Brunch & Run Club Kickoff",
    type: "Brunch",
    date: "March 28, 2025",
    time: "9:00 AM",
    location: "Morning Glory Cafe",
    city: "Portland, OR",
    attendees: 15,
    maxAttendees: 20,
    image: brunchRunClub,
    hostName: "Jenna T.",
  },
];

const typeColors: Record<string, string> = {
  "Watch Party": "bg-primary text-primary-foreground",
  "Brunch": "bg-secondary text-secondary-foreground",
  "Picnic": "bg-accent text-accent-foreground",
  "Field Day": "bg-muted text-muted-foreground",
};

const sportFilters = ['All', 'NBA', 'WNBA', 'NFL', 'MLB', 'MLS', 'NWSL', 'NCAA', 'World Cup LA', 'LA28'];

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [userRsvps, setUserRsvps] = useState<Record<string, string>>({});
  const { user, isMember } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
    if (user) {
      fetchUserRsvps();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRsvps = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('event_rsvps')
        .select('event_id, status')
        .eq('user_id', user.id);

      if (error) throw error;

      const rsvpMap: Record<string, string> = {};
      data?.forEach(rsvp => {
        rsvpMap[rsvp.event_id] = rsvp.status;
      });
      setUserRsvps(rsvpMap);
    } catch (error) {
      console.error('Error fetching RSVPs:', error);
    }
  };

  const handleRSVP = async (eventId: string, visibility: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to RSVP to events.',
        variant: 'destructive',
      });
      return;
    }

    if (!isMember && visibility !== 'public') {
      toast({
        title: 'Members only',
        description: 'This event is only open to Loverball members.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const status = visibility === 'invite_only' ? 'requested' : 'attending';
      
      const { error } = await supabase
        .from('event_rsvps')
        .upsert({
          event_id: eventId,
          user_id: user.id,
          status,
        });

      if (error) throw error;

      setUserRsvps(prev => ({ ...prev, [eventId]: status }));

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
    }
  };

  const handleCancelRSVP = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('event_rsvps')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      setUserRsvps(prev => {
        const updated = { ...prev };
        delete updated[eventId];
        return updated;
      });

      toast({
        title: 'RSVP cancelled',
        description: 'You have been removed from the guest list.',
      });
    } catch (error: any) {
      console.error('Error cancelling RSVP:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel RSVP. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const filteredEvents = events.filter(event => {
    if (selectedFilter === 'All') return true;
    return event.sport_tags?.includes(selectedFilter);
  });

  const upcomingEvents = filteredEvents.filter(
    e => new Date(e.event_date) >= new Date()
  );

  // Show sample events when no database events
  const hasDbEvents = events.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />
      
      <main className="md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Events</h1>
            <p className="text-muted-foreground">
              Join watch parties, brunches, picnics, field days, and more with the Loverball community.
            </p>
          </div>

          {hasDbEvents ? (
            <>
              {/* Sport Filters */}
              <div className="mb-6 overflow-x-auto pb-2">
                <div className="flex gap-2 min-w-max">
                  {sportFilters.map((filter) => (
                    <Badge
                      key={filter}
                      variant={selectedFilter === filter ? 'default' : 'outline'}
                      className="cursor-pointer px-4 py-2 text-sm"
                      onClick={() => setSelectedFilter(filter)}
                    >
                      {filter}
                    </Badge>
                  ))}
                </div>
              </div>

              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="my-events">My Events</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming">
                  {upcomingEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {upcomingEvents.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onRSVP={() => handleRSVP(event.id, event.visibility)}
                          rsvpStatus={userRsvps[event.id]}
                          isMember={isMember}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h2 className="text-xl font-semibold mb-2">No upcoming events</h2>
                      <p className="text-muted-foreground">
                        {selectedFilter !== 'All' 
                          ? `No ${selectedFilter} events scheduled. Try another filter.`
                          : 'Check back soon for new events!'}
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="my-events">
                  {Object.keys(userRsvps).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {events
                        .filter(event => userRsvps[event.id])
                        .map((event) => (
                          <EventCard
                            key={event.id}
                            event={event}
                            rsvpStatus={userRsvps[event.id]}
                            isMember={isMember}
                            onCancelRSVP={() => handleCancelRSVP(event.id)}
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h2 className="text-xl font-semibold mb-2">No events yet</h2>
                      <p className="text-muted-foreground">
                        RSVP to events to see them here.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          ) : (
            /* Sample events showcase when no DB events */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sampleEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                    <Badge className={`absolute top-3 right-3 ${typeColors[event.type] || 'bg-muted text-muted-foreground'}`}>
                      {event.type}
                    </Badge>
                  </div>
                  
                  <CardContent className="pt-4">
                    <h3 className="font-bold text-lg mb-3 line-clamp-2">{event.title}</h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="line-clamp-1">{event.location}, {event.city}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span>{event.attendees}/{event.maxAttendees} attending</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {event.hostName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm text-muted-foreground">by {event.hostName}</span>
                      </div>
                      <Button size="sm" className="rounded-full">
                        Join
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Events;