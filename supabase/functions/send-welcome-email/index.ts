import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authenticated caller — verify JWT (service role accepted)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const isServiceRole = token === serviceRoleKey;

  let callerEmail: string | null = null;
  if (!isServiceRole) {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    callerEmail = ((data.claims.email as string | undefined) ?? '').toLowerCase() || null;
  }

  try {
    const { email, name } = await req.json();

    if (!email || !name || typeof email !== 'string' || typeof name !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing email or name' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Non-service-role callers can only send the welcome email to their own address.
    if (!isServiceRole) {
      if (!callerEmail || email.toLowerCase() !== callerEmail) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // HTML-escape user-supplied name to prevent HTML/link injection in the email body.
    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const firstName = escapeHtml(name.split(' ')[0].slice(0, 80));

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <!-- Header -->
          <tr>
            <td style="background-color:#0A1128;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#FF4D3A;letter-spacing:1px;font-family:Oswald,Impact,sans-serif;">LOVERBALL</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#f8f8f8;padding:32px 24px;">
              <p style="margin:0 0 20px;font-size:16px;color:#111111;line-height:1.6;">
                Hi ${firstName},
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">
                Welcome to Loverball — a community built for women sports fans.
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">
                Loverball is where sports, culture, and community come together. It's a place to discover events, RSVP to experiences, connect with other members, and be part of a fan community built around showing up together.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#333333;line-height:1.6;">
                We also want to be clear about how we email: we don't spam. You'll only hear from us about events, important updates related to your RSVPs or activity, and the notifications you choose to receive.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#333333;line-height:1.6;">
                We're so glad you're here and excited to have you in the community.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#333333;line-height:1.6;">
                — Team Loverball
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background-color:#FF4D3A;border-radius:8px;">
                    <a href="https://www.loverball.com/home" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.5px;">
                      View upcoming events →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 24px;text-align:center;border-top:1px solid #e5e5e5;">
              <p style="margin:0;font-size:12px;color:#999999;">
                © ${new Date().getFullYear()} Loverball · Built for women in sports
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'no-reply@loverball.com',
        to: email,
        subject: 'Welcome to Loverball',
        html: htmlBody,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error('Resend error:', result);
      return new Response(JSON.stringify({ error: 'Failed to send email', details: result }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Welcome email error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
