import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import DesktopNav from '@/components/DesktopNav';
import MobileHeader from '@/components/MobileHeader';
import EventCard from '@/components/EventCard';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar } from 'lucide-react';

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

  const filteredEvents = events.filter(event => {
    if (selectedFilter === 'All') return true;
    return event.sport_tags?.includes(selectedFilter);
  });

  const upcomingEvents = filteredEvents.filter(
    e => new Date(e.event_date) >= new Date()
  );

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
              Join the Loverball community at watch parties, brunches, panels, and more.
            </p>
          </div>

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
        </div>
      </main>
    </div>
  );
};

export default Events;
