import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";

const CATEGORIES = ["All", "watch_party", "game", "panel", "brunch", "networking", "other"];
const CATEGORY_LABELS: Record<string, string> = {
  All: "All",
  watch_party: "Watch Parties",
  game: "Game Days",
  panel: "Panels",
  brunch: "Brunches",
  networking: "Networking",
  other: "Other",
};

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

const fmtTime = (t: string) => {
  const [h, m] = t.split(":");
  const d = new Date();
  d.setHours(parseInt(h), parseInt(m));
  return format(d, "h:mm a");
};

const Events = () => {
  const goTo = (path: string) => { window.location.href = path; };
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [rsvpId, setRsvpId] = useState<string | null>(null);
  const [userRsvps, setUserRsvps] = useState<Record<string, string>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("status", "published")
          .order("event_date");
        if (error) throw error;
        setEvents(data || []);

        if (data?.length) {
          const { data: rsvps } = await supabase
            .from("event_rsvps")
            .select("event_id")
            .in("event_id", data.map(e => e.id))
            .in("status", ["attending", "confirmed"]);
          if (rsvps) {
            const c: Record<string, number> = {};
            rsvps.forEach(r => { c[r.event_id] = (c[r.event_id] || 0) + 1; });
            setCounts(c);
          }
        }
      } catch (err) {
        // Events fetch error handled silently
      }
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
    await supabase.from("event_rsvps").upsert(
      { event_id: rsvpId, user_id: user.id, status },
      { onConflict: "event_id,user_id" }
    );
    setUserRsvps(p => ({ ...p, [rsvpId]: status }));
    if (status === "attending") setCounts(p => ({ ...p, [rsvpId]: (p[rsvpId] || 0) + 1 }));
    toast({ title: status === "attending" ? "You're going! 🎉" : status === "maybe" ? "Marked as maybe" : "Noted!" });
    setRsvpId(null);
  };

  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const upcomingEvents = events.filter(e => e.event_date >= todayStr);
  const pastEvents = events.filter(e => e.event_date < todayStr).reverse();

  const baseEvents = tab === "upcoming" ? upcomingEvents : pastEvents;
  const filtered = category === "All" ? baseEvents : baseEvents.filter(e => e.event_type === category);

  const featured = tab === "upcoming" && upcomingEvents.length
    ? upcomingEvents.reduce((closest, ev) => {
        const diff = Math.abs(new Date(ev.event_date).getTime() - now.getTime());
        const closestDiff = Math.abs(new Date(closest.event_date).getTime() - now.getTime());
        return diff < closestDiff ? ev : closest;
      })
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader /><DesktopNav /><BottomNav />
        <main className="md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader /><DesktopNav /><BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-6">
          <h1 className="font-display text-2xl md:text-[28px] font-bold uppercase tracking-tight mb-4">Events</h1>

          {/* TABS */}
          <div className="flex gap-1 mb-6 bg-secondary rounded-full p-1 w-fit">
            <button
              onClick={() => setTab("upcoming")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${tab === "upcoming" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setTab("past")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${tab === "past" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Past Events
            </button>
          </div>

          {/* FEATURED */}
          {featured && (
            <Card className="overflow-hidden mb-8 group cursor-pointer hover:shadow-lg transition-all"
              onClick={() => goTo(`/event/${featured.id}`)}>
              <div className="relative h-56 md:h-72 overflow-hidden">
                {featured.image_url ? (
                  <img src={featured.image_url} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold tracking-wider rounded-full mb-2">Featured Event</Badge>
                  <h2 className="text-white font-display text-2xl md:text-3xl font-bold uppercase">{featured.title}</h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/70 text-xs sm:text-sm mt-2">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(new Date(featured.event_date), "MMM d, yyyy")}</span>
                    {featured.event_time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{fmtTime(featured.event_time)}</span>}
                    {(featured.venue_name || featured.city) && <span className="flex items-center gap-1 truncate max-w-[180px]"><MapPin className="w-3.5 h-3.5 text-accent flex-shrink-0" />{featured.venue_name || featured.city}</span>}
                  </div>
                  <Button className="rounded-full mt-4 bg-primary text-primary-foreground" onClick={e => { e.stopPropagation(); setRsvpId(featured.id); }}>RSVP Now</Button>
                </div>
              </div>
            </Card>
          )}

          {/* CATEGORY CHIPS */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 -mx-5 px-5 mb-6">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  category === c 
                    ? "bg-primary text-primary-foreground" 
                    : "border border-foreground/20 text-foreground hover:bg-secondary"
                }`}
              >
                {CATEGORY_LABELS[c] || c}
              </button>
            ))}
          </div>

          {/* EVENTS GRID */}
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No events in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(ev => {
                const ct = counts[ev.id] || 0;
                const rsvp = userRsvps[ev.id];
                const spotsLeft = ev.capacity ? ev.capacity - ct : null;

                return (
                  <Card key={ev.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => goTo(`/event/${ev.id}`)}>
                    <div className="relative h-44 overflow-hidden">
                      {ev.image_url ? (
                        <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <Calendar className="w-10 h-10 text-primary/30" />
                        </div>
                      )}
                      {ev.event_type && <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground text-[10px] font-semibold tracking-wider rounded-full">{CATEGORY_LABELS[ev.event_type] || ev.event_type}</Badge>}
                      {ev.price === 0 && <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full">Free</Badge>}
                      {/* Large date number */}
                      <div className="absolute bottom-3 right-3">
                        <span className="font-display text-4xl font-bold text-white drop-shadow-lg">{format(new Date(ev.event_date), "d")}</span>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">{ev.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(ev.event_date), "MMM d")}</span>
                        {ev.event_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtTime(ev.event_time)}</span>}
                      </div>
                      {(ev.venue_name || ev.city) && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3 text-accent" />{ev.venue_name}{ev.venue_name && ev.city ? ", " : ""}{ev.city}</p>
                      )}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" />{ct}{ev.capacity ? `/${ev.capacity}` : ""}
                          {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 5 && (
                            <span className="text-destructive ml-1">({spotsLeft} left!)</span>
                          )}
                        </span>
                        {rsvp ? (
                          <Badge variant="outline" className="text-[10px] rounded-full capitalize text-muted-foreground">{rsvp}</Badge>
                        ) : (
                          <Button size="sm" className="rounded-full text-xs h-8 px-4 bg-primary text-primary-foreground" onClick={e => { e.stopPropagation(); setRsvpId(ev.id); }}>RSVP</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* RSVP MODAL */}
        <Dialog open={!!rsvpId} onOpenChange={() => setRsvpId(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display text-xl uppercase">RSVP</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Button className="w-full rounded-full bg-primary text-primary-foreground" onClick={() => handleRsvp("attending")}>✅ Going</Button>
              <Button variant="outline" className="w-full rounded-full" onClick={() => handleRsvp("maybe")}>🤔 Maybe</Button>
              <Button variant="ghost" className="w-full rounded-full" onClick={() => handleRsvp("not_going")}>❌ Can't Make It</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Events;
