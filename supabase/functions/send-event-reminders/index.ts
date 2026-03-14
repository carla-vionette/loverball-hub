import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventWithRSVPs {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  venue_name: string | null;
  city: string | null;
}

interface RSVPWithProfile {
  user_id: string;
  profiles: {
    name: string;
    sms_notifications_enabled: boolean | null;
  } | null;
  phone_number?: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const callerId = claimsData.claims.sub as string;
    const adminCheck = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isAdmin } = await adminCheck.rpc('has_role', { _user_id: callerId, _role: 'admin' });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - admin only' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error('Missing Twilio credentials');
      return new Response(
        JSON.stringify({ error: 'Twilio not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`Checking for events on ${todayStr}`);

    // Fetch today's events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, event_date, event_time, venue_name, city')
      .eq('event_date', todayStr);

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      throw eventsError;
    }

    if (!events || events.length === 0) {
      console.log('No events today');
      return new Response(
        JSON.stringify({ message: 'No events today', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${events.length} events today`);
    let totalSent = 0;
    const errors: string[] = [];

    for (const event of events) {
      console.log(`Processing event: ${event.title}`);

      // Get RSVPs with phone numbers
      const { data: rsvps, error: rsvpsError } = await supabase
        .from('event_rsvps')
        .select(`
          user_id,
          profiles!inner (
            name,
            sms_notifications_enabled
          )
        `)
        .eq('event_id', event.id)
        .in('status', ['attending', 'confirmed']);

      if (rsvpsError) {
        console.error(`Error fetching RSVPs for event ${event.id}:`, rsvpsError);
        errors.push(`Event ${event.id}: ${rsvpsError.message}`);
        continue;
      }

      if (!rsvps || rsvps.length === 0) {
        console.log(`No attendees for event: ${event.title}`);
        continue;
      }

      // Fetch phone numbers from profiles_sensitive for eligible users
      const userIds = (rsvps as unknown as RSVPWithProfile[])
        .filter(r => r.profiles?.sms_notifications_enabled !== false)
        .map(r => r.user_id);

      const { data: sensitiveData } = await supabase
        .from('profiles_sensitive')
        .select('id, phone_number')
        .in('id', userIds);

      const phoneMap = new Map((sensitiveData || []).map((s: any) => [s.id, s.phone_number]));

      const eligibleRsvps = (rsvps as unknown as RSVPWithProfile[]).filter(r => {
        const phone = phoneMap.get(r.user_id);
        return phone && r.profiles?.sms_notifications_enabled !== false;
      });

      console.log(`${eligibleRsvps.length} eligible attendees for SMS`);

      // Format event time
      let timeStr = '';
      if (event.event_time) {
        const [hours, minutes] = event.event_time.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      }

      const locationStr = [event.venue_name, event.city].filter(Boolean).join(', ');

      for (const rsvp of eligibleRsvps) {
        const phoneNumber = phoneMap.get(rsvp.user_id);
        if (!phoneNumber) continue;

        const firstName = rsvp.profiles.name?.split(' ')[0] || 'there';
        const message = `Hey ${firstName}! 🏀 Reminder: "${event.title}" is TODAY${timeStr ? ` at ${timeStr}` : ''}${locationStr ? ` - ${locationStr}` : ''}. See you there! - Loverball`;

        try {
          // Send SMS via Twilio
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
          const authHeader = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

          const formData = new URLSearchParams();
          formData.append('To', rsvp.profiles.phone_number);
          formData.append('From', twilioPhoneNumber);
          formData.append('Body', message);

          const twilioResponse = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${authHeader}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          });

          if (!twilioResponse.ok) {
            const errorText = await twilioResponse.text();
            console.error(`Twilio error for ${rsvp.profiles.phone_number}:`, errorText);
            errors.push(`Failed to send to ${rsvp.user_id}: ${errorText}`);
          } else {
            console.log(`SMS sent to ${rsvp.profiles.phone_number}`);
            totalSent++;
          }
        } catch (smsError) {
          console.error(`Error sending SMS:`, smsError);
          errors.push(`SMS error: ${smsError}`);
        }
      }
    }

    console.log(`Total SMS sent: ${totalSent}`);

    return new Response(
      JSON.stringify({ 
        message: `Processed ${events.length} events`, 
        sent: totalSent,
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-event-reminders:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});