import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ESPN API endpoints for different sports
const ESPN_ENDPOINTS = {
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

// ESPN News endpoints
const ESPN_NEWS_ENDPOINTS = {
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news',
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news',
  nhl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/news',
};

// LA Team identifiers for ESPN API
const LA_TEAM_ABBREVS = {
  // NBA
  'LAL': 'Los Angeles Lakers',
  'LAC': 'Los Angeles Clippers',
  // WNBA
  'LA': 'Los Angeles Sparks',
  // NFL
  'LAR': 'Los Angeles Rams',
  // Chargers
  'LAC_NFL': 'Los Angeles Chargers',
  // MLB
  'LAD': 'Los Angeles Dodgers',
  'LAA': 'Los Angeles Angels',
  // NHL
  'LA_NHL': 'Los Angeles Kings',
  'ANA': 'Anaheim Ducks',
  // MLS
  'LAG': 'LA Galaxy',
  'LAFC': 'LAFC',
  // NWSL
  'ACFC': 'Angel City FC',
  'SD': 'San Diego Wave FC',
};

const LA_TEAM_NAMES = [
  'Lakers', 'Clippers', 'Sparks', 'Rams', 'Chargers', 'Dodgers', 'Angels',
  'Kings', 'Ducks', 'Galaxy', 'LAFC', 'Angel City', 'Wave',
  // College teams
  'UCLA', 'USC', 'Pepperdine', 'LMU', 'Cal State Fullerton', 'CSUN', 
  'Long Beach State', 'UC Irvine', 'Bruins', 'Trojans'
];

interface ESPNGame {
  id: string;
  status: {
    type: {
      name: string;
      description: string;
      completed: boolean;
    };
    displayClock?: string;
    period?: number;
  };
  competitions: Array<{
    competitors: Array<{
      team: {
        displayName: string;
        abbreviation: string;
      };
      score: string;
      homeAway: string;
    }>;
    status?: {
      type: {
        name: string;
        shortDetail: string;
      };
    };
    date: string;
  }>;
}

interface ESPNResponse {
  events?: ESPNGame[];
}

interface TickerItem {
  text: string;
  priority: number; // Lower = higher priority (live games first)
}

function isLATeam(teamName: string): boolean {
  return LA_TEAM_NAMES.some(laTeam => 
    teamName.toLowerCase().includes(laTeam.toLowerCase())
  );
}

function formatGameTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
  }) + ' PT';
}

function formatPeriod(sport: string, period: number, clock: string): string {
  if (sport === 'nba' || sport === 'wnba') {
    return `Q${period} ${clock}`;
  } else if (sport === 'nfl') {
    return `Q${period} ${clock}`;
  } else if (sport === 'nhl') {
    const periodNames = ['1st', '2nd', '3rd', 'OT'];
    return `${periodNames[period - 1] || period} Period ${clock}`;
  } else if (sport === 'mlb') {
    return clock || 'In Progress';
  } else if (sport === 'mls' || sport === 'nwsl') {
    return period <= 1 ? `1st Half ${clock}` : `2nd Half ${clock}`;
  } else if (sport.includes('ncaa')) {
    if (sport.includes('fb')) {
      return `Q${period} ${clock}`;
    }
    return period <= 1 ? `1st Half ${clock}` : `2nd Half ${clock}`;
  }
  return clock;
}

