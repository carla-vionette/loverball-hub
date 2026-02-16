import { useState, useEffect, useMemo } from 'react';
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
import { Loader2, Calendar, MapPin, Users, Clock, Plus, SlidersHorizontal, Image, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

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
  price?: number | null;
  venue_type?: string | null;
}

// Sample events for showcase when no DB events exist
const sampleEvents = [
  { id: "sample-1", title: "WNBA Finals Watch Party", type: "Watch Party", date: "March 15, 2025", time: "7:00 PM", location: "Brooklyn Sports Bar", city: "Brooklyn, NY", attendees: 24, maxAttendees: 30, image: wnbaWatchParty, hostName: "Sarah M." },
  { id: "sample-2", title: "Sunday Brunch & Basketball Talk", type: "Brunch", date: "March 17, 2025", time: "11:00 AM", location: "The Garden Cafe", city: "Austin, TX", attendees: 12, maxAttendees: 15, image: brunchBasketball, hostName: "Emma J." },
  { id: "sample-3", title: "Sunset Picnic & Volleyball", type: "Picnic", date: "March 20, 2025", time: "5:30 PM", location: "Riverside Park", city: "Chicago, IL", attendees: 18, maxAttendees: 25, image: sunsetVolleyball, hostName: "Lisa C." },
  { id: "sample-4", title: "Field Day: Soccer & Basketball", type: "Field Day", date: "March 22, 2025", time: "10:00 AM", location: "Central Sports Complex", city: "Seattle, WA", attendees: 32, maxAttendees: 40, image: fieldDay, hostName: "Maya P." },
  { id: "sample-5", title: "Women's March Madness Watch Party", type: "Watch Party", date: "March 24, 2025", time: "6:00 PM", location: "The Sports Lounge", city: "Denver, CO", attendees: 28, maxAttendees: 35, image: marchMadnessParty, hostName: "Rachel K." },
  { id: "sample-6", title: "Brunch & Run Club Kickoff", type: "Brunch", date: "March 28, 2025", time: "9:00 AM", location: "Morning Glory Cafe", city: "Portland, OR", attendees: 15, maxAttendees: 20, image: brunchRunClub, hostName: "Jenna T." },
];

const typeColors: Record<string, string> = {
  "Watch Party": "bg-primary text-primary-foreground",
  "Brunch": "bg-secondary text-secondary-foreground",
  "Picnic": "bg-accent text-accent-foreground",
  "Field Day": "bg-muted text-muted-foreground",
};

