/**
 * WatchSpotsPanel — pinned watch spots for a game (or event), with community
 * upvotes and an empty-state that recommends nearby bars in the same city.
 *
 * Data model (added in 2026 migration):
 *   - watch_locations         : bars/partner venues/community spots
 *   - watch_location_pins     : link a location to a game (external_game_id) or event_id
 *   - watch_pin_upvotes       : one row per (pin, user)
 */
import { useEffect, useMemo, useState } from "react";
import { ChevronUp, MapPin, Plus, Sparkles, Tv } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const PINK = "#E85D2F";
const TEAL = "#2DD4BF";
const PANEL = "#161616";
const BORDER = "1px solid rgba(250,245,233,0.08)";

type WatchLocation = {
  id: string;
  name: string;
  neighborhood: string | null;
  city: string;
  state: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  website: string | null;
  vibe_tags: string[];
  leagues_supported: string[];
  is_partner: boolean;
};

type Pin = {
  id: string;
  watch_location_id: string;
  submitted_by: string;
  note: string | null;
  upvote_count: number;
  status: string;
};

type Props = {
  /** Pass exactly one of these so we know what this watch list is for. */
  eventId?: string;
  externalGameId?: string;
  venueCity?: string | null;
  league?: string | null;
};

const mapsUrl = (loc: WatchLocation) => {
  const q = encodeURIComponent(`${loc.name}, ${loc.address || loc.city}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
};

const VibeChip = ({ tag }: { tag: string }) => (
  <span
    className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest"
    style={{ background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.3)", color: TEAL, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}
  >
    {tag}
  </span>
);

const WatchSpotsPanel = ({ eventId, externalGameId, venueCity, league }: Props) => {
  const { user } = useAuth();
  const [pins, setPins] = useState<Pin[]>([]);
  const [locations, setLocations] = useState<Record<string, WatchLocation>>({});
  const [suggestions, setSuggestions] = useState<WatchLocation[]>([]);
  const [myUpvotes, setMyUpvotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", neighborhood: "", website: "", note: "" });

  // Load pins + locations
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let q = supabase
        .from("watch_location_pins")
        .select("id, watch_location_id, submitted_by, note, upvote_count, status")
        .eq("status", "approved")
        .order("upvote_count", { ascending: false })
        .limit(20);
      if (eventId)            q = q.eq("event_id", eventId);
      else if (externalGameId) q = q.eq("external_game_id", externalGameId);
      else                     q = q.eq("event_id", "00000000-0000-0000-0000-000000000000"); // never match
      const { data: pinRows } = await q;
      if (cancelled) return;
      const safePins = Array.isArray(pinRows) ? (pinRows as Pin[]) : [];
      setPins(safePins);

      const locIds = Array.from(new Set(safePins.map(p => p.watch_location_id)));
      if (locIds.length) {
        const { data: locRows } = await supabase
          .from("watch_locations")
          .select("id, name, neighborhood, city, state, address, latitude, longitude, website, vibe_tags, leagues_supported, is_partner")
          .in("id", locIds);
        if (!cancelled && locRows) {
          const map: Record<string, WatchLocation> = {};
          (locRows as WatchLocation[]).forEach(l => { map[l.id] = l; });
          setLocations(map);
        }
      }

      // Empty-state suggestions: approved bars in the same city.
      if (venueCity) {
        const { data: nearby } = await supabase
          .from("watch_locations")
          .select("id, name, neighborhood, city, state, address, latitude, longitude, website, vibe_tags, leagues_supported, is_partner")
          .ilike("city", `%${venueCity}%`)
          .eq("status", "approved")
          .limit(6);
        if (!cancelled) setSuggestions(Array.isArray(nearby) ? (nearby as WatchLocation[]) : []);
      }

      // My upvotes
      if (user && safePins.length) {
        const { data: up } = await supabase
          .from("watch_pin_upvotes")
          .select("pin_id")
          .eq("user_id", user.id)
          .in("pin_id", safePins.map(p => p.id));
        if (!cancelled && up) setMyUpvotes(new Set((up as { pin_id: string }[]).map(r => r.pin_id)));
      }

      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [eventId, externalGameId, venueCity, user?.id]);

  const toggleUpvote = async (pinId: string) => {
    if (!user) { toast({ title: "Sign in to upvote" }); return; }
    const has = myUpvotes.has(pinId);
    if (has) {
      const { error } = await supabase.from("watch_pin_upvotes").delete().eq("pin_id", pinId).eq("user_id", user.id);
      if (error) { toast({ title: "Couldn't undo upvote", variant: "destructive" }); return; }
      setMyUpvotes(prev => { const n = new Set(prev); n.delete(pinId); return n; });
      setPins(prev => prev.map(p => p.id === pinId ? { ...p, upvote_count: Math.max(0, p.upvote_count - 1) } : p));
    } else {
      const { error } = await supabase.from("watch_pin_upvotes").insert({ pin_id: pinId, user_id: user.id });
      if (error) { toast({ title: "Couldn't upvote", variant: "destructive" }); return; }
      setMyUpvotes(prev => new Set(prev).add(pinId));
      setPins(prev => prev.map(p => p.id === pinId ? { ...p, upvote_count: p.upvote_count + 1 } : p));
    }
  };

  const pinExisting = async (locationId: string) => {
    if (!user) { toast({ title: "Sign in to suggest a spot" }); return; }
    const payload: Record<string, string | null> = { watch_location_id: locationId, submitted_by: user.id, note: null };
    if (eventId) payload.event_id = eventId;
    else if (externalGameId) payload.external_game_id = externalGameId;
    const { error } = await supabase.from("watch_location_pins").insert(payload);
    if (error && !/duplicate/i.test(error.message)) { toast({ title: "Couldn't pin spot", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Pinned to this game 🍻" });
    // Soft refresh by reloading effect
    setSuggestions(prev => prev.filter(s => s.id !== locationId));
  };

  const submitNewSpot = async () => {
    if (!user) { toast({ title: "Sign in to suggest a spot" }); return; }
    const name = draft.name.trim();
    if (!name) { toast({ title: "Add a venue name" }); return; }
    const city = venueCity || "";
    const { data: loc, error: locErr } = await supabase
      .from("watch_locations")
      .insert({
        name,
        neighborhood: draft.neighborhood.trim() || null,
        city: city || "Unknown",
        website: draft.website.trim() || null,
        vibe_tags: [],
        leagues_supported: league ? [league] : [],
        submitted_by: user.id,
        status: "pending",
      })
      .select("id")
      .maybeSingle();
    if (locErr || !loc) { toast({ title: "Couldn't save spot", description: locErr?.message, variant: "destructive" }); return; }
    const pinPayload: Record<string, string | null> = { watch_location_id: loc.id, submitted_by: user.id, note: draft.note.trim() || null };
    if (eventId) pinPayload.event_id = eventId;
    else if (externalGameId) pinPayload.external_game_id = externalGameId;
    const { error: pinErr } = await supabase.from("watch_location_pins").insert(pinPayload);
    if (pinErr) { toast({ title: "Spot saved but pin failed", description: pinErr.message, variant: "destructive" }); }
    toast({ title: "Thanks — we'll review your spot ✨" });
    setSuggestOpen(false);
    setDraft({ name: "", neighborhood: "", website: "", note: "" });
  };

  const sortedPins = useMemo(() => [...pins].sort((a, b) => b.upvote_count - a.upvote_count), [pins]);

  return (
    <div className="rounded-2xl p-5" style={{ background: PANEL, border: BORDER }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tv className="w-4 h-4" style={{ color: PINK }} />
          <span className="text-[12px] uppercase" style={{ letterSpacing: "0.18em", fontFamily: "'Space Mono', monospace", color: "rgba(250,245,233,0.7)" }}>
            Where to Watch
          </span>
        </div>
        <button
          onClick={() => setSuggestOpen(true)}
          className="inline-flex items-center gap-1 text-[11px] uppercase tracking-widest"
          style={{ color: PINK, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}
        >
          <Plus className="w-3.5 h-3.5" /> Suggest a spot
        </button>
      </div>

      {loading ? (
        <div className="text-[12px]" style={{ color: "rgba(250,245,233,0.5)" }}>Loading watch spots…</div>
      ) : sortedPins.length === 0 ? (
        <div className="space-y-3">
          <div className="p-4 rounded-xl" style={{ background: "rgba(232,93,47,0.06)", border: "1px dashed rgba(232,93,47,0.3)" }}>
            <p className="text-[13px]" style={{ color: "#FAF5E9", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
              ✨ No official watch party yet. Be the first to pin a spot.
            </p>
          </div>
          {suggestions.length > 0 && (
            <>
              <p className="text-[10px] uppercase mt-4" style={{ color: "rgba(250,245,233,0.55)", letterSpacing: "0.2em", fontFamily: "'Space Mono', monospace" }}>
                <Sparkles className="inline w-3 h-3 mr-1" style={{ color: PINK }} /> Bars near {venueCity || "the venue"}
              </p>
              <ul className="space-y-2">
                {suggestions.map(s => (
                  <li key={s.id} className="flex items-start justify-between gap-3 p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: BORDER }}>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: "#FAF5E9" }}>{s.name}</p>
                      <p className="text-[11px] flex items-center gap-1" style={{ color: "rgba(250,245,233,0.55)" }}>
                        <MapPin className="w-3 h-3" /> {s.neighborhood ? `${s.neighborhood}, ` : ""}{s.city}
                      </p>
                      {s.vibe_tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {s.vibe_tags.slice(0, 3).map(t => <VibeChip key={t} tag={t} />)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <a href={mapsUrl(s)} target="_blank" rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest"
                        style={{ background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.35)", color: TEAL, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                        Maps
                      </a>
                      <button onClick={() => pinExisting(s.id)}
                        className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest"
                        style={{ background: PINK, color: "#0a0a0a", fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                        Pin this
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {sortedPins.map(p => {
            const loc = locations[p.watch_location_id];
            if (!loc) return null;
            const iUp = myUpvotes.has(p.id);
            return (
              <li key={p.id} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: BORDER }}>
                <button
                  onClick={() => toggleUpvote(p.id)}
                  className="flex flex-col items-center justify-center w-11 rounded-lg py-1 shrink-0 transition-colors"
                  style={{
                    background: iUp ? "rgba(232,93,47,0.18)" : "rgba(255,255,255,0.04)",
                    border: iUp ? `1px solid ${PINK}` : "1px solid rgba(255,255,255,0.08)",
                  }}
                  aria-label={iUp ? "Remove upvote" : "Upvote watch spot"}
                  aria-pressed={iUp}
                >
                  <ChevronUp className="w-4 h-4" style={{ color: iUp ? PINK : "rgba(250,245,233,0.6)" }} />
                  <span className="text-[11px] font-bold" style={{ color: iUp ? PINK : "#FAF5E9", fontFamily: "'Space Mono', monospace" }}>
                    {p.upvote_count}
                  </span>
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-medium" style={{ color: "#FAF5E9" }}>{loc.name}</p>
                    {loc.is_partner && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest"
                        style={{ background: "rgba(232,93,47,0.12)", border: "1px solid rgba(232,93,47,0.35)", color: PINK, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                        Partner
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] flex items-center gap-1" style={{ color: "rgba(250,245,233,0.55)" }}>
                    <MapPin className="w-3 h-3" /> {loc.neighborhood ? `${loc.neighborhood}, ` : ""}{loc.city}
                  </p>
                  {p.note && (
                    <p className="text-[12px] mt-1" style={{ color: "rgba(250,245,233,0.7)", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
                      "{p.note}"
                    </p>
                  )}
                  {loc.vibe_tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {loc.vibe_tags.slice(0, 4).map(t => <VibeChip key={t} tag={t} />)}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <a href={mapsUrl(loc)} target="_blank" rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest"
                      style={{ background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.35)", color: TEAL, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                      Open in Maps
                    </a>
                    {loc.website && (
                      <a href={loc.website} target="_blank" rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest"
                        style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.14)", color: "#FAF5E9", fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                        Site
                      </a>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Suggest-a-spot dialog */}
      <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Suggest a watch spot</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Venue name</label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. The Greyhound Bar & Grill" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Neighborhood</label>
              <Input value={draft.neighborhood} onChange={(e) => setDraft({ ...draft, neighborhood: e.target.value })} placeholder="e.g. Koreatown" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Website (optional)</label>
              <Input value={draft.website} onChange={(e) => setDraft({ ...draft, website: e.target.value })} placeholder="https://" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Why it's a good spot</label>
              <Textarea value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="Big screens, sound on, women's sports crowd…" rows={3} />
            </div>
            <Button onClick={submitNewSpot} className="w-full">Submit for review</Button>
            <p className="text-[11px] text-muted-foreground">
              {venueCity ? `Saved as a spot in ${venueCity}.` : "We'll associate this with the game venue."} Our team approves community spots before they go live.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WatchSpotsPanel;
