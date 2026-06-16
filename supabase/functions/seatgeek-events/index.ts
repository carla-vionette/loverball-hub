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

// Heuristic: detect World Cup matches by title even when taxonomy is just
// "soccer". Excludes obvious non-soccer uses of the phrase "world cup"
// (classical music showcases, eating contests, rugby/cricket, etc).
const NON_SOCCER_WC = /\b(classical|symphony|orchestra|opera|piano|violin|music|festival|eating|hot ?dog|chili|bbq|wing|pie|coffee|barista|rugby|cricket|polo|chess|esports?|gaming|dog|cat|frisbee|disc|surf|ski|snowboard)\b/i;
function isWorldCupTitle(title: string): boolean {
  if (!/world\s*cup/i.test(title)) return false;
  if (NON_SOCCER_WC.test(title)) return false;
  return true;
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
  // Prefer specific league taxonomies (mls, nwsl, wnba, etc.) over the
  // generic "soccer" parent so we don't misclassify MLS/NWSL games as FIFA_WC.
  const specific = tax.find(s => s !== "soccer" && LEAGUE_MAP[s]);
  if (specific) return LEAGUE_MAP[specific];
  // Only treat generic "soccer" as FIFA_WC when the title hints at it.
  if (tax.includes("soccer") && isWorldCupTitle(ev.title)) {
    return { league: "FIFA_WC", sport_kind: "pro" as const, is_womens: false };
  }
  if (tax.includes("international_soccer")) return LEAGUE_MAP.international_soccer;
  for (const slug of tax) {
    const hit = LEAGUE_MAP[slug];
    if (hit && slug !== "soccer") return hit;
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

  const vi = venueLookup(venue.name || null);
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
    location_lat: vi?.lat ?? null,
    location_lng: vi?.lng ?? null,
  };
}

// ── FIFA World Cup 2026 venues with lat/lng ─────────────────────────────
// Coordinates power the client's 50-mile stadium gating for every host city.
type VenueInfo = { name: string; lat: number; lng: number; city: string; address: string };

const WC26_VENUES: Record<string, Omit<VenueInfo, "name">> = {
  "Estadio Azteca":            { lat: 19.3029, lng: -99.1503,  city: "Mexico City",       address: "Calz. de Tlalpan 3465, Mexico City, MX" },
  "Estadio Akron":             { lat: 20.6816, lng: -103.4628, city: "Guadalajara",       address: "Av. Vallarta s/n, Zapopan, MX" },
  "Estadio BBVA":              { lat: 25.6692, lng: -100.2440, city: "Monterrey",         address: "Av. Pablo Livas, Guadalupe, MX" },
  "BMO Field":                 { lat: 43.6332, lng: -79.4185,  city: "Toronto",           address: "170 Princes' Blvd, Toronto, ON" },
  "BC Place":                  { lat: 49.2767, lng: -123.1119, city: "Vancouver",         address: "777 Pacific Blvd, Vancouver, BC" },
  "Mercedes-Benz Stadium":     { lat: 33.7553, lng: -84.4006,  city: "Atlanta",           address: "1 AMB Dr NW, Atlanta, GA" },
  "Gillette Stadium":          { lat: 42.0909, lng: -71.2643,  city: "Foxborough",        address: "1 Patriot Pl, Foxborough, MA" },
  "AT&T Stadium":              { lat: 32.7473, lng: -97.0945,  city: "Arlington",         address: "1 AT&T Way, Arlington, TX" },
  "NRG Stadium":               { lat: 29.6847, lng: -95.4107,  city: "Houston",           address: "NRG Pkwy, Houston, TX" },
  "Arrowhead Stadium":         { lat: 39.0489, lng: -94.4839,  city: "Kansas City",       address: "1 Arrowhead Dr, Kansas City, MO" },
  "GEHA Field at Arrowhead Stadium": { lat: 39.0489, lng: -94.4839, city: "Kansas City",  address: "1 Arrowhead Dr, Kansas City, MO" },
  "SoFi Stadium":              { lat: 33.9535, lng: -118.3392, city: "Inglewood",         address: "1001 Stadium Dr, Inglewood, CA" },
  "Hard Rock Stadium":         { lat: 25.9580, lng: -80.2389,  city: "Miami Gardens",     address: "347 Don Shula Dr, Miami Gardens, FL" },
  "MetLife Stadium":           { lat: 40.8135, lng: -74.0745,  city: "East Rutherford",   address: "1 MetLife Stadium Dr, East Rutherford, NJ" },
  "Lincoln Financial Field":   { lat: 39.9008, lng: -75.1675,  city: "Philadelphia",      address: "1 Lincoln Financial Field Way, Philadelphia, PA" },
  "Levi's Stadium":            { lat: 37.4030, lng: -121.9700, city: "Santa Clara",       address: "4900 Marie P. DeBartolo Way, Santa Clara, CA" },
  "Lumen Field":               { lat: 47.5952, lng: -122.3316, city: "Seattle",           address: "800 Occidental Ave S, Seattle, WA" },
};

const WC26_VENUE_ALIASES: Record<string, string> = {
  "Mexico City Stadium": "Estadio Azteca",
  "Guadalajara Stadium": "Estadio Akron",
  "Monterrey Stadium": "Estadio BBVA",
  "Toronto Stadium": "BMO Field",
  "Los Angeles Stadium": "SoFi Stadium",
  "San Francisco Bay Area Stadium": "Levi's Stadium",
  "New York/New Jersey Stadium": "MetLife Stadium",
  "Boston Stadium": "Gillette Stadium",
  "Houston Stadium": "NRG Stadium",
  "Dallas Stadium": "AT&T Stadium",
  "Philadelphia Stadium": "Lincoln Financial Field",
  "Atlanta Stadium": "Mercedes-Benz Stadium",
  "Seattle Stadium": "Lumen Field",
  "Miami Stadium": "Hard Rock Stadium",
  "Kansas City Stadium": "Arrowhead Stadium",
};

function venueLookup(name: string | undefined | null): VenueInfo | null {
  if (!name) return null;
  const key = name.trim();
  const alias = WC26_VENUE_ALIASES[key];
  if (alias && WC26_VENUES[alias]) return { name: alias, ...WC26_VENUES[alias] };
  if (WC26_VENUES[key]) return { name: key, ...WC26_VENUES[key] };
  const lower = key.toLowerCase();
  for (const [k, v] of Object.entries(WC26_VENUES)) {
    if (lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)) return { name: k, ...v };
  }
  for (const [generic, canonical] of Object.entries(WC26_VENUE_ALIASES)) {
    if (lower.includes(generic.toLowerCase()) && WC26_VENUES[canonical]) return { name: canonical, ...WC26_VENUES[canonical] };
  }
  return null;
}

interface TheSportsDBEvent {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strVenue: string;
  strCountry?: string;
  strTimestamp?: string;
  dateEvent?: string;
  strTime?: string;
  strThumb?: string | null;
  strPoster?: string | null;
}

// Cache TheSportsDB results in-memory per-isolate for the lifetime of the
// edge worker (TheSportsDB is rate-limited and the WC26 schedule changes
// slowly — only scores/postponements move).
let WC_CACHE: { at: number; events: any[] } | null = null;
const WC_CACHE_MS = 30 * 60 * 1000; // 30 minutes

