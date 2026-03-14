import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ESPN scoreboard endpoints
const ESPN_FEEDS = [
  { url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard', sport: '🏀', league: 'NBA' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard', sport: '🏒', league: 'NHL' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard', sport: '🏀', league: 'WNBA' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.nwsl/scoreboard', sport: '⚽', league: 'NWSL' },
];

// Hardcoded fallback for March 9, 2026
const FALLBACK_GAMES = [
  { text: 'TONIGHT: NBA — PHI vs CLE — 4:00 PM PT', sport: '🏀', isLive: false, dateTime: '2026-03-10T00:00:00Z' },
  { text: 'TONIGHT: NBA — MEM vs BKN — 4:30 PM PT', sport: '🏀', isLive: false, dateTime: '2026-03-10T00:30:00Z' },
  { text: 'TONIGHT: NBA — DEN vs OKC — 4:30 PM PT', sport: '🏀', isLive: false, dateTime: '2026-03-10T00:30:00Z' },
  { text: 'TONIGHT: NBA — GSW vs UTA — 6:00 PM PT', sport: '🏀', isLive: false, dateTime: '2026-03-10T02:00:00Z' },
  { text: 'TONIGHT: NBA — NYK vs LAC — 7:00 PM PT', sport: '🏀', isLive: false, dateTime: '2026-03-10T03:00:00Z' },
  { text: 'TODAY: NHL — LA Kings vs Columbus — 1:00 PM PT', sport: '🏒', isLive: false, dateTime: '2026-03-09T21:00:00Z' },
  { text: 'TONIGHT: NHL — NY Rangers vs PHI — 4:00 PM PT', sport: '🏒', isLive: false, dateTime: '2026-03-10T00:00:00Z' },
  { text: 'TONIGHT: NHL — Calgary vs WSH — 4:00 PM PT', sport: '🏒', isLive: false, dateTime: '2026-03-10T00:00:00Z' },
  { text: 'TONIGHT: NHL — Utah vs CHI — 5:30 PM PT', sport: '🏒', isLive: false, dateTime: '2026-03-10T01:30:00Z' },
  { text: 'TONIGHT: NHL — Ottawa vs VAN — 6:00 PM PT', sport: '🏒', isLive: false, dateTime: '2026-03-10T02:00:00Z' },
];

interface GameItem {
  text: string;
  isLive: boolean;
  sport: string;
  dateTime: string;
}

let cache: { data: unknown; expiry: number } | null = null;
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

function formatTimePT(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }) + ' PT';
  } catch {
    return '';
  }
}

function getAbbrev(team: any): string {
  return team?.abbreviation || team?.shortDisplayName || team?.displayName || '???';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const token = authHeader.replace('Bearer ', '');
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    if (cache && cache.expiry > Date.now()) {
      return new Response(JSON.stringify(cache.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: GameItem[] = [];
    let apiSuccess = false;

    const fetches = ESPN_FEEDS.map(async (feed) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(feed.url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!res.ok) { await res.text(); return; }

        const data = await res.json();
        const events = data?.events || [];

        for (const ev of events) {
          const competition = ev.competitions?.[0];
          if (!competition) continue;

          const homeTeam = competition.competitors?.find((c: any) => c.homeAway === 'home');
          const awayTeam = competition.competitors?.find((c: any) => c.homeAway === 'away');
          const homeAbbr = getAbbrev(homeTeam?.team);
          const awayAbbr = getAbbrev(awayTeam?.team);
          const status = ev.status?.type?.name || '';
          const statusDetail = ev.status?.type?.detail || '';
          const gameDate = ev.date || '';

          let text: string;
          let isLive = false;

          if (status === 'STATUS_IN_PROGRESS') {
            const homeScore = homeTeam?.score || '0';
            const awayScore = awayTeam?.score || '0';
            const clock = ev.status?.displayClock || '';
            const period = ev.status?.period || '';
            text = `LIVE: ${feed.league} — ${awayAbbr} ${awayScore} vs ${homeAbbr} ${homeScore} — ${statusDetail || `Q${period} ${clock}`}`;
            isLive = true;
          } else if (status === 'STATUS_FINAL') {
            const homeScore = homeTeam?.score || '0';
            const awayScore = awayTeam?.score || '0';
            text = `FINAL: ${feed.league} — ${awayAbbr} ${awayScore}, ${homeAbbr} ${homeScore}`;
          } else {
            // Scheduled
            const timePT = formatTimePT(gameDate);
            text = `TONIGHT: ${feed.league} — ${awayAbbr} vs ${homeAbbr} — ${timePT}`;
          }

          results.push({ text, isLive, sport: feed.sport, dateTime: gameDate });
          apiSuccess = true;
        }
      } catch (err) {
        console.error(`ESPN ${feed.league} error:`, err);
      }
    });

    await Promise.all(fetches);

    // Use fallback if no API data
    const items = apiSuccess && results.length > 0 ? results : FALLBACK_GAMES;

    // Sort: live first, then by time
    items.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
    });

    const response = { items: items.slice(0, 15), updatedAt: new Date().toISOString() };
    cache = { data: response, expiry: Date.now() + CACHE_TTL };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('womens-sports-live error:', err);
    // Return fallback on total failure
    const response = { items: FALLBACK_GAMES, updatedAt: new Date().toISOString() };
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
