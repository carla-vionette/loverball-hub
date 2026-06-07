import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock, Loader2, PlusCircle, Send, Search, Share2, Copy, Link2, Mail, Smartphone } from "lucide-react";
import EventTagBadges from "@/components/EventTagBadges";
import SponsorCard from "@/components/SponsorCard";
import RsvpAvatarBar from "@/components/RsvpAvatarBar";
import SharePreview from "@/components/SharePreview";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { parseEventDate } from "@/lib/eventDate";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DesktopNav from "@/components/DesktopNav";
import { Input } from "@/components/ui/input";
import AttendeeProfileDrawer from "@/components/AttendeeProfileDrawer";
import EventSubmissionForm from "@/components/EventSubmissionForm";
import Seo from "@/components/Seo";
import EditorialMasthead from "@/components/layout/EditorialMasthead";
import { buildShareSummary, buildSharePreviewDescription } from "@/lib/eventShare";
import { distanceMiles } from "@/lib/geocoding";
import AreaSelector from "@/components/AreaSelector";
import { useActiveArea } from "@/hooks/useActiveArea";
import { resolveEventImage, handleEventImageError } from "@/lib/eventImage";
import BetaTrialBanner from "@/components/BetaTrialBanner";
import ZipPromptCard from "@/components/events/ZipPromptCard";
import SportsFilterBar, { type SportsFilter } from "@/components/events/SportsFilterBar";
import { fetchLocalSportsEvents, type MockDbEvent } from "@/lib/mockSportsEvents";
import WatchPartyBarModal from "@/components/events/WatchPartyBarModal";
import EventChatThread, { SYSTEM_PREFIX } from "@/components/events/EventChatThread";
import { MessageCircle } from "lucide-react";
import type { SportsBar } from "@/data/laSportsBars";


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
  banner_image?: string | null;
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
  location_lat?: number | null;
  location_lng?: number | null;
  promoted?: boolean | null;
}

