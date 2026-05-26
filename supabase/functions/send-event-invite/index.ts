import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://www.loverball.com";
const FROM = "Loverball <invites@loverball.com>";
const MAX_PER_REQUEST = 20;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]!)
  );
}

function fmtDate(date: string, time?: string | null) {
  const d = new Date(date + "T00:00:00");
  const dateStr = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  if (!time) return dateStr;
  const [h, m] = time.split(":");
  const t = new Date();
  t.setHours(parseInt(h), parseInt(m));
  const timeStr = t.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${dateStr} · ${timeStr}`;
}

function buildHtml(event: Record<string, unknown>, eventUrl: string, note: string | null, senderName: string | null) {
  const title = escapeHtml(String(event.title));
  const when = escapeHtml(fmtDate(String(event.event_date), event.event_time as string | null));
  const loc = escapeHtml(
    [event.venue_name, event.city].filter(Boolean).join(", ") || ""
  );
  const desc = event.description
    ? escapeHtml(String(event.description).slice(0, 300))
    : "";
  const img = event.image_url
    ? escapeHtml(String(event.image_url))
    : `${SITE}/og-image.png`;
  const fromLine = senderName
    ? `<p style="margin:0 0 18px;font-size:14px;color:#666;">${escapeHtml(senderName)} invited you to an event on Loverball.</p>`
    : "";
  const noteBlock = note
    ? `<div style="margin:0 0 22px;padding:14px 16px;background:#faf5e9;border-left:3px solid #D4537E;border-radius:4px;"><p style="margin:0;font-size:14px;color:#333;line-height:1.5;font-style:italic;">"${escapeHtml(note)}"</p></div>`
    : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;">
<tr><td align="center" style="padding:32px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
  <tr><td style="background:#0a0a0a;padding:18px 24px;text-align:center;">
    <p style="margin:0;font-family:Georgia,serif;font-style:italic;color:#D4537E;font-size:22px;letter-spacing:0.5px;">Loverball</p>
  </td></tr>
  <tr><td><img src="${img}" alt="${title}" width="560" style="display:block;width:100%;height:auto;max-height:320px;object-fit:cover;"></td></tr>
  <tr><td style="padding:28px 28px 8px;">
    ${fromLine}
    <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-style:italic;font-size:28px;line-height:1.15;color:#0a0a0a;">${title}</h1>
    <p style="margin:0 0 6px;font-size:15px;color:#0a0a0a;font-weight:600;">📅 ${when}</p>
    ${loc ? `<p style="margin:0 0 18px;font-size:15px;color:#444;">📍 ${loc}</p>` : ""}
    ${desc ? `<p style="margin:0 0 22px;font-size:15px;color:#444;line-height:1.6;">${desc}</p>` : ""}
    ${noteBlock}
    <table cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
      <tr><td style="background:#D4537E;border-radius:999px;">
        <a href="${eventUrl}" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:1.5px;text-transform:uppercase;">RSVP with Loverball</a>
      </td></tr>
    </table>
    <p style="margin:0 0 4px;font-size:12px;color:#999;">Or open the link directly:</p>
    <p style="margin:0;font-size:12px;word-break:break-all;"><a href="${eventUrl}" style="color:#D4537E;text-decoration:none;">${escapeHtml(eventUrl)}</a></p>
  </td></tr>
  <tr><td style="padding:20px 28px 28px;border-top:1px solid #eee;text-align:center;">
    <p style="margin:0;font-size:11px;color:#999;letter-spacing:0.5px;">LOVERBALL · HER GAME. HER COMMUNITY.</p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller
    const authedClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await authedClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;

    const body = await req.json();
    const eventId = String(body.eventId || "").trim();
    const note = body.message ? String(body.message).slice(0, 500) : null;
    const rawEmails: unknown = body.emails;
    if (!eventId || !Array.isArray(rawEmails)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const emails = Array.from(
      new Set(
        rawEmails
          .map((e) => String(e).trim().toLowerCase())
          .filter((e) => EMAIL_RE.test(e))
      )
    ).slice(0, MAX_PER_REQUEST);
    if (emails.length === 0) {
      return new Response(JSON.stringify({ error: "No valid emails" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch event
    const service = createClient(supabaseUrl, serviceKey);
    const { data: event, error: evErr } = await service
      .from("events")
      .select("id, title, description, image_url, event_date, event_time, venue_name, city, host_user_id, visibility")
      .eq("id", eventId)
      .maybeSingle();
    if (evErr || !event) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authorization: only the event host or an admin may send branded invites.
    const isHost = (event as { host_user_id?: string }).host_user_id === callerId;
    let isAdmin = false;
    if (!isHost) {
      const { data: adminCheck } = await service.rpc("has_role", {
        _user_id: callerId,
        _role: "admin",
      });
      isAdmin = adminCheck === true;
    }
    if (!isHost && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sender name (best effort)
    let senderName: string | null = null;
    const { data: prof } = await service
      .from("profiles")
      .select("name")
      .eq("id", callerId)
      .maybeSingle();
    if (prof?.name) senderName = String(prof.name);

    const eventUrl = `${SITE}/e/${event.id}`;
    const subject = `${senderName ? `${senderName} invited you · ` : ""}${event.title} on Loverball`;
    const html = buildHtml(event as Record<string, unknown>, eventUrl, note, senderName);

    let sent = 0;
    const failures: string[] = [];
    for (const to of emails) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: FROM, to, subject, html }),
      });
      if (res.ok) {
        sent++;
      } else {
        const err = await res.text();
        console.error(`Failed to send to ${to}:`, err);
        failures.push(to);
      }
    }

    return new Response(JSON.stringify({ success: true, sent, failures }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("send-event-invite error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
