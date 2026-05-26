import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_FROM = Deno.env.get("TWILIO_PHONE_NUMBER");

const RATE_LIMIT_PER_HOUR = 20;

interface Payload {
  targetUserId?: string;
  to?: string;
  body: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
      return new Response(JSON.stringify({ error: "Twilio not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth required
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const userClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const callerId = userData?.user?.id;
    if (!callerId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = (await req.json()) as Payload;
    const body = (payload.body || "").toString().slice(0, 320);
    if (!body.trim()) {
      return new Response(JSON.stringify({ error: "body required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve destination phone + preferences
    let toPhone = payload.to;
    let targetUserId: string | null = payload.targetUserId ?? null;

    if (targetUserId) {
      // Authorization: only allow SMS to target if caller is admin, self, or has an accepted friendship.
      if (targetUserId !== callerId) {
        const { data: adminCheck } = await admin.rpc("has_role", {
          _user_id: callerId,
          _role: "admin",
        });
        const isAdmin = adminCheck === true;
        if (!isAdmin) {
          const { data: friendship } = await admin
            .from("friendships")
            .select("id")
            .eq("status", "accepted")
            .or(
              `and(requester_id.eq.${callerId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${callerId})`,
            )
            .maybeSingle();
          if (!friendship) {
            return new Response(JSON.stringify({ error: "Forbidden" }), {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }

      const { data: prof } = await admin
        .from("profiles")
        .select("phone, sms_notifications_enabled, sms_unsubscribed")
        .eq("id", targetUserId)
        .maybeSingle();
      if (!prof?.phone) {
        return new Response(JSON.stringify({ skipped: "no_phone" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (prof.sms_notifications_enabled === false || prof.sms_unsubscribed === true) {
        return new Response(JSON.stringify({ skipped: "opted_out" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      toPhone = prof.phone;
    } else {
      // Direct phone targeting (no targetUserId) is admin-only.
      const { data: adminCheck } = await admin.rpc("has_role", {
        _user_id: callerId,
        _role: "admin",
      });
      if (adminCheck !== true) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!toPhone || !/^\+[1-9]\d{6,14}$/.test(toPhone)) {
      return new Response(JSON.stringify({ error: "invalid phone (E.164 required)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: count recent sends by caller
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("sms_send_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", callerId)
      .gte("created_at", oneHourAgo);
    if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Append STOP instructions on first-ish messages
    const finalBody = body.includes("STOP") ? body : `${body}\n\nReply STOP to opt out.`;

    const twResp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: toPhone, From: TWILIO_FROM, Body: finalBody }),
      },
    );

    const twData = await twResp.json();

    await admin.from("sms_send_log").insert({
      user_id: callerId,
      to_phone: toPhone,
      body_preview: finalBody.slice(0, 160),
      status: twResp.ok ? "sent" : "failed",
    });

    if (!twResp.ok) {
      return new Response(JSON.stringify({ error: "twilio_error", details: twData }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, sid: twData.sid }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
