// seatgeek-events: server-side proxy for the SeatGeek Public API so the
// client_id is never exposed in the client bundle. Returns a normalized
// payload tailored to the Events tab (pro + collegiate sports near a ZIP).
//
// Auth: requires a Supabase user JWT (verify_jwt = true by default).
// Rate limit: 60 req / 15 min per user, enforced via check_rate_limit RPC.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const CLIENT_ID = Deno.env.get("SEATGEEK_CLIENT_ID") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BASE = "https://api.seatgeek.com/2/events";

// SeatGeek taxonomy slug → our League code + women's flag.
const LEAGUE_MAP: Record<string, { league: string; sport_kind: "pro" | "college"; is_womens: boolean }> = {
  nfl:                     { league: "NFL",        sport_kind: "pro",     is_womens: false },
  nba:                     { league: "NBA",        sport_kind: "pro",     is_womens: false },
  wnba:                    { league: "WNBA",       sport_kind: "pro",     is_womens: true  },
  nwsl:                    { league: "NWSL",       sport_kind: "pro",     is_womens: true  },
  mls:                     { league: "MLS",        sport_kind: "pro",     is_womens: false },
  mlb:                     { league: "MLB",        sport_kind: "pro",     is_womens: false },
  nhl:                     { league: "NHL",        sport_kind: "pro",     is_womens: false },
  ncaa_football:           { league: "NCAAF",      sport_kind: "college", is_womens: false },
  ncaa_basketball:         { league: "NCAAM",      sport_kind: "college", is_womens: false },
  ncaa_womens_basketball:  { league: "NCAAW",      sport_kind: "college", is_womens: true  },
  ncaa_soccer:             { league: "NCAA_SOCCER",sport_kind: "college", is_womens: false },
  ncaa_womens_soccer:      { league: "NCAA_SOCCER",sport_kind: "college", is_womens: true  },
  // FIFA World Cup 2026 + international friendlies fall under SeatGeek's
  // "international_soccer" taxonomy. Surface them under their own league
  // code so the client can render special "Where to Watch" UI.
  international_soccer:    { league: "FIFA_WC",    sport_kind: "pro",     is_womens: false },
  soccer:                  { league: "FIFA_WC",    sport_kind: "pro",     is_womens: false },
};

const TAXONOMY_SLUGS = Object.keys(LEAGUE_MAP).join(",");

// Heuristic: detect World Cup matches by title even when taxonomy is just "soccer".
function isWorldCupTitle(title: string): boolean {
  return /world\s*cup/i.test(title);
}

interface SeatGeekEvent {
  id: number;
  title: string;
  datetime_local: string;
  url: string;
  taxonomies?: { name: string }[];
  performers?: { name: string; home_team?: boolean; image?: string | null; image_attribution?: string }[];
  venue?: { name?: string; address?: string; extended_address?: string; city?: string; state?: string };
}

function pickLeague(ev: SeatGeekEvent) {
  const tax = ev.taxonomies?.map(t => t.name) || [];
  for (const slug of tax) {
    const hit = LEAGUE_MAP[slug];
    if (hit) return hit;
  }
  return null;
}

function normalize(ev: SeatGeekEvent) {
  const lg = pickLeague(ev);
  if (!lg) return null;

  const home = ev.performers?.find(p => p.home_team) ?? ev.performers?.[0];
  const away = ev.performers?.find(p => p !== home) ?? null;
  const venue = ev.venue || {};
  const venue_address = [venue.address, venue.extended_address, venue.city, venue.state]
    .filter(Boolean).join(", ");

  return {
    id: `sg-${ev.id}`,
    title: ev.title,
    team_home: home?.name || "",
    team_away: away?.name || "",
    venue_name: venue.name || "",
    venue_address,
    city: venue.city || "",
    date_time: ev.datetime_local,
    league: lg.league,
    sport_kind: lg.sport_kind,
    is_womens: lg.is_womens,
    ticket_url: ev.url,
    image_url: home?.image || null,
  };
}

