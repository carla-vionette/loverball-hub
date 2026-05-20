import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Twilio inbound webhook for STOP/START handling.
// Configure Twilio number's "A MESSAGE COMES IN" webhook to POST here.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const form = await req.formData();
  const from = (form.get("From") as string | null)?.trim();
  const body = (form.get("Body") as string | null)?.trim().toUpperCase() ?? "";

  if (!from) return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const stopWords = ["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"];
  const startWords = ["START", "YES", "UNSTOP"];

  if (stopWords.includes(body)) {
    await admin.from("profiles").update({ sms_unsubscribed: true }).eq("phone", from);
    return new Response(
      `<Response><Message>You're unsubscribed from Loverball SMS. Reply START to resubscribe.</Message></Response>`,
      { headers: { "Content-Type": "text/xml" } },
    );
  }
  if (startWords.includes(body)) {
    await admin.from("profiles").update({ sms_unsubscribed: false }).eq("phone", from);
    return new Response(
      `<Response><Message>You're back in. Reply STOP anytime to opt out.</Message></Response>`,
      { headers: { "Content-Type": "text/xml" } },
    );
  }

  return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
});
