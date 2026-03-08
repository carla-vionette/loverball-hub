import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LinkPreviewData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  favicon: string | null;
}

// SSRF protection: block private/internal IPs
const BLOCKED_PATTERNS = [
  /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])/i,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^https?:\/\/169\.254\./,
  /^https?:\/\/100\.(6[4-9]|[7-9][0-9]|1[0-2][0-7])\./,
  /^https?:\/\/\[?fe80:/i,
  /^https?:\/\/\[?fd/i,
  /^https?:\/\/\[?fc/i,
];

function isBlockedUrl(url: string): boolean {
  return BLOCKED_PATTERNS.some(p => p.test(url));
}

// Rate limiter
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 20;

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

function extractMeta(html: string, properties: string[]): string | null {
  for (const prop of properties) {
    const propMatch = html.match(new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'));
    if (propMatch) return propMatch[1];
    const propMatch2 = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i'));
    if (propMatch2) return propMatch2[1];
    const nameMatch = html.match(new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'));
    if (nameMatch) return nameMatch[1];
    const nameMatch2 = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${prop}["']`, 'i'));
    if (nameMatch2) return nameMatch2[1];
  }
  return null;
}

function extractTitle(html: string): string | null {
  const ogTitle = extractMeta(html, ['og:title', 'twitter:title']);
  if (ogTitle) return ogTitle;
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

function extractFavicon(html: string, baseUrl: string): string | null {
  const patterns = [
    /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i,
    /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const href = match[1];
      if (href.startsWith('http')) return href;
      if (href.startsWith('//')) return `https:${href}`;
      if (href.startsWith('/')) {
        const url = new URL(baseUrl);
        return `${url.origin}${href}`;
      }
      return `${baseUrl}/${href}`;
    }
  }
  try {
    const url = new URL(baseUrl);
    return `${url.origin}/favicon.ico`;
  } catch {
    return null;
  }
}

function resolveUrl(href: string | null, baseUrl: string): string | null {
  if (!href) return null;
  if (href.startsWith('http')) return href;
  if (href.startsWith('//')) return `https:${href}`;
  try {
    const base = new URL(baseUrl);
    if (href.startsWith('/')) return `${base.origin}${href}`;
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;

    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { url } = await req.json();
    
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only allow http/https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return new Response(
        JSON.stringify({ error: "Only HTTP/HTTPS URLs are allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SSRF protection: block private/internal IPs
    if (isBlockedUrl(url)) {
      return new Response(
        JSON.stringify({ error: "Blocked URL" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch URL", status: response.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();
    
    const preview: LinkPreviewData = {
      url: response.url || url,
      title: extractTitle(html),
      description: extractMeta(html, ['og:description', 'twitter:description', 'description']),
      image: resolveUrl(extractMeta(html, ['og:image', 'twitter:image', 'twitter:image:src']), response.url || url),
      siteName: extractMeta(html, ['og:site_name']) || parsedUrl.hostname.replace('www.', ''),
      favicon: extractFavicon(html, response.url || url),
    };

    return new Response(
      JSON.stringify(preview),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error fetching link preview:", error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ error: "Request timeout" }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Failed to fetch link preview" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});