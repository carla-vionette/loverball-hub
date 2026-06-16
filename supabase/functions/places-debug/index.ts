// TEMP DEBUG: Probes Google Places (New) searchNearby with the same key/
// pathway as nearby-sports-bars. Anon-callable for debugging only.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const GOOGLE_PLACES_SERVER_KEY = Deno.env.get("GOOGLE_PLACES_SERVER_KEY");
  const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  const env = {
    has_server_key: !!GOOGLE_PLACES_SERVER_KEY,
    server_key_len: GOOGLE_PLACES_SERVER_KEY?.length ?? 0,
    has_connector_key: !!GOOGLE_MAPS_API_KEY,
    has_lovable_key: !!LOVABLE_API_KEY,
  };

  // Test direct Places (New) with server key
  let direct: any = { tried: false };
  if (GOOGLE_PLACES_SERVER_KEY) {
    direct = { tried: true };
    try {
      const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
        method: "POST",
        headers: {
          "X-Goog-Api-Key": GOOGLE_PLACES_SERVER_KEY,
          "Content-Type": "application/json",
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
        },
        body: JSON.stringify({
          includedTypes: ["sports_bar", "bar", "pub"],
          maxResultCount: 5,
          locationRestriction: {
            circle: { center: { latitude: 34.0522, longitude: -118.2437 }, radius: 5000 },
          },
        }),
      });
      const text = await res.text();
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch {}
      direct.status = res.status;
      direct.ok = res.ok;
      direct.place_count = parsed?.places?.length ?? 0;
      direct.first_place = parsed?.places?.[0]?.displayName?.text ?? null;
      direct.error_status = parsed?.error?.status ?? null;
      direct.error_message = parsed?.error?.message ?? null;
      direct.raw_snippet = text.slice(0, 400);
    } catch (e) {
      direct.exception = String(e);
    }
  }

  // Test connector gateway path
  let gateway: any = { tried: false };
  if (LOVABLE_API_KEY && GOOGLE_MAPS_API_KEY) {
    gateway = { tried: true };
    try {
      const res = await fetch(
        "https://connector-gateway.lovable.dev/google_maps/places/v1/places:searchNearby",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
            "Content-Type": "application/json",
            "X-Goog-FieldMask": "places.id,places.displayName",
          },
          body: JSON.stringify({
            includedTypes: ["sports_bar", "bar", "pub"],
            maxResultCount: 5,
            locationRestriction: {
              circle: { center: { latitude: 34.0522, longitude: -118.2437 }, radius: 5000 },
            },
          }),
        },
      );
      const text = await res.text();
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch {}
      gateway.status = res.status;
      gateway.ok = res.ok;
      gateway.place_count = parsed?.places?.length ?? 0;
      gateway.error_status = parsed?.error?.status ?? null;
      gateway.error_message = parsed?.error?.message ?? null;
      gateway.raw_snippet = text.slice(0, 400);
    } catch (e) {
      gateway.exception = String(e);
    }
  }

  return new Response(JSON.stringify({ env, direct, gateway }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
