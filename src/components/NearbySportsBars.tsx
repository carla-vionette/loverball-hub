import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tv, MapPin, ExternalLink, Navigation } from "lucide-react";
import { useActiveArea } from "@/hooks/useActiveArea";
import { isValidUsZip, distanceMiles } from "@/lib/geocoding";

async function zipToLatLng(zip: string): Promise<{ lat: number; lng: number; zip: string } | null> {
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

interface Bar {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  distance: number; // miles
  website?: string;
}

interface Props {
  /** Optional event coordinates — used as the search center when provided. */
  eventLat?: number | null;
  eventLng?: number | null;
  /** Search radius in meters (default 12km). */
  radiusM?: number;
  limit?: number;
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
      // try next mirror
    }
  }
  return null;
}

function buildAddress(tags: Record<string, string>): string | undefined {
  const parts = [
    [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "),
    tags["addr:city"],
    tags["addr:state"],
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
}

const NearbySportsBars = ({ eventLat, eventLng, radiusM = 5000, limit = 8 }: Props) => {
  const { active } = useActiveArea();
  const [bars, setBars] = useState<Bar[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zipInput, setZipInput] = useState("");
  const [manualCenter, setManualCenter] = useState<{ lat: number; lng: number; zip: string } | null>(null);
  const [resolvingZip, setResolvingZip] = useState(false);

  // Restore saved ZIP on mount
  useEffect(() => {
    const saved = localStorage.getItem("sportsBarsZip");
    if (saved && isValidUsZip(saved)) {
      zipToLatLng(saved).then((loc) => {
        if (loc) setManualCenter(loc);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve center: event > manual > active area
  const center =
    (eventLat != null && eventLng != null && { lat: eventLat, lng: eventLng, source: "event" as const }) ||
    (manualCenter && { lat: manualCenter.lat, lng: manualCenter.lng, source: "manual" as const }) ||
    (active?.lat != null && active?.lng != null && { lat: active.lat, lng: active.lng, source: "home" as const }) ||
    null;

  const centerLabel =
    manualCenter?.zip ||
    (center?.source === "home" ? active?.zip || active?.city || null : null) ||
    null;

  const load = useCallback(async () => {
    if (!center) return;
    setLoading(true);
    setError(null);
    const { lat, lng } = center;
    const r = radiusM;
    const query = `
[out:json][timeout:20];
(
  node["amenity"~"^(bar|pub)$"](around:${r},${lat},${lng});
  way["amenity"~"^(bar|pub)$"](around:${r},${lat},${lng});
);
out center tags 80;`;
    const data = await fetchOverpass(query);
    if (!data?.elements) {
      setBars([]);
      setLoading(false);
      return;
    }
    const seen = new Set<string>();
    const list: Bar[] = [];
    for (const el of data.elements) {
      const tags = el.tags || {};
      const name = tags.name;
      if (!name) continue;
      const key = name.toLowerCase().trim();
      if (seen.has(key)) continue;
      seen.add(key);
      const elat = el.lat ?? el.center?.lat;
      const elng = el.lon ?? el.center?.lon;
      if (typeof elat !== "number" || typeof elng !== "number") continue;
      list.push({
        id: `${el.type}-${el.id}`,
        name,
        lat: elat,
        lng: elng,
        address: buildAddress(tags),
        distance: distanceMiles(lat, lng, elat, elng),
        website: tags.website || tags["contact:website"],
      });
    }
    list.sort((a, b) => a.distance - b.distance);
    setBars(list.slice(0, limit));
    setLoading(false);
  }, [center?.lat, center?.lng, radiusM, limit]);

  useEffect(() => {
    if (center) load();
    else { setBars(null); setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.lat, center?.lng]);

  const submitZip = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = zipInput.trim();
    if (!isValidUsZip(clean)) {
      setError("Enter a valid 5-digit US ZIP.");
      return;
    }
    setResolvingZip(true);
    setError(null);
    const loc = await zipToLatLng(clean);
    setResolvingZip(false);
    if (!loc) {
      setError("ZIP not found.");
      return;
    }
    setManualCenter(loc);
    localStorage.setItem("sportsBarsZip", loc.zip);
  };

  return (
    <Card className="mt-6 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Tv className="w-4 h-4 text-primary" />
          Where to Watch
        </CardTitle>
        {centerLabel && (
          <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-primary" />
            Sports bars near <span className="font-semibold text-foreground">{centerLabel}</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {!center && (
          <form onSubmit={submitZip} className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Enter your ZIP to find sports bars near you.
            </p>
            <div className="flex gap-2">
              <Input
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                placeholder="ZIP code"
                inputMode="numeric"
                maxLength={5}
                className="h-9"
              />
              <Button type="submit" size="sm" disabled={resolvingZip}>
                {resolvingZip ? "…" : "Find"}
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </form>
        )}

        {center && loading && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        )}

        {center && !loading && error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        {center && !loading && bars && bars.length === 0 && (
          <div className="text-center py-6 px-2">
            <Tv className="w-8 h-8 text-primary/50 mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground mb-1">
              No sports bars found nearby. Try a different ZIP code.
            </p>
          </div>
        )}

        {center && !loading && bars && bars.length > 0 && (
          <div className="space-y-2">
            {bars.map((b) => {
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                b.name
              )}&query_place_id=&center=${b.lat},${b.lng}`;
              return (
                <div
                  key={b.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-border/40 hover:bg-muted/50 hover:border-primary/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm text-foreground line-clamp-2">{b.name}</p>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 inline-flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        {b.distance.toFixed(1)} mi
                      </span>
                    </div>
                    {b.address && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{b.address}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Directions <ExternalLink className="w-3 h-3" />
                      </a>
                      {b.website && (
                        <a
                          href={b.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Website <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] text-muted-foreground">Source: OpenStreetMap</p>
              <button
                type="button"
                onClick={() => { setManualCenter(null); setZipInput(""); setBars(null); }}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                Change ZIP
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NearbySportsBars;
