import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// IP-based rate limiter for public endpoints
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
  // Cleanup old entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [k, v] of rateLimitMap) {
      if (now - v.windowStart > RATE_LIMIT_WINDOW * 2) rateLimitMap.delete(k);
    }
  }
  return true;
}

// In-memory cache for rate limiting and performance
interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 120000; // 2 minutes - sports data doesn't change by the second

function getCachedData(key: string): unknown | null {
  const entry = cache.get(key);
  if (entry && (Date.now() - entry.timestamp) < CACHE_TTL) {
    console.log(`Cache hit for: ${key}`);
    return entry.data;
  }
  return null;
}

function setCachedData(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

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

// Reddit subreddits for LA teams
const REDDIT_SUBREDDITS = [
  'lakers', 'LAClippers', 'LASparks',
  'LosAngelesRams', 'Chargers',
  'Dodgers', 'angelsbaseball',
  'losangeleskings', 'AnaheimDucks',
  'LAGalaxy', 'LAFC', 'AngelCityFC',
  'UCLA', 'USC'
];

// LA Team identifiers for ESPN API
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

interface RedditPost {
  data: {
    title: string;
    score: number;
    subreddit: string;
    created_utc: number;
    is_self: boolean;
    num_comments: number;
  };
}

interface RedditResponse {
  data?: {
    children?: RedditPost[];
  };
}

interface TickerItem {
  text: string;
  priority: number; // Lower = higher priority (live games first)
  source: 'espn' | 'reddit';
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

// Fetch with timeout and retry
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, timeoutMs = 5000): Promise<Response | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) return res;
      console.warn(`Attempt ${attempt} for ${url}: status ${res.status}`);
      await res.text();
    } catch (err) {
      console.warn(`Attempt ${attempt} for ${url}: ${err instanceof Error ? err.message : err}`);
    }
    if (attempt < retries) await new Promise(r => setTimeout(r, 800 * attempt));
  }
  return null;
}

async function fetchESPNData(endpoint: string): Promise<ESPNResponse | null> {
  const cached = getCachedData(`espn:${endpoint}`);
  if (cached) return cached as ESPNResponse;

  const res = await fetchWithRetry(endpoint, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SportsTickerBot/1.0)' },
  });
  if (!res) return null;
  try {
    const data = await res.json();
    setCachedData(`espn:${endpoint}`, data);
    return data;
  } catch {
    return null;
  }
}

async function fetchRedditPosts(): Promise<TickerItem[]> {
  // Check cache first
  const cached = getCachedData('reddit:all');
  if (cached) return cached as TickerItem[];

  const items: TickerItem[] = [];
  
  // Fetch from a few key subreddits to avoid rate limits
  const prioritySubreddits = ['lakers', 'Dodgers', 'LosAngelesRams', 'LAFC', 'UCLA'];
  
  for (const subreddit of prioritySubreddits) {
    try {
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/hot.json?limit=3`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; LASportsTickerBot/1.0)',
          },
        }
      );
      
      if (!response.ok) {
        console.log(`Reddit API returned ${response.status} for r/${subreddit}`);
        continue;
      }
      
      const data: RedditResponse = await response.json();
      const posts = data.data?.children || [];
      
      for (const post of posts) {
        const { title, score, num_comments } = post.data;
        
        // Skip stickied/low-engagement posts
        if (score < 50 || num_comments < 10) continue;
        
        // Truncate title if too long
        const truncated = title.length > 55 ? title.substring(0, 52) + '...' : title;
        
        items.push({
          text: `r/${subreddit}: ${truncated}`,
          priority: 5, // Reddit posts have lower priority than games/news
          source: 'reddit'
        });
      }
      
      // Small delay to be respectful of Reddit's rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error fetching Reddit r/${subreddit}:`, error);
    }
  }
  
  // Sort by implicit engagement (position in hot feed) and take top results
  const result = items.slice(0, 5);
  setCachedData('reddit:all', result);
  return result;
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
      
      tickerText = `🔴 LIVE: ${awayTeam.team.displayName} @ ${homeTeam.team.displayName} | ${awayScore}-${homeScore} | ${periodText}`;
      priority = 1; // Highest priority for live games
    } else if (statusType === 'STATUS_FINAL' || event.status.type.completed) {
      // Final score
      tickerText = `${awayTeam.team.displayName} ${awayScore}-${homeScore} ${homeTeam.team.displayName} | FINAL`;
      priority = 2;
    } else if (statusType === 'STATUS_SCHEDULED') {
      // Upcoming game
      const gameTime = formatGameTime(competition.date);
      tickerText = `📅 ${awayTeam.team.displayName} vs ${homeTeam.team.displayName} | ${gameTime}`;
      priority = 3;
    }
    
    if (tickerText) {
      items.push({ text: tickerText, priority, source: 'espn' });
    }
  }
  
  return items;
}

async function fetchNews(): Promise<TickerItem[]> {
  // Check cache first
  const cached = getCachedData('espn:news');
  if (cached) return cached as TickerItem[];

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
            text: `📰 ${truncated}`, 
            priority: 4,
            source: 'espn'
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching news for ${sport}:`, error);
    }
  }
  
  const result = items.slice(0, 4); // Max 4 headlines
  setCachedData('espn:news', result);
  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit by IP or auth token
  const clientId = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
  if (!checkRateLimit(clientId)) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded', items: ['Rate limit exceeded. Please try again later.'], updatedAt: new Date().toISOString() }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { category = 'both', gender = 'both' } = await req.json().catch(() => ({}));
    const cacheKey = `ticker:${category}:${gender}`;
    
    // Check main response cache
    const cachedResponse = getCachedData(cacheKey);
    if (cachedResponse) {
      console.log(`Returning cached ticker response for ${cacheKey}`);
      return new Response(
        JSON.stringify(cachedResponse),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-Cache': 'HIT'
          } 
        }
      );
    }
    
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
    
    // Fetch all data in parallel (ESPN games, ESPN news, Reddit posts)
    const [gamesResults, newsItems, redditItems] = await Promise.all([
      Promise.all(
        endpointsToFetch.map(async ({ endpoint, sport }) => {
          const data = await fetchESPNData(endpoint);
          return processGames(data, sport, category, gender);
        })
      ),
      fetchNews(),
      fetchRedditPosts()
    ]);
    
    // Combine all items
    let allItems: TickerItem[] = [
      ...gamesResults.flat(),
      ...newsItems,
      ...redditItems
    ];
    
    // Sort by priority (live games first, then finals, then upcoming, then news, then reddit)
    allItems.sort((a, b) => a.priority - b.priority);
    
    // Take top 18 items (more room for reddit content)
    const tickerItems = allItems.slice(0, 18).map(item => item.text);
    
    // Count sources for logging
    const espnCount = allItems.filter(i => i.source === 'espn').length;
    const redditCount = allItems.filter(i => i.source === 'reddit').length;
    console.log(`Processed ${tickerItems.length} items (ESPN: ${espnCount}, Reddit: ${redditCount})`);
    
    // If no items found, provide a fallback message
    if (tickerItems.length === 0) {
      tickerItems.push('No live LA games right now. Check back soon for updates!');
    }

    const responseData = { 
      items: tickerItems,
      updatedAt: new Date().toISOString(),
      filters: { category, gender },
      sources: ['ESPN', 'Reddit']
    };
    
    // Cache the full response
    setCachedData(cacheKey, responseData);

    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Cache': 'MISS'
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
