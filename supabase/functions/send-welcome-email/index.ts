import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require service role or admin authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { email, name } = await req.json();

    if (!email || !name) {
      return new Response(JSON.stringify({ error: 'Missing email or name' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const firstName = name.split(' ')[0];

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
            <td style="background-color:#000000;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#00E5FF;letter-spacing:1px;">LOVERBALL</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#f8f8f8;padding:32px 24px;">
              <h2 style="margin:0 0 16px;font-size:22px;color:#111111;">Welcome to the squad, ${firstName}! 🏀</h2>
              <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">
                You're officially part of Loverball — the community for women who live and breathe sports.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#333333;line-height:1.6;">
                Get ready to discover events, connect with fans, and rep your favorite teams. We're hype to have you here. 🔥
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background-color:#00E5FF;border-radius:8px;">
                    <a href="https://loverball-hub.lovable.app/home" style="display:inline-block;padding:14px 32px;color:#000000;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.5px;">
                      EXPLORE LOVERBALL →
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
        from: 'Members@loverball.com',
        to: email,
        subject: `Welcome to Loverball, ${firstName}! 🏀`,
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
