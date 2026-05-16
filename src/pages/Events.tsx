import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, MapPin, Users, Clock, Loader2, PlusCircle, Send } from "lucide-react";
import EventTagBadges from "@/components/EventTagBadges";
import SponsorCard from "@/components/SponsorCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import AttendeeProfileDrawer from "@/components/AttendeeProfileDrawer";
import EventSubmissionForm from "@/components/EventSubmissionForm";
import Seo from "@/components/Seo";

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
  event_tags?: string[] | null;
}

type SceneVariant = "external" | "hosted" | "cultural";
const variantMap: Record<string, SceneVariant> = {
  game: "external",
  watch_party: "external",
  networking: "hosted",
  brunch: "hosted",
  party: "hosted",
  panel: "cultural",
  salon: "cultural",
  other: "cultural",
};
const getVariant = (t?: string | null): SceneVariant => (t && variantMap[t]) || "cultural";
const sceneTheme: Record<SceneVariant, { bg: string; text: string; badge: string; eyebrow: string; label: string }> = {
  external: {
    bg: "bg-foreground",
    text: "text-background",
    badge: "bg-background text-foreground",
    eyebrow: "text-background/70",
    label: "Broadcast",
  },
  hosted: {
    bg: "bg-primary",
    text: "text-primary-foreground",
    badge: "bg-primary-foreground text-primary",
    eyebrow: "text-primary-foreground/80",
    label: "Hosted",
  },
  cultural: {
    bg: "bg-[hsl(173_58%_39%)]",
    text: "text-white",
    badge: "bg-white text-[hsl(173_58%_39%)]",
    eyebrow: "text-white/80",
    label: "Cultural",
  },
};

const fmtTime = (t: string) => {
  const [h, m] = t.split(":");
  const d = new Date();
  d.setHours(parseInt(h), parseInt(m));
  return format(d, "h:mm a");
};

interface AttendeeProfile {
  id: string;
  name: string;
  profile_photo_url: string | null;
  bio: string | null;
  favorite_sports?: string[] | null;
  primary_role?: string | null;
  city?: string | null;
}

