import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LinkPreviewData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  favicon: string | null;
}

// Extract meta content from HTML
function extractMeta(html: string, properties: string[]): string | null {
  for (const prop of properties) {
    // Try property attribute
    const propMatch = html.match(new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'));
    if (propMatch) return propMatch[1];
    
    // Try content before property
    const propMatch2 = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i'));
    if (propMatch2) return propMatch2[1];
    
    // Try name attribute
    const nameMatch = html.match(new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'));
    if (nameMatch) return nameMatch[1];
    
    // Try content before name
    const nameMatch2 = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${prop}["']`, 'i'));
    if (nameMatch2) return nameMatch2[1];
  }
  return null;
}

// Extract title from HTML
function extractTitle(html: string): string | null {
  const ogTitle = extractMeta(html, ['og:title', 'twitter:title']);
  if (ogTitle) return ogTitle;
  
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

// Extract favicon
function extractFavicon(html: string, baseUrl: string): string | null {
  // Try various link rel patterns
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
  
  // Default favicon path
  try {
    const url = new URL(baseUrl);
    return `${url.origin}/favicon.ico`;
  } catch {
    return null;
  }
}

// Resolve relative URLs to absolute
function resolveUrl(href: string | null, baseUrl: string): string | null {
  if (!href) return null;
  if (href.startsWith('http')) return href;
  if (href.startsWith('//')) return `https:${href}`;
  
  try {
    const base = new URL(baseUrl);
    if (href.startsWith('/')) {
      return `${base.origin}${href}`;
    }
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication to prevent SSRF abuse
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { url } = await req.json();
    
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the URL with a timeout
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
    
    // Extract metadata
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
