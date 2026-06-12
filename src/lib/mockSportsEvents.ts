// Mock external sports events used to populate the Events tab when a user
// sets a ZIP code. Replace with SeatGeek (or equivalent) by flipping
// USE_MOCK_DATA to false and wiring fetchExternalSportsEvents().
//
// Each mock event maps to the same DbEvent shape consumed by Events.tsx,
// plus a few extra fields surfaced via the `__` namespace for client-side
// filtering and click routing (since mock events have no DB row).

import { addDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

// Flip to `false` to hit the live SeatGeek proxy edge function instead of
// returning mock metro fixtures. Requires the SEATGEEK_CLIENT_ID secret
// to be configured on the seatgeek-events function.
export const USE_MOCK_DATA = false;

export type SportKind = "pro" | "college";
export type League =
  | "NFL" | "NBA" | "WNBA" | "NWSL" | "MLS" | "MLB" | "NHL"
  | "NCAAF" | "NCAAM" | "NCAAW" | "NCAA_SOCCER" | "FIFA_WC";

export interface MockSportsEvent {
  id: string;
  title: string;
  team_home: string;
  team_away: string;
  venue_name: string;
  venue_address: string;
  date_time: string;       // ISO
  league: League;
  sport: string;
  sport_kind: SportKind;
  is_womens: boolean;
  ticket_url?: string;
  image_url?: string;
  city: string;
}

// ── ZIP → metro mapping ────────────────────────────────────────────────
// Coarse map by 3-digit ZIP prefix. Good enough for a soft, local feel
// without depending on a geocoder for every lookup.
interface Metro {
  city: string;
  pro: Partial<Record<League, { team: string; venue: string; address: string }[]>>;
  colleges: { name: string; sport: League[]; venue: string }[];
}

const METROS: Record<string, Metro> = {
  LA: {
    city: "Los Angeles",
    pro: {
      NBA:  [{ team: "Los Angeles Lakers",  venue: "Crypto.com Arena", address: "1111 S Figueroa St, Los Angeles, CA" }],
      WNBA: [{ team: "Los Angeles Sparks",  venue: "Crypto.com Arena", address: "1111 S Figueroa St, Los Angeles, CA" }],
      NWSL: [{ team: "Angel City FC",       venue: "BMO Stadium",      address: "3939 S Figueroa St, Los Angeles, CA" }],
      MLS:  [{ team: "LAFC",                venue: "BMO Stadium",      address: "3939 S Figueroa St, Los Angeles, CA" }],
      MLB:  [{ team: "Los Angeles Dodgers", venue: "Dodger Stadium",   address: "1000 Vin Scully Ave, Los Angeles, CA" }],
      NHL:  [{ team: "LA Kings",            venue: "Crypto.com Arena", address: "1111 S Figueroa St, Los Angeles, CA" }],
      NFL:  [{ team: "Los Angeles Rams",    venue: "SoFi Stadium",     address: "1001 Stadium Dr, Inglewood, CA" }],
    },
    colleges: [
      { name: "USC Trojans",  sport: ["NCAAF", "NCAAM", "NCAAW", "NCAA_SOCCER"], venue: "Galen Center / Coliseum" },
      { name: "UCLA Bruins",  sport: ["NCAAF", "NCAAM", "NCAAW", "NCAA_SOCCER"], venue: "Pauley Pavilion / Rose Bowl" },
    ],
  },
  NYC: {
    city: "New York",
    pro: {
      NBA:  [{ team: "New York Knicks",     venue: "Madison Square Garden", address: "4 Pennsylvania Plaza, New York, NY" }],
      WNBA: [{ team: "New York Liberty",    venue: "Barclays Center",       address: "620 Atlantic Ave, Brooklyn, NY" }],
      NWSL: [{ team: "NJ/NY Gotham FC",     venue: "Red Bull Arena",        address: "600 Cape May St, Harrison, NJ" }],
      MLS:  [{ team: "NYCFC",               venue: "Yankee Stadium",        address: "1 E 161 St, Bronx, NY" }],
      MLB:  [{ team: "New York Yankees",    venue: "Yankee Stadium",        address: "1 E 161 St, Bronx, NY" }],
      NHL:  [{ team: "New York Rangers",    venue: "Madison Square Garden", address: "4 Pennsylvania Plaza, New York, NY" }],
      NFL:  [{ team: "New York Giants",     venue: "MetLife Stadium",       address: "1 MetLife Stadium Dr, East Rutherford, NJ" }],
    },
    colleges: [
      { name: "St. John's Red Storm", sport: ["NCAAM", "NCAAW"], venue: "Carnesecca Arena" },
      { name: "Columbia Lions",       sport: ["NCAAF", "NCAA_SOCCER"], venue: "Wien Stadium" },
    ],
  },
  CHI: {
    city: "Chicago",
    pro: {
      NBA:  [{ team: "Chicago Bulls",     venue: "United Center",      address: "1901 W Madison St, Chicago, IL" }],
      WNBA: [{ team: "Chicago Sky",       venue: "Wintrust Arena",     address: "200 E Cermak Rd, Chicago, IL" }],
      NWSL: [{ team: "Chicago Red Stars", venue: "SeatGeek Stadium",   address: "7000 S Harlem Ave, Bridgeview, IL" }],
      MLS:  [{ team: "Chicago Fire FC",   venue: "Soldier Field",      address: "1410 Special Olympics Dr, Chicago, IL" }],
      MLB:  [{ team: "Chicago Cubs",      venue: "Wrigley Field",      address: "1060 W Addison St, Chicago, IL" }],
      NHL:  [{ team: "Chicago Blackhawks",venue: "United Center",      address: "1901 W Madison St, Chicago, IL" }],
      NFL:  [{ team: "Chicago Bears",     venue: "Soldier Field",      address: "1410 Special Olympics Dr, Chicago, IL" }],
    },
    colleges: [
      { name: "Northwestern Wildcats", sport: ["NCAAF", "NCAAM", "NCAAW", "NCAA_SOCCER"], venue: "Welsh-Ryan Arena" },
      { name: "DePaul Blue Demons",    sport: ["NCAAM", "NCAAW"], venue: "Wintrust Arena" },
    ],
  },
  SF: {
    city: "San Francisco",
    pro: {
      NBA:  [{ team: "Golden State Warriors", venue: "Chase Center",     address: "1 Warriors Way, San Francisco, CA" }],
      WNBA: [{ team: "Golden State Valkyries", venue: "Chase Center",    address: "1 Warriors Way, San Francisco, CA" }],
      NWSL: [{ team: "Bay FC",                venue: "PayPal Park",      address: "1123 Coleman Ave, San Jose, CA" }],
      MLS:  [{ team: "San Jose Earthquakes",  venue: "PayPal Park",      address: "1123 Coleman Ave, San Jose, CA" }],
      MLB:  [{ team: "San Francisco Giants",  venue: "Oracle Park",      address: "24 Willie Mays Plaza, San Francisco, CA" }],
      NHL:  [{ team: "San Jose Sharks",       venue: "SAP Center",       address: "525 W Santa Clara St, San Jose, CA" }],
      NFL:  [{ team: "San Francisco 49ers",   venue: "Levi's Stadium",   address: "4900 Marie P DeBartolo Way, Santa Clara, CA" }],
    },
    colleges: [
      { name: "Stanford Cardinal", sport: ["NCAAF", "NCAAM", "NCAAW", "NCAA_SOCCER"], venue: "Maples Pavilion" },
      { name: "Cal Golden Bears",  sport: ["NCAAF", "NCAAM", "NCAAW", "NCAA_SOCCER"], venue: "Haas Pavilion" },
    ],
  },
};

// Loose ZIP → metro lookup. Falls back to LA so users always see something
// to interact with while we wire the live data source.
function metroForZip(zip?: string | null): Metro {
  if (!zip || zip.length < 3) return METROS.LA;
  const p = zip.slice(0, 3);
  // West coast
  if (/^90[0-9]|^91[0-9]|^92[0-9]|^93[0-9]/.test(p)) return METROS.LA;
  if (/^94[0-9]|^95[0-9]/.test(p)) return METROS.SF;
  // Midwest
  if (/^60[0-6]/.test(p)) return METROS.CHI;
  // East coast
  if (/^10[0-9]|^11[0-9]|^07[0-9]/.test(p)) return METROS.NYC;
  return METROS.LA;
}

function metroForCity(city?: string | null): Metro | null {
  if (!city) return null;
  const c = city.toLowerCase();
  if (c.includes("los angeles") || c.includes("inglewood")) return METROS.LA;
  if (c.includes("new york") || c.includes("brooklyn") || c.includes("bronx")) return METROS.NYC;
  if (c.includes("chicago")) return METROS.CHI;
  if (c.includes("san francisco") || c.includes("san jose") || c.includes("oakland")) return METROS.SF;
  return null;
}

const LEAGUE_SPORT: Record<League, string> = {
  NFL: "football", NBA: "basketball", WNBA: "basketball",
  NWSL: "soccer", MLS: "soccer", MLB: "baseball", NHL: "hockey",
  NCAAF: "football", NCAAM: "basketball", NCAAW: "basketball",
  NCAA_SOCCER: "soccer", FIFA_WC: "soccer",
};

const WOMENS: League[] = ["WNBA", "NWSL", "NCAAW"];

export function buildMockSportsEvents(opts: {
  zip?: string | null;
  city?: string | null;
}): MockSportsEvent[] {
  const metro = metroForCity(opts.city) || metroForZip(opts.zip);
  const out: MockSportsEvent[] = [];
  const today = new Date();
  // Curated LA events are merged in via fetchLocalSportsEvents below so
  // they appear before procedurally-generated ones for the LA metro.



  // Pro events — schedule one per league over the next ~3 weeks.
  let day = 2;
  (Object.keys(metro.pro) as League[]).forEach((league, i) => {
    const teams = metro.pro[league] || [];
    teams.forEach((t, j) => {
      const date = addDays(today, day);
      day += 2 + ((i + j) % 3);
      out.push({
        id: `mock-pro-${league}-${i}-${j}`,
        title: `${t.team} vs Opponent`,
        team_home: t.team,
        team_away: "Opponent",
        venue_name: t.venue,
        venue_address: t.address,
        date_time: date.toISOString(),
        league,
        sport: LEAGUE_SPORT[league],
        sport_kind: "pro",
        is_womens: WOMENS.includes(league),
        ticket_url: undefined,
        city: metro.city,
      });
    });
  });

  // College events — one per sport per local school over next ~4 weeks.
  let cday = 5;
  metro.colleges.forEach((college, i) => {
    college.sport.forEach((league, j) => {
      const date = addDays(today, cday);
      cday += 3 + ((i + j) % 4);
      out.push({
        id: `mock-col-${i}-${league}-${j}`,
        title: `${college.name} ${league === "NCAAF" ? "Football" : league === "NCAA_SOCCER" ? "Soccer" : "Basketball"}`,
        team_home: college.name,
        team_away: "Rival",
        venue_name: college.venue,
        venue_address: `${college.venue}, ${metro.city}`,
        date_time: date.toISOString(),
        league,
        sport: LEAGUE_SPORT[league],
        sport_kind: "college",
        is_womens: league === "NCAAW",
        ticket_url: undefined,
        city: metro.city,
      });
    });
  });

  return out;
}

// Adapter — convert mock events into the DbEvent-ish shape consumed by
// Events.tsx, keeping mock-specific fields under `__mock_*` so the existing
// rendering code stays untouched.
export interface MockDbEvent {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  banner_image: string | null;
  event_date: string;
  event_time: string | null;
  venue_name: string | null;
  city: string | null;
  event_type: string;
  sport_tags: string[];
  visibility: string;
  capacity: number | null;
  price: number | null;
  event_tags: string[];
  location_lat: number | null;
  location_lng: number | null;
  promoted: boolean;
  __mock: true;
  __league: League;
  __sport_kind: SportKind;
  __is_womens: boolean;
  __ticket_url?: string;
}

export function toDbShape(m: MockSportsEvent): MockDbEvent {
  const d = new Date(m.date_time);
  return {
    id: m.id,
    title: m.title,
    description: `${m.league} · ${m.venue_name}`,
    image_url: null,
    banner_image: null,
    event_date: format(d, "yyyy-MM-dd"),
    event_time: format(d, "HH:mm"),
    venue_name: m.venue_name,
    city: m.city,
    event_type: "game", // → "external" variant → black dot
    sport_tags: [m.sport],
    visibility: "public",
    capacity: null,
    price: null,
    event_tags: [m.league, m.is_womens ? "women" : "open", m.sport_kind],
    location_lat: null,
    location_lng: null,
    promoted: false,
    __mock: true,
    __league: m.league,
    __sport_kind: m.sport_kind,
    __is_womens: m.is_womens,
    __ticket_url: m.ticket_url,
  };
}

// SeatGeek response shape from the seatgeek-events edge function. Already
// normalized server-side, so this mirrors MockSportsEvent 1:1.
interface SeatGeekProxyEvent {
  id: string;
  title: string;
  team_home: string;
  team_away: string;
  venue_name: string;
  venue_address: string;
  city: string;
  date_time: string;
  league: League;
  sport_kind: SportKind;
  is_womens: boolean;
  ticket_url?: string;
  image_url?: string | null;
}

const LEAGUE_SPORT_FALLBACK: Record<string, string> = {
  NFL: "football", NBA: "basketball", WNBA: "basketball",
  NWSL: "soccer", MLS: "soccer", MLB: "baseball", NHL: "hockey",
  NCAAF: "football", NCAAM: "basketball", NCAAW: "basketball",
  NCAA_SOCCER: "soccer", FIFA_WC: "soccer",
};

function liveToDbShape(e: SeatGeekProxyEvent): MockDbEvent {
  const d = new Date(e.date_time);
  const sport = LEAGUE_SPORT_FALLBACK[e.league] || "sports";
  return {
    id: e.id,
    title: e.title,
    description: `${e.league} · ${e.venue_name}`,
    image_url: e.image_url ?? null,
    banner_image: null,
    event_date: format(d, "yyyy-MM-dd"),
    event_time: format(d, "HH:mm"),
    venue_name: e.venue_name,
    city: e.city,
    event_type: "game",
    sport_tags: [sport],
    visibility: "public",
    capacity: null,
    price: null,
    event_tags: [e.league, e.is_womens ? "women" : "open", e.sport_kind],
    location_lat: null,
    location_lng: null,
    promoted: false,
    __mock: true,
    __league: e.league,
    __sport_kind: e.sport_kind,
    __is_womens: e.is_womens,
    __ticket_url: e.ticket_url,
  };
}

async function fetchSeatGeekEvents(opts: {
  zip?: string | null;
  lat?: number | null;
  lng?: number | null;
  range?: string;
}): Promise<MockDbEvent[]> {
  const params: Record<string, string | number> = { range: opts.range || "50mi", per_page: 100 };
  if (opts.zip && /^\d{5}$/.test(opts.zip)) params.zip = opts.zip;
  else if (opts.lat != null && opts.lng != null) {
    params.lat = String(opts.lat);
    params.lng = String(opts.lng);
  } else {
    return [];
  }

  try {
    const { data, error } = await supabase.functions.invoke("seatgeek-events", {
      body: params,
    });
    if (error) {
      console.warn("[seatgeek] invoke failed:", error.message);
      return [];
    }
    if (data?.fallback) {
      console.warn("[seatgeek] fallback response:", data.reason, data);
    }
    const events = Array.isArray(data?.events) ? (data.events as SeatGeekProxyEvent[]) : [];
    return events.map(liveToDbShape).filter(Boolean) as MockDbEvent[];
  } catch (err) {
    console.warn("[seatgeek] network error:", err);
    return [];
  }
}

import { LA_MOCK_DB_EVENTS } from "@/data/mockEvents";

export function fetchLocalSportsEvents(opts: {
  zip?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
}): Promise<MockDbEvent[]> {
  if (USE_MOCK_DATA) {
    const metro = metroForCity(opts.city) || metroForZip(opts.zip);
    const curated = metro === METROS.LA ? LA_MOCK_DB_EVENTS : [];
    return Promise.resolve([...curated, ...buildMockSportsEvents(opts).map(toDbShape)]);
  }
  return fetchSeatGeekEvents(opts);
}


