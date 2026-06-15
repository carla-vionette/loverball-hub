// Proxies Google Places API (New) :searchNearby through the Lovable connector
// gateway to find sports bars within a given radius of a lat/lng.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");

interface NearbyReq {
  lat?: number;
  lng?: number;
  radiusMiles?: number;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Google Maps connector not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json().catch(() => ({}))) as NearbyReq;
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const radiusMiles = Math.min(Math.max(Number(body.radiusMiles) || 5, 1), 25);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return new Response(
        JSON.stringify({ error: "Invalid lat/lng" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const radiusMeters = Math.round(radiusMiles * 1609.34);

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
        ].join(","),
      },
      body: JSON.stringify({
        includedTypes: ["sports_bar", "bar", "pub"],
        maxResultCount: 20,
        rankPreference: "DISTANCE",
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: radiusMeters,
          },
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch { /* keep raw */ }
      const googleStatus = parsed?.error?.status || parsed?.error?.details?.[0]?.reason || null;
      const googleMessage = parsed?.error?.message || null;
      const fallbackReason =
        res.status === 403 && /referrer|REFERER|API_KEY_HTTP_REFERRER_BLOCKED/i.test(text)
          ? "referrer_blocked"
          : res.status === 403
          ? "forbidden"
          : res.status === 429
          ? "rate_limited"
          : res.status >= 500
          ? "places_upstream_error"
          : "places_request_failed";
      console.error(JSON.stringify({
        scope: "nearby-sports-bars",
        event: "places_searchNearby_failed",
        http_status: res.status,
        google_status: googleStatus,
        google_message: googleMessage,
        fallback_reason: fallbackReason,
        raw: text.slice(0, 500),
      }));
      return new Response(
        JSON.stringify({
          error: "Places API error",
          status: res.status,
          fallback_reason: fallbackReason,
          google_status: googleStatus,
          google_message: googleMessage,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await res.json();
    const places = Array.isArray(data?.places) ? data.places : [];

    const bars = places.map((p: any) => {
      const name = p?.displayName?.text || "Sports Bar";
      const neighborhood = (p?.shortFormattedAddress || p?.formattedAddress || "")
        .split(",")
        .slice(0, 2)
        .join(",")
        .trim() || (p?.primaryTypeDisplayName?.text ?? "Nearby");
      return {
        id: p?.id ? `g_${p.id}` : `g_${slugify(name)}`,
        name,
        neighborhood,
        vibe: p?.editorialSummary?.text || p?.primaryTypeDisplayName?.text || "Sports bar",
        lat: p?.location?.latitude ?? null,
        lng: p?.location?.longitude ?? null,
        rating: typeof p?.rating === "number" ? p.rating : 0,
        review_count: typeof p?.userRatingCount === "number" ? p.userRatingCount : 0,
        address: p?.formattedAddress || null,
      };
    }).filter((b: any) => b.lat != null && b.lng != null);

    return new Response(JSON.stringify({ bars }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("nearby-sports-bars error", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