// Event color system:
//   ⚫ Black   — External sports games (pro + collegiate)
//   🩷 Raspberry — Loverball-hosted events
//   🩵 Teal    — Curated culture / sports bars / watch parties
type EventVariant = "external" | "hosted" | "cultural";
const variantMap: Record<string, EventVariant> = {
  game: "external",
  watch_party: "cultural",
  networking: "hosted",
  brunch: "hosted",
  party: "hosted",
  panel: "cultural",
  salon: "cultural",
  other: "cultural",
};
const getVariant = (t?: string | null): EventVariant => (t && variantMap[t]) || "cultural";
const eventTheme: Record<EventVariant, { accent: string; dot: string; label: string }> = {
  external: { accent: "#0a0a0a", dot: "#0a0a0a", label: "Game" },
  hosted:   { accent: "#E85D2F", dot: "#E85D2F", label: "Loverball" },
  cultural: { accent: "#2DD4BF", dot: "#2DD4BF", label: "Watch Party" },
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
  const [shareEvent, setShareEvent] = useState<DbEvent | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const { active: activeArea, home: homeArea, isOverriding } = useActiveArea();
  const userLoc = activeArea?.lat != null && activeArea?.lng != null
    ? { lat: activeArea.lat, lng: activeArea.lng }
    : null;
  const [radius, setRadius] = useState<25 | 50 | 100 | "national">(50);
  const [sportsFilter, setSportsFilter] = useState<SportsFilter>("all");
  const [localSports, setLocalSports] = useState<MockDbEvent[]>([]);
  const needsZip = !!user && !homeArea?.zip && !activeArea?.zip;

  // Game RSVPs (stadium / bar) — backed by external_event_rsvps. Keyed by event id (text).
  type GameRsvp = { type: 'stadium' | 'bar'; bar_id?: string | null; bar_name?: string | null };
  const [gameRsvps, setGameRsvps] = useState<Record<string, GameRsvp>>({});
  const [gameCounts, setGameCounts] = useState<Record<string, number>>({});
  const [barModalEventId, setBarModalEventId] = useState<string | null>(null);
  const [openChatId, setOpenChatId] = useState<string | null>(null);

  // Helper: post a system message into an event's chat (visually distinct in UI).
  const postSystemMessage = async (eventId: string, text: string) => {
    if (!user) return;
    try {
      await supabase.from('event_chat_messages').insert({
        event_id: eventId,
        user_id: user.id,
        message: `${SYSTEM_PREFIX} ${text}`.slice(0, 1000),
      });
    } catch { /* non-fatal */ }
  };

  const displayName = (): string => {
    const meta = (user as { user_metadata?: { name?: string; full_name?: string }; email?: string } | null);
    return meta?.user_metadata?.name || meta?.user_metadata?.full_name || meta?.email?.split('@')[0] || 'someone';
  };

  const [gateEventId, setGateEventId] = useState<string | null>(null);
  const openGate = (id: string, intent: 'yes' | 'maybe' | 'no' = 'yes') => {
    sessionStorage.setItem("postAuthRedirect", `/event/${id}`);
    try {
      sessionStorage.setItem(
        'lb-pending-rsvp',
        JSON.stringify({ eventId: id, status: intent, ts: Date.now() })
      );
    } catch { /* ignore */ }
    setGateEventId(id);
    setGateOpen(true);
  };
  const openTile = (id: string) => {
    // Mock sports events have no DB row — open the ticket URL or no-op.
    const mock = localSports.find(e => e.id === id);
    if (mock) {
      if (mock.__ticket_url) window.open(mock.__ticket_url, "_blank", "noopener,noreferrer");
      return;
    }
    // Public event pages are viewable by anyone; logged-out users land on the
    // /e/:id public view (attendee list + chat remain gated behind sign-in).
    if (user) goTo(`/event/${id}`);
    else goTo(`/e/${id}`);
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
          .order("promoted", { ascending: false })
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
          // Left join on profiles so RSVPs from users without a full profile still count
          const { data: guests } = await supabase
            .from("event_guests")
            .select(`
              event_id,
              user_id,
              profile:profiles (
                id, name, profile_photo_url, bio, favorite_sports, primary_role, city
              )
            `)
            .in("event_id", eventIds)
            .eq("status", "going")
            .limit(200);

          if (guests) {
            const byEvent: Record<string, AttendeeProfile[]> = {};
            (guests as any[]).forEach((g) => {
              if (!byEvent[g.event_id]) byEvent[g.event_id] = [];
              if (byEvent[g.event_id].length < 4) {
                byEvent[g.event_id].push({
                  id: g.profile?.id || g.user_id,
                  name: g.profile?.name || "Member",
                  profile_photo_url: g.profile?.profile_photo_url || null,
                  bio: g.profile?.bio || null,
                  favorite_sports: g.profile?.favorite_sports || null,
                  primary_role: g.profile?.primary_role || null,
                  city: g.profile?.city || null,
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

  // Auto-populate local pro + college games whenever the active area changes.
  // Stays mock-backed until USE_MOCK_DATA is flipped in mockSportsEvents.ts.
  useEffect(() => {
    let cancelled = false;
    const zip = activeArea?.zip || null;
    const city = activeArea?.city || null;
    const lat = activeArea?.lat ?? null;
    const lng = activeArea?.lng ?? null;
    if (!zip && !city && lat == null) { setLocalSports([]); return; }
    fetchLocalSportsEvents({ zip, city, lat, lng }).then((rows) => {
      if (!cancelled) setLocalSports(rows);
    });
    return () => { cancelled = true; };
  }, [activeArea?.zip, activeArea?.city, activeArea?.lat, activeArea?.lng]);

  // Load game RSVPs (stadium / bar) for game-type events from external_event_rsvps
  useEffect(() => {
    const gameIds = events.filter(e => e.event_type === 'game').map(e => e.id);
    if (gameIds.length === 0) return;
    (async () => {
      const { data: rows } = await supabase
        .from('external_event_rsvps')
        .select('event_id, user_id, rsvp_type, bar_id, bar_name')
        .in('event_id', gameIds);
      if (!rows) return;
      const cts: Record<string, number> = {};
      const mine: Record<string, GameRsvp> = {};
      rows.forEach((r: any) => {
        cts[r.event_id] = (cts[r.event_id] || 0) + 1;
        if (user && r.user_id === user.id) {
          mine[r.event_id] = { type: r.rsvp_type, bar_id: r.bar_id, bar_name: r.bar_name };
        }
      });
      setGameCounts(cts);
      setGameRsvps(mine);
    })();
  }, [events, user]);

  const toggleStadium = async (eventId: string) => {
    if (!user) { openGate(eventId); return; }
    const existing = gameRsvps[eventId];
    if (existing?.type === 'stadium') {
      // undo
      await supabase.from('external_event_rsvps').delete().eq('event_id', eventId).eq('user_id', user.id);
      setGameRsvps(p => { const n = { ...p }; delete n[eventId]; return n; });
      setGameCounts(p => ({ ...p, [eventId]: Math.max(0, (p[eventId] || 1) - 1) }));
      toast({ title: 'RSVP removed' });
      return;
    }
    const wasNew = !existing;
    const { error } = await supabase.from('external_event_rsvps').upsert(
      { event_id: eventId, user_id: user.id, rsvp_type: 'stadium', bar_id: null, bar_name: null },
      { onConflict: 'event_id,user_id' }
    );
    if (error) { toast({ title: 'Could not save RSVP', variant: 'destructive' }); return; }
    setGameRsvps(p => ({ ...p, [eventId]: { type: 'stadium' } }));
    if (wasNew) setGameCounts(p => ({ ...p, [eventId]: (p[eventId] || 0) + 1 }));
    postSystemMessage(eventId, `@${displayName()} is going to the game 🏟️`);
    toast({ title: 'Going! 🏟️' });
  };

  const openBarPicker = (eventId: string) => {
    if (!user) { openGate(eventId); return; }
    setBarModalEventId(eventId);
  };

  const selectBar = async (bar: SportsBar) => {
    if (!user || !barModalEventId) return;
    const eventId = barModalEventId;
    const wasNew = !gameRsvps[eventId];
    const { error } = await supabase.from('external_event_rsvps').upsert(
      { event_id: eventId, user_id: user.id, rsvp_type: 'bar', bar_id: bar.id, bar_name: bar.name },
      { onConflict: 'event_id,user_id' }
    );
    if (error) { toast({ title: 'Could not save watch party', variant: 'destructive' }); return; }
    setGameRsvps(p => ({ ...p, [eventId]: { type: 'bar', bar_id: bar.id, bar_name: bar.name } }));
    if (wasNew) setGameCounts(p => ({ ...p, [eventId]: (p[eventId] || 0) + 1 }));
    postSystemMessage(eventId, `@${displayName()} is watching @ ${bar.name} 🍺`);
    toast({ title: `Watch party at ${bar.name} 🍺` });
    setBarModalEventId(null);
  };

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

  const handleShare = (ev: DbEvent) => {
    setShareEvent(ev);
    setShowShareDialog(true);
  };

  const getShareUrl = (ev: DbEvent) => `https://www.loverball.com/e/${ev.id}`;
  // Crawler-friendly URL for SMS/iMessage previews. The edge function returns
  // a tiny HTML doc with proper OG tags (event cover image) and redirects real
  // browsers to /e/:id, so iMessage shows the event photo in the link preview.
  // The `v` param busts iMessage/WhatsApp link-preview caches when the event
  // cover image changes. Bump it whenever an event's flyer is updated.
  const getSmsShareUrl = (ev: DbEvent) =>
    `https://nfjavjfxgxrpvieinpdp.supabase.co/functions/v1/event-og-meta?id=${ev.id}&v=2`;

  const copyShareLink = () => {
    if (!shareEvent) return;
    const url = getShareUrl(shareEvent);
    const summary = buildShareSummary(shareEvent);
    navigator.clipboard.writeText(`${summary}\n\n${url}`);
    toast({ title: "Copied!", description: "Event summary and link copied to clipboard." });
  };

  const handleNativeShare = async () => {
    if (!shareEvent) return;
    const url = getShareUrl(shareEvent);
    const summary = buildShareSummary(shareEvent);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: shareEvent.title, text: `${summary}\n\n${url}`, url });
        return;
      } catch { /* user cancelled */ }
    }
    copyShareLink();
  };

  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const now = new Date();
  // Events move to "past" 24 hours after their event_date
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Merge mock external sports events into the same pipeline so they get
  // ZIP/radius filtering, color-coded dots, and chronological sort for free.
  const combinedEvents = [...events, ...(localSports as unknown as DbEvent[])];
  const upcomingEvents = combinedEvents.filter(e => parseEventDate(e.event_date) >= cutoff);
  const pastEvents = combinedEvents.filter(e => parseEventDate(e.event_date) < cutoff).reverse();

  const baseEvents = tab === "upcoming" ? upcomingEvents : pastEvents;
  const categoryFiltered = category === "All" ? baseEvents : baseEvents.filter(e => e.event_type === category);

  // Sports filter chip row — operates on both real games + mock external events.
  const weekCutoff = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const sportsFiltered = categoryFiltered.filter((e) => {
    const m = (e as unknown as MockDbEvent).__mock ? (e as unknown as MockDbEvent) : null;
    switch (sportsFilter) {
      case "pro":     return m?.__sport_kind === "pro";
      case "college": return m?.__sport_kind === "college";
      case "womens":
        return m ? m.__is_womens : (e.sport_tags || []).some(t => /women|wnba|nwsl|ncaaw/i.test(t));
      case "week":
        return parseEventDate(e.event_date) <= weekCutoff;
      case "all":
      default:        return true;
    }
  });

  // Proximity filter — only applied when user has lat/lng AND radius is numeric.
  // Events without coords are always shown (treated as "national" reach).
  const withDistance = sportsFiltered.map(e => {
    let distance: number | null = null;
    if (userLoc && e.location_lat != null && e.location_lng != null) {
      distance = distanceMiles(userLoc.lat, userLoc.lng, e.location_lat, e.location_lng);
    }
    return { ev: e, distance };
  });

  // Area filter: when an active area is set, restrict to that area.
  // - Prefer distance from active lat/lng within radius
  // - Else fall back to city-level match
  // - Events with no coords AND no city are treated as national (always shown)
  const activeCity = activeArea?.city?.toLowerCase().trim() || null;
  const radiusFiltered = (activeArea && radius !== "national")
    ? withDistance.filter(({ ev: e, distance }) => {
        if (distance != null) return distance <= radius;
        if (activeCity && e.city) return e.city.toLowerCase().includes(activeCity);
        return true; // unknown location → don't hide
      })
    : withDistance;

  const q = searchQuery.trim().toLowerCase();
  const filteredWithDist = q
    ? radiusFiltered.filter(({ ev: e }) =>
        e.title.toLowerCase().includes(q) ||
        (e.city && e.city.toLowerCase().includes(q)) ||
        (e.venue_name && e.venue_name.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.sport_tags && e.sport_tags.some((t: string) => t.toLowerCase().includes(q))) ||
        (e.event_tags && e.event_tags.some((t: string) => t.toLowerCase().includes(q)))
      )
    : radiusFiltered;

  const filtered = filteredWithDist.map(x => x.ev);
  const distanceById: Record<string, number | null> = Object.fromEntries(
    filteredWithDist.map(x => [x.ev.id, x.distance])
  );

  const featured = tab === "upcoming" && upcomingEvents.length
    ? upcomingEvents.reduce((closest, ev) => {
        const diff = Math.abs(parseEventDate(ev.event_date).getTime() - now.getTime());
        const closestDiff = Math.abs(parseEventDate(closest.event_date).getTime() - now.getTime());
        return diff < closestDiff ? ev : closest;
      })
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
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

      <main className="pb-24 md:pb-0">
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-8">
          <BetaTrialBanner className="mb-6" />
          {needsZip && <ZipPromptCard />}
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
                  background: tab === t.k ? "#E85D2F" : "transparent",
                  color: tab === t.k ? "#FFFFFF" : "rgba(248,248,248,0.6)",
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
          <div className="mb-10 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search events, teams, cities, venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 rounded-full bg-muted/60 border-border/20 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/40"
              style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14 }}
            />
          </div>

          {/* Location filter block */}
          {user && (
            <div className="mb-7 space-y-3">
              <AreaSelector />
              <div className="flex flex-wrap items-center gap-2">
                <span style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: "0.18em", color: "rgba(248,248,248,0.55)", textTransform: "uppercase" }}>
                  {userLoc ? "Within" : "Radius"}
                </span>
                {[25, 50, 100, "national" as const].map((r) => {
                  const active = radius === r;
                  const label = r === "national" ? "National" : `${r} mi`;
                  return (
                    <button
                      key={String(r)}
                      onClick={() => setRadius(r as any)}
                      className="px-3 py-1.5 rounded-full transition-all"
                      style={{
                        background: active ? "#FAF5E9" : "rgba(20,20,21,0.6)",
                        color: active ? "#0a0a0a" : "rgba(248,248,248,0.7)",
                        border: active ? "1px solid #FAF5E9" : "1px solid rgba(255,255,255,0.08)",
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontWeight: 700,
                        fontSize: 10,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
                {isOverriding && (
                  <span style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 10, color: "#2DD4BF", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    · Temporary view
                  </span>
                )}
              </div>
            </div>
          )}


          {/* FEATURED — cinematic */}
          {featured && (() => {
            const th = eventTheme[getVariant(featured.event_type)];
            const d = parseEventDate(featured.event_date);
            return (
              <div
                className="relative overflow-hidden mb-10 cursor-pointer group rounded-[24px]"
                style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)" }}
                onClick={() => openTile(featured.id)}
              >
                <div className="relative h-72 md:h-[420px] overflow-hidden">
                  <img
                    src={resolveEventImage(featured)}
                    alt={featured.title}
                    loading="eager"
                    onError={handleEventImageError}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                  />
                  {/* layered overlays */}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,10,11,0.35) 0%, rgba(10,10,11,0.15) 40%, rgba(10,10,11,0.92) 100%)" }} />
                  <div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 30% 20%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)" }} />

                  {/* eyebrow */}
                  <div className="absolute top-5 left-5 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(232,107,176,0.15)", border: "1px solid rgba(232,107,176,0.5)", color: "#E85D2F", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                      {th.label}
                    </span>
                    <span style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: "0.18em", color: "rgba(248,248,248,0.7)", textTransform: "uppercase" }}>
                      · Featured
                    </span>
                  </div>

                  {/* Date stamp — strong treatment */}
                  <div className="absolute top-5 right-5 text-right">
                    <div style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: "0.22em", color: "#FFFFFF", textTransform: "uppercase" }}>
                      {format(d, "EEE")}
                    </div>
                    <div style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 56, lineHeight: 0.85, color: "#FAF5E9" }}>
                      {format(d, "dd")}
                    </div>
                    <div style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: "0.22em", color: "#FFFFFF", textTransform: "uppercase" }}>
                      {format(d, "MMM yyyy")}
                    </div>
                  </div>

                  {/* Bottom block */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                    <h2 className="line-clamp-2"
                      style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: "clamp(28px, 6vw, 44px)", lineHeight: 0.95, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.005em", margin: 0, textShadow: "0 2px 16px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.95)" }}>
                      {featured.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3"
                      style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 11, color: "rgba(248,248,248,0.7)", letterSpacing: "0.04em" }}>
                      {featured.event_time && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{fmtTime(featured.event_time)}</span>}
                      {(featured.venue_name || featured.city) && <span className="flex items-center gap-1.5 truncate max-w-[220px]"><MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#E85D2F" }} />{featured.venue_name || featured.city}</span>}
                      {counts[featured.id] > 0 && <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{counts[featured.id]} going</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-5">
                      <Button
                        className="rounded-full h-11 px-6"
                        style={{ background: "#E85D2F", color: "#fff", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}
                        onClick={e => { e.stopPropagation(); requestRsvp(featured.id); }}
                      >
                        {user ? "RSVP Now" : "Sign Up to RSVP"}
                      </Button>
                      <button
                        onClick={e => { e.stopPropagation(); handleShare(featured); }}
                        className="h-11 w-11 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: "rgba(10,10,11,0.65)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(6px)" }}
                        aria-label="Share event"
                      >
                        <Share2 className="w-4 h-4" style={{ color: "#FAF5E9" }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* SPORTS FILTER — All / Pro / College / Women's / This Week */}
          <SportsFilterBar value={sportsFilter} onChange={setSportsFilter} />

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
                    background: active ? "#FAF5E9" : "rgba(20,20,21,0.6)",
                    color: active ? "#0a0a0a" : "rgba(248,248,248,0.7)",
                    border: active ? "1px solid #FAF5E9" : "1px solid rgba(255,255,255,0.08)",
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
              style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
                style={{ background: "rgba(232,93,47,0.1)", border: "1px solid rgba(232,93,47,0.25)" }}>
                <Calendar className="w-9 h-9" style={{ color: "#E85D2F" }} />
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 500, fontSize: 28, color: "#FFFFFF", letterSpacing: "-0.02em", margin: 0 }}>
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
                const d = parseEventDate(ev.event_date);
                const dist = distanceById[ev.id];

                return (
                  <React.Fragment key={ev.id}>
                    <article
                      className="overflow-hidden cursor-pointer group rounded-[22px] transition-all"
                      style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)" }}
                      onClick={() => openTile(ev.id)}
                    >
                      {/* Cinematic header w/ date stamp */}
                      <div className="relative h-44 overflow-hidden">
                        <img
                          src={resolveEventImage(ev)}
                          alt={ev.title}
                          loading="lazy"
                          onError={handleEventImageError}
                          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                        />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,10,11,0.1) 0%, rgba(10,10,11,0.55) 100%)" }} />

                        {/* Eyebrow — colored dot + type label */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full inline-flex items-center gap-1.5"
                            style={{ background: "rgba(10,10,11,0.78)", border: `1px solid ${th.dot}66`, color: "#FAF5E9", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700, fontSize: 8.5, letterSpacing: "0.18em", textTransform: "uppercase", backdropFilter: "blur(6px)" }}>
                            <span style={{ width: 6, height: 6, borderRadius: 999, background: th.dot, display: "inline-block" }} />
                            {th.label}
                          </span>
                          {ev.price === 0 && (
                            <span className="px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(248,248,248,0.92)", color: "#0a0a0a", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800, fontSize: 8.5, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                              Free
                            </span>
                          )}
                        </div>

                        {/* Share button — top right */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleShare(ev); }}
                          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                          style={{ background: "rgba(10,10,11,0.65)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(6px)" }}
                          aria-label="Share event"
                        >
                          <Share2 className="w-3.5 h-3.5" style={{ color: "#FAF5E9" }} />
                        </button>

                        {/* Date block */}
                        <div className="absolute bottom-3 left-3 px-2.5 py-1.5 rounded-lg text-center"
                          style={{ background: "rgba(10,10,11,0.78)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}>
                          <div style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 9, letterSpacing: "0.18em", color: "#FFFFFF", textTransform: "uppercase" }}>
                            {format(d, "MMM")}
                          </div>
                          <div style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 24, lineHeight: 0.9, color: "#FAF5E9" }}>
                            {format(d, "dd")}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <h3 className="line-clamp-2"
                          style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 18, lineHeight: 1.05, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.01em", margin: 0 }}>
                          {ev.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1"
                          style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 10, color: "rgba(248,248,248,0.55)", letterSpacing: "0.04em" }}>
                          {ev.event_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtTime(ev.event_time)}</span>}
                          {(ev.venue_name || ev.city) && (
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                              <MapPin className="w-3 h-3" style={{ color: "#E85D2F" }} />
                              {ev.venue_name}{ev.venue_name && ev.city ? ", " : ""}{ev.city}
                            </span>
                          )}
                          {dist != null && (
                            <span style={{ color: "#2DD4BF" }}>{dist < 1 ? "<1" : Math.round(dist)} mi</span>
                          )}
                        </div>

                        {(() => {
                          const isGame = ev.event_type === 'game';
                          const gRsvp = gameRsvps[ev.id];
                          const gCount = gameCounts[ev.id] || 0;
                          const isStadium = gRsvp?.type === 'stadium';
                          const isBar = gRsvp?.type === 'bar';

                          if (isGame && user) {
                            return (
                              <>
                                {ev.event_tags && ev.event_tags.length > 0 && (
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <EventTagBadges tags={ev.event_tags} size="sm" />
                                  </div>
                                )}
                                <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                                  <RsvpAvatarBar
                                    attendees={eventAttendees[ev.id] || []}
                                    totalCount={gCount}
                                    size="sm"
                                    maxAvatars={5}
                                    onAvatarClick={(attendee) => { setSelectedProfile({ ...attendee, bio: null }); setDrawerOpen(true); }}
                                    onViewAllClick={() => openTile(ev.id)}
                                  />
                                </div>
                                <div className="flex items-center gap-1.5 pt-1"
                                  style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 10, color: "rgba(248,248,248,0.6)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                  <Users className="w-3 h-3" />
                                  {gCount} {gCount === 1 ? 'member' : 'members'} going
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    size="sm"
                                    className="rounded-full h-9 px-2 transition-all"
                                    style={{
                                      background: isStadium ? "#E85D2F" : "transparent",
                                      color: isStadium ? "#fff" : "#FAF5E9",
                                      border: isStadium ? "1px solid #E85D2F" : "1px solid rgba(255,255,255,0.14)",
                                      fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
                                    }}
                                    onClick={() => toggleStadium(ev.id)}
                                  >
                                    {isStadium ? "Going! 🏟️" : "I'm Going 🏟️"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    title={isBar && gRsvp?.bar_name ? `Watching @ ${gRsvp.bar_name}` : undefined}
                                    className="rounded-full h-9 px-2 transition-all truncate"
                                    style={{
                                      background: isBar ? "#2DD4BF" : "transparent",
                                      color: isBar ? "#0a0a0a" : "#FAF5E9",
                                      border: isBar ? "1px solid #2DD4BF" : "1px solid rgba(255,255,255,0.14)",
                                      fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
                                    }}
                                    onClick={() => openBarPicker(ev.id)}
                                  >
                                    <span className="truncate">
                                      {isBar && gRsvp?.bar_name ? `Watching @ ${gRsvp.bar_name} 🍺` : "Watch Party 🍺"}
                                    </span>
                                  </Button>
                                </div>
                                <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => setOpenChatId(openChatId === ev.id ? null : ev.id)}
                                    className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
                                    style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#E85D2F" }}
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    {openChatId === ev.id ? "Hide chat" : "Open event chat"}
                                  </button>
                                  {openChatId === ev.id && (
                                    <div className="pt-2">
                                      <EventChatThread eventId={ev.id} />
                                    </div>
                                  )}
                                </div>
                              </>
                            );
                          }

                          if (user) {
                            return (
                              <>
                                {ev.event_tags && ev.event_tags.length > 0 && (
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <EventTagBadges tags={ev.event_tags} size="sm" />
                                  </div>
                                )}
                                <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                                  <RsvpAvatarBar
                                    attendees={eventAttendees[ev.id] || []}
                                    totalCount={ct}
                                    size="sm"
                                    maxAvatars={5}
                                    onAvatarClick={(attendee) => { setSelectedProfile({ ...attendee, bio: null }); setDrawerOpen(true); }}
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
                                      style={{ background: rsvp === "attending" ? "rgba(232,93,47,0.15)" : "rgba(255,255,255,0.06)", color: rsvp === "attending" ? "#E85D2F" : "rgba(248,248,248,0.6)", border: rsvp === "attending" ? "1px solid rgba(232,93,47,0.35)" : "1px solid rgba(255,255,255,0.08)", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                      {rsvp === "attending" ? "Going ✓" : rsvp}
                                    </span>
                                  ) : (
                                    <Button size="sm" className="rounded-full h-8 px-4"
                                      style={{ background: "#E85D2F", color: "#fff", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}
                                      onClick={e => { e.stopPropagation(); setRsvpId(ev.id); }}>
                                      RSVP
                                    </Button>
                                  )}
                                </div>
                              </>
                            );
                          }

                          return (
                            <div className="pt-2 flex items-center justify-between gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                              <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 12, color: "rgba(248,248,248,0.55)", margin: 0 }}>
                                Sign up to see who's going
                              </p>
                              <Button size="sm" className="rounded-full h-8 px-4"
                                style={{ background: "transparent", color: "#E85D2F", border: "1px solid rgba(232,93,47,0.4)", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}
                                onClick={e => { e.stopPropagation(); openGate(ev.id); }}>
                                Unlock
                              </Button>
                            </div>
                          );
                        })()}
                      </div>
                    </article>
                    {sponsorSlot && <SponsorCard index={Math.floor(cardIndex / 5) - 1} />}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* SHARE DIALOG */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="sm:max-w-md rounded-3xl" style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)" }}>
            <DialogHeader>
              <span style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: "0.22em", color: "#FFFFFF", textTransform: "uppercase" }}>
                Spread the word
              </span>
              <DialogTitle style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 30, lineHeight: 0.95, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.01em", marginTop: 4 }}>
                Share Event
              </DialogTitle>
            </DialogHeader>
            {shareEvent && (
              <div className="space-y-4 pt-1">
                <SharePreview
                  title={`${shareEvent.title} · Loverball`}
                  description={buildSharePreviewDescription(shareEvent)}
                  imageUrl={resolveEventImage(shareEvent)}
                  siteName="loverball.com"
                  eventDate={format(parseEventDate(shareEvent.event_date), "EEE, MMM d, yyyy")}
                  eventTime={shareEvent.event_time ? fmtTime(shareEvent.event_time) : null}
                  venue={shareEvent.venue_name || null}
                  city={shareEvent.city || null}
                />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 rounded-full bg-transparent"
                    style={{ borderColor: "rgba(255,255,255,0.12)", color: "#FAF5E9", fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}
                    onClick={copyShareLink}
                  >
                    <Copy className="w-4 h-4 mr-2" /> Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-11 rounded-full bg-transparent"
                    style={{ borderColor: "rgba(255,255,255,0.12)", color: "#FAF5E9", fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}
                    asChild
                  >
                    <a
                      href={`mailto:?subject=${encodeURIComponent(shareEvent.title)}&body=${encodeURIComponent(buildShareSummary(shareEvent) + "\n\n" + getShareUrl(shareEvent))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Mail className="w-4 h-4 mr-2" /> Email
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-11 rounded-full bg-transparent"
                    style={{ borderColor: "rgba(255,255,255,0.12)", color: "#FAF5E9", fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}
                    asChild
                  >
                    <a
                      href={`sms:?&body=${encodeURIComponent(buildShareSummary(shareEvent) + "\n\n" + getSmsShareUrl(shareEvent))}`}
                    >
                      <Smartphone className="w-4 h-4 mr-2" /> Text
                    </a>
                  </Button>
                </div>
                <div className="rounded-xl p-3" style={{ background: "rgba(20,20,21,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-xs mb-1 flex items-center gap-1" style={{ color: "rgba(248,248,248,0.5)", fontFamily: "'Space Mono', ui-monospace, monospace", letterSpacing: "0.04em" }}>
                    <Link2 className="w-3 h-3" />
                    Share URL
                  </p>
                  <p className="text-xs font-mono break-all" style={{ color: "#FAF5E9" }}>
                    {getShareUrl(shareEvent)}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* RSVP MODAL */}
        <Dialog open={!!rsvpId} onOpenChange={() => setRsvpId(null)}>
          <DialogContent className="sm:max-w-sm rounded-3xl" style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)" }}>
            <DialogHeader>
              <span style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: "0.22em", color: "#FFFFFF", textTransform: "uppercase" }}>
                Confirm your seat
              </span>
              <DialogTitle style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 30, lineHeight: 0.95, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.01em", marginTop: 4 }}>
                RSVP
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2.5 pt-3">
              <Button className="w-full rounded-full h-11"
                style={{ background: "#E85D2F", color: "#fff", fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}
                onClick={() => handleRsvp("attending")}>Going</Button>
              <Button className="w-full rounded-full h-11"
                style={{ background: "transparent", color: "#FAF5E9", border: "1px solid rgba(255,255,255,0.12)", fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}
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

        {/* Watch Party Bar Selector */}
        <WatchPartyBarModal
          open={!!barModalEventId}
          onOpenChange={(o) => { if (!o) setBarModalEventId(null); }}
          eventTitle={events.find(e => e.id === barModalEventId)?.title}
          selectedBarId={barModalEventId ? gameRsvps[barModalEventId]?.bar_id || null : null}
          userLoc={userLoc}
          onConfirm={selectBar}
        />

        {/* Event Submission Form */}
        <EventSubmissionForm open={showSubmitForm} onOpenChange={setShowSubmitForm} />

        {/* SIGNUP GATE */}
        <Dialog open={gateOpen} onOpenChange={setGateOpen}>
          <DialogContent className="sm:max-w-md text-center">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl uppercase tracking-tight" style={{ color: "#FFFFFF" }}>Your people are already here</DialogTitle>
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