const Events = () => {
  const goTo = (path: string) => { window.location.href = path; };
  const [gateOpen, setGateOpen] = useState(false);
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [rsvpId, setRsvpId] = useState<string | null>(null);
  const [userRsvps, setUserRsvps] = useState<Record<string, string>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [eventAttendees, setEventAttendees] = useState<Record<string, AttendeeProfile[]>>({});
  const [selectedProfile, setSelectedProfile] = useState<AttendeeProfile | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [isApprovedCreator, setIsApprovedCreator] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [gateEventId, setGateEventId] = useState<string | null>(null);
  const openGate = (id: string) => {
    sessionStorage.setItem("postAuthRedirect", `/event/${id}`);
    setGateEventId(id);
    setGateOpen(true);
  };
  const openTile = (id: string) => {
    if (user) goTo(`/event/${id}`);
    else openGate(id);
  };
  const requestRsvp = (id: string) => {
    if (user) setRsvpId(id);
    else openGate(id);
  };

  // Check if user is an approved creator/team/org account
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("creator_channels")
        .select("id")
        .eq("owner_user_id", user.id)
        .eq("status", "active")
        .limit(1);
      setIsApprovedCreator(!!data && data.length > 0);
    })();
  }, [user]);

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
          const eventIds = data.map(e => e.id);
          const { data: rsvps } = await supabase
            .from("event_rsvps")
            .select("event_id")
            .in("event_id", eventIds)
            .in("status", ["attending", "confirmed"]);
          if (rsvps) {
            const c: Record<string, number> = {};
            rsvps.forEach(r => { c[r.event_id] = (c[r.event_id] || 0) + 1; });
            setCounts(c);
          }

          // Fetch attendee avatars for each event (up to 4 per event)
          const { data: guests } = await supabase
            .from("event_guests")
            .select(`
              event_id,
              user_id,
              profile:profiles!inner (
                id, name, profile_photo_url, bio, favorite_sports, primary_role, city
              )
            `)
            .in("event_id", eventIds)
            .eq("status", "going")
            .limit(200);

          if (guests) {
            const byEvent: Record<string, AttendeeProfile[]> = {};
            (guests as any[]).forEach((g) => {
              if (!g.profile) return;
              if (!byEvent[g.event_id]) byEvent[g.event_id] = [];
              if (byEvent[g.event_id].length < 4) {
                byEvent[g.event_id].push({
                  id: g.profile.id,
                  name: g.profile.name,
                  profile_photo_url: g.profile.profile_photo_url,
                  bio: g.profile.bio,
                  favorite_sports: g.profile.favorite_sports,
                  primary_role: g.profile.primary_role,
                  city: g.profile.city,
                });
              }
            });
            setEventAttendees(byEvent);
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
      <Seo
        title="The Scene — Women's Sports Events | Loverball"
        description="Watch parties, game days, panels, brunches, and networking meetups for women's sports fans. Discover upcoming Loverball events."
        path="/events"
      />
      <MobileHeader /><DesktopNav /><BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 md:px-10 py-6">
          <div className="flex items-end justify-between mb-6">
            <div>
              <span className="mag-eyebrow text-raspberry" style={{ transform: "rotate(-2deg)", display: "inline-block" }}>Curated for you</span>
              <h1 className="mag-title text-foreground" style={{ fontSize: "clamp(48px, 14vw, 72px)", marginTop: 4 }}>
                The Scene
              </h1>
            </div>
            {user && isApprovedCreator && (
              <Button className="rounded-full gap-2" onClick={() => setShowSubmitForm(true)}>
                <PlusCircle className="w-4 h-4" /> Submit
              </Button>
            )}
          </div>

          {/* Apply to Post CTA for non-approved users */}
          {user && !isApprovedCreator && (
            <Card className="mb-6 border-dashed border-primary/30 bg-primary/5">
              <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Want to post an event?</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Team, creator, and organization accounts can submit events for review. Apply to become an approved account to start posting.
                  </p>
                </div>
                <Button variant="outline" className="rounded-full gap-2 whitespace-nowrap" onClick={() => window.location.href = "/auth?apply=creator"}>
                  <Send className="w-3.5 h-3.5" /> Apply to Post
                </Button>
              </CardContent>
            </Card>
          )}

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
          {featured && (() => {
            const v = getVariant(featured.event_type);
            const th = sceneTheme[v];
            return (
            <Card className={`overflow-hidden mb-8 group cursor-pointer hover:shadow-lg transition-all border-none ${th.bg} ${th.text}`}
              onClick={() => openTile(featured.id)}>
              <div className="relative h-56 md:h-72 overflow-hidden">
                {featured.image_url ? (
                  <>
                    <img src={featured.image_url} alt={featured.title} loading="eager" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                    <div className={`absolute inset-0 ${th.bg} mix-blend-multiply opacity-60`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  </>
                ) : (
                  <div className={`w-full h-full ${th.bg}`} />
                )}
                <div className="absolute top-4 left-4">
                  <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${th.eyebrow}`}>{th.label} · {CATEGORY_LABELS[featured.event_type || ""] || featured.event_type}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                  <Badge className={`${th.badge} text-[10px] font-semibold tracking-wider rounded-full mb-2`}>Featured Event</Badge>
                  <h2 className={`font-display text-2xl md:text-3xl font-bold uppercase ${th.text}`}>{featured.title}</h2>
                  <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm mt-2 ${th.eyebrow}`}>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(new Date(featured.event_date), "MMM d, yyyy")}</span>
                    {featured.event_time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{fmtTime(featured.event_time)}</span>}
                    {(featured.venue_name || featured.city) && <span className="flex items-center gap-1 truncate max-w-[180px]"><MapPin className="w-3.5 h-3.5 flex-shrink-0" />{featured.venue_name || featured.city}</span>}
                  </div>
                  <Button className={`rounded-full mt-4 ${th.badge} hover:opacity-90`} onClick={e => { e.stopPropagation(); requestRsvp(featured.id); }}>{user ? "RSVP Now" : "Sign Up to RSVP"}</Button>
                </div>
              </div>
            </Card>
            );
          })()}

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
            <div className="text-center py-20 space-y-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="w-12 h-12 text-primary/40" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {tab === "upcoming" ? "No upcoming events" : "No past events"}
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {tab === "upcoming"
                  ? "New events are added regularly. Check back soon or follow us to get notified!"
                  : "Past event recaps will appear here after events conclude."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((ev, idx) => {
                const ct = counts[ev.id] || 0;
                const rsvp = userRsvps[ev.id];
                const spotsLeft = ev.capacity ? ev.capacity - ct : null;
                const cardIndex = idx + 1;
                const sponsorSlot = cardIndex > 0 && cardIndex % 5 === 0;

                const v = getVariant(ev.event_type);
                const th = sceneTheme[v];

                return (
                  <React.Fragment key={ev.id}>
                    <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all border-none"
                      onClick={() => openTile(ev.id)}>
                      <div className={`relative h-44 overflow-hidden ${th.bg}`}>
                        {ev.image_url ? (
                          <>
                            <img src={ev.image_url} alt={ev.title} loading="lazy" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                            <div className={`absolute inset-0 ${th.bg} mix-blend-multiply opacity-50`} />
                          </>
                        ) : (
                          <div className={`absolute inset-0 flex items-center justify-center ${th.text}`}>
                            <Calendar className="w-10 h-10 opacity-50" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <Badge className={`${th.badge} text-[10px] font-semibold tracking-wider rounded-full`}>{th.label}</Badge>
                          {ev.event_type && <span className={`text-[10px] font-semibold tracking-wider uppercase ${th.text} drop-shadow`}>{CATEGORY_LABELS[ev.event_type] || ev.event_type}</span>}
                        </div>
                        {ev.price === 0 && <Badge className={`absolute top-3 right-3 ${th.badge} text-[10px] font-semibold rounded-full`}>Free</Badge>}
                        <div className="absolute bottom-3 right-3">
                          <span className={`font-display text-4xl font-bold drop-shadow-lg ${th.text}`}>{format(new Date(ev.event_date), "d")}</span>
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
                        {user ? (
                          <>
                            {ev.event_tags && ev.event_tags.length > 0 && (
                              <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                                <EventTagBadges tags={ev.event_tags} size="sm" />
                              </div>
                            )}
                            {/* Attendee avatars */}
                            {eventAttendees[ev.id]?.length > 0 && (
                              <div className="flex items-center gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
                                <div className="flex -space-x-1.5">
                                  {eventAttendees[ev.id].slice(0, 4).map((attendee) => (
                                    <button
                                      key={attendee.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedProfile(attendee);
                                        setDrawerOpen(true);
                                      }}
                                      className="hover:z-10 transition-transform hover:scale-110"
                                    >
                                      <Avatar className="w-7 h-7 border-2 border-background">
                                        <AvatarImage src={attendee.profile_photo_url || undefined} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                          {attendee.name?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                    </button>
                                  ))}
                                </div>
                                {ct > 4 && (
                                  <span className="text-[10px] text-muted-foreground ml-1">+{ct - 4}</span>
                                )}
                              </div>
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
                          </>
                        ) : (
                          <div className="pt-2 flex items-center justify-between gap-2">
                            <p className="text-[11px] text-muted-foreground leading-snug">Sign up to see who's going & RSVP</p>
                            <Button size="sm" className="rounded-full text-xs h-8 px-4 bg-primary text-primary-foreground" onClick={e => { e.stopPropagation(); openGate(ev.id); }}>Unlock</Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    {/* Sponsor slot every 5th card */}
                    {sponsorSlot && <SponsorCard index={Math.floor(cardIndex / 5) - 1} />}
                  </React.Fragment>
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

        {/* Attendee Profile Drawer */}
        <AttendeeProfileDrawer
          profile={selectedProfile}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />

        {/* Event Submission Form */}
        <EventSubmissionForm open={showSubmitForm} onOpenChange={setShowSubmitForm} />

        {/* SIGNUP GATE */}
        <Dialog open={gateOpen} onOpenChange={setGateOpen}>
          <DialogContent className="sm:max-w-md text-center">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl uppercase tracking-tight">Your people are already here</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sign up in seconds to see who's going, join the event chat, and meet other women going.
              </p>
              <div className="space-y-2 pt-2">
                <Button className="w-full rounded-full bg-primary text-primary-foreground h-11" onClick={() => goTo('/signup')}>
                  Sign Up — It's Free
                </Button>
                <Button variant="outline" className="w-full rounded-full h-11" onClick={() => goTo(`/auth?redirect=${encodeURIComponent(gateEventId ? `/event/${gateEventId}` : '/events')}`)}>
                  I already have an account
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
};

export default Events;
