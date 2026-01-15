import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 100 profile queries per 15 minutes per user
const MAX_REQUESTS = 100;
const WINDOW_MINUTES = 15;

// Sensitive fields that require a match/connection to view
const SENSITIVE_FIELDS = [
  'phone_number',
  'instagram_url',
  'linkedin_url',
  'tiktok_url',
  'website_url',
  'neighborhood',
  'age_range',
  'sms_notifications_enabled',
];

// Strip sensitive fields from profile data
const stripSensitiveFields = (profile: any): any => {
  if (!profile) return profile;
  const stripped = { ...profile };
  for (const field of SENSITIVE_FIELDS) {
    delete stripped[field];
  }
  return stripped;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - no token provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create client with user's auth token for RLS
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Service role client for rate limiting and match checks
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit using service role (bypasses RLS)
    const { data: allowed, error: rateLimitError } = await supabaseAdmin.rpc(
      'check_rate_limit',
      { 
        p_user_id: user.id, 
        p_action_type: 'profile_query',
        p_max_requests: MAX_REQUESTS,
        p_window_minutes: WINDOW_MINUTES
      }
    );

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
      return new Response(
        JSON.stringify({ error: "Internal error checking rate limit" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!allowed) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded", 
          message: `Maximum ${MAX_REQUESTS} profile queries per ${WINDOW_MINUTES} minutes. Please try again later.` 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's matches to determine which profiles get full visibility
    const { data: matches } = await supabaseAdmin
      .from("matches")
      .select("user_a_id, user_b_id")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "active");
    
    const matchedUserIds = new Set<string>();
    if (matches) {
      for (const match of matches) {
        if (match.user_a_id === user.id) {
          matchedUserIds.add(match.user_b_id);
        } else {
          matchedUserIds.add(match.user_a_id);
        }
      }
    }

    // Parse query parameters
    const url = new URL(req.url);
    const excludeIds = url.searchParams.get("exclude")?.split(",").filter(Boolean) || [];
    const includeIds = url.searchParams.get("include")?.split(",").filter(Boolean) || [];
    const singleId = url.searchParams.get("id");
    const selectFields = url.searchParams.get("select") || "*";

    let profileData: any = null;
    let queryError: any = null;

    // Handle different query types
    if (singleId) {
      // Single profile fetch
      const result = await supabaseUser
        .from("profiles")
        .select(selectFields)
        .eq("id", singleId)
        .maybeSingle();
      profileData = result.data;
      queryError = result.error;
    } else if (includeIds.length > 0) {
      // Fetch specific profiles by IDs
      const result = await supabaseUser
        .from("profiles")
        .select(selectFields)
        .in("id", includeIds);
      profileData = result.data;
      queryError = result.error;
    } else {
      // Exclude current user by default
      const result = await supabaseUser
        .from("profiles")
        .select(selectFields)
        .neq("id", user.id);
      profileData = result.data;
      queryError = result.error;
    }

    if (queryError) {
      console.error("Profile query error:", queryError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch profiles" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Client-side filter for exclusions (safer than SQL string concatenation)
    let filteredData = profileData;
    if (excludeIds.length > 0 && Array.isArray(profileData)) {
      const excludeSet = new Set(excludeIds);
      filteredData = profileData.filter((profile: any) => !excludeSet.has(profile.id));
    }

    // Apply tiered visibility: strip sensitive fields unless matched or own profile
    let processedData = filteredData;
    if (Array.isArray(filteredData)) {
      processedData = filteredData.map((profile: any) => {
        // Own profile or matched user gets full data
        if (profile.id === user.id || matchedUserIds.has(profile.id)) {
          return profile;
        }
        // Otherwise strip sensitive fields
        return stripSensitiveFields(profile);
      });
    } else if (filteredData) {
      // Single profile
      if (filteredData.id !== user.id && !matchedUserIds.has(filteredData.id)) {
        processedData = stripSensitiveFields(filteredData);
      }
    }

    return new Response(
      JSON.stringify({ data: processedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
