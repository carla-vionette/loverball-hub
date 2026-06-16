// sports-search: Fetches live/recent/upcoming games across all major leagues from ESPN's
// public scoreboard API. Supports both a default feed (no query) and team/city/league search.
// ESPN's site.api endpoints are public — no API key required — and cover all leagues.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

type League = "NBA" | "WNBA" | "MLB" | "NHL" | "NFL" | "MLS" | "NWSL";

const ESPN_SCOREBOARD: Record<League, string> = {
  NBA: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
  WNBA: "https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard",
  MLB: "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard",
  NHL: "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard",
  NFL: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
  MLS: "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard",
  NWSL: "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.nwsl/scoreboard",
};

const ALL_LEAGUES: League[] = ["NBA", "WNBA", "MLB", "NHL", "NFL", "MLS", "NWSL"];

const TEAM_ALIASES: Record<string, string[]> = {
  "la kings": ["los angeles kings"],
  "kings nhl": ["los angeles kings"],
  "lakers": ["los angeles lakers"],
  "clippers": ["la clippers", "los angeles clippers"],
  "dodgers": ["los angeles dodgers"],
  "angels": ["los angeles angels", "la angels"],
  "rams": ["los angeles rams", "la rams"],
  "chargers": ["los angeles chargers", "la chargers"],
  "sparks": ["los angeles sparks", "la sparks"],
  "la sparks": ["los angeles sparks"],
  "lafc": ["los angeles fc"],
  "la galaxy": ["los angeles galaxy"],
};

const LEAGUE_ALIASES: Record<string, League> = {
  nba: "NBA", "n.b.a": "NBA",
  wnba: "WNBA",
  mlb: "MLB", baseball: "MLB",
  nhl: "NHL", hockey: "NHL",
  nfl: "NFL", football: "NFL",
  mls: "MLS",
  nwsl: "NWSL",
};

// In-memory cache: ESPN data changes minute-to-minute, so cache briefly.
const cache = new Map<string, { ts: number; data: any }>();
const CACHE_TTL = 45_000; // 45s

async function fetchEspn(league: League): Promise<any> {
  const url = ESPN_SCOREBOARD[league];
  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LoverballScores/1.0)" },
    });
    if (!res.ok) {
      console.warn(`ESPN ${league} returned ${res.status}`);
      return null;
    }
    const data = await res.json();
    cache.set(url, { ts: Date.now(), data });
    return data;
  } catch (err) {
    console.warn(`ESPN ${league} fetch failed:`, err);
    return null;
  }
}

interface GameOut {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: string;
  awayScore: string;
  status: "live" | "final" | "upcoming";
  statusDetail: string;
  sport: string;
  gameTime: string | null;
}

function formatPeriod(league: League, period: number, clock: string, statusName: string): string {
  if (statusName === "STATUS_HALFTIME") return "Halftime";
  if (league === "NBA" || league === "WNBA" || league === "NFL") return `Q${period} ${clock}`.trim();
  if (league === "NHL") {
    const names = ["1st", "2nd", "3rd", "OT", "SO"];
    return `${names[period - 1] || `P${period}`} ${clock}`.trim();
  }
  if (league === "MLB") return clock || "In Progress";
  if (league === "MLS" || league === "NWSL") {
    return period <= 1 ? `1st Half ${clock}`.trim() : `2nd Half ${clock}`.trim();
  }
  return clock || "Live";
}

