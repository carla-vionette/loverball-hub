import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SHOPIFY_API_VERSION = '2025-07';
const SHOPIFY_STORE_PERMANENT_DOMAIN = 'loverball-hub-xfpsa.myshopify.com';
const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;

// IP-based rate limiter (shop is public-facing)
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
  if (rateLimitMap.size > 1000) {
    for (const [k, v] of rateLimitMap) {
      if (now - v.windowStart > RATE_LIMIT_WINDOW * 2) rateLimitMap.delete(k);
    }
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limit by IP (shop is publicly accessible)
    const clientId = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    if (!checkRateLimit(clientId)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SHOPIFY_STOREFRONT_TOKEN = Deno.env.get('SHOPIFY_STOREFRONT_ACCESS_TOKEN');
    
    if (!SHOPIFY_STOREFRONT_TOKEN) {
      console.error('SHOPIFY_STOREFRONT_ACCESS_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Shopify integration not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query, variables } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate query length to prevent abuse
    if (query.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Query too large' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Proxying Shopify request:', { queryLength: query.length, variables });

    const shopifyResponse = await fetch(SHOPIFY_STOREFRONT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (shopifyResponse.status === 402) {
      console.error('Shopify payment required');
      return new Response(
        JSON.stringify({ error: 'Shopify API access requires an active Shopify billing plan.', paymentRequired: true }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!shopifyResponse.ok) {
      console.error('Shopify API error:', shopifyResponse.status);
      return new Response(
        JSON.stringify({ error: `Shopify API error: ${shopifyResponse.status}` }),
        { status: shopifyResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await shopifyResponse.json();

    if (data.errors) {
      console.error('Shopify GraphQL errors:', data.errors);
      return new Response(
        JSON.stringify({ errors: data.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Shopify request successful');

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in shopify-proxy:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});