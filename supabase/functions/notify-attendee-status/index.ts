import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  userId: string;
  eventId: string;
  newStatus: string;
  previousStatus?: string;
  isPromotion?: boolean;
}

Deno.serve(async (req) => {
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

    // Verify the caller is an admin
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
    const userId = claimsData.claims.sub as string;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isAdmin } = await adminClient.rpc('has_role', { _user_id: userId, _role: 'admin' });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - admin only' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    const { userId, eventId, newStatus, previousStatus, isPromotion }: NotificationRequest = await req.json();

    console.log(`Processing notification for user ${userId}, event ${eventId}, status: ${newStatus}, promotion: ${isPromotion}`);

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, phone_number, sms_notifications_enabled')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user email from auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    const userEmail = authUser?.user?.email;

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title, event_date, event_time, venue_name, city')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      console.error('Error fetching event:', eventError);
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firstName = profile.name?.split(' ')[0] || 'there';
    const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    let timeStr = '';
    if (event.event_time) {
      const [hours, minutes] = event.event_time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    const locationStr = [event.venue_name, event.city].filter(Boolean).join(', ');

    // Prepare messages based on status change
    let smsMessage = '';
    let emailSubject = '';
    let emailHtml = '';

    if (isPromotion) {
      // Waitlist promotion
      smsMessage = `🎉 Great news, ${firstName}! You've been moved from the waitlist to ATTENDING for "${event.title}" on ${eventDate}${timeStr ? ` at ${timeStr}` : ''}. See you there! - Loverball`;
      emailSubject = `You're In! 🎉 Promoted from Waitlist - ${event.title}`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #c41e3a; margin-bottom: 20px;">You're In! 🎉</h1>
          <p style="font-size: 16px; color: #333;">Hey ${firstName},</p>
          <p style="font-size: 16px; color: #333;">Great news! A spot opened up and you've been promoted from the waitlist!</p>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #333; margin: 0 0 10px 0;">${event.title}</h2>
            <p style="color: #666; margin: 5px 0;">📅 ${eventDate}${timeStr ? ` at ${timeStr}` : ''}</p>
            ${locationStr ? `<p style="color: #666; margin: 5px 0;">📍 ${locationStr}</p>` : ''}
          </div>
          <p style="font-size: 16px; color: #333;">We can't wait to see you there!</p>
          <p style="font-size: 14px; color: #888; margin-top: 30px;">— The Loverball Team</p>
        </div>
      `;
    } else if (newStatus === 'confirmed' || newStatus === 'attending') {
      smsMessage = `✅ Hey ${firstName}! Your RSVP for "${event.title}" is confirmed! See you on ${eventDate}${timeStr ? ` at ${timeStr}` : ''}${locationStr ? ` at ${locationStr}` : ''}. - Loverball`;
      emailSubject = `RSVP Confirmed ✅ - ${event.title}`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2e7d32; margin-bottom: 20px;">You're Confirmed! ✅</h1>
          <p style="font-size: 16px; color: #333;">Hey ${firstName},</p>
          <p style="font-size: 16px; color: #333;">Your attendance for this event has been confirmed!</p>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #333; margin: 0 0 10px 0;">${event.title}</h2>
            <p style="color: #666; margin: 5px 0;">📅 ${eventDate}${timeStr ? ` at ${timeStr}` : ''}</p>
            ${locationStr ? `<p style="color: #666; margin: 5px 0;">📍 ${locationStr}</p>` : ''}
          </div>
          <p style="font-size: 16px; color: #333;">See you there!</p>
          <p style="font-size: 14px; color: #888; margin-top: 30px;">— The Loverball Team</p>
        </div>
      `;
    } else if (newStatus === 'waitlist') {
      smsMessage = `⏳ Hey ${firstName}, you've been added to the waitlist for "${event.title}" on ${eventDate}. We'll notify you if a spot opens up! - Loverball`;
      emailSubject = `You're on the Waitlist - ${event.title}`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ed6c02; margin-bottom: 20px;">You're on the Waitlist ⏳</h1>
          <p style="font-size: 16px; color: #333;">Hey ${firstName},</p>
          <p style="font-size: 16px; color: #333;">The event is currently at capacity, but don't worry - you're on the waitlist!</p>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #333; margin: 0 0 10px 0;">${event.title}</h2>
            <p style="color: #666; margin: 5px 0;">📅 ${eventDate}${timeStr ? ` at ${timeStr}` : ''}</p>
            ${locationStr ? `<p style="color: #666; margin: 5px 0;">📍 ${locationStr}</p>` : ''}
          </div>
          <p style="font-size: 16px; color: #333;">We'll notify you immediately if a spot opens up.</p>
          <p style="font-size: 14px; color: #888; margin-top: 30px;">— The Loverball Team</p>
        </div>
      `;
    } else if (newStatus === 'declined' || newStatus === 'cancelled') {
      smsMessage = `Your RSVP for "${event.title}" has been updated to ${newStatus}. Hope to see you at future events! - Loverball`;
      emailSubject = `RSVP Updated - ${event.title}`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #666; margin-bottom: 20px;">RSVP Updated</h1>
          <p style="font-size: 16px; color: #333;">Hey ${firstName},</p>
          <p style="font-size: 16px; color: #333;">Your RSVP status for the following event has been updated to: <strong>${newStatus}</strong></p>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #333; margin: 0 0 10px 0;">${event.title}</h2>
            <p style="color: #666; margin: 5px 0;">📅 ${eventDate}</p>
          </div>
          <p style="font-size: 16px; color: #333;">We hope to see you at future Loverball events!</p>
          <p style="font-size: 14px; color: #888; margin-top: 30px;">— The Loverball Team</p>
        </div>
      `;
    }

    const results = { sms: false, email: false, errors: [] as string[] };

    // Send SMS if enabled and configured
    if (smsMessage && profile.phone_number && profile.sms_notifications_enabled !== false && twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        const authHeader = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

        const formData = new URLSearchParams();
        formData.append('To', profile.phone_number);
        formData.append('From', twilioPhoneNumber);
        formData.append('Body', smsMessage);

        const twilioResponse = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        if (twilioResponse.ok) {
          console.log(`SMS sent to ${profile.phone_number}`);
          results.sms = true;
        } else {
          const errorText = await twilioResponse.text();
          console.error('Twilio error:', errorText);
          results.errors.push(`SMS failed: ${errorText}`);
        }
      } catch (smsError) {
        console.error('SMS error:', smsError);
        results.errors.push(`SMS error: ${smsError}`);
      }
    }

    // Send email if configured
    if (emailSubject && emailHtml && userEmail && resend) {
      try {
        const emailResponse = await resend.emails.send({
          from: 'Loverball <onboarding@resend.dev>',
          to: [userEmail],
          subject: emailSubject,
          html: emailHtml,
        });

        if (emailResponse.error) {
          console.error('Resend error:', emailResponse.error);
          results.errors.push(`Email failed: ${emailResponse.error.message}`);
        } else {
          console.log(`Email sent to ${userEmail}`);
          results.email = true;
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
        results.errors.push(`Email error: ${emailError}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: results.sms || results.email,
        sms_sent: results.sms,
        email_sent: results.email,
        errors: results.errors.length > 0 ? results.errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notify-attendee-status:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
