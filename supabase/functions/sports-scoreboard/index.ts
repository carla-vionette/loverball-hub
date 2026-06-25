import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// IP-based rate limiter
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 30;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

interface CacheEntry { data: unknown; timestamp: number; }
const cache: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 120000;

function getCached(key: string): unknown | null {
  const e = cache.get(key);
  return e && (Date.now() - e.timestamp) < CACHE_TTL ? e.data : null;
}
function setCache(key: string, data: unknown) { cache.set(key, { data, timestamp: Date.now() }); }

const ESPN_SCOREBOARD: Record<string, string> = {
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
  wnba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard',
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
  nhl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
  mls: 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard',
  nwsl: 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.nwsl/scoreboard',
};

// Default fallback when caller doesn't pass `teams`: Los Angeles metro pro teams.
const DEFAULT_TEAMS = [
  'Dodgers', 'Angels',
  'Lakers', 'Clippers', 'Sparks',
  'Rams', 'Chargers',
  'Kings', 'Ducks',
  'Galaxy', 'LAFC', 'Angel City',
];

const SPORT_LABELS: Record<string, string> = {
  nba: 'NBA', wnba: 'WNBA', nfl: 'NFL', mlb: 'MLB', nhl: 'NHL',
  mls: 'MLS', nwsl: 'NWSL',
};

function teamMatches(name: string, teams: string[]): boolean {
  const n = name.toLowerCase();
  return teams.some(t => {
    const needle = t.trim().toLowerCase();
    return needle.length > 1 && n.includes(needle);
  });
}

interface GameData {
  id: string;
  sport: string;
  sportLabel: string;
  status: 'live' | 'final' | 'scheduled';
  statusDetail: string;
  clock?: string;
  period?: number;
  homeTeam: { name: string; abbreviation: string; score: string; logo: string; isLocal: boolean };
  awayTeam: { name: string; abbreviation: string; score: string; logo: string; isLocal: boolean };
  startTime: string;
  venue?: string;
  broadcast?: string;
  /** True when the user's local team is the HOME team (in-town game). */
  homeIsLocal: boolean;
}

// Fetch with timeout and retry
async function fetchWithRetry(url: string, retries = 3, timeoutMs = 5000): Promise<Response | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SportsBot/1.0)' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) return res;
      console.warn(`Attempt ${attempt} for ${url}: status ${res.status}`);
      await res.text(); // consume body
    } catch (err) {
      console.warn(`Attempt ${attempt} for ${url}: ${err instanceof Error ? err.message : err}`);
    }
    if (attempt < retries) await new Promise(r => setTimeout(r, 800 * attempt));
  }
  return null;
}

async function fetchESPN(url: string): Promise<any> {
  const cached = getCached(url);
  if (cached) return cached;
  const res = await fetchWithRetry(url);
  if (!res) return null;
  try {
    const data = await res.json();
    setCache(url, data);
    return data;
  } catch { return null; }
}

// TheSportsDB supplementary data
const THESPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';
const LEAGUE_IDS: Record<string, string> = {
  nba: '4387',
  wnba: '4516',  // Women's National Basketball Association
  nfl: '4391',
  mlb: '4424',
  nhl: '4380',
  mls: '4346',
  nwsl: '4822',  // National Women's Soccer League
};

async function fetchTheSportsDBNextEvents(sport: string): Promise<any[]> {
  const leagueId = LEAGUE_IDS[sport];
  if (!leagueId) return [];
  const cacheKey = `thesportsdb:${sport}`;
  const cached = getCached(cacheKey);
  if (cached) return cached as any[];

  const res = await fetchWithRetry(`${THESPORTSDB_BASE}/eventsnextleague.php?id=${leagueId}`, 2, 5000);
  if (!res) return [];
  try {
    const data = await res.json();
    const events = data?.events || [];
    setCache(cacheKey, events);
    return events;
  } catch { return []; }
}

