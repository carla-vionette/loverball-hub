// sports-search: Search SportsDataIO across multiple leagues for live/recent/upcoming games.
// Accepts { query } and returns normalized GameScore-shaped results.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const API_KEY = Deno.env.get("SPORTSDATA_API_KEY") ?? "";
const BASE = "https://api.sportsdata.io/v3";

type League = "NBA" | "WNBA" | "MLB" | "NHL" | "NFL" | "MLS" | "NWSL";

// Date helper: SportsDataIO expects YYYY-MMM-DD (e.g. 2026-JUN-04)
const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
function fmtDate(d: Date) {
  return `${d.getFullYear()}-${MONTHS[d.getMonth()]}-${String(d.getDate()).padStart(2,"0")}`;
}

// Per-league GamesByDate endpoint. NFL/MLS use different schemes; we keep this best-effort.
const GAMES_BY_DATE: Record<League, ((date: string) => string) | null> = {
  NBA: (d) => `/nba/scores/json/GamesByDate/${d}`,
  WNBA: (d) => `/wnba/scores/json/GamesByDate/${d}`,
  MLB: (d) => `/mlb/scores/json/GamesByDate/${d}`,
  NHL: (d) => `/nhl/scores/json/GamesByDate/${d}`,
  NFL: null, // week-based; handled separately
  MLS: null, // competition schedule; handled separately
  NWSL: null,
};

// League abbreviation aliases users might type.
const LEAGUE_ALIASES: Record<string, League> = {
  nba: "NBA", "n.b.a": "NBA",
  wnba: "WNBA",
  mlb: "MLB", baseball: "MLB",
  nhl: "NHL", hockey: "NHL",
  nfl: "NFL", football: "NFL",
  mls: "MLS",
  nwsl: "NWSL",
};

// Light team→league map (server-side copy of the relevant subset).
// Keys are lowercase substrings we match against team name OR city.
const TEAM_LEAGUE: Array<{ match: string[]; league: League }> = [
  // NBA
  ...["lakers","clippers","warriors","celtics","knicks","nets","76ers","sixers","bucks","heat","bulls","suns","mavericks","mavs","nuggets","thunder","timberwolves","wolves","kings","grizzlies","pelicans","hawks","raptors","cavaliers","cavs","pacers","magic","pistons","hornets","wizards","trail blazers","blazers","jazz","spurs","rockets","los angeles","new york","brooklyn","philadelphia","milwaukee","miami","chicago","phoenix","dallas","denver","oklahoma","minnesota","sacramento","memphis","new orleans","atlanta","toronto","cleveland","indiana","orlando","detroit","charlotte","washington","portland","utah","san antonio","houston","golden state","boston"].map((m) => ({ match: [m], league: "NBA" as League })),
  // WNBA
  ...["sparks","liberty","aces","fever","storm","sky","mercury","mystics","sun","lynx","dream","wings","valkyries"].map((m) => ({ match: [m], league: "WNBA" as League })),
  // MLB
  ...["dodgers","yankees","red sox","mets","giants","cubs","cardinals","phillies","braves","astros","rangers","blue jays","orioles","rays","white sox","guardians","tigers","royals","twins","angels","athletics","mariners","diamondbacks","rockies","padres","brewers","reds","pirates","nationals","marlins"].map((m) => ({ match: [m], league: "MLB" as League })),
  // NFL
  ...["49ers","eagles","chiefs","cowboys","rams","chargers","packers","bills","ravens","dolphins","lions","seahawks","steelers","bears","raiders","broncos","vikings","jets","saints","patriots","commanders","cardinals","bengals","jaguars","titans","browns","colts","panthers","texans","buccaneers","falcons"].map((m) => ({ match: [m], league: "NFL" as League })),
  // NHL
  ...["rangers","kings","ducks","sharks","bruins","canadiens","maple leafs","oilers","flames","canucks","jets","wild","blackhawks","red wings","penguins","capitals","flyers","islanders","devils","hurricanes","panthers","lightning","predators","stars","blues","avalanche","golden knights","kraken","blue jackets","senators","sabres","coyotes","utah hockey"].map((m) => ({ match: [m], league: "NHL" as League })),
  // MLS
  ...["lafc","la galaxy","inter miami","atlanta united","seattle sounders","portland timbers","nycfc","new york red bulls","austin fc","fc cincinnati","columbus crew"].map((m) => ({ match: [m], league: "MLS" as League })),
  // NWSL
  ...["angel city","gotham","thorns","wave","bay fc","reign","spirit","courage","current","racing louisville","houston dash","orlando pride"].map((m) => ({ match: [m], league: "NWSL" as League })),
];

function detectLeagues(q: string): League[] {
  const lower = q.toLowerCase().trim();
  if (!lower) return [];
  // Exact league abbreviation
  if (LEAGUE_ALIASES[lower]) return [LEAGUE_ALIASES[lower]];
  // Word-boundary league abbrev inside query
  for (const [alias, lg] of Object.entries(LEAGUE_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`).test(lower)) return [lg];
  }
  // Team / city substring match
  const found = new Set<League>();
  for (const { match, league } of TEAM_LEAGUE) {
    for (const m of match) {
      if (lower.includes(m)) { found.add(league); break; }
    }
  }
  return Array.from(found);
}

async function sdFetch(path: string): Promise<any[]> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "Ocp-Apim-Subscription-Key": API_KEY },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
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

function normalizeStatus(s: string): GameOut["status"] {
  const v = (s || "").toLowerCase();
  if (v === "inprogress" || v === "in progress" || v === "live") return "live";
  if (v === "final" || v === "f/ot" || v.includes("final")) return "final";
  return "upcoming";
}

function normalize(game: any, league: League): GameOut | null {
  const home = game.HomeTeam || game.HomeTeamName || game.HomeTeamCity;
  const away = game.AwayTeam || game.AwayTeamName || game.AwayTeamCity;
  if (!home || !away) return null;
  const status = normalizeStatus(game.Status);
  const dt = game.DateTime || game.Day || game.DateTimeUTC || null;
  return {
    id: `${league}-${game.GameID ?? `${home}-${away}-${dt}`}`,
    homeTeam: String(home),
    awayTeam: String(away),
    homeScore: game.HomeTeamScore != null ? String(game.HomeTeamScore) : "-",
    awayScore: game.AwayTeamScore != null ? String(game.AwayTeamScore) : "-",
    status,
    statusDetail: status === "live"
      ? (game.Quarter ? `${game.Quarter} ${game.TimeRemainingMinutes ?? ""}:${String(game.TimeRemainingSeconds ?? 0).padStart(2,"0")}` : "Live")
      : status === "final" ? "Final" : (dt ? new Date(dt).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Scheduled"),
    sport: league,
    gameTime: dt,
  };
}

function teamMatches(g: GameOut, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return `${g.homeTeam} ${g.awayTeam}`.toLowerCase().includes(needle);
}

async function fetchLeagueWindow(league: League): Promise<any[]> {
  const builder = GAMES_BY_DATE[league];
  if (!builder) return [];
  const days: Date[] = [];
  const today = new Date();
  for (let offset = -3; offset <= 7; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    days.push(d);
  }
  const results = await Promise.all(days.map((d) => sdFetch(builder(fmtDate(d)))));
  return results.flat();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!API_KEY) {
    return new Response(JSON.stringify({ games: [], error: "API key not configured" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { query } = await req.json().catch(() => ({ query: "" }));
    const q = String(query ?? "").trim().slice(0, 64);
    if (!q || q.length < 2) {
      return new Response(JSON.stringify({ games: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const leagues = detectLeagues(q);
    if (leagues.length === 0) {
      return new Response(JSON.stringify({ games: [], hint: "no_league_matched" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If query is just a league abbreviation, don't filter by team text.
    const isLeagueOnly = !!LEAGUE_ALIASES[q.toLowerCase()];

    const perLeague = await Promise.all(
      leagues.map(async (lg) => ({ lg, items: await fetchLeagueWindow(lg) }))
    );
    const normalized: GameOut[] = [];
    for (const { lg, items } of perLeague) {
      for (const g of items) {
        const out = normalize(g, lg);
        if (out) normalized.push(out);
      }
    }

    const filtered = isLeagueOnly
      ? normalized
      : normalized.filter((g) => teamMatches(g, q));

    // Bucket and pick: all live + most recent final + next upcoming (per team if team query).
    const live = filtered.filter((g) => g.status === "live");
    const finals = filtered
      .filter((g) => g.status === "final")
      .sort((a, b) => (b.gameTime ?? "").localeCompare(a.gameTime ?? ""));
    const upcoming = filtered
      .filter((g) => g.status === "upcoming")
      .sort((a, b) => (a.gameTime ?? "").localeCompare(b.gameTime ?? ""));

    const games = isLeagueOnly
      ? [...live, ...finals.slice(0, 6), ...upcoming.slice(0, 6)].slice(0, 12)
      : [...live, ...finals.slice(0, 1), ...upcoming.slice(0, 1)];

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
