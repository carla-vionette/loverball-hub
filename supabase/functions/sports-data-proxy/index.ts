// sports-data-proxy: server-side proxy for SportsDataIO so the API key is never exposed in the client bundle.
// Accepts a constrained set of paths and forwards them with the secret key from env.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const API_KEY = Deno.env.get("SPORTSDATA_API_KEY") ?? "";
const BASE_URL = "https://api.sportsdata.io/v3";

// Allowlist of paths/path-patterns we will proxy. Anything else returns 400.
const ALLOWED_PATTERNS: RegExp[] = [
  /^\/wnba\/scores\/json\/Teams$/,
  /^\/wnba\/scores\/json\/Standings\/\d{4}$/,
  /^\/wnba\/scores\/json\/GamesByDate\/[0-9A-Z\-]+$/i,
  /^\/wnba\/stats\/json\/PlayerSeasonStats\/\d{4}$/,
  /^\/soccer\/scores\/json\/CompetitionDetails\/[A-Z]+$/i,
];

function isAllowed(path: string) {
  return ALLOWED_PATTERNS.some((re) => re.test(path));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Require an authenticated user — this proxy hits a paid upstream API.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "SportsData API key not configured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") ?? "";
    if (!path.startsWith("/") || !isAllowed(path)) {
      return new Response(JSON.stringify({ error: "Path not allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch(`${BASE_URL}${path}`, {
      headers: { "Ocp-Apim-Subscription-Key": API_KEY },
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sports-data-proxy error:", err);
    return new Response(JSON.stringify({ error: "Upstream error" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
