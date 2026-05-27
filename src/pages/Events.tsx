import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock, Loader2, PlusCircle, Send, Search, Share2, Copy, Link2 } from "lucide-react";
import EventTagBadges from "@/components/EventTagBadges";
import SponsorCard from "@/components/SponsorCard";
import RsvpAvatarBar from "@/components/RsvpAvatarBar";
import SharePreview from "@/components/SharePreview";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import { Input } from "@/components/ui/input";
import AttendeeProfileDrawer from "@/components/AttendeeProfileDrawer";
import EventSubmissionForm from "@/components/EventSubmissionForm";
import Seo from "@/components/Seo";
import EditorialMasthead from "@/components/layout/EditorialMasthead";


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

type EventVariant = "external" | "hosted" | "cultural";
const variantMap: Record<string, EventVariant> = {
  game: "external",
  watch_party: "external",
  networking: "hosted",
  brunch: "hosted",
  party: "hosted",
  panel: "cultural",
  salon: "cultural",
  other: "cultural",
};
const getVariant = (t?: string | null): EventVariant => (t && variantMap[t]) || "cultural";
const eventTheme: Record<EventVariant, { accent: string; label: string }> = {
  external: { accent: "#F04E23", label: "Broadcast" },
  hosted:   { accent: "#E86BB0", label: "Hosted" },
  cultural: { accent: "#F8F8F8", label: "Cultural" },
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
  const [searchQuery, setSearchQuery] = useState("");

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
  // Events move to "past" 24 hours after their event_date
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const upcomingEvents = events.filter(e => new Date(e.event_date) >= cutoff);
  const pastEvents = events.filter(e => new Date(e.event_date) < cutoff).reverse();

  const baseEvents = tab === "upcoming" ? upcomingEvents : pastEvents;
  const categoryFiltered = category === "All" ? baseEvents : baseEvents.filter(e => e.event_type === category);
  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? categoryFiltered.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.city && e.city.toLowerCase().includes(q)) ||
        (e.venue_name && e.venue_name.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.sport_tags && e.sport_tags.some((t: string) => t.toLowerCase().includes(q))) ||
        (e.event_tags && e.event_tags.some((t: string) => t.toLowerCase().includes(q)))
      )
    : categoryFiltered;

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
        <BottomNav />
        <main className="pb-20 md:pb-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Events — Women's Sports Events | Loverball"
        description="Watch parties, game days, panels, brunches, and networking meetups for women's sports fans. Discover upcoming Loverball events."
        path="/events"
      />
      <DesktopNav />
      <BottomNav />

      <main className="pb-24 md:pb-0">
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-8">
          <EditorialMasthead
            section="Events"
            meta={`${upcomingEvents.length} on deck`}
            eyebrow="selectively assembled"
            title="Events"
            size="lg"
            rightSlot={
              user && isApprovedCreator ? (
                <Button
                  className="rounded-full gap-2 h-10 px-5"
                  style={{
                    background: "hsl(var(--primary))",
                    color: "hsl(var(--primary-foreground))",
                    fontFamily: "'Space Mono', ui-monospace, monospace",
                    fontWeight: 400,
                    letterSpacing: "0.16em",
                    fontSize: 11,
                    textTransform: "uppercase",
                  }}
                  onClick={() => setShowSubmitForm(true)}
                >
                  <PlusCircle className="w-4 h-4" /> Submit
                </Button>
              ) : undefined
            }
          />


          {/* TABS */}
          <div className="flex gap-1 mb-7 p-1 w-fit rounded-full"
            style={{ background: "rgba(20,20,21,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { k: "upcoming" as const, label: "Upcoming" },
              { k: "past" as const, label: "Past" },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className="px-5 py-2 rounded-full transition-all"
                style={{
                  background: tab === t.k ? "#F04E23" : "transparent",
                  color: tab === t.k ? "#E6F25A" : "rgba(248,248,248,0.6)",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="mb-7 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search events, cities, venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 rounded-full bg-muted/60 border-border/20 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/40"
              style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14 }}
            />
          </div>

          {/* FEATURED — cinematic */}
          {featured && (() => {
            const th = eventTheme[getVariant(featured.event_type)];
            const d = new Date(featured.event_date);
            return (
              <div
                className="relative overflow-hidden mb-10 cursor-pointer group rounded-[24px]"
                style={{ background: "#141415", border: "1px solid rgba(255,255,255,0.08)" }}
                onClick={() => openTile(featured.id)}
              >
                <div className="relative h-72 md:h-[420px] overflow-hidden">
                  {featured.image_url ? (
                    <img src={featured.image_url} alt={featured.title} loading="eager"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${th.accent}, #141415)` }} />
                  )}
                  {/* layered overlays */}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,10,11,0.35) 0%, rgba(10,10,11,0.15) 40%, rgba(10,10,11,0.92) 100%)" }} />
                  <div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 30% 20%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)" }} />

                  {/* eyebrow */}
                  <div className="absolute top-5 left-5 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(232,107,176,0.15)", border: "1px solid rgba(232,107,176,0.5)", color: "#E86BB0", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                      {th.label}
                    </span>
                    <span style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: "0.18em", color: "rgba(248,248,248,0.7)", textTransform: "uppercase" }}>
                      · Featured
                    </span>
                  </div>

                  {/* Date stamp — strong treatment */}
                  <div className="absolute top-5 right-5 text-right">
                    <div style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: "0.22em", color: "#E6F25A", textTransform: "uppercase" }}>
                      {format(d, "EEE")}
                    </div>
                    <div style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 56, lineHeight: 0.85, color: "#F8F8F8" }}>
                      {format(d, "dd")}
                    </div>
                    <div style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: "0.22em", color: "#E6F25A", textTransform: "uppercase" }}>
                      {format(d, "MMM yyyy")}
                    </div>
                  </div>

                  {/* Bottom block */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                    <h2 className="line-clamp-2"
                      style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: "clamp(28px, 6vw, 44px)", lineHeight: 0.95, color: "#E6F25A", textTransform: "uppercase", letterSpacing: "0.005em", margin: 0, textShadow: "0 2px 16px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.95)" }}>
                      {featured.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3"
                      style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 11, color: "rgba(248,248,248,0.7)", letterSpacing: "0.04em" }}>
                      {featured.event_time && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{fmtTime(featured.event_time)}</span>}
                      {(featured.venue_name || featured.city) && <span className="flex items-center gap-1.5 truncate max-w-[220px]"><MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#E86BB0" }} />{featured.venue_name || featured.city}</span>}
                      {counts[featured.id] > 0 && <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{counts[featured.id]} going</span>}
                    </div>
                    <Button
                      className="rounded-full mt-5 h-11 px-6"
                      style={{ background: "#F04E23", color: "#fff", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}
                      onClick={e => { e.stopPropagation(); requestRsvp(featured.id); }}
                    >
                      {user ? "RSVP Now" : "Sign Up to RSVP"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* CATEGORY CHIPS */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 -mx-5 px-5 mb-7">
            {CATEGORIES.map(c => {
              const active = category === c;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className="px-4 py-2 rounded-full whitespace-nowrap transition-all"
                  style={{
                    background: active ? "#F8F8F8" : "rgba(20,20,21,0.6)",
                    color: active ? "#0A0A0B" : "rgba(248,248,248,0.7)",
                    border: active ? "1px solid #F8F8F8" : "1px solid rgba(255,255,255,0.08)",
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {CATEGORY_LABELS[c] || c}
                </button>
              );
            })}
          </div>

          {/* EVENTS GRID */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 space-y-4 rounded-3xl"
              style={{ background: "#141415", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
                style={{ background: "rgba(240,78,35,0.1)", border: "1px solid rgba(240,78,35,0.25)" }}>
                <Calendar className="w-9 h-9" style={{ color: "#F04E23" }} />
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 500, fontSize: 28, color: "#E6F25A", letterSpacing: "-0.02em", margin: 0 }}>
                {searchQuery.trim()
                  ? "No events match your search"
                  : tab === "upcoming" ? "No upcoming events" : "No past events"}
              </h2>
              <p className="max-w-sm mx-auto"
                style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 14, color: "rgba(248,248,248,0.55)" }}>
                {searchQuery.trim()
                  ? "Try a different keyword or city."
                  : tab === "upcoming"
                    ? "Curated invitations drop weekly. Stay close."
                    : "Recaps will appear here after the lights come up."}
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
                const th = eventTheme[getVariant(ev.event_type)];
                const d = new Date(ev.event_date);

                return (
                  <React.Fragment key={ev.id}>
                    <article
                      className="overflow-hidden cursor-pointer group rounded-[22px] transition-all"
                      style={{ background: "#1A1A1C", border: "1px solid rgba(255,255,255,0.08)" }}
                      onClick={() => openTile(ev.id)}
                    >
                      {/* Cinematic header w/ date stamp */}
                      <div className="relative h-44 overflow-hidden">
                        {ev.image_url ? (
                          <img src={ev.image_url} alt={ev.title} loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${th.accent}40, #141415)` }} />
                        )}
                        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,10,11,0.1) 0%, rgba(10,10,11,0.55) 100%)" }} />

                        {/* Eyebrow */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(232,107,176,0.15)", border: "1px solid rgba(232,107,176,0.5)", color: "#E86BB0", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700, fontSize: 8.5, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                            {th.label}
                          </span>
                          {ev.price === 0 && (
                            <span className="px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(248,248,248,0.92)", color: "#0A0A0B", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800, fontSize: 8.5, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                              Free
                            </span>
                          )}
                        </div>

                        {/* Date block */}
                        <div className="absolute bottom-3 left-3 px-2.5 py-1.5 rounded-lg text-center"
                          style={{ background: "rgba(10,10,11,0.78)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}>
                          <div style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 9, letterSpacing: "0.18em", color: "#E6F25A", textTransform: "uppercase" }}>
                            {format(d, "MMM")}
                          </div>
                          <div style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 24, lineHeight: 0.9, color: "#F8F8F8" }}>
                            {format(d, "dd")}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <h3 className="line-clamp-2"
                          style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 18, lineHeight: 1.05, color: "#E6F25A", textTransform: "uppercase", letterSpacing: "0.01em", margin: 0 }}>
                          {ev.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1"
                          style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 10, color: "rgba(248,248,248,0.55)", letterSpacing: "0.04em" }}>
                          {ev.event_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtTime(ev.event_time)}</span>}
                          {(ev.venue_name || ev.city) && (
                            <span className="flex items-center gap-1 truncate max-w-[180px]">
                              <MapPin className="w-3 h-3" style={{ color: "#E86BB0" }} />
                              {ev.venue_name}{ev.venue_name && ev.city ? ", " : ""}{ev.city}
                            </span>
                          )}
                        </div>

                        {user ? (
                          <>
                            {ev.event_tags && ev.event_tags.length > 0 && (
                              <div onClick={(e) => e.stopPropagation()}>
                                <EventTagBadges tags={ev.event_tags} size="sm" />
                              </div>
                            )}
                            {/* RSVP Avatar Bar — social proof */}
                            <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                              <RsvpAvatarBar
                                attendees={eventAttendees[ev.id] || []}
                                totalCount={ct}
                                size="sm"
                                maxAvatars={5}
                                onAvatarClick={(attendee) => {
                                  setSelectedProfile({ ...attendee, bio: null });
                                  setDrawerOpen(true);
                                }}
                                onViewAllClick={() => openTile(ev.id)}
                              />
                            </div>
                            <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                              <span className="flex items-center gap-1"
                                style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 10, color: "rgba(248,248,248,0.5)", letterSpacing: "0.04em" }}>
                                <Users className="w-3 h-3" />{ct}{ev.capacity ? `/${ev.capacity}` : ""}
                              </span>
                              {rsvp ? (
                                <span className="px-3 py-1 rounded-full capitalize"
                                  style={{ background: rsvp === "attending" ? "rgba(240,78,35,0.15)" : "rgba(255,255,255,0.06)", color: rsvp === "attending" ? "#F04E23" : "rgba(248,248,248,0.6)", border: rsvp === "attending" ? "1px solid rgba(240,78,35,0.35)" : "1px solid rgba(255,255,255,0.08)", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                  {rsvp === "attending" ? "Going ✓" : rsvp}
                                </span>
                              ) : (
                                <Button size="sm" className="rounded-full h-8 px-4"
                                  style={{ background: "#F04E23", color: "#fff", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}
                                  onClick={e => { e.stopPropagation(); setRsvpId(ev.id); }}>
                                  RSVP
                                </Button>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="pt-2 flex items-center justify-between gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                            <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 12, color: "rgba(248,248,248,0.55)", margin: 0 }}>
                              Sign up to see who's going
                            </p>
                            <Button size="sm" className="rounded-full h-8 px-4"
                              style={{ background: "transparent", color: "#F04E23", border: "1px solid rgba(240,78,35,0.4)", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}
                              onClick={e => { e.stopPropagation(); openGate(ev.id); }}>
                              Unlock
                            </Button>
                          </div>
                        )}
                      </div>
                    </article>
                    {sponsorSlot && <SponsorCard index={Math.floor(cardIndex / 5) - 1} />}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* RSVP MODAL */}
        <Dialog open={!!rsvpId} onOpenChange={() => setRsvpId(null)}>
          <DialogContent className="sm:max-w-sm rounded-3xl" style={{ background: "#141415", border: "1px solid rgba(255,255,255,0.08)" }}>
            <DialogHeader>
              <span style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: "0.22em", color: "#E6F25A", textTransform: "uppercase" }}>
                Confirm your seat
              </span>
              <DialogTitle style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 30, lineHeight: 0.95, color: "#E6F25A", textTransform: "uppercase", letterSpacing: "0.01em", marginTop: 4 }}>
                RSVP
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2.5 pt-3">
              <Button className="w-full rounded-full h-11"
                style={{ background: "#F04E23", color: "#fff", fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}
                onClick={() => handleRsvp("attending")}>Going</Button>
              <Button className="w-full rounded-full h-11"
                style={{ background: "transparent", color: "#F8F8F8", border: "1px solid rgba(255,255,255,0.12)", fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}
                onClick={() => handleRsvp("maybe")}>Maybe</Button>
              <Button variant="ghost" className="w-full rounded-full h-11"
                style={{ color: "rgba(248,248,248,0.5)", fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}
                onClick={() => handleRsvp("not_going")}>Can't Make It</Button>
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
              <DialogTitle className="font-display text-2xl uppercase tracking-tight" style={{ color: "#E6F25A" }}>Your people are already here</DialogTitle>
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
