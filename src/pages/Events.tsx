import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import PageSkeleton from "@/components/PageSkeleton";

import wnbaWatchParty from "@/assets/wnba-watch-party.jpg";
import brunchBasketball from "@/assets/brunch-basketball.jpg";
import sunsetVolleyball from "@/assets/sunset-volleyball.jpg";
import fieldDay from "@/assets/field-day.jpg";
import marchMadnessParty from "@/assets/march-madness-party.jpg";
import brunchRunClub from "@/assets/brunch-run-club.jpg";

const CATEGORIES = ["All", "Watch Parties", "Game Days", "Meetups", "Tailgates", "Networking"];

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
}

const sampleEvents = [
  { id: "s1", title: "WNBA Finals Watch Party", event_date: "2025-04-15", event_time: "19:00", venue_name: "Brooklyn Sports Bar", city: "Los Angeles", event_type: "Watch Parties", image_url: null, sport_tags: ["WNBA"], visibility: "public", capacity: 30, price: 0, _image: wnbaWatchParty, _attendees: 24, _host: "Sarah M." },
  { id: "s2", title: "Sunday Brunch & Basketball", event_date: "2025-04-17", event_time: "11:00", venue_name: "The Garden Cafe", city: "Silver Lake", event_type: "Meetups", image_url: null, sport_tags: ["Basketball"], visibility: "public", capacity: 15, price: 25, _image: brunchBasketball, _attendees: 12, _host: "Emma J." },
  { id: "s3", title: "Sunset Volleyball Meetup", event_date: "2025-04-20", event_time: "17:30", venue_name: "Santa Monica Beach", city: "Santa Monica", event_type: "Game Days", image_url: null, sport_tags: ["Volleyball"], visibility: "public", capacity: 25, price: 0, _image: sunsetVolleyball, _attendees: 18, _host: "Lisa C." },
  { id: "s4", title: "Field Day: Soccer & Basketball", event_date: "2025-04-22", event_time: "10:00", venue_name: "Central Sports Complex", city: "Pasadena", event_type: "Game Days", image_url: null, sport_tags: ["Soccer", "Basketball"], visibility: "public", capacity: 40, price: 10, _image: fieldDay, _attendees: 32, _host: "Maya P." },
  { id: "s5", title: "March Madness Watch Party", event_date: "2025-04-24", event_time: "18:00", venue_name: "The Sports Lounge", city: "Downtown LA", event_type: "Watch Parties", image_url: null, sport_tags: ["Basketball"], visibility: "public", capacity: 35, price: 0, _image: marchMadnessParty, _attendees: 28, _host: "Rachel K." },
  { id: "s6", title: "Brunch & Run Club Kickoff", event_date: "2025-04-28", event_time: "09:00", venue_name: "Morning Glory Cafe", city: "Venice", event_type: "Meetups", image_url: null, sport_tags: ["Running"], visibility: "public", capacity: 20, price: 15, _image: brunchRunClub, _attendees: 15, _host: "Jenna T." },
];

