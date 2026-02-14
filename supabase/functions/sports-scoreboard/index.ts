import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  ncaambb: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard',
  ncaawbb: 'https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/scoreboard',
  ncaafb: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',
};

const LA_TEAMS = [
  'Lakers', 'Clippers', 'Sparks', 'Rams', 'Chargers', 'Dodgers', 'Angels',
  'Kings', 'Ducks', 'Galaxy', 'LAFC', 'Angel City', 'Wave',
  'UCLA', 'USC', 'Pepperdine', 'LMU', 'Cal State Fullerton', 'CSUN',
  'Long Beach State', 'UC Irvine', 'Bruins', 'Trojans'
];

const SPORT_LABELS: Record<string, string> = {
  nba: 'NBA', wnba: 'WNBA', nfl: 'NFL', mlb: 'MLB', nhl: 'NHL',
  mls: 'MLS', nwsl: 'NWSL', ncaambb: 'NCAAM', ncaawbb: 'NCAAW', ncaafb: 'NCAAF'
};

function isLATeam(name: string): boolean {
  return LA_TEAMS.some(t => name.toLowerCase().includes(t.toLowerCase()));
}

interface GameData {
  id: string;
  sport: string;
  sportLabel: string;
  status: 'live' | 'final' | 'scheduled';
  statusDetail: string;
  clock?: string;
  period?: number;
  homeTeam: { name: string; abbreviation: string; score: string; logo: string; isLA: boolean };
  awayTeam: { name: string; abbreviation: string; score: string; logo: string; isLA: boolean };
  startTime: string;
  venue?: string;
  broadcast?: string;
}

async function fetchESPN(url: string): Promise<any> {
  const cached = getCached(url);
  if (cached) return cached;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SportsBot/1.0)' } });
    if (!res.ok) return null;
    const data = await res.json();
    setCache(url, data);
    return data;
  } catch { return null; }
}

function processGames(data: any, sport: string): GameData[] {
  if (!data?.events) return [];
  const games: GameData[] = [];

  for (const event of data.events) {
    const comp = event.competitions?.[0];
    if (!comp) continue;
    const home = comp.competitors?.find((c: any) => c.homeAway === 'home');
    const away = comp.competitors?.find((c: any) => c.homeAway === 'away');
    if (!home || !away) continue;
    if (!isLATeam(home.team.displayName) && !isLATeam(away.team.displayName)) continue;

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
        logo: home.team.logo || `https://a.espncdn.com/i/teamlogos/${sport === 'nfl' ? 'nfl' : sport === 'nba' ? 'nba' : sport}/500/${home.team.abbreviation?.toLowerCase()}.png`,
        isLA: isLATeam(home.team.displayName),
      },
      awayTeam: {
        name: away.team.displayName,
        abbreviation: away.team.abbreviation,
        score: away.score || '0',
        logo: away.team.logo || `https://a.espncdn.com/i/teamlogos/${sport}/500/${away.team.abbreviation?.toLowerCase()}.png`,
        isLA: isLATeam(away.team.displayName),
      },
      startTime: comp.date || event.date || '',
      venue,
      broadcast,
    });
  }
  return games;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { sports = 'all', dateRange = 'today' } = body;
    const cacheKey = `scoreboard:${sports}:${dateRange}`;
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
      // Fetch last 7 days
      for (let d = 7; d >= 0; d--) {
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        for (const sport of sportKeys) {
          fetches.push(fetchESPN(`${ESPN_SCOREBOARD[sport]}?dates=${dateStr}`).then(data => processGames(data, sport)));
        }
      }
    } else if (dateRange === 'upcoming') {
      // Fetch next 7 days
      for (let d = 0; d <= 7; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() + d);
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        for (const sport of sportKeys) {
          fetches.push(fetchESPN(`${ESPN_SCOREBOARD[sport]}?dates=${dateStr}`).then(data => processGames(data, sport)));
        }
      }
    } else {
      // Today only
      for (const sport of sportKeys) {
        fetches.push(fetchESPN(ESPN_SCOREBOARD[sport]).then(data => processGames(data, sport)));
      }
    }

    const results = await Promise.all(fetches);
    const allGames = results.flat();

    // Deduplicate by game id
    const seen = new Set<string>();
    const unique = allGames.filter(g => { if (seen.has(g.id)) return false; seen.add(g.id); return true; });

    // Separate by status
    const live = unique.filter(g => g.status === 'live');
    const final_ = unique.filter(g => g.status === 'final');
    const scheduled = unique.filter(g => g.status === 'scheduled');

    // Sort: live by period desc, final by time desc, scheduled by time asc
    live.sort((a, b) => (b.period || 0) - (a.period || 0));
    scheduled.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const responseData = {
      live,
      final: final_,
      scheduled,
      totalGames: unique.length,
      updatedAt: new Date().toISOString(),
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
