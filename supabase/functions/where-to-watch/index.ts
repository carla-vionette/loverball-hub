// where-to-watch: returns upcoming games + broadcast info for a list of team names
// or a free-text query. Uses ESPN's public scoreboard endpoints (no API key needed).
// JWT-auth required, per-user rate limited, in-memory cached.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Rate limit (per authenticated user) ──
const rateMap = new Map<string, { count: number; windowStart: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30;
function checkRate(key: string) {
  const now = Date.now();
  const e = rateMap.get(key);
  if (!e || now - e.windowStart > RATE_WINDOW_MS) {
    rateMap.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (e.count >= RATE_MAX) return false;
  e.count++;
  return true;
}

// ── Cache ──
const cache = new Map<string, { ts: number; data: unknown }>();
const CACHE_TTL = 10 * 60_000; // 10 min
function getCached(k: string) {
  const e = cache.get(k);
  return e && Date.now() - e.ts < CACHE_TTL ? e.data : null;
}
function setCached(k: string, data: unknown) {
  cache.set(k, { ts: Date.now(), data });
}

// ── ESPN sources ──
const ESPN: Record<string, { url: string; league: string; sport: string }> = {
  nba: { url: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard", league: "NBA", sport: "Basketball" },
  wnba: { url: "https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard", league: "WNBA", sport: "Basketball" },
  nfl: { url: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard", league: "NFL", sport: "Football" },
  mlb: { url: "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard", league: "MLB", sport: "Baseball" },
  nhl: { url: "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard", league: "NHL", sport: "Hockey" },
  mls: { url: "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard", league: "MLS", sport: "Soccer" },
  nwsl: { url: "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.nwsl/scoreboard", league: "NWSL", sport: "Soccer" },
  ncaambb: { url: "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard", league: "NCAAM", sport: "Basketball" },
  ncaawbb: { url: "https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/scoreboard", league: "NCAAW", sport: "Basketball" },
  ncaafb: { url: "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard", league: "NCAAF", sport: "Football" },
};

const TEAM_ALIASES: Record<string, string[]> = {
  "la kings": ["los angeles kings"],
  "kings nhl": ["los angeles kings"],
  lakers: ["los angeles lakers"],
  clippers: ["la clippers", "los angeles clippers"],
  dodgers: ["los angeles dodgers"],
  angels: ["los angeles angels", "la angels"],
  rams: ["los angeles rams", "la rams"],
  chargers: ["los angeles chargers", "la chargers"],
  sparks: ["los angeles sparks", "la sparks"],
  "la sparks": ["los angeles sparks"],
  lafc: ["los angeles fc"],
  "la galaxy": ["los angeles galaxy"],
  "angel city": ["angel city fc"],
};

async function fetchJSON(url: string, timeoutMs = 6000): Promise<any | null> {
  const cached = getCached(url);
  if (cached) return cached;
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (LoverballBot/1.0)" },
      signal: c.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    setCached(url, data);
    return data;
  } catch {
    return null;
  }
}

interface GameOut {
  id: string;
  league: string;
  sport: string;
  status: "live" | "scheduled" | "final";
  statusDetail: string;
  startTime: string; // ISO
  homeTeam: { name: string; abbreviation: string; logo: string };
  awayTeam: { name: string; abbreviation: string; logo: string };
  broadcasts: string[];
  venue?: string;
  matchedTeam?: string;
}

function extractGames(data: any, leagueKey: string): GameOut[] {
  if (!data?.events) return [];
  const meta = ESPN[leagueKey];
  const out: GameOut[] = [];
  for (const ev of data.events) {
    const comp = ev.competitions?.[0];
    if (!comp) continue;
    const home = comp.competitors?.find((c: any) => c.homeAway === "home");
    const away = comp.competitors?.find((c: any) => c.homeAway === "away");
    if (!home || !away) continue;

    const statusName = ev.status?.type?.name || "";
    let status: "live" | "scheduled" | "final" = "scheduled";
    if (statusName.includes("IN_PROGRESS") || statusName.includes("HALFTIME") || statusName === "STATUS_END_PERIOD") status = "live";
    else if (ev.status?.type?.completed || statusName === "STATUS_FINAL") status = "final";

    const broadcasts: string[] = [];
    for (const b of comp.broadcasts || []) {
      for (const n of b.names || []) if (n && !broadcasts.includes(n)) broadcasts.push(n);
    }
    for (const g of comp.geoBroadcasts || []) {
      const n = g?.media?.shortName;
      if (n && !broadcasts.includes(n)) broadcasts.push(n);
    }

    out.push({
      id: String(ev.id),
      league: meta.league,
      sport: meta.sport,
      status,
      statusDetail: ev.status?.type?.shortDetail || ev.status?.type?.description || "",
      startTime: comp.date || ev.date || "",
      homeTeam: {
        name: home.team?.displayName || "",
        abbreviation: home.team?.abbreviation || "",
        logo: home.team?.logo || "",
      },
      awayTeam: {
        name: away.team?.displayName || "",
        abbreviation: away.team?.abbreviation || "",
        logo: away.team?.logo || "",
      },
      broadcasts,
      venue: comp.venue?.fullName || undefined,
    });
  }
  return out;
}

function matches(game: GameOut, needles: string[]): string | null {
  if (needles.length === 0) return null;
  const hay = [
    game.homeTeam.name,
    game.awayTeam.name,
    game.homeTeam.abbreviation,
    game.awayTeam.abbreviation,
    game.league,
    game.sport,
  ]
    .filter(Boolean)
    .map((s) => s.toLowerCase());
  for (const n of needles) {
    const needle = n.toLowerCase().trim();
    if (!needle) continue;
    const aliases = [needle, ...(TEAM_ALIASES[needle] || [])];
    for (const h of hay) {
      if (aliases.some((alias) => h.includes(alias))) return n;
    }
  }
  return null;
}

function ymd(d: Date) {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Public endpoint — broadcast/scoreboard data is non-sensitive. Rate limit by user (if signed in) or IP.
  let rateKey = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
      );
      const token = authHeader.replace("Bearer ", "");
      const { data: claims } = await supabase.auth.getClaims(token);
      if (claims?.claims?.sub) rateKey = claims.claims.sub as string;
    } catch { /* ignore — treat as anon */ }
  }
  if (!checkRate(rateKey)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded", games: [], updatedAt: new Date().toISOString() }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const teams: string[] = Array.isArray(body.teams) ? body.teams.slice(0, 20) : [];
    const query: string = typeof body.query === "string" ? body.query.slice(0, 60) : "";
    const days: number = Math.min(Math.max(Number(body.days) || 7, 1), 10);

    const needles = [...teams, query].map((s) => (s || "").trim()).filter(Boolean);

    // Build date list: today through +days
    const today = new Date();
    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      dates.push(ymd(d));
    }

    const leagueKeys = Object.keys(ESPN);

    const urls: { key: string; url: string }[] = [];
    for (const key of leagueKeys) {
      for (const date of dates) {
        urls.push({ key, url: `${ESPN[key].url}?dates=${date}` });
      }
    }

    // Concurrency cap
    const results: GameOut[] = [];
    const CHUNK = 8;
    for (let i = 0; i < urls.length; i += CHUNK) {
      const slice = urls.slice(i, i + CHUNK);
      const datas = await Promise.all(slice.map((u) => fetchJSON(u.url)));
      datas.forEach((d, idx) => {
        results.push(...extractGames(d, slice[idx].key));
      });
    }

    // Dedupe by id
    const seen = new Set<string>();
    const unique: GameOut[] = [];
    for (const g of results) {
      if (seen.has(g.id)) continue;
      seen.add(g.id);
      unique.push(g);
    }

    // Filter by needles (if any)
    const filtered: GameOut[] = [];
    if (needles.length > 0) {
      for (const g of unique) {
        const m = matches(g, needles);
        if (m) filtered.push({ ...g, matchedTeam: m });
      }
    } else {
      filtered.push(...unique);
    }

    // Sort by start time asc; live first
    filtered.sort((a, b) => {
      if (a.status === "live" && b.status !== "live") return -1;
      if (b.status === "live" && a.status !== "live") return 1;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

    return new Response(
      JSON.stringify({
        games: filtered.slice(0, 60),
        totalGames: filtered.length,
        updatedAt: new Date().toISOString(),
        source: "ESPN",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("where-to-watch error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", games: [], updatedAt: new Date().toISOString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