const sportFilters = ['All', 'NBA', 'WNBA', 'NFL', 'MLB', 'MLS', 'NWSL', 'NCAA', 'World Cup LA', 'LA28'];
const priceFilters = ['Any', 'Free', 'Under $20', '$20-50', '$50+'];
const venueTypes = ['Indoor', 'Outdoor', 'Virtual', 'Stadium', 'Bar/Restaurant'];
const distanceFilters = ['Any', 'Within 5 mi', 'Within 10 mi', 'Within 25 mi'];

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [userRsvps, setUserRsvps] = useState<Record<string, string>>({});
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>({});
  const { user, isMember } = useAuth();
  const { toast } = useToast();

  // Filter state
  const [priceFilter, setPriceFilter] = useState('Any');
  const [selectedVenueTypes, setSelectedVenueTypes] = useState<string[]>([]);
  const [distanceFilter, setDistanceFilter] = useState('Any');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = [
    priceFilter !== 'Any' ? 1 : 0,
    selectedVenueTypes.length > 0 ? 1 : 0,
    distanceFilter !== 'Any' ? 1 : 0,
    dateRange.from ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  useEffect(() => {
    fetchEvents();
    fetchPastEvents();
    if (user) fetchUserRsvps();
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
      
      // Fetch attendee counts
      if (data && data.length > 0) {
        const ids = data.map(e => e.id);
        const { data: rsvpData } = await supabase
          .from('event_rsvps')
          .select('event_id')
          .in('event_id', ids)
          .in('status', ['attending', 'confirmed']);
        if (rsvpData) {
          const counts: Record<string, number> = {};
          rsvpData.forEach(r => { counts[r.event_id] = (counts[r.event_id] || 0) + 1; });
          setAttendeeCounts(counts);
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPastEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .lt('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: false })
        .limit(12);
      if (error) throw error;
      setPastEvents(data || []);
    } catch (error) {
      console.error('Error fetching past events:', error);
    }
  };

  const fetchUserRsvps = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('event_rsvps').select('event_id, status').eq('user_id', user.id);
      if (error) throw error;
      const rsvpMap: Record<string, string> = {};
      data?.forEach(rsvp => { rsvpMap[rsvp.event_id] = rsvp.status; });
      setUserRsvps(rsvpMap);
    } catch (error) {
      console.error('Error fetching RSVPs:', error);
    }
  };

  const handleRSVP = async (eventId: string, visibility: string) => {
    if (!user) { toast({ title: 'Sign in required', description: 'Please sign in to RSVP to events.', variant: 'destructive' }); return; }
    if (!isMember && visibility !== 'public') { toast({ title: 'Members only', description: 'This event is only open to Loverball members.', variant: 'destructive' }); return; }
    try {
      const status = visibility === 'invite_only' ? 'requested' : 'attending';
      const { error } = await supabase.from('event_rsvps').upsert({ event_id: eventId, user_id: user.id, status });
      if (error) throw error;
      setUserRsvps(prev => ({ ...prev, [eventId]: status }));
      toast({ title: status === 'requested' ? 'Invite requested!' : 'RSVP confirmed!', description: status === 'requested' ? 'The host will review your request.' : "We'll see you there!" });
    } catch (error: any) {
      console.error('Error submitting RSVP:', error);
      toast({ title: 'Error', description: 'Failed to submit RSVP. Please try again.', variant: 'destructive' });
    }
  };

  const handleCancelRSVP = async (eventId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('event_rsvps').delete().eq('event_id', eventId).eq('user_id', user.id);
      if (error) throw error;
      setUserRsvps(prev => { const updated = { ...prev }; delete updated[eventId]; return updated; });
      toast({ title: 'RSVP cancelled', description: 'You have been removed from the guest list.' });
    } catch (error: any) {
      console.error('Error cancelling RSVP:', error);
      toast({ title: 'Error', description: 'Failed to cancel RSVP. Please try again.', variant: 'destructive' });
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Sport filter
      if (selectedFilter !== 'All' && !event.sport_tags?.includes(selectedFilter)) return false;
      // Price filter
      const p = (event as any).price ?? 0;
      if (priceFilter === 'Free' && p !== 0) return false;
      if (priceFilter === 'Under $20' && (p === 0 || p >= 20)) return false;
      if (priceFilter === '$20-50' && (p < 20 || p > 50)) return false;
      if (priceFilter === '$50+' && p < 50) return false;
      // Venue type
      if (selectedVenueTypes.length > 0 && !selectedVenueTypes.includes(event.venue_type || 'Indoor')) return false;
      // Date range
      if (dateRange.from && new Date(event.event_date) < dateRange.from) return false;
      if (dateRange.to && new Date(event.event_date) > dateRange.to) return false;
      return true;
    });
  }, [events, selectedFilter, priceFilter, selectedVenueTypes, distanceFilter, dateRange]);

  const upcomingEvents = filteredEvents.filter(e => new Date(e.event_date) >= new Date());
  const hasDbEvents = events.length > 0;

  const clearFilters = () => {
    setPriceFilter('Any');
    setSelectedVenueTypes([]);
    setDistanceFilter('Any');
    setDateRange({});
  };

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
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="inline-block bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-semibold tracking-wide mb-4">
                Community
              </span>
              <h1 className="text-4xl font-sans font-normal mb-3">Events</h1>
              <p className="text-muted-foreground text-lg">
                Join watch parties, brunches, picnics, field days, and more with the Loverball community.
              </p>
            </div>
            {isMember && (
              <Button className="rounded-full gap-2 self-start sm:self-auto" onClick={() => toast({ title: "Coming soon!", description: "Event creation will be available shortly." })}>
                <Plus className="w-4 h-4" /> Create Event
              </Button>
            )}
          </div>

          {hasDbEvents ? (
            <>
              {/* Sport Filters + Filter Button */}
              <div className="mb-6 flex items-center gap-3">
                <div className="flex-1 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none md:hidden" />
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none md:hidden" />
                  <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                    <div className="flex gap-2 min-w-max py-1">
                      {sportFilters.map((filter) => (
                        <Badge
                          key={filter}
                          variant={selectedFilter === filter ? 'default' : 'outline'}
                          className={`cursor-pointer px-5 py-2.5 text-sm rounded-full transition-all whitespace-nowrap ${selectedFilter === filter ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary/50'}`}
                          onClick={() => setSelectedFilter(filter)}
                        >
                          {filter}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Filter Sidebar Trigger */}
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="rounded-full gap-2 shrink-0 relative">
                      <SlidersHorizontal className="w-4 h-4" /> Filters
                      {activeFilterCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">{activeFilterCount}</span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-80">
                    <SheetHeader>
                      <SheetTitle className="flex items-center justify-between">
                        Filters
                        {activeFilterCount > 0 && (
                          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground">Clear all</Button>
                        )}
                      </SheetTitle>
                    </SheetHeader>
                    <div className="space-y-6 mt-6">
                      {/* Price */}
                      <div>
                        <h4 className="text-sm font-medium mb-3">Price</h4>
                        <div className="flex flex-wrap gap-2">
                          {priceFilters.map(p => (
                            <Badge key={p} variant={priceFilter === p ? 'default' : 'outline'} className="cursor-pointer rounded-full px-3 py-1.5" onClick={() => setPriceFilter(p)}>
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Separator />
                      {/* Date Range */}
                      <div>
                        <h4 className="text-sm font-medium mb-3">Date Range</h4>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal rounded-full">
                              <Calendar className="mr-2 h-4 w-4" />
                              {dateRange.from ? (
                                dateRange.to ? `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d')}` : format(dateRange.from, 'MMM d, yyyy')
                              ) : 'Pick dates'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarPicker
                              mode="range"
                              selected={dateRange as any}
                              onSelect={(range: any) => setDateRange(range || {})}
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Separator />
                      {/* Venue Type */}
                      <div>
                        <h4 className="text-sm font-medium mb-3">Venue Type</h4>
                        <div className="space-y-2">
                          {venueTypes.map(vt => (
                            <div key={vt} className="flex items-center gap-2">
                              <Checkbox
                                id={`vt-${vt}`}
                                checked={selectedVenueTypes.includes(vt)}
                                onCheckedChange={(checked) => {
                                  setSelectedVenueTypes(prev => checked ? [...prev, vt] : prev.filter(v => v !== vt));
                                }}
                              />
                              <Label htmlFor={`vt-${vt}`} className="text-sm">{vt}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator />
                      {/* Distance */}
                      <div>
                        <h4 className="text-sm font-medium mb-3">Distance</h4>
                        <div className="flex flex-wrap gap-2">
                          {distanceFilters.map(d => (
                            <Badge key={d} variant={distanceFilter === d ? 'default' : 'outline'} className="cursor-pointer rounded-full px-3 py-1.5" onClick={() => setDistanceFilter(d)}>
                              {d}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="mb-8 bg-card rounded-full p-1 border border-border/20">
                  <TabsTrigger value="upcoming" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6">Upcoming</TabsTrigger>
                  <TabsTrigger value="my-events" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6">My Events</TabsTrigger>
                  <TabsTrigger value="past" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6">Past Events</TabsTrigger>
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
                          attendeeCount={attendeeCounts[event.id] || 0}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h2 className="text-xl font-semibold mb-2">No upcoming events</h2>
                      <p className="text-muted-foreground">
                        {selectedFilter !== 'All' || activeFilterCount > 0
                          ? 'No events match your filters. Try adjusting them.'
                          : 'Check back soon for new events!'}
                      </p>
                      {activeFilterCount > 0 && (
                        <Button variant="outline" className="mt-4 rounded-full" onClick={clearFilters}>Clear filters</Button>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="my-events">
                  {Object.keys(userRsvps).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {events.filter(event => userRsvps[event.id]).map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          rsvpStatus={userRsvps[event.id]}
                          isMember={isMember}
                          onCancelRSVP={() => handleCancelRSVP(event.id)}
                          attendeeCount={attendeeCounts[event.id] || 0}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h2 className="text-xl font-semibold mb-2">No events yet</h2>
                      <p className="text-muted-foreground">RSVP to events to see them here.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="past">
                  {pastEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {pastEvents.map((event) => (
                        <Card key={event.id} className="overflow-hidden rounded-2xl border-border/50 group cursor-pointer hover:shadow-lg transition-all" onClick={() => {}}>
                          <div className="relative h-48 bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
                            {event.image_url ? (
                              <img src={event.image_url} alt={event.title} className="w-full h-full object-cover opacity-80" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image className="w-16 h-16 text-primary/20" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3">
                              <Badge variant="secondary" className="rounded-full text-xs mb-2">Past Event</Badge>
                              <h3 className="text-white font-semibold line-clamp-2">{event.title}</h3>
                            </div>
                          </div>
                          <CardContent className="pt-4 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4 text-primary/70" />
                              <span>{format(new Date(event.event_date), 'MMM d, yyyy')}</span>
                            </div>
                            {(event.venue_name || event.city) && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4 text-primary/70" />
                                <span>{event.venue_name}{event.venue_name && event.city ? ', ' : ''}{event.city}</span>
                              </div>
                            )}
                            {event.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Image className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h2 className="text-xl font-semibold mb-2">No past events yet</h2>
                      <p className="text-muted-foreground">Past events with photos and recaps will appear here.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          ) : (
            /* Sample events showcase when no DB events */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer rounded-2xl border-border/50 group">
                  <div className="relative aspect-video overflow-hidden">
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <Badge className={`absolute top-3 right-3 rounded-full px-3 ${typeColors[event.type] || 'bg-muted text-muted-foreground'}`}>{event.type}</Badge>
                  </div>
                  <CardContent className="pt-5">
                    <h3 className="font-sans font-semibold text-lg mb-3 line-clamp-2 group-hover:text-primary transition-colors">{event.title}</h3>
                    <div className="space-y-2.5 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="w-4 h-4 flex-shrink-0 text-primary/70" /><span>{event.date}</span></div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="w-4 h-4 flex-shrink-0 text-primary/70" /><span>{event.time}</span></div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4 flex-shrink-0 text-primary/70" /><span className="line-clamp-1">{event.location}, {event.city}</span></div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="w-4 h-4 flex-shrink-0 text-primary/70" /><span>{event.attendees}/{event.maxAttendees} attending</span></div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{event.hostName.split(' ').map(n => n[0]).join('')}</div>
                        <span className="text-sm text-muted-foreground">by {event.hostName}</span>
                      </div>
                      <Button size="sm" className="rounded-full px-5">Join</Button>
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
