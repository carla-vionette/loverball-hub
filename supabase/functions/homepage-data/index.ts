import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split("T")[0];

    // Run all queries in parallel — single round trip from client, parallel on server
    const [newsRes, eventsRes, tickerRes] = await Promise.all([
      supabase
        .from("feed_items")
        .select("id, title, summary, source, source_url, image_url, category, sport_tags, team_tags, created_at")
        .order("created_at", { ascending: false })
        .limit(6),

      supabase
        .from("events")
        .select("id, title, event_date, event_time, venue_name, city, location, event_type, image_url, slug, sport_tags, tier, visibility")
        .gte("event_date", today)
        .eq("visibility", "public")
        .order("event_date", { ascending: true })
        .limit(5),

      supabase
        .from("sports_ticker_items")
        .select("id, title, item_type, tag, link_url, starts_at")
        .eq("is_active", true)
        .order("published_at", { ascending: false })
        .limit(20),
    ]);

    const payload = {
      trending_news: newsRes.data ?? [],
      upcoming_events: eventsRes.data ?? [],
      ticker_items: tickerRes.data ?? [],
      fetched_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(payload), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=120, s-maxage=300",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