function normalizeEspnEvent(event: any, league: League): GameOut | null {
  const comp = event?.competitions?.[0];
  if (!comp) return null;
  const home = comp.competitors?.find((c: any) => c.homeAway === "home");
  const away = comp.competitors?.find((c: any) => c.homeAway === "away");
  if (!home || !away) return null;

  const statusName = event.status?.type?.name ?? "";
  const completed = event.status?.type?.completed === true;
  let status: GameOut["status"] = "upcoming";
  if (statusName === "STATUS_IN_PROGRESS" || statusName === "STATUS_HALFTIME") status = "live";
  else if (statusName === "STATUS_FINAL" || completed) status = "final";

  const dt = comp.date || event.date || null;
  const clock = event.status?.displayClock || "";
  const period = event.status?.period || 1;

  let statusDetail = "Scheduled";
  if (status === "live") statusDetail = formatPeriod(league, period, clock, statusName);
  else if (status === "final") statusDetail = "Final";
  else if (dt) {
    statusDetail = new Date(dt).toLocaleString("en-US", {
      weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  }

  return {
    id: `${league}-${event.id}`,
    homeTeam: home.team?.displayName || home.team?.name || "Home",
    awayTeam: away.team?.displayName || away.team?.name || "Away",
    homeScore: home.score ?? "0",
    awayScore: away.score ?? "0",
    status,
    statusDetail,
    sport: league,
    gameTime: dt,
  };
}

function detectLeagues(q: string): League[] {
  const lower = q.toLowerCase().trim();
  if (!lower) return [];
  if (LEAGUE_ALIASES[lower]) return [LEAGUE_ALIASES[lower]];
  for (const [alias, lg] of Object.entries(LEAGUE_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`).test(lower)) return [lg];
  }
  return [];
}

function teamMatches(g: GameOut, q: string): boolean {
  const needle = q.toLowerCase().trim();
  if (!needle) return true;
  const aliases = [needle, ...(TEAM_ALIASES[needle] || [])];
  const haystack = `${g.homeTeam} ${g.awayTeam}`.toLowerCase();
  return aliases.some((alias) => haystack.includes(alias));
}

async function fetchLeagues(leagues: League[]): Promise<GameOut[]> {
  const results = await Promise.all(
    leagues.map(async (lg) => {
      const data = await fetchEspn(lg);
      const events = data?.events || [];
      return events
        .map((e: any) => normalizeEspnEvent(e, lg))
        .filter(Boolean) as GameOut[];
    })
  );
  return results.flat();
}

function rankAndTrim(games: GameOut[], limit: number): GameOut[] {
  const live = games.filter((g) => g.status === "live");
  const finals = games
    .filter((g) => g.status === "final")
    .sort((a, b) => (b.gameTime ?? "").localeCompare(a.gameTime ?? ""));
  const upcoming = games
    .filter((g) => g.status === "upcoming")
    .sort((a, b) => (a.gameTime ?? "").localeCompare(b.gameTime ?? ""));
  return [...live, ...finals, ...upcoming].slice(0, limit);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const rawQuery = String(body?.query ?? "").trim().slice(0, 64);

    // No query → default feed across all major leagues.
    if (!rawQuery || rawQuery.length < 2) {
      const all = await fetchLeagues(ALL_LEAGUES);
      const games = rankAndTrim(all, 12);
      return new Response(JSON.stringify({ games }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Query → narrow to a league if the query mentions one; otherwise search all leagues.
    const detected = detectLeagues(rawQuery);
    const isLeagueOnly = detected.length === 1 && !!LEAGUE_ALIASES[rawQuery.toLowerCase()];
    const leagues = detected.length > 0 ? detected : ALL_LEAGUES;

    const all = await fetchLeagues(leagues);
    const filtered = isLeagueOnly ? all : all.filter((g) => teamMatches(g, rawQuery));

    // For team queries return live + most recent final + next upcoming; for league-only return more.
    const games = isLeagueOnly
      ? rankAndTrim(filtered, 12)
      : (() => {
          const live = filtered.filter((g) => g.status === "live");
          const finals = filtered
            .filter((g) => g.status === "final")
            .sort((a, b) => (b.gameTime ?? "").localeCompare(a.gameTime ?? ""));
          const upcoming = filtered
            .filter((g) => g.status === "upcoming")
            .sort((a, b) => (a.gameTime ?? "").localeCompare(b.gameTime ?? ""));
          return [...live, ...finals.slice(0, 2), ...upcoming.slice(0, 2)];
        })();

    return new Response(JSON.stringify({ games }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sports-search error:", err);
    return new Response(JSON.stringify({ games: [], error: "Internal error" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