async function fetchWorldCup2026(): Promise<any[]> {
  if (WC_CACHE && Date.now() - WC_CACHE.at < WC_CACHE_MS) return WC_CACHE.events;
  try {
    const r = await fetch(
      "https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4429&s=2026"
    );
    if (!r.ok) {
      console.error("thesportsdb non-200", r.status);
      return WC_CACHE?.events || [];
    }
    const json = await r.json().catch(() => null) as { events?: TheSportsDBEvent[] } | null;
    const list = Array.isArray(json?.events) ? json!.events : [];
    const mapped = list.map((e) => {
      const vi = venueLookup(e.strVenue);
      const iso = e.strTimestamp
        ? new Date(e.strTimestamp + (/[zZ]|[+-]\d\d:?\d\d$/.test(e.strTimestamp) ? "" : "Z")).toISOString()
        : (e.dateEvent ? new Date(`${e.dateEvent}T${e.strTime || "12:00:00"}Z`).toISOString() : new Date().toISOString());
      const title = e.strEvent || `${e.strHomeTeam} vs ${e.strAwayTeam}`;
      return {
        id: `wc26-${e.idEvent}`,
        title,
        team_home: e.strHomeTeam || "",
        team_away: e.strAwayTeam || "",
        venue_name: e.strVenue || "",
        venue_address: vi?.address || [e.strVenue, e.strCountry].filter(Boolean).join(", "),
        city: vi?.city || "",
        date_time: iso,
        league: "FIFA_WC",
        sport_kind: "pro" as const,
        is_womens: false,
        ticket_url: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026",
        image_url: e.strThumb || e.strPoster || null,
        location_lat: vi?.lat ?? null,
        location_lng: vi?.lng ?? null,
      };
    });
    WC_CACHE = { at: Date.now(), events: mapped };
    return mapped;
  } catch (err) {
    console.error("thesportsdb fetch error", err);
    return WC_CACHE?.events || [];
  }
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
  let range = "50mi"; let perPage = 100;
  let worldCupGlobal = false;
  if (req.method === "POST") {
    try {
      const body = await req.json().catch(() => ({}));
      zip = String(body?.zip ?? "").trim();
      if (body?.lat != null) lat = String(body.lat);
      if (body?.lng != null) lng = String(body.lng);
      if (body?.range) range = String(body.range);
      if (body?.per_page) perPage = Math.min(parseInt(String(body.per_page), 10) || 100, 200);
      if (body?.world_cup_global) worldCupGlobal = true;
    } catch { /* fall through to validation */ }
  } else {
    const url = new URL(req.url);
    zip = (url.searchParams.get("zip") || "").trim();
    lat = url.searchParams.get("lat");
    lng = url.searchParams.get("lng");
    range = url.searchParams.get("range") || range;
    perPage = Math.min(parseInt(url.searchParams.get("per_page") || "100", 10) || 100, 200);
    worldCupGlobal = url.searchParams.get("world_cup_global") === "1";
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

  // ── Local query: pro + collegiate + international soccer near user ───
  const localParams = new URLSearchParams({
    client_id: CLIENT_ID,
    "taxonomies.name": TAXONOMY_SLUGS,
    "datetime_utc.gte": new Date().toISOString(),
    sort: "datetime_local.asc",
    per_page: String(perPage),
    range,
  });
  if (hasZip) localParams.set("postal_code", zip);
  else { localParams.set("lat", lat!); localParams.set("lon", lng!); }

  // Redact client_id from any logged URL
  const redact = (p: URLSearchParams) => {
    const s = new URLSearchParams(p);
    s.set("client_id", "***");
    return `${BASE}?${s.toString()}`;
  };

  async function fetchOne(p: URLSearchParams): Promise<any | null> {
    try {
      const r = await fetch(`${BASE}?${p.toString()}`);
      if (!r.ok) {
        const text = await r.text().catch(() => "");
        console.error("seatgeek upstream non-200", { url: redact(p), status: r.status, body: text.slice(0, 500) });
        return null;
      }
      return await r.json();
    } catch (err) {
      console.error("seatgeek-events network error", { url: redact(p), error: String(err) });
      return null;
    }
  }

  // Run SeatGeek local query and the canonical WC26 fixture pull in parallel.
  const [localJson, wcEvents] = await Promise.all([
    fetchOne(localParams),
    fetchWorldCup2026(),
  ]);

  if (!localJson && wcEvents.length === 0) return fallback("upstream_error");

  const localEvents = Array.isArray(localJson?.events) ? localJson.events.map(normalize).filter(Boolean) : [];

  // Merge + dedupe by id. WC26 wins on conflict so the canonical fixture
  // (with verified venue coords) overrides any SeatGeek WC duplicates.
  const byId = new Map<string, any>();
  for (const e of localEvents) byId.set(e.id, e);
  for (const e of wcEvents) byId.set(e.id, e);
  const events = Array.from(byId.values());

  return new Response(JSON.stringify({ events }), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=120, s-maxage=600",
    },
  });
});
