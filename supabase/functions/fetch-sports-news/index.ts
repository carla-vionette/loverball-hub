import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── General RSS feeds ───
const RSS_FEEDS = [
  { url: 'https://justwomenssports.com/feed', source: "Just Women's Sports", defaultTags: ["women's sports"] },
  { url: 'https://feeds.bbci.co.uk/sport/rss.xml', source: 'BBC Sport', defaultTags: [] },
  { url: 'https://www.espn.com/espn/rss/news', source: 'ESPN', defaultTags: [] },
  { url: 'https://www.espn.com/espn/rss/wnba/news', source: 'ESPN WNBA', defaultTags: ['basketball', "women's sports"] },
  { url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN Soccer', defaultTags: ['soccer'] },
];

// ─── Team-specific feeds ───
// Maps team display name → { keywords, feeds, sportTags }
const TEAM_FEEDS: Record<string, { keywords: string[]; feeds: Array<{ url: string; source: string }>; sportTags: string[] }> = {
  // WNBA
  'LA Sparks':       { keywords: ['sparks', 'la sparks'], feeds: [{ url: 'https://www.espn.com/espn/rss/wnba/news', source: 'ESPN WNBA' }], sportTags: ['basketball', "women's sports"] },
  'Las Vegas Aces':  { keywords: ['aces', 'las vegas aces'], feeds: [{ url: 'https://www.espn.com/espn/rss/wnba/news', source: 'ESPN WNBA' }], sportTags: ['basketball', "women's sports"] },
  'New York Liberty': { keywords: ['liberty', 'ny liberty', 'new york liberty'], feeds: [{ url: 'https://www.espn.com/espn/rss/wnba/news', source: 'ESPN WNBA' }], sportTags: ['basketball', "women's sports"] },
  'Indiana Fever':   { keywords: ['fever', 'indiana fever', 'caitlin clark'], feeds: [{ url: 'https://www.espn.com/espn/rss/wnba/news', source: 'ESPN WNBA' }], sportTags: ['basketball', "women's sports"] },
  'Chicago Sky':     { keywords: ['chicago sky', 'sky wnba'], feeds: [{ url: 'https://www.espn.com/espn/rss/wnba/news', source: 'ESPN WNBA' }], sportTags: ['basketball', "women's sports"] },
  'Seattle Storm':   { keywords: ['seattle storm', 'storm wnba'], feeds: [{ url: 'https://www.espn.com/espn/rss/wnba/news', source: 'ESPN WNBA' }], sportTags: ['basketball', "women's sports"] },
  'Minnesota Lynx':  { keywords: ['lynx', 'minnesota lynx'], feeds: [{ url: 'https://www.espn.com/espn/rss/wnba/news', source: 'ESPN WNBA' }], sportTags: ['basketball', "women's sports"] },
  'Connecticut Sun': { keywords: ['connecticut sun', 'sun wnba'], feeds: [{ url: 'https://www.espn.com/espn/rss/wnba/news', source: 'ESPN WNBA' }], sportTags: ['basketball', "women's sports"] },
  'Phoenix Mercury': { keywords: ['mercury', 'phoenix mercury'], feeds: [{ url: 'https://www.espn.com/espn/rss/wnba/news', source: 'ESPN WNBA' }], sportTags: ['basketball', "women's sports"] },
  'Atlanta Dream':   { keywords: ['dream', 'atlanta dream'], feeds: [{ url: 'https://www.espn.com/espn/rss/wnba/news', source: 'ESPN WNBA' }], sportTags: ['basketball', "women's sports"] },
  'Dallas Wings':    { keywords: ['wings', 'dallas wings'], feeds: [{ url: 'https://www.espn.com/espn/rss/wnba/news', source: 'ESPN WNBA' }], sportTags: ['basketball', "women's sports"] },
  'Washington Mystics': { keywords: ['mystics', 'washington mystics'], feeds: [{ url: 'https://www.espn.com/espn/rss/wnba/news', source: 'ESPN WNBA' }], sportTags: ['basketball', "women's sports"] },
  // NWSL
  'Angel City FC':   { keywords: ['angel city'], feeds: [{ url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN Soccer' }], sportTags: ['soccer', "women's sports"] },
  'Gotham FC':       { keywords: ['gotham fc', 'gotham'], feeds: [{ url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN Soccer' }], sportTags: ['soccer', "women's sports"] },
  'Portland Thorns': { keywords: ['thorns', 'portland thorns'], feeds: [{ url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN Soccer' }], sportTags: ['soccer', "women's sports"] },
  'OL Reign':        { keywords: ['ol reign', 'reign fc'], feeds: [{ url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN Soccer' }], sportTags: ['soccer', "women's sports"] },
  'Racing Louisville': { keywords: ['racing louisville'], feeds: [{ url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN Soccer' }], sportTags: ['soccer', "women's sports"] },
  'San Diego Wave':  { keywords: ['san diego wave', 'wave fc'], feeds: [{ url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN Soccer' }], sportTags: ['soccer', "women's sports"] },
  'Bay FC':          { keywords: ['bay fc'], feeds: [{ url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN Soccer' }], sportTags: ['soccer', "women's sports"] },
  // National teams
  'USWNT':           { keywords: ['uswnt', 'us women', 'u.s. women'], feeds: [{ url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN Soccer' }], sportTags: ['soccer', "women's sports"] },
  // WTA Tennis
  'WTA':             { keywords: ['wta', "women's tennis"], feeds: [{ url: 'https://feeds.bbci.co.uk/sport/tennis/rss.xml', source: 'BBC Sport Tennis' }], sportTags: ['tennis', "women's sports"] },
  // College basketball
  'UConn Huskies':   { keywords: ['uconn', 'huskies basketball'], feeds: [{ url: 'https://www.espn.com/espn/rss/ncw/news', source: 'ESPN NCAAW' }], sportTags: ['basketball', "women's sports"] },
  'South Carolina Gamecocks': { keywords: ['gamecocks', 'south carolina'], feeds: [{ url: 'https://www.espn.com/espn/rss/ncw/news', source: 'ESPN NCAAW' }], sportTags: ['basketball', "women's sports"] },
  'LSU Tigers':      { keywords: ['lsu', 'tigers basketball'], feeds: [{ url: 'https://www.espn.com/espn/rss/ncw/news', source: 'ESPN NCAAW' }], sportTags: ['basketball', "women's sports"] },
  'Iowa Hawkeyes':   { keywords: ['iowa hawkeyes', 'hawkeyes basketball'], feeds: [{ url: 'https://www.espn.com/espn/rss/ncw/news', source: 'ESPN NCAAW' }], sportTags: ['basketball', "women's sports"] },
  'Stanford Cardinal': { keywords: ['stanford cardinal', 'stanford basketball'], feeds: [{ url: 'https://www.espn.com/espn/rss/ncw/news', source: 'ESPN NCAAW' }], sportTags: ['basketball', "women's sports"] },
  // LA-specific
  'Lakers':          { keywords: ['lakers'], feeds: [{ url: 'https://www.espn.com/espn/rss/nba/news', source: 'ESPN NBA' }], sportTags: ['basketball'] },
  'Clippers':        { keywords: ['clippers'], feeds: [{ url: 'https://www.espn.com/espn/rss/nba/news', source: 'ESPN NBA' }], sportTags: ['basketball'] },
  'LA Galaxy':       { keywords: ['galaxy', 'la galaxy'], feeds: [{ url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN Soccer' }], sportTags: ['soccer'] },
  'LAFC':            { keywords: ['lafc'], feeds: [{ url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN Soccer' }], sportTags: ['soccer'] },
  'Dodgers':         { keywords: ['dodgers'], feeds: [{ url: 'https://www.espn.com/espn/rss/mlb/news', source: 'ESPN MLB' }], sportTags: ['baseball'] },
  'Rams':            { keywords: ['rams'], feeds: [{ url: 'https://www.espn.com/espn/rss/nfl/news', source: 'ESPN NFL' }], sportTags: ['football'] },
  'Chargers':        { keywords: ['chargers'], feeds: [{ url: 'https://www.espn.com/espn/rss/nfl/news', source: 'ESPN NFL' }], sportTags: ['football'] },
  'LA Kings':        { keywords: ['kings', 'la kings'], feeds: [{ url: 'https://www.espn.com/espn/rss/nhl/news', source: 'ESPN NHL' }], sportTags: ['hockey'] },
};

// ─── Sport keyword detection ───
const SPORT_KEYWORDS: Record<string, string[]> = {
  'basketball': ['basketball', 'wnba', 'nba', 'hoops', 'lakers', 'sparks', 'clippers', 'ncaaw'],
  'soccer': ['soccer', 'football', 'nwsl', 'mls', 'uswnt', 'angel city', 'la galaxy', 'lafc', 'world cup', 'premier league'],
  'tennis': ['tennis', 'wimbledon', 'us open', 'french open', 'australian open', 'wta', 'atp'],
  'volleyball': ['volleyball'],
  'softball': ['softball'],
  'gymnastics': ['gymnastics', 'gymnast'],
  'swimming': ['swimming', 'swim'],
  'track': ['track and field', 'athletics', 'marathon', 'running', 'sprint', '100m', '200m', '400m', '800m', 'relay', 'hurdle'],
  'baseball': ['baseball', 'mlb', 'dodgers', 'angels'],
  'football': ['nfl', 'rams', 'chargers', 'super bowl'],
  'hockey': ['hockey', 'nhl', 'kings', 'ducks'],
  'golf': ['golf', 'lpga', 'pga'],
  'boxing': ['boxing', 'ufc', 'mma', 'fight'],
  'cricket': ['cricket'],
  'rugby': ['rugby'],
  'olympics': ['olympic', 'olympics', 'la28', 'paris 2024'],
};

const WOMEN_KEYWORDS = ['women', 'woman', 'wnba', 'nwsl', 'wta', 'uswnt', 'lpga', 'she ', 'her ', 'female', 'angel city', 'sparks'];

function extractSportTags(text: string): string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [];
  for (const [sport, keywords] of Object.entries(SPORT_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) tags.push(sport);
  }
  return tags;
}

function extractTeamTags(text: string): string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [];
  for (const [team, config] of Object.entries(TEAM_FEEDS)) {
    if (config.keywords.some(kw => lower.includes(kw))) tags.push(team);
  }
  return tags;
}

function isWomensSports(text: string): boolean {
  return WOMEN_KEYWORDS.some(kw => text.toLowerCase().includes(kw));
}

function trimToSentences(text: string, max = 3): string {
  if (!text) return '';
  const clean = text.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
  const sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
  return sentences.slice(0, max).join(' ').trim();
}

function parseRSSItems(xml: string): Array<{ title: string; description: string; link: string; pubDate: string; imageUrl: string | null }> {
  const items: Array<{ title: string; description: string; link: string; pubDate: string; imageUrl: string | null }> = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const getTag = (tag: string): string => {
      const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
      const cdataMatch = block.match(cdataRegex);
      if (cdataMatch) return cdataMatch[1].trim();
      const simpleRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
      const simpleMatch = block.match(simpleRegex);
      return simpleMatch ? simpleMatch[1].trim() : '';
    };

    let imageUrl: string | null = null;
    const mediaContentMatch = block.match(/<media:content[^>]*url=["']([^"']+)["'][^>]*>/i);
    if (mediaContentMatch) imageUrl = mediaContentMatch[1];
    if (!imageUrl) {
      const mediaThumbnailMatch = block.match(/<media:thumbnail[^>]*url=["']([^"']+)["'][^>]*>/i);
      if (mediaThumbnailMatch) imageUrl = mediaThumbnailMatch[1];
    }
    if (!imageUrl) {
      const enclosureMatch = block.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image[^"']*["'][^>]*>/i);
      if (enclosureMatch) imageUrl = enclosureMatch[1];
    }
    if (!imageUrl) {
      const imgMatch = block.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
      if (imgMatch) imageUrl = imgMatch[1];
    }

    const title = getTag('title');
    const description = getTag('description') || getTag('content:encoded') || '';
    const link = getTag('link');
    const pubDate = getTag('pubDate');
    if (title && link) {
      items.push({ title, description, link, pubDate, imageUrl });
    }
  }
  return items;
}

async function fetchFeed(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Loverball-NewsBot/1.0' },
    });
    clearTimeout(timeout);
    if (!res.ok) { console.warn(`Feed ${url} returned ${res.status}`); return ''; }
    return await res.text();
  } catch (err) {
    clearTimeout(timeout);
    console.warn(`Feed ${url} failed: ${err}`);
    return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    let isAuthorized = false;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      // Allow service-role invocation (used by pg_cron / scheduled jobs)
      if (token === serviceKey) {
        isAuthorized = true;
      } else {
        const supabaseAuth = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
        const { data: { user } } = await supabaseAuth.auth.getUser();
        if (user) {
          const supabaseAdmin = createClient(supabaseUrl, serviceKey);
          const { data: isAdmin } = await supabaseAdmin.rpc('has_role', { _user_id: user.id, _role: 'admin' });
          if (isAdmin) isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Collect all unique feed URLs (general + team-specific)
    const feedMap = new Map<string, { source: string; defaultTags: string[] }>();
    for (const f of RSS_FEEDS) {
      feedMap.set(f.url, { source: f.source, defaultTags: f.defaultTags });
    }
    for (const [, config] of Object.entries(TEAM_FEEDS)) {
      for (const f of config.feeds) {
        if (!feedMap.has(f.url)) {
          feedMap.set(f.url, { source: f.source, defaultTags: config.sportTags });
        }
      }
    }

    // Fetch all unique feeds in parallel
    const feedUrls = Array.from(feedMap.keys());
    const xmlResults = await Promise.allSettled(feedUrls.map(url => fetchFeed(url)));
    const xmlByUrl = new Map<string, string>();
    feedUrls.forEach((url, i) => {
      const r = xmlResults[i];
      if (r.status === 'fulfilled') xmlByUrl.set(url, r.value);
    });

    const allArticles: Array<{
      title: string; summary: string; source: string; source_url: string;
      category: string; sport_tags: string[]; team_tags: string[];
      image_url: string | null; created_at: string;
    }> = [];
    const seenUrls = new Set<string>();

    // Process each feed
    for (const [url, meta] of feedMap.entries()) {
      const xml = xmlByUrl.get(url);
      if (!xml) continue;
      const items = parseRSSItems(xml);

      for (const item of items.slice(0, 25)) {
        if (seenUrls.has(item.link)) continue;
        seenUrls.add(item.link);

        const combined = `${item.title} ${item.description}`;

        // For generic ESPN feed, only include women's sports or team-specific content
        if (meta.source === 'ESPN' && !isWomensSports(combined)) {
          const teams = extractTeamTags(combined);
          if (teams.length === 0) continue;
        }

        const sportTags = [...new Set([...extractSportTags(combined), ...meta.defaultTags])];
        const teamTags = extractTeamTags(combined);
        const summary = trimToSentences(item.description, 3);

        let category = 'general';
        if (isWomensSports(combined)) category = "women's sports";
        else if (sportTags.length > 0) category = sportTags[0];

        const pubDate = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();

        allArticles.push({
          title: item.title.replace(/<[^>]*>/g, '').trim(),
          summary: summary || item.title,
          source: meta.source,
          source_url: item.link,
          category,
          sport_tags: sportTags,
          team_tags: teamTags,
          image_url: item.imageUrl || null,
          created_at: pubDate,
        });
      }
    }

    console.log(`Parsed ${allArticles.length} articles from ${feedMap.size} unique feeds`);

    if (allArticles.length > 0) {
      const { error: upsertError } = await supabase
        .from('feed_items')
        .upsert(
          allArticles.map(a => ({
            title: a.title, summary: a.summary, source: a.source,
            source_url: a.source_url, category: a.category,
            sport_tags: a.sport_tags, team_tags: a.team_tags,
            image_url: a.image_url, created_at: a.created_at,
          })),
          { onConflict: 'source_url', ignoreDuplicates: false }
        );
      if (upsertError) console.error('Upsert error:', upsertError);

      // Clean up articles older than 72 hours
      const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
      await supabase.from('feed_items').delete().lt('created_at', cutoff);
    }

    return new Response(JSON.stringify({
      success: true, articlesProcessed: allArticles.length,
      lastUpdated: new Date().toISOString(),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('fetch-sports-news error:', error);
    return new Response(JSON.stringify({
      success: false, error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});