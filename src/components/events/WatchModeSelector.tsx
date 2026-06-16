// WatchModeSelector — appears after a member RSVPs "I'm going" to a game/
// watch-party event. Lets them declare WHERE they're watching so the
// attendee list on the event page can group people by stadium vs each bar.
//
// Persists the choice onto the existing `event_rsvps` row (rsvp_type +
// bar_id + bar_name columns). Reuses the same Overpass-backed nearby bar
// lookup as <NearbySportsBars />.

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Tv, Check, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { distanceMiles, isValidUsZip } from "@/lib/geocoding";

interface Bar {
  id: string;
  name: string;
  distance: number;
  address?: string;
}

interface Props {
  eventId: string;
  eventLat: number | null;
  eventLng: number | null;
  /** Initial saved choice for this user. */
  initialRsvpType?: "stadium" | "bar" | null;
  initialBarName?: string | null;
  initialBarId?: string | null;
  onSaved?: () => void;
}

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

async function fetchOverpass(query: string): Promise<any | null> {
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (res.ok) return await res.json();
    } catch {
      /* try next */
    }
  }
  return null;
}

async function zipToLatLng(
  zip: string,
): Promise<{ lat: number; lng: number; zip: string } | null> {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!res.ok) return null;
    const data = await res.json();
    const place = data?.places?.[0];
    if (!place) return null;
    const lat = parseFloat(place.latitude);
    const lng = parseFloat(place.longitude);
    if (!isFinite(lat) || !isFinite(lng)) return null;
    return { lat, lng, zip: data["post code"] || zip };
  } catch {
    return null;
  }
}

const WatchModeSelector = ({
  eventId,
  eventLat,
  eventLng,
  initialRsvpType,
  initialBarName,
  initialBarId,
  onSaved,
}: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"stadium" | "bar" | null>(
    initialRsvpType ?? null,
  );
  const [savedBar, setSavedBar] = useState<{
    id: string | null;
    name: string | null;
  } | null>(
    initialBarName
      ? { id: initialBarId ?? null, name: initialBarName }
      : null,
  );
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bars, setBars] = useState<Bar[] | null>(null);
  const [loadingBars, setLoadingBars] = useState(false);
  const [zipInput, setZipInput] = useState("");
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(
    eventLat != null && eventLng != null
      ? { lat: eventLat, lng: eventLng }
      : null,
  );

  // Stadium is offered only when we know the venue is within 50mi of the
  // user's center. If the event has no coordinates, we always allow stadium
  // (fall back to trusting the venue address).
  const stadiumOffered = (() => {
    if (eventLat == null || eventLng == null) return true;
    if (!center) return true;
    return distanceMiles(eventLat, eventLng, center.lat, center.lng) <= 50;
  })();

  const loadBars = useCallback(
    async (c: { lat: number; lng: number }) => {
      setLoadingBars(true);
      // Prefer Google Places (New) via our edge function — real, ranked
      // sports bars with ratings. Fall back to OSM/Overpass if it fails.
      try {
        const { data, error } = await supabase.functions.invoke(
          "nearby-sports-bars",
          { body: { lat: c.lat, lng: c.lng, radiusMiles: 5 } },
        );
        if (!error && Array.isArray(data?.bars) && data.bars.length > 0) {
          const out: Bar[] = data.bars
            .map((b: any) => ({
              id: b.id,
              name: b.name,
              distance:
                typeof b.lat === "number" && typeof b.lng === "number"
                  ? distanceMiles(c.lat, c.lng, b.lat, b.lng)
                  : 0,
              address: b.address || b.neighborhood || undefined,
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 12);
          setBars(out);
          setLoadingBars(false);
          return;
        }
      } catch {
        /* fall through to Overpass */
      }
      const r = 5000;
      const q = `[out:json][timeout:20];
(
  node["amenity"~"^(bar|pub)$"](around:${r},${c.lat},${c.lng});
  way["amenity"~"^(bar|pub)$"](around:${r},${c.lat},${c.lng});
);
out center tags 60;`;
      const data = await fetchOverpass(q);
      const out: Bar[] = [];
      const seen = new Set<string>();
      for (const el of data?.elements || []) {
        const tags = el.tags || {};
        const name = tags.name;
        if (!name) continue;
        const key = name.toLowerCase().trim();
        if (seen.has(key)) continue;
        seen.add(key);
        const elat = el.lat ?? el.center?.lat;
        const elng = el.lon ?? el.center?.lon;
        if (typeof elat !== "number" || typeof elng !== "number") continue;
        out.push({
          id: `${el.type}-${el.id}`,
          name,
          distance: distanceMiles(c.lat, c.lng, elat, elng),
          address: [tags["addr:street"], tags["addr:city"]]
            .filter(Boolean)
            .join(", "),
        });
      }
      out.sort((a, b) => a.distance - b.distance);
      setBars(out.slice(0, 12));
      setLoadingBars(false);
    },
    [],
  );


  useEffect(() => {
    if (picking && bars === null && center) loadBars(center);
  }, [picking, bars, center, loadBars]);

  const save = async (
    rsvp_type: "stadium" | "bar",
    bar?: { id: string | null; name: string },
  ) => {
    if (!user) return;
    setSaving(true);
    const payload: any = {
      event_id: eventId,
      user_id: user.id,
      status: "attending",
      rsvp_type,
      bar_id: rsvp_type === "bar" ? bar?.id ?? null : null,
      bar_name: rsvp_type === "bar" ? bar?.name ?? null : null,
    };
    const { error } = await supabase
      .from("event_rsvps")
      .upsert(payload, { onConflict: "event_id,user_id" });
    setSaving(false);
    if (error) {
      toast({
        title: "Couldn't save your choice",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setMode(rsvp_type);
    setSavedBar(
      rsvp_type === "bar" ? { id: bar?.id ?? null, name: bar?.name ?? "" } : null,
    );
    setPicking(false);
    toast({
      title:
        rsvp_type === "stadium"
          ? "You're at the stadium 🏟️"
          : `Watching at ${bar?.name} 🍺`,
    });
    onSaved?.();
  };

  const submitZip = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = zipInput.trim();
    if (!isValidUsZip(clean)) {
      toast({ title: "Enter a 5-digit US ZIP", variant: "destructive" });
      return;
    }
    const loc = await zipToLatLng(clean);
    if (!loc) {
      toast({ title: "ZIP not found", variant: "destructive" });
      return;
    }
    setCenter({ lat: loc.lat, lng: loc.lng });
    setBars(null);
  };

  // Already saved view
  if (mode && !picking) {
    return (
      <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{
            background:
              mode === "stadium" ? "hsl(173 58% 39%)" : "hsl(var(--primary))",
            color: "white",
          }}
        >
          {mode === "stadium" ? <MapPin className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">
            {mode === "stadium"
              ? "You're going to the stadium"
              : `Watching at ${savedBar?.name || "a bar"}`}
          </div>
          <div className="text-[11px] text-muted-foreground">
            You'll show up in this group on the event page
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="gap-1 text-xs"
          onClick={() => setPicking(true)}
        >
          <Pencil className="w-3.5 h-3.5" />
          Change
        </Button>
      </div>
    );
  }

  // Picker view
  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-3">
      <div>
        <div className="text-sm font-bold text-foreground">
          Where are you watching?
        </div>
        <div className="text-[11px] text-muted-foreground">
          So we can put you in the right group on the event page.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!stadiumOffered || saving}
          onClick={() => save("stadium")}
          className="rounded-xl border border-border p-3 text-left hover:border-primary/60 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-[hsl(173_58%_39%)]" />
            <span className="text-sm font-semibold">Stadium</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            {stadiumOffered ? "Going to the venue" : "Venue is >50mi away"}
          </div>
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => setPicking(true)}
          className="rounded-xl border border-border p-3 text-left hover:border-primary/60"
        >
          <div className="flex items-center gap-2 mb-1">
            <Tv className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Watch party</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Pick a nearby sports bar
          </div>
        </button>
      </div>

      {picking && (
        <div className="space-y-2 pt-1">
          {!center && (
            <form onSubmit={submitZip} className="flex gap-2">
              <Input
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                placeholder="Your ZIP"
                inputMode="numeric"
                maxLength={5}
                className="h-9"
              />
              <Button type="submit" size="sm">
                Find bars
              </Button>
            </form>
          )}

          {center && loadingBars && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Finding nearby bars…
            </div>
          )}

          {center && !loadingBars && bars && bars.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No bars found nearby. Try a different ZIP.
            </p>
          )}

          {center && !loadingBars && bars && bars.length > 0 && (
            <ul className="max-h-64 overflow-y-auto divide-y divide-border rounded-lg border border-border">
              {bars.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center gap-2 p-2.5 hover:bg-muted/50"
                >
                  <Tv className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{b.name}</div>
                    {b.address && (
                      <div className="text-[11px] text-muted-foreground truncate">
                        {b.address} · {b.distance.toFixed(1)} mi
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full h-8 text-xs gap-1"
                    disabled={saving}
                    onClick={() =>
                      save("bar", { id: b.id, name: b.name })
                    }
                  >
                    <Check className="w-3.5 h-3.5" />
                    I'm in
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default WatchModeSelector;
