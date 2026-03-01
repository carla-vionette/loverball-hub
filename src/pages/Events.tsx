import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import PageSkeleton from "@/components/PageSkeleton";

import wnbaImg from "@/assets/wnba-watch-party.jpg";
import brunchImg from "@/assets/brunch-basketball.jpg";
import volleyImg from "@/assets/sunset-volleyball.jpg";
import fieldImg from "@/assets/field-day.jpg";
import marchImg from "@/assets/march-madness-party.jpg";
import runImg from "@/assets/brunch-run-club.jpg";

const CATEGORIES = ["All", "Watch Parties", "Game Days", "Meetups", "Tailgates", "Networking"];

interface DbEvent {
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

const SAMPLE = [
  { id: "s1", title: "WNBA Finals Watch Party", event_date: "2025-04-15", event_time: "19:00", venue_name: "Brooklyn Sports Bar", city: "Los Angeles", event_type: "Watch Parties", image_url: null, sport_tags: ["WNBA"], visibility: "public", capacity: 30, price: 0, _img: wnbaImg, _count: 24, _host: "Sarah M." },
  { id: "s2", title: "Sunday Brunch & Basketball", event_date: "2025-04-17", event_time: "11:00", venue_name: "The Garden Cafe", city: "Silver Lake", event_type: "Meetups", image_url: null, sport_tags: ["Basketball"], visibility: "public", capacity: 15, price: 25, _img: brunchImg, _count: 12, _host: "Emma J." },
  { id: "s3", title: "Sunset Volleyball Meetup", event_date: "2025-04-20", event_time: "17:30", venue_name: "Santa Monica Beach", city: "Santa Monica", event_type: "Game Days", image_url: null, sport_tags: ["Volleyball"], visibility: "public", capacity: 25, price: 0, _img: volleyImg, _count: 18, _host: "Lisa C." },
  { id: "s4", title: "Field Day: Soccer & Basketball", event_date: "2025-04-22", event_time: "10:00", venue_name: "Central Sports Complex", city: "Pasadena", event_type: "Game Days", image_url: null, sport_tags: ["Soccer", "Basketball"], visibility: "public", capacity: 40, price: 10, _img: fieldImg, _count: 32, _host: "Maya P." },
  { id: "s5", title: "March Madness Watch Party", event_date: "2025-04-24", event_time: "18:00", venue_name: "The Sports Lounge", city: "Downtown LA", event_type: "Watch Parties", image_url: null, sport_tags: ["Basketball"], visibility: "public", capacity: 35, price: 0, _img: marchImg, _count: 28, _host: "Rachel K." },
  { id: "s6", title: "Brunch & Run Club Kickoff", event_date: "2025-04-28", event_time: "09:00", venue_name: "Morning Glory Cafe", city: "Venice", event_type: "Meetups", image_url: null, sport_tags: ["Running"], visibility: "public", capacity: 20, price: 15, _img: runImg, _count: 15, _host: "Jenna T." },
];

const fmtTime = (t: string) => {
  const [h, m] = t.split(":");
  const d = new Date();
  d.setHours(parseInt(h), parseInt(m));
  return format(d, "h:mm a");
};

const Events = () => {
  const [dbEvents, setDbEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [rsvpId, setRsvpId] = useState<string | null>(null);
  const [userRsvps, setUserRsvps] = useState<Record<string, string>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const auth = useAuth();
  const user = auth?.user ?? null;
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from("events").select("*").gte("event_date", new Date().toISOString().split("T")[0]).order("event_date");
        if (error) throw error;
        setDbEvents(data || []);
        if (data?.length) {
          const { data: rsvps } = await supabase.from("event_rsvps").select("event_id").in("event_id", data.map(e => e.id)).in("status", ["attending", "confirmed"]);
          if (rsvps) {
            const c: Record<string, number> = {};
            rsvps.forEach(r => { c[r.event_id] = (c[r.event_id] || 0) + 1; });
            setCounts(c);
          }
        }
      } catch { /* fall back to sample */ }
      setLoading(false);
    })();
    if (user) {
      supabase.from("event_rsvps").select("event_id, status").eq("user_id", user.id).then(({ data }) => {
        if (data) {
          const m: Record<string, string> = {};
          data.forEach(r => { m[r.event_id] = r.status; });
          setUserRsvps(m);
        }
      });
    }
  }, [user]);

  const handleRsvp = async (status: string) => {
    if (!user || !rsvpId) { toast({ title: "Sign in required", variant: "destructive" }); return; }
    await supabase.from("event_rsvps").upsert({ event_id: rsvpId, user_id: user.id, status });
    setUserRsvps(p => ({ ...p, [rsvpId]: status }));
    toast({ title: status === "attending" ? "You're going! 🎉" : status === "maybe" ? "Marked as maybe" : "Noted!" });
    setRsvpId(null);
  };

  const all = dbEvents.length > 0 ? dbEvents : SAMPLE;
  const filtered = category === "All" ? all : all.filter(e => (e as any).event_type === category);
  const featured = all[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader /><DesktopNav /><BottomNav />
        <main className="md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
          <div className="max-w-6xl mx-auto px-5 py-8"><PageSkeleton variant="cards" count={6} /></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader /><DesktopNav /><BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-6">
          {/* FEATURED */}
          {featured && (
            <Card className="overflow-hidden mb-8 group cursor-pointer hover:shadow-lg transition-all border-border/30">
              <div className="relative h-56 md:h-72 overflow-hidden">
                <img src={(featured as any)._img || featured.image_url || wnbaImg} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <Badge className="bg-primary text-primary-foreground text-[10px] font-bold tracking-wider rounded-sm mb-2">Featured Event</Badge>
                  <h2 className="text-card font-condensed text-3xl font-bold uppercase">{featured.title}</h2>
                  <div className="flex items-center gap-4 text-card/70 text-sm mt-2 font-sans">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(new Date(featured.event_date), "MMM d, yyyy")}</span>
                    {featured.event_time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{fmtTime(featured.event_time)}</span>}
                    {(featured.venue_name || featured.city) && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{featured.venue_name || featured.city}</span>}
                  </div>
                  <Button className="rounded-full mt-4" onClick={() => setRsvpId(featured.id)}>RSVP Now</Button>
                </div>
              </div>
            </Card>
          )}

          {/* CATEGORY CHIPS */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 -mx-5 px-5 mb-6">
            {CATEGORIES.map(c => (
              <Badge
                key={c}
                variant={category === c ? "default" : "outline"}
                className={`cursor-pointer px-5 py-2.5 text-sm rounded-full whitespace-nowrap transition-all ${category === c ? "bg-primary text-primary-foreground" : "hover:bg-secondary/50"}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </Badge>
            ))}
          </div>

          {/* EVENTS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(ev => {
              const img = (ev as any)._img || ev.image_url;
              const ct = counts[ev.id] || (ev as any)._count || 0;
              const host = (ev as any)._host || "Loverball";
              const rsvp = userRsvps[ev.id];

              return (
                <Card key={ev.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all border-border/30">
                  <div className="relative h-44 overflow-hidden">
                    {img ? (
                      <img src={img} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Calendar className="w-10 h-10 text-primary/30" />
                      </div>
                    )}
                    {ev.event_type && <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold tracking-wider rounded-sm">{ev.event_type}</Badge>}
                    {ev.price === 0 && <Badge className="absolute top-3 right-3 bg-success text-success-foreground text-[10px] font-bold rounded-sm">Free</Badge>}
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors font-sans">{ev.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-sans">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(ev.event_date), "MMM d")}</span>
                      {ev.event_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtTime(ev.event_time)}</span>}
                    </div>
                    {(ev.venue_name || ev.city) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 font-sans"><MapPin className="w-3 h-3" />{ev.venue_name}{ev.venue_name && ev.city ? ", " : ""}{ev.city}</p>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{host.charAt(0)}</div>
                        <span className="text-xs text-muted-foreground font-sans">{host}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5 font-sans"><Users className="w-3 h-3" />{ct}{ev.capacity ? `/${ev.capacity}` : ""}</span>
                      </div>
                      {rsvp ? (
                        <Badge variant="outline" className="text-[10px] rounded-full capitalize">{rsvp}</Badge>
                      ) : (
                        <Button size="sm" className="rounded-full text-xs h-8 px-4" onClick={e => { e.stopPropagation(); setRsvpId(ev.id); }}>RSVP</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* RSVP MODAL */}
        <Dialog open={!!rsvpId} onOpenChange={() => setRsvpId(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-condensed text-xl uppercase">RSVP</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Button className="w-full rounded-full" onClick={() => handleRsvp("attending")}>✅ Going</Button>
              <Button variant="outline" className="w-full rounded-full" onClick={() => handleRsvp("maybe")}>🤔 Maybe</Button>
              <Button variant="ghost" className="w-full rounded-full" onClick={() => setRsvpId(null)}>❌ Can't Make It</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Events;
