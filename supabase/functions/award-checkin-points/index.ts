import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CHECKIN_POINTS = 50;

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getPrevWeek(yearWeek: string): string {
  const [year, week] = yearWeek.split('-W').map(Number);
  if (week === 1) return `${year - 1}-W52`;
  return `${year}-W${String(week - 1).padStart(2, '0')}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Validate user with anon key + user token
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Service role client for writes
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { event_id } = await req.json();
    if (!event_id) {
      return new Response(JSON.stringify({ error: 'event_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify event exists
    const { data: event, error: eventErr } = await supabase
      .from('events')
      .select('id, event_date, city')
      .eq('id', event_id)
      .single();

    if (eventErr || !event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify it's event day
    const today = new Date().toISOString().split('T')[0];
    if (event.event_date !== today) {
      return new Response(JSON.stringify({ error: 'Check-in only available on event day' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if already checked in
    const { data: existing } = await supabase
      .from('check_ins')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', event_id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Already checked in', already_checked_in: true }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Insert check-in
    const { error: checkInError } = await supabase
      .from('check_ins')
      .insert({ user_id: userId, event_id });

    if (checkInError) {
      if (checkInError.code === '23505') {
        return new Response(JSON.stringify({ error: 'Already checked in', already_checked_in: true }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw checkInError;
    }

    // 2. Award points (service role bypasses RLS)
    await supabase.from('point_transactions').insert({
      user_id: userId,
      points: CHECKIN_POINTS,
      reason: 'Event check-in',
      event_id,
    });

    // 3. Update total_points
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_points, current_streak, longest_streak, last_streak_week')
      .eq('id', userId)
      .single();

    const newTotal = (profile?.total_points || 0) + CHECKIN_POINTS;

    // 4. Update streak
    const now = new Date();
    const yearWeek = `${now.getFullYear()}-W${String(getWeekNumber(now)).padStart(2, '0')}`;
    let newStreak = profile?.current_streak || 0;
    const lastWeek = profile?.last_streak_week;
    const prevWeekStr = getPrevWeek(yearWeek);

    if (lastWeek === yearWeek) {
      // Already counted this week, no change
    } else if (lastWeek === prevWeekStr) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    await supabase
      .from('profiles')
      .update({
        total_points: newTotal,
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, profile?.longest_streak || 0),
        last_streak_week: lastWeek === yearWeek ? lastWeek : yearWeek,
      })
      .eq('id', userId);

    // 5. Check for badges
    let earnedBadge: { type: string; emoji: string; label: string } | null = null;

    const { count: checkInCount } = await supabase
      .from('check_ins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if ((checkInCount ?? 0) <= 1) {
      const { error: badgeErr } = await supabase
        .from('badges')
        .insert({ user_id: userId, badge_type: 'first_checkin' });
      if (!badgeErr) {
        earnedBadge = { type: 'first_checkin', emoji: '🏟️', label: 'First Check-In' };
      }
    }

    // Road tripper badge
    if (!earnedBadge && event.city) {
      const { data: pastCheckIns } = await supabase
        .from('check_ins')
        .select('event_id')
        .eq('user_id', userId)
        .neq('event_id', event_id);

      if (pastCheckIns && pastCheckIns.length > 0) {
        const pastEventIds = pastCheckIns.map((c: any) => c.event_id);
        const { data: pastEvents } = await supabase
          .from('events')
          .select('city')
          .in('id', pastEventIds);

        const pastCities = new Set((pastEvents || []).map((e: any) => e.city?.toLowerCase()));
        if (!pastCities.has(event.city.toLowerCase())) {
          const { error: badgeErr } = await supabase
            .from('badges')
            .insert({ user_id: userId, badge_type: 'road_tripper' });
          if (!badgeErr) {
            earnedBadge = { type: 'road_tripper', emoji: '✈️', label: 'Road Tripper' };
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        points: CHECKIN_POINTS,
        total_points: newTotal,
        streak: newStreak,
        earned_badge: earnedBadge,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Check-in error:', error);
    return new Response(
      JSON.stringify({ error: 'Check-in failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
