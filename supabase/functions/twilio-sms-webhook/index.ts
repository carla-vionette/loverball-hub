import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Twilio inbound webhook for STOP/START handling.
// Validates the X-Twilio-Signature header (HMAC-SHA1) to ensure the request
// genuinely originated from Twilio. See:
// https://www.twilio.com/docs/usage/webhooks/webhooks-security

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";

async function validateTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
  signature: string,
): Promise<boolean> {
  if (!authToken || !signature) return false;
  // Per Twilio spec: URL + sorted-by-key concatenation of "key" + "value"
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const k of sortedKeys) data += k + params[k];

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(authToken),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sigBytes = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)),
  );
  // base64 encode
  let bin = "";
  for (const b of sigBytes) bin += String.fromCharCode(b);
  const expected = btoa(bin);
  // Constant-time-ish compare
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");

  const signature = req.headers.get("X-Twilio-Signature") ?? "";
  const form = await req.formData();

  // Collect form params for signature validation
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = String(v);

  // Twilio signs the public URL it called. Honor x-forwarded-proto/host if present.
  const fwdProto = req.headers.get("x-forwarded-proto");
  const fwdHost = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const reqUrl = new URL(req.url);
  const publicUrl = fwdHost
    ? `${fwdProto ?? reqUrl.protocol.replace(":", "")}://${fwdHost}${reqUrl.pathname}${reqUrl.search}`
    : req.url;

  const valid = await validateTwilioSignature(TWILIO_AUTH_TOKEN, publicUrl, params, signature);
  if (!valid) {
    return new Response("Forbidden", { status: 403 });
  }

  const from = (params["From"] ?? "").trim();
  const body = (params["Body"] ?? "").trim().toUpperCase();

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
