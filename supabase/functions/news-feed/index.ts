import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// In-memory cache
interface CacheEntry { data: unknown; timestamp: number; }
const cache: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 300000; // 5 minutes

function getCached(key: string): unknown | null {
  const e = cache.get(key);
  return e && (Date.now() - e.timestamp) < CACHE_TTL ? e.data : null;
}
function setCache(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() });
  // Cleanup old entries
  if (cache.size > 50) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now - v.timestamp > CACHE_TTL * 2) cache.delete(k);
    }
  }
}

// Fetch with timeout and retry
async function fetchWithRetry(url: string, retries = 3, timeoutMs = 5000): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) return res;
      console.warn(`Attempt ${attempt} for ${url}: status ${res.status}`);
      await res.text(); // consume body
    } catch (err) {
      console.warn(`Attempt ${attempt} for ${url}: ${err instanceof Error ? err.message : err}`);
    }
    if (attempt < retries) await new Promise(r => setTimeout(r, 1000 * attempt));
  }
  throw new Error(`All ${retries} attempts failed for ${url}`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY');
    if (!NEWS_API_KEY) {
      return new Response(JSON.stringify({
        error: 'NEWS_API_KEY is not configured. Add your NewsAPI key to enable this feature.',
        articles: [],
        lastUpdated: new Date().toISOString(),
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const {
      endpoint = 'top-headlines', // 'top-headlines' or 'everything'
      category = 'sports',
      query = '',
      page = 1,
      pageSize = 20,
      sortBy = 'publishedAt',
      language = 'en',
      country = 'us',
    } = body;

    const cacheKey = `news:${endpoint}:${category}:${query}:${page}:${sortBy}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
      });
    }

    let url: string;
    if (endpoint === 'everything') {
      url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query || 'sports')}&language=${language}&sortBy=${sortBy}&page=${page}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`;
    } else {
      url = `https://newsapi.org/v2/top-headlines?category=${category}&country=${country}&language=${language}&page=${page}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`;
      if (query) url += `&q=${encodeURIComponent(query)}`;
    }

    const res = await fetchWithRetry(url, 3, 5000);
    const data = await res.json();

    const responseData = {
      articles: (data.articles || []).map((a: any) => ({
        title: a.title,
        description: a.description,
        url: a.url,
        urlToImage: a.urlToImage,
        source: a.source?.name || 'Unknown',
        publishedAt: a.publishedAt,
        author: a.author,
      })),
      totalResults: data.totalResults || 0,
      page,
      pageSize,
      lastUpdated: new Date().toISOString(),
    };

    setCache(cacheKey, responseData);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('news-feed error:', msg);

    // Return cached data if available on error
    const fallbackKey = Array.from(cache.keys()).find(k => k.startsWith('news:'));
    const fallback = fallbackKey ? cache.get(fallbackKey) : null;

    return new Response(JSON.stringify({
      error: msg,
      articles: fallback ? (fallback.data as any).articles : [],
      totalResults: fallback ? (fallback.data as any).totalResults : 0,
      lastUpdated: fallback ? new Date(fallback.timestamp).toISOString() : new Date().toISOString(),
      fromCache: !!fallback,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