function processGames(data: any, sport: string, teams: string[]): GameData[] {
  if (!data?.events) return [];
  const games: GameData[] = [];

  for (const event of data.events) {
    const comp = event.competitions?.[0];
    if (!comp) continue;
    const home = comp.competitors?.find((c: any) => c.homeAway === 'home');
    const away = comp.competitors?.find((c: any) => c.homeAway === 'away');
    if (!home || !away) continue;

    const homeIsLocal = teamMatches(home.team.displayName, teams);
    const awayIsLocal = teamMatches(away.team.displayName, teams);
    if (!homeIsLocal && !awayIsLocal) continue;

    const statusName = event.status?.type?.name || '';
    let status: 'live' | 'final' | 'scheduled' = 'scheduled';
    if (statusName === 'STATUS_IN_PROGRESS' || statusName === 'STATUS_HALFTIME' || statusName === 'STATUS_END_PERIOD') {
      status = 'live';
    } else if (statusName === 'STATUS_FINAL' || event.status?.type?.completed) {
      status = 'final';
    }

    const broadcast = comp.broadcasts?.[0]?.names?.[0] || '';
    const venue = comp.venue?.fullName || '';

    games.push({
      id: event.id,
      sport,
      sportLabel: SPORT_LABELS[sport] || sport.toUpperCase(),
      status,
      statusDetail: event.status?.type?.shortDetail || event.status?.type?.description || '',
      clock: event.status?.displayClock,
      period: event.status?.period,
      homeTeam: {
        name: home.team.displayName,
        abbreviation: home.team.abbreviation,
        score: home.score || '0',
        logo: home.team.logo || `https://a.espncdn.com/i/teamlogos/${sport}/500/${home.team.abbreviation?.toLowerCase()}.png`,
        isLocal: homeIsLocal,
      },
      awayTeam: {
        name: away.team.displayName,
        abbreviation: away.team.abbreviation,
        score: away.score || '0',
        logo: away.team.logo || `https://a.espncdn.com/i/teamlogos/${sport}/500/${away.team.abbreviation?.toLowerCase()}.png`,
        isLocal: awayIsLocal,
      },
      startTime: comp.date || event.date || '',
      venue,
      broadcast,
      homeIsLocal,
    });
  }
  return games;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Public endpoint — scoreboard data is non-sensitive. Rate limit by user (if signed in) or IP.
  let clientId = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
      );
      const token = authHeader.replace('Bearer ', '');
      const { data } = await supabase.auth.getClaims(token);
      if (data?.claims?.sub) clientId = data.claims.sub as string;
    } catch { /* ignore — treat as anon */ }
  }

  if (!checkRateLimit(clientId)) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded', live: [], final: [], scheduled: [], totalGames: 0, updatedAt: new Date().toISOString() }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { sports = 'all', dateRange = 'today' } = body;

    // Accept a list of pro team names to filter by. Falls back to LA metro.
    const rawTeams = Array.isArray(body?.teams) ? body.teams : null;
    const teams: string[] = rawTeams && rawTeams.length
      ? rawTeams.filter((t: unknown): t is string => typeof t === 'string' && t.trim().length > 1).slice(0, 60)
      : DEFAULT_TEAMS;

    const teamsKey = teams.slice().sort().join('|');
    const cacheKey = `scoreboard:${sports}:${dateRange}:${teamsKey}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
      });
    }

    // Determine which sports to fetch
    let sportKeys = Object.keys(ESPN_SCOREBOARD);
    if (sports !== 'all') {
      const requested = sports.split(',').map((s: string) => s.trim().toLowerCase());
      sportKeys = sportKeys.filter(k => requested.includes(k) || requested.includes(SPORT_LABELS[k]?.toLowerCase()));
    }

    // Build URLs - for recent/upcoming, add date params
    const today = new Date();
    const fetches: Promise<GameData[]>[] = [];

    if (dateRange === 'recent') {
      for (let d = 7; d >= 0; d--) {
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        for (const sport of sportKeys) {
          fetches.push(fetchESPN(`${ESPN_SCOREBOARD[sport]}?dates=${dateStr}`).then(data => processGames(data, sport, teams)));
        }
      }
    } else if (dateRange === 'upcoming') {
      for (let d = 0; d <= 7; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() + d);
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        for (const sport of sportKeys) {
          fetches.push(fetchESPN(`${ESPN_SCOREBOARD[sport]}?dates=${dateStr}`).then(data => processGames(data, sport, teams)));
        }
      }
    } else {
      for (const sport of sportKeys) {
        fetches.push(fetchESPN(ESPN_SCOREBOARD[sport]).then(data => processGames(data, sport, teams)));
      }
    }

    // Also fetch TheSportsDB upcoming events for supplementary data — now includes wnba/nwsl.
    const sportsDBFetches = sportKeys
      .filter(k => LEAGUE_IDS[k])
      .map(k => fetchTheSportsDBNextEvents(k).then(events => ({ sport: k, events })));

    const [espnResults, ...sportsDBResults] = await Promise.all([
      Promise.all(fetches),
      ...sportsDBFetches,
    ]);

    const allGames = (espnResults as GameData[][]).flat();

    // Deduplicate by game id
    const seen = new Set<string>();
    const unique = allGames.filter(g => { if (seen.has(g.id)) return false; seen.add(g.id); return true; });

    // Separate by status
    const live = unique.filter(g => g.status === 'live');
    const final_ = unique.filter(g => g.status === 'final');
    const scheduled = unique.filter(g => g.status === 'scheduled');

    live.sort((a, b) => (b.period || 0) - (a.period || 0));
    scheduled.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // TheSportsDB upcoming events (filtered to local teams)
    const theSportsDBUpcoming = (sportsDBResults as Array<{ sport: string; events: any[] }>)
      .flatMap(({ sport, events }) =>
        (events || [])
          .filter((e: any) => e && (e.strHomeTeam || e.strAwayTeam))
          .filter((e: any) =>
            teamMatches(e.strHomeTeam || '', teams) || teamMatches(e.strAwayTeam || '', teams)
          )
          .map((e: any) => {
            const homeIsLocal = teamMatches(e.strHomeTeam || '', teams);
            return {
              id: e.idEvent,
              sport,
              sportLabel: SPORT_LABELS[sport] || sport.toUpperCase(),
              event: `${e.strAwayTeam} vs ${e.strHomeTeam}`,
              homeTeam: e.strHomeTeam,
              awayTeam: e.strAwayTeam,
              date: e.dateEvent,
              time: e.strTime,
              league: e.strLeague,
              homeIsLocal,
              source: 'thesportsdb',
            };
          })
      )
      .slice(0, 30);

    const responseData = {
      live,
      final: final_,
      scheduled,
      theSportsDBUpcoming,
      totalGames: unique.length,
      teams,
      updatedAt: new Date().toISOString(),
      sources: ['ESPN', 'TheSportsDB'],
    };

    setCache(cacheKey, responseData);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('sports-scoreboard error:', msg);
    return new Response(JSON.stringify({ error: msg, live: [], final: [], scheduled: [], totalGames: 0, updatedAt: new Date().toISOString() }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
