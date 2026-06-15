// where-to-watch-spots — unified Where-to-Watch resolver.
// Priority pipeline: official events → partner → curated → community pins →
// Google Places nearby → static fallback. Returns ranked WatchSpot[].
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

type Source = "official" | "partner" | "curated" | "community" | "places" | "fallback";

interface WatchSpot {
  id: string;
  source: Source;
  name: string;
  neighborhood?: string;
  city: string;
  distanceMi?: number;
  rating?: number;
  reviewCount?: number;
  vibe?: string;
  vibeTags: string[];
  lat?: number;
  lng?: number;
  website?: string;
  mapsUrl: string;
  watchingCount: number;
  rank: number;
  // optional pointers for check-in
  watchLocationId?: string;
  placeExternalId?: string;
  eventId?: string;
  eventSlug?: string;
}

interface Body {
  kind: "game" | "event";
  externalGameId?: string;
  eventId?: string;
  league?: string;
  homeTeam?: string;
  awayTeam?: string;
  city?: string;
  lat?: number;
  lng?: number;
  radiusMiles?: number;
  startTime?: string; // ISO
}

const rateMap = new Map<string, { count: number; windowStart: number }>();
function rateOk(key: string) {
  const now = Date.now();
  const e = rateMap.get(key);
  if (!e || now - e.windowStart > 60_000) {
    rateMap.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (e.count >= 60) return false;
  e.count++;
  return true;
}

function mapsUrl(name: string, lat?: number, lng?: number, city?: string) {
  const q = encodeURIComponent(`${name}${city ? ", " + city : ""}`);
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${q}&center=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function distanceMi(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const SOURCE_WEIGHT: Record<Source, number> = {
  official: 60,
  partner: 50,
  curated: 40,
  community: 35,
  places: 25,
  fallback: 10,
};

function rankSpot(s: WatchSpot, body: Body): number {
  let score = SOURCE_WEIGHT[s.source];
  if (s.distanceMi != null) score += Math.max(0, 20 - s.distanceMi * 2);
  score += Math.min(20, s.watchingCount * 4);
  const league = (body.league || "").toLowerCase();
  if (league && s.vibeTags.some((t) => t.toLowerCase().includes(league))) score += 8;
  if (s.vibeTags.includes("womens-sports-crowd")) score += 6;
  if (s.rating && s.rating >= 4.3) score += 4;
  return score;
}

async function fetchPlacesNearby(body: Body): Promise<WatchSpot[]> {
  if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY || body.lat == null || body.lng == null) return [];
  const radius = Math.round(Math.min(Math.max(body.radiusMiles ?? 5, 1), 25) * 1609.34);
  try {
    const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchNearby`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
        "Content-Type": "application/json",
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.shortFormattedAddress",
          "places.location",
          "places.rating",
          "places.userRatingCount",
          "places.primaryTypeDisplayName",
          "places.editorialSummary",
          "places.websiteUri",
        ].join(","),
      },
      body: JSON.stringify({
        includedTypes: ["sports_bar", "bar", "pub"],
        maxResultCount: 15,
        rankPreference: "DISTANCE",
        locationRestriction: {
          circle: { center: { latitude: body.lat, longitude: body.lng }, radius },
        },
      }),
    });
    if (!res.ok) {
      console.warn("places searchNearby failed", res.status, await res.text());
      return [];
    }
    const data = await res.json();
    const places = Array.isArray(data?.places) ? data.places : [];
    return places.map((p: any): WatchSpot => {
      const name = p?.displayName?.text || "Sports Bar";
      const lat = p?.location?.latitude;
      const lng = p?.location?.longitude;
      const neighborhood = (p?.shortFormattedAddress || "").split(",")[0]?.trim();
      const dist =
        body.lat != null && body.lng != null && lat != null && lng != null
          ? distanceMi(body.lat, body.lng, lat, lng)
          : undefined;
      return {
        id: `places:${p?.id || name}`,
        source: "places",
        name,
        neighborhood,
        city: body.city || (p?.formattedAddress?.split(",")[1] || "").trim() || "",
        distanceMi: dist,
        rating: typeof p?.rating === "number" ? p.rating : undefined,
        reviewCount: typeof p?.userRatingCount === "number" ? p.userRatingCount : undefined,
        vibe: p?.editorialSummary?.text || p?.primaryTypeDisplayName?.text || "Sports bar",
        vibeTags: ["nearby"],
        lat,
        lng,
        website: p?.websiteUri,
        mapsUrl: mapsUrl(name, lat, lng, body.city),
        watchingCount: 0,
        rank: 0,
        placeExternalId: p?.id,
      };
    });
  } catch (e) {
    console.warn("places error", e);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  if (!rateOk(ip)) {
    return new Response(JSON.stringify({ error: "rate_limited", spots: [] }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    if (body.kind !== "game" && body.kind !== "event") {
      return new Response(JSON.stringify({ error: "invalid_kind", spots: [] }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const spots: WatchSpot[] = [];
    const sources: Record<string, "ok" | "empty" | "error"> = {};

    // 1. Official watch_party events (city + relevant tag + within +/- 1 day of start)
    try {
      const startDay = body.startTime
        ? new Date(body.startTime).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      let q = supabase
        .from("events")
        .select("id, slug, title, venue_name, city, neighborhood, event_date, event_time, sport_tags, event_tags, image_url")
        .eq("event_type", "watch_party")
        .eq("visibility", "public")
        .gte("event_date", startDay)
        .lte("event_date", startDay)
        .limit(10);
      if (body.city) q = q.ilike("city", `%${body.city}%`);
      const { data } = await q;
      sources.official = (data?.length ?? 0) > 0 ? "ok" : "empty";
      for (const e of data || []) {
        spots.push({
          id: `event:${e.id}`,
          source: "official",
          name: e.title,
          neighborhood: (e as any).neighborhood ?? undefined,
          city: e.city || body.city || "",
          vibe: e.venue_name ? `Official watch party at ${e.venue_name}` : "Official Loverball watch party",
          vibeTags: ["official-watch-party", ...(e.sport_tags || []), ...(e.event_tags || [])],
          mapsUrl: e.venue_name ? mapsUrl(e.venue_name, undefined, undefined, e.city || body.city) : "#",
          watchingCount: 0,
          rank: 0,
          eventId: e.id,
          eventSlug: e.slug ?? undefined,
        });
      }
    } catch (e) {
      sources.official = "error";
      console.warn("official query failed", e);
    }

    // 2 + 3. Partner & curated watch_locations (city match)
    try {
      let q = supabase
        .from("watch_locations")
        .select("id, name, neighborhood, city, state, address, latitude, longitude, website, vibe_tags, leagues_supported, is_partner, short_description, rating, review_count")
        .eq("status", "approved");
      if (body.city) q = q.ilike("city", `%${body.city}%`);
      const { data } = await q.limit(20);
      sources.curated = (data?.length ?? 0) > 0 ? "ok" : "empty";
      for (const l of data || []) {
        const lat = l.latitude as number | null;
        const lng = l.longitude as number | null;
        const dist =
          body.lat != null && body.lng != null && lat != null && lng != null
            ? distanceMi(body.lat, body.lng, lat, lng)
            : undefined;
        spots.push({
          id: `loc:${l.id}`,
          source: l.is_partner ? "partner" : "curated",
          name: l.name,
          neighborhood: l.neighborhood ?? undefined,
          city: l.city,
          distanceMi: dist,
          rating: (l as any).rating ?? undefined,
          reviewCount: (l as any).review_count ?? undefined,
          vibe: (l as any).short_description ?? undefined,
          vibeTags: l.vibe_tags || [],
          lat: lat ?? undefined,
          lng: lng ?? undefined,
          website: l.website ?? undefined,
          mapsUrl: mapsUrl(l.name, lat ?? undefined, lng ?? undefined, l.city),
          watchingCount: 0,
          rank: 0,
          watchLocationId: l.id,
        });
      }
    } catch (e) {
      sources.curated = "error";
      console.warn("curated query failed", e);
    }

    // 4. Community pins for this game/event
    try {
      let q = supabase
        .from("watch_location_pins")
        .select("id, watch_location_id, note, upvote_count, event_id, external_game_id")
        .eq("status", "approved")
        .order("upvote_count", { ascending: false })
        .limit(15);
      if (body.kind === "event" && body.eventId) q = q.eq("event_id", body.eventId);
      else if (body.kind === "game" && body.externalGameId) q = q.eq("external_game_id", body.externalGameId);
      else q = q.eq("event_id", "00000000-0000-0000-0000-000000000000");
      const { data: pins } = await q;
      sources.community = (pins?.length ?? 0) > 0 ? "ok" : "empty";
      const locIds = Array.from(new Set((pins || []).map((p: any) => p.watch_location_id)));
      const { data: locs } = locIds.length
        ? await supabase
            .from("watch_locations")
            .select("id, name, neighborhood, city, latitude, longitude, website, vibe_tags, is_partner, short_description, rating, review_count")
            .in("id", locIds)
        : { data: [] as any[] };
      const locMap = new Map((locs || []).map((l: any) => [l.id, l]));
      for (const p of pins || []) {
        const l = locMap.get(p.watch_location_id);
        if (!l) continue;
        // avoid duplicating same location already added as curated
        if (spots.find((s) => s.watchLocationId === l.id)) continue;
        const dist =
          body.lat != null && body.lng != null && l.latitude != null && l.longitude != null
            ? distanceMi(body.lat, body.lng, l.latitude, l.longitude)
            : undefined;
        spots.push({
          id: `pin:${p.id}`,
          source: "community",
          name: l.name,
          neighborhood: l.neighborhood ?? undefined,
          city: l.city,
          distanceMi: dist,
          rating: l.rating ?? undefined,
          reviewCount: l.review_count ?? undefined,
          vibe: p.note || l.short_description || undefined,
          vibeTags: [...(l.vibe_tags || []), `community:+${p.upvote_count}`],
          lat: l.latitude ?? undefined,
          lng: l.longitude ?? undefined,
          website: l.website ?? undefined,
          mapsUrl: mapsUrl(l.name, l.latitude, l.longitude, l.city),
          watchingCount: 0,
          rank: 0,
          watchLocationId: l.id,
        });
      }
    } catch (e) {
      sources.community = "error";
      console.warn("community query failed", e);
    }

    // 5. Google Places nearby (only if we have coords)
    if (body.lat != null && body.lng != null) {
      const placesResults = await fetchPlacesNearby(body);
      sources.places = placesResults.length > 0 ? "ok" : "empty";
      // Cap so they don't drown DB-sourced spots
      spots.push(...placesResults.slice(0, 10));
    } else {
      sources.places = "skipped" as any;
    }

    // 6. Aggregate watcher counts from check-ins
    try {
      const { data: counts } = await supabase.rpc("get_watch_checkin_counts", {
        p_game_ids: body.externalGameId ? [body.externalGameId] : null,
        p_event_ids: body.eventId ? [body.eventId] : null,
      });
      if (Array.isArray(counts)) {
        for (const c of counts) {
          const match = spots.find((s) => {
            if (c.watch_location_id && s.watchLocationId === c.watch_location_id) return true;
            if (c.place_external_id && s.placeExternalId === c.place_external_id) return true;
            if (c.place_name && s.name.toLowerCase() === String(c.place_name).toLowerCase()) return true;
            return false;
          });
          if (match) match.watchingCount = Number(c.watcher_count) || 0;
        }
      }
    } catch (e) {
      console.warn("checkin counts failed", e);
    }

    // 7. Rank
    for (const s of spots) s.rank = rankSpot(s, body);
    spots.sort((a, b) => b.rank - a.rank);

    // 8. Truncate
    const final = spots.slice(0, 12);

    // Determine overall state for client UX
    let state: "live-ok" | "places-failed-curated" | "no-local-suggested" | "empty";
    if (final.length === 0) state = "empty";
    else if (sources.places === "error" && final.length > 0) state = "places-failed-curated";
    else if (sources.official === "empty" && sources.curated === "empty" && sources.community === "empty")
      state = "no-local-suggested";
    else state = "live-ok";

    return new Response(
      JSON.stringify({
        spots: final,
        sources,
        state,
        updatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("where-to-watch-spots error", e);
    return new Response(JSON.stringify({ error: "internal", spots: [], state: "empty" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
