import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// RSS feed sources — women's sports focused
const RSS_FEEDS = [
  { url: 'https://justwomenssports.com/feed', source: 'Just Women\'s Sports', defaultTags: ['women\'s sports'] },
  { url: 'https://feeds.bbci.co.uk/sport/rss.xml', source: 'BBC Sport', defaultTags: [] },
  { url: 'https://www.espn.com/espn/rss/news', source: 'ESPN', defaultTags: [] },
  { url: 'https://www.espn.com/espn/rss/wnba/news', source: 'ESPN WNBA', defaultTags: ['basketball', 'women\'s sports'] },
  { url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN Soccer', defaultTags: ['soccer'] },
];

// Keywords for sport tagging
const SPORT_KEYWORDS: Record<string, string[]> = {
  'basketball': ['basketball', 'wnba', 'nba', 'hoops', 'lakers', 'sparks', 'clippers'],
  'soccer': ['soccer', 'football', 'nwsl', 'mls', 'uswnt', 'angel city', 'la galaxy', 'lafc', 'world cup', 'premier league'],
  'tennis': ['tennis', 'wimbledon', 'us open', 'french open', 'australian open', 'wta', 'atp'],
  'volleyball': ['volleyball'],
  'softball': ['softball'],
  'gymnastics': ['gymnastics', 'gymnast'],
  'swimming': ['swimming', 'swim'],
  'track': ['track', 'field', 'athletics', 'marathon', 'running'],
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

const TEAM_KEYWORDS: Record<string, string[]> = {
  'LA Sparks': ['sparks', 'la sparks'],
  'Angel City FC': ['angel city'],
  'LA Galaxy': ['galaxy', 'la galaxy'],
  'LAFC': ['lafc'],
  'Lakers': ['lakers'],
  'Clippers': ['clippers'],
  'Dodgers': ['dodgers'],
  'Rams': ['rams'],
  'Chargers': ['chargers'],
  'LA Kings': ['kings', 'la kings'],
};

function extractSportTags(text: string): string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [];
  for (const [sport, keywords] of Object.entries(SPORT_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      tags.push(sport);
    }
  }
  return tags;
}

function extractTeamTags(text: string): string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [];
  for (const [team, keywords] of Object.entries(TEAM_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      tags.push(team);
    }
  }
  return tags;
}

function isWomensSports(text: string): boolean {
  const lower = text.toLowerCase();
  return WOMEN_KEYWORDS.some(kw => lower.includes(kw));
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

    // Try to extract image from media:content, media:thumbnail, or enclosure
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
    // Try og:image style in description
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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Allow both cron (no auth) and admin-authenticated calls
    const authHeader = req.headers.get('Authorization');
    let isAuthorized = false;

    // If called via cron with the anon key, allow it
    if (authHeader === `Bearer ${anonKey}`) {
      isAuthorized = true;
    } else if (authHeader?.startsWith('Bearer ')) {
      // Verify caller is admin
      const supabaseAuth = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (user) {
        const supabaseAdmin = createClient(supabaseUrl, serviceKey);
        const { data: isAdmin } = await supabaseAdmin.rpc('has_role', { _user_id: user.id, _role: 'admin' });
        if (isAdmin) isAuthorized = true;
      }
    }

    // For cron jobs, also allow calls with no auth header (internal invocation)
    if (!authHeader) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const allArticles: Array<{
      title: string;
      summary: string;
      source: string;
      source_url: string;
      category: string;
      sport_tags: string[];
      team_tags: string[];
      image_url: string | null;
      created_at: string;
    }> = [];

    // Fetch all feeds in parallel
    const feedResults = await Promise.allSettled(
      RSS_FEEDS.map(async (feed) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          const res = await fetch(feed.url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Loverball-NewsBot/1.0' },
          });
          clearTimeout(timeout);
          if (!res.ok) {
            console.warn(`Feed ${feed.source} returned ${res.status}`);
            return { feed, xml: '' };
          }
          const xml = await res.text();
          return { feed, xml };
        } catch (err) {
          clearTimeout(timeout);
          console.warn(`Feed ${feed.source} failed: ${err}`);
          return { feed, xml: '' };
        }
      })
    );

    for (const result of feedResults) {
      if (result.status !== 'fulfilled' || !result.value.xml) continue;
      const { feed, xml } = result.value;
      const items = parseRSSItems(xml);

      for (const item of items.slice(0, 20)) {
        const combined = `${item.title} ${item.description}`;
        
        // For generic ESPN feed, only include women's sports or LA-specific content
        if (feed.source === 'ESPN' && !isWomensSports(combined)) {
          const laTeams = extractTeamTags(combined);
          if (laTeams.length === 0) continue;
        }

        const sportTags = [...new Set([...extractSportTags(combined), ...feed.defaultTags])];
        const teamTags = extractTeamTags(combined);
        const summary = trimToSentences(item.description, 3);

        let category = 'general';
        if (isWomensSports(combined)) category = 'women\'s sports';
        else if (sportTags.length > 0) category = sportTags[0];

        const pubDate = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();

        allArticles.push({
          title: item.title.replace(/<[^>]*>/g, '').trim(),
          summary: summary || item.title,
          source: feed.source,
          source_url: item.link,
          category,
          sport_tags: sportTags,
          team_tags: teamTags,
          image_url: item.imageUrl || null,
          created_at: pubDate,
        });
      }
    }

    console.log(`Parsed ${allArticles.length} articles from ${RSS_FEEDS.length} feeds`);

    if (allArticles.length > 0) {
      const { error: upsertError } = await supabase
        .from('feed_items')
        .upsert(
          allArticles.map(a => ({
            title: a.title,
            summary: a.summary,
            source: a.source,
            source_url: a.source_url,
            category: a.category,
            sport_tags: a.sport_tags,
            team_tags: a.team_tags,
            image_url: a.image_url,
            created_at: a.created_at,
          })),
          { onConflict: 'source_url', ignoreDuplicates: false }
        );

      if (upsertError) {
        console.error('Upsert error:', upsertError);
      }

      // Clean up articles older than 72 hours
      const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
      await supabase.from('feed_items').delete().lt('created_at', cutoff);
    }

    return new Response(JSON.stringify({
      success: true,
      articlesProcessed: allArticles.length,
      lastUpdated: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('fetch-sports-news error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
