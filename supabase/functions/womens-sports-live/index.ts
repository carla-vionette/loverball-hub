import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TheSportsDB free API - league IDs for women's sports
const LEAGUES = [
  { id: 4387, name: 'WNBA', sport: '🏀' },
  { id: 4388, name: 'NWSL', sport: '⚽' },
];

interface SportsEvent {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  dateEvent: string;
  strTime: string;
  strStatus?: string;
  intHomeScore?: string;
  intAwayScore?: string;
  strLeague: string;
}

// Simple memory cache
let cache: { data: unknown; expiry: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check cache
    if (cache && cache.expiry > Date.now()) {
      return new Response(JSON.stringify(cache.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: Array<{
      text: string;
      isLive: boolean;
      sport: string;
      dateTime: string;
    }> = [];

    // Fetch next events for each league
    const fetches = LEAGUES.map(async (league) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(
          `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${league.id}`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);

        if (!res.ok) return;

        const data = await res.json();
        const events: SportsEvent[] = data.events || [];

        for (const ev of events.slice(0, 3)) {
          const home = ev.strHomeTeam || '';
          const away = ev.strAwayTeam || '';
          const eventDate = ev.dateEvent || '';
          const eventTime = ev.strTime || '00:00:00';

          // Build UTC date
          const utcDate = new Date(`${eventDate}T${eventTime}Z`);
          const now = new Date();

          // Check if game is today
          const todayStr = now.toISOString().slice(0, 10);
          const isToday = eventDate === todayStr;

          // Format time in PT
          const timePT = utcDate.toLocaleString('en-US', {
            timeZone: 'America/Los_Angeles',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });

          // Format date
          const datePT = utcDate.toLocaleString('en-US', {
            timeZone: 'America/Los_Angeles',
            month: 'short',
            day: 'numeric',
          });

          let text: string;
          let isLive = false;

          // Check if currently live (within game window ~3 hours)
          const diffMs = now.getTime() - utcDate.getTime();
          if (diffMs >= 0 && diffMs < 3 * 60 * 60 * 1000) {
            text = `LIVE: ${league.name} — ${away} at ${home}`;
            isLive = true;
          } else if (isToday && diffMs < 0) {
            text = `TODAY: ${league.name} — ${away} at ${home} — ${timePT} PT`;
          } else if (diffMs < 0) {
            text = `NEXT UP: ${league.name} — ${away} at ${home} — ${datePT}, ${timePT} PT`;
          } else {
            continue; // Past event, skip
          }

          results.push({
            text,
            isLive,
            sport: league.sport,
            dateTime: utcDate.toISOString(),
          });
        }
      } catch (err) {
        console.error(`Error fetching ${league.name}:`, err);
      }
    });

    await Promise.all(fetches);

    // Sort: live first, then by date
    results.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
    });

    const response = {
      items: results.slice(0, 5),
      updatedAt: new Date().toISOString(),
    };

    // Cache result
    cache = { data: response, expiry: Date.now() + CACHE_TTL };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('womens-sports-live error:', err);
    return new Response(JSON.stringify({ items: [], error: 'Failed to fetch sports data' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