const Events = () => {
  const [dbEvents, setDbEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [rsvpModal, setRsvpModal] = useState<string | null>(null);
  const [userRsvps, setUserRsvps] = useState<Record<string, string>>({});
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>({});
  const { user, isMember } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
    if (user) fetchUserRsvps();
  }, [user]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase.from("events").select("*").gte("event_date", new Date().toISOString().split("T")[0]).order("event_date", { ascending: true });
      if (error) throw error;
      setDbEvents(data || []);
      if (data && data.length > 0) {
        const { data: rsvpData } = await supabase.from("event_rsvps").select("event_id").in("event_id", data.map(e => e.id)).in("status", ["attending", "confirmed"]);
        if (rsvpData) {
          const counts: Record<string, number> = {};
          rsvpData.forEach(r => { counts[r.event_id] = (counts[r.event_id] || 0) + 1; });
          setAttendeeCounts(counts);
        }
      }
    } catch (e) {
      console.error("Error fetching events:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRsvps = async () => {
    if (!user) return;
    const { data } = await supabase.from("event_rsvps").select("event_id, status").eq("user_id", user.id);
    if (data) {
      const map: Record<string, string> = {};
      data.forEach(r => { map[r.event_id] = r.status; });
      setUserRsvps(map);
    }
  };

  const handleRSVP = async (eventId: string, status: string) => {
    if (!user) { toast({ title: "Sign in required", variant: "destructive" }); return; }
    try {
      await supabase.from("event_rsvps").upsert({ event_id: eventId, user_id: user.id, status });
      setUserRsvps(prev => ({ ...prev, [eventId]: status }));
      toast({ title: status === "attending" ? "You're going! 🎉" : status === "maybe" ? "Marked as maybe" : "Noted!" });
      setRsvpModal(null);
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to RSVP", variant: "destructive" });
    }
  };

  const allEvents = dbEvents.length > 0 ? dbEvents : sampleEvents;
  const filteredEvents = selectedCategory === "All" ? allEvents : allEvents.filter(e => (e as any).event_type === selectedCategory);
  const featuredEvent = allEvents[0];

  const formatTime = (time: string) => {
    const [h, m] = time.split(":");
    const d = new Date(); d.setHours(parseInt(h), parseInt(m));
    return format(d, "h:mm a");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader /><DesktopNav /><BottomNav />
        <main className="md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
          <div className="container mx-auto px-4 py-8 max-w-6xl"><PageSkeleton variant="cards" count={6} /></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader /><DesktopNav /><BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-6">
          {/* FEATURED EVENT HERO */}
          {featuredEvent && (
            <Card className="overflow-hidden mb-8 group cursor-pointer hover:shadow-lg transition-all border-border/30">
              <div className="relative h-56 md:h-72 overflow-hidden">
                <img
                  src={(featuredEvent as any)._image || featuredEvent.image_url || wnbaWatchParty}
                  alt={featuredEvent.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <Badge className="bg-primary text-primary-foreground text-[10px] font-bold tracking-wider rounded-sm mb-2">
                    Featured Event
                  </Badge>
                  <h2 className="text-white font-condensed text-3xl font-bold uppercase">{featuredEvent.title}</h2>
                  <div className="flex items-center gap-4 text-white/70 text-sm mt-2">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(new Date(featuredEvent.event_date), "MMM d, yyyy")}</span>
                    {featuredEvent.event_time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatTime(featuredEvent.event_time)}</span>}
                    {(featuredEvent.venue_name || featuredEvent.city) && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{featuredEvent.venue_name || featuredEvent.city}</span>}
                  </div>
                  <Button className="rounded-full mt-4" onClick={() => setRsvpModal(featuredEvent.id)}>RSVP Now</Button>
                </div>
              </div>
            </Card>
          )}

          {/* CATEGORY FILTER CHIPS */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 -mx-5 px-5 mb-6">
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className={`cursor-pointer px-5 py-2.5 text-sm rounded-full whitespace-nowrap transition-all ${selectedCategory === cat ? "bg-primary text-primary-foreground" : "hover:bg-secondary/50"}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>

          {/* EVENTS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEvents.map((event) => {
              const img = (event as any)._image || event.image_url;
              const attendees = attendeeCounts[event.id] || (event as any)._attendees || 0;
              const host = (event as any)._host || "Loverball";
              const rsvpStatus = userRsvps[event.id];

              return (
                <Card key={event.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all border-border/30">
                  <div className="relative h-44 overflow-hidden">
                    {img ? (
                      <img src={img} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Calendar className="w-10 h-10 text-primary/30" />
                      </div>
                    )}
                    {event.event_type && (
                      <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold tracking-wider rounded-sm">
                        {event.event_type}
                      </Badge>
                    )}
                    {event.price === 0 && (
                      <Badge className="absolute top-3 right-3 bg-success text-success-foreground text-[10px] font-bold rounded-sm">
                        Free
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors">{event.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(event.event_date), "MMM d")}</span>
                      {event.event_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(event.event_time)}</span>}
                    </div>
                    {(event.venue_name || event.city) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue_name}{event.venue_name && event.city ? ", " : ""}{event.city}</p>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{host.charAt(0)}</div>
                        <span className="text-xs text-muted-foreground">{host}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Users className="w-3 h-3" />{attendees}{event.capacity ? `/${event.capacity}` : ""}</span>
                      </div>
                      {rsvpStatus ? (
                        <Badge variant="outline" className="text-[10px] rounded-full capitalize">{rsvpStatus}</Badge>
                      ) : (
                        <Button size="sm" className="rounded-full text-xs h-8 px-4" onClick={(e) => { e.stopPropagation(); setRsvpModal(event.id); }}>
                          RSVP
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* RSVP MODAL */}
        <Dialog open={!!rsvpModal} onOpenChange={() => setRsvpModal(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-condensed text-xl uppercase">RSVP</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Button className="w-full rounded-full" onClick={() => rsvpModal && handleRSVP(rsvpModal, "attending")}>
                ✅ Going
              </Button>
              <Button variant="outline" className="w-full rounded-full" onClick={() => rsvpModal && handleRSVP(rsvpModal, "maybe")}>
                🤔 Maybe
              </Button>
              <Button variant="ghost" className="w-full rounded-full" onClick={() => setRsvpModal(null)}>
                ❌ Can't Make It
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Events;