async function fetchESPNData(endpoint: string): Promise<ESPNResponse | null> {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SportsTickerBot/1.0)',
      },
    });
    if (!response.ok) {
      console.error(`ESPN API error for ${endpoint}: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
}

function processGames(data: ESPNResponse | null, sport: string, category: string, gender: string): TickerItem[] {
  if (!data?.events) return [];
  
  const items: TickerItem[] = [];
  
  for (const event of data.events) {
    const competition = event.competitions[0];
    if (!competition) continue;
    
    const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
    const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
    
    if (!homeTeam || !awayTeam) continue;
    
    // Check if any LA team is involved
    const hasLATeam = isLATeam(homeTeam.team.displayName) || isLATeam(awayTeam.team.displayName);
    if (!hasLATeam) continue;
    
    // Apply category filter
    const isCollegeSport = sport.includes('ncaa');
    if (category === 'college' && !isCollegeSport) continue;
    if (category === 'pro' && isCollegeSport) continue;
    
    // Apply gender filter for pro sports
    if (category !== 'college') {
      const isWomensSport = sport === 'wnba' || sport === 'nwsl' || sport.includes('wbb');
      if (gender === 'women' && !isWomensSport) continue;
      if (gender === 'men' && isWomensSport) continue;
    }
    
    const statusType = event.status.type.name;
    const homeScore = homeTeam.score || '0';
    const awayScore = awayTeam.score || '0';
    
    let tickerText = '';
    let priority = 3;
    
    if (statusType === 'STATUS_IN_PROGRESS' || statusType === 'STATUS_HALFTIME') {
      // Live game
      const clock = event.status.displayClock || '';
      const period = event.status.period || 1;
      const periodText = statusType === 'STATUS_HALFTIME' ? 'Halftime' : formatPeriod(sport, period, clock);
      
      tickerText = `${awayTeam.team.displayName} @ ${homeTeam.team.displayName} | Score: ${awayScore}-${homeScore} | ${periodText}`;
      priority = 1; // Highest priority for live games
    } else if (statusType === 'STATUS_FINAL' || event.status.type.completed) {
      // Final score
      tickerText = `${awayTeam.team.displayName} ${awayScore}-${homeScore} ${homeTeam.team.displayName} | FINAL`;
      priority = 2;
    } else if (statusType === 'STATUS_SCHEDULED') {
      // Upcoming game
      const gameTime = formatGameTime(competition.date);
      tickerText = `${awayTeam.team.displayName} vs ${homeTeam.team.displayName} | ${gameTime}`;
      priority = 3;
    }
    
    if (tickerText) {
      items.push({ text: tickerText, priority });
    }
  }
  
  return items;
}

async function fetchNews(): Promise<TickerItem[]> {
  const items: TickerItem[] = [];
  
  for (const [sport, endpoint] of Object.entries(ESPN_NEWS_ENDPOINTS)) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SportsTickerBot/1.0)',
        },
      });
      
      if (!response.ok) continue;
      
      const data = await response.json();
      const articles = data.articles || [];
      
      for (const article of articles.slice(0, 3)) {
        const headline = article.headline || '';
        // Check if headline mentions LA team
        if (LA_TEAM_NAMES.some(team => headline.toLowerCase().includes(team.toLowerCase()))) {
          // Truncate headline if too long
          const truncated = headline.length > 60 ? headline.substring(0, 57) + '...' : headline;
          items.push({ 
            text: `HEADLINE: ${truncated}`, 
            priority: 4 
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching news for ${sport}:`, error);
    }
  }
  
  return items.slice(0, 4); // Max 4 headlines
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category = 'both', gender = 'both' } = await req.json().catch(() => ({}));
    
    console.log(`Fetching LA sports ticker - category: ${category}, gender: ${gender}`);
    
    // Determine which endpoints to fetch based on filters
    const endpointsToFetch: { endpoint: string; sport: string }[] = [];
    
    if (category === 'pro' || category === 'both') {
      if (gender === 'both' || gender === 'men') {
        endpointsToFetch.push(
          { endpoint: ESPN_ENDPOINTS.nba, sport: 'nba' },
          { endpoint: ESPN_ENDPOINTS.nfl, sport: 'nfl' },
          { endpoint: ESPN_ENDPOINTS.mlb, sport: 'mlb' },
          { endpoint: ESPN_ENDPOINTS.nhl, sport: 'nhl' },
          { endpoint: ESPN_ENDPOINTS.mls, sport: 'mls' }
        );
      }
      if (gender === 'both' || gender === 'women') {
        endpointsToFetch.push(
          { endpoint: ESPN_ENDPOINTS.wnba, sport: 'wnba' },
          { endpoint: ESPN_ENDPOINTS.nwsl, sport: 'nwsl' }
        );
      }
    }
    
    if (category === 'college' || category === 'both') {
      endpointsToFetch.push(
        { endpoint: ESPN_ENDPOINTS.ncaambb, sport: 'ncaambb' },
        { endpoint: ESPN_ENDPOINTS.ncaawbb, sport: 'ncaawbb' },
        { endpoint: ESPN_ENDPOINTS.ncaafb, sport: 'ncaafb' }
      );
    }
    
    // Fetch all data in parallel
    const [gamesResults, newsItems] = await Promise.all([
      Promise.all(
        endpointsToFetch.map(async ({ endpoint, sport }) => {
          const data = await fetchESPNData(endpoint);
          return processGames(data, sport, category, gender);
        })
      ),
      fetchNews()
    ]);
    
    // Combine all game items
    let allItems: TickerItem[] = gamesResults.flat();
    
    // Add news headlines
    allItems = [...allItems, ...newsItems];
    
    // Sort by priority (live games first, then finals, then upcoming, then news)
    allItems.sort((a, b) => a.priority - b.priority);
    
    // Take top 15 items
    const tickerItems = allItems.slice(0, 15).map(item => item.text);
    
    console.log(`Processed ${tickerItems.length} real ticker items from ESPN`);
    
    // If no items found, provide a fallback message
    if (tickerItems.length === 0) {
      tickerItems.push('No live LA games right now. Check back soon for updates!');
    }

    return new Response(
      JSON.stringify({ 
        items: tickerItems,
        updatedAt: new Date().toISOString(),
        filters: { category, gender },
        source: 'ESPN'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in la-sports-ticker:', errorMessage);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        items: ['Unable to fetch live scores. Please try again later.'],
        updatedAt: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