function fallback(reason: string, extra: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({ events: [], fallback: true, reason, ...extra }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // ── Validate required env vars ───────────────────────────────────────
  const missingEnv: string[] = [];
  if (!CLIENT_ID) missingEnv.push("SEATGEEK_CLIENT_ID");
  if (!SUPABASE_URL) missingEnv.push("SUPABASE_URL");
  if (!SUPABASE_ANON) missingEnv.push("SUPABASE_ANON_KEY");
  if (!SERVICE_ROLE) missingEnv.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missingEnv.length) {
    console.error("seatgeek-events missing env vars:", missingEnv.join(", "));
    return fallback("missing_env", { missing: missingEnv });
  }

  // ── Auth ─────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Rate limit (60 req / 15 min) ─────────────────────────────────────
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: allowed } = await admin.rpc("check_rate_limit", {
    p_user_id: user.id,
    p_action_type: "seatgeek_events",
    p_max_requests: 60,
    p_window_minutes: 15,
  });
  if (allowed === false) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Validate input (accepts GET query params OR POST JSON body) ──────
  let zip = "", lat: string | null = null, lng: string | null = null;
  let range = "50mi"; let perPage = 50;
  if (req.method === "POST") {
    try {
      const body = await req.json().catch(() => ({}));
      zip = String(body?.zip ?? "").trim();
      if (body?.lat != null) lat = String(body.lat);
      if (body?.lng != null) lng = String(body.lng);
      if (body?.range) range = String(body.range);
      if (body?.per_page) perPage = Math.min(parseInt(String(body.per_page), 10) || 50, 100);
    } catch { /* fall through to validation */ }
  } else {
    const url = new URL(req.url);
    zip = (url.searchParams.get("zip") || "").trim();
    lat = url.searchParams.get("lat");
    lng = url.searchParams.get("lng");
    range = url.searchParams.get("range") || range;
    perPage = Math.min(parseInt(url.searchParams.get("per_page") || "50", 10) || 50, 100);
  }

  const hasZip = /^\d{5}$/.test(zip);
  const hasLatLng = lat && lng && !isNaN(+lat) && !isNaN(+lng);
  if (!hasZip && !hasLatLng) {
    return new Response(JSON.stringify({ error: "zip or lat+lng required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!/^\d{1,3}(mi|km)$/i.test(range)) {
    return new Response(JSON.stringify({ error: "invalid range" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    "taxonomies.name": TAXONOMY_SLUGS,
    "datetime_utc.gte": new Date().toISOString(),
    sort: "datetime_local.asc",
    per_page: String(perPage),
    range,
  });
  if (hasZip) params.set("postal_code", zip);
  else { params.set("lat", lat!); params.set("lon", lng!); }

  // Redact client_id from any logged URL
  const safeParams = new URLSearchParams(params);
  safeParams.set("client_id", "***");
  const safeUrl = `${BASE}?${safeParams.toString()}`;

  let upstream: Response;
  try {
    upstream = await fetch(`${BASE}?${params.toString()}`);
  } catch (err) {
    console.error("seatgeek-events network error", { url: safeUrl, error: String(err) });
    return fallback("network_error");
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    let parsed: unknown = null;
    try { parsed = JSON.parse(text); } catch { /* not json */ }
    console.error("seatgeek upstream non-200", {
      url: safeUrl,
      status: upstream.status,
      body: text.slice(0, 500),
      parsed,
    });
    return fallback("upstream_error", { status: upstream.status, details: parsed });
  }

  let json: any;
  try {
    json = await upstream.json();
  } catch (err) {
    console.error("seatgeek-events JSON parse error", { url: safeUrl, error: String(err) });
    return fallback("parse_error");
  }

  const events = Array.isArray(json?.events)
    ? json.events.map(normalize).filter(Boolean)
    : [];

  return new Response(JSON.stringify({ events }), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=120, s-maxage=600",
    },
  });
});
