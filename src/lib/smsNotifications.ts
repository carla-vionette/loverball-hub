import { supabase } from "@/integrations/supabase/client";

/**
 * Trigger an SMS to the target user via the send-sms-notification edge function.
 * Best-effort: silently ignores errors (in-app notification is the primary channel).
 */
export async function sendSmsToUser(targetUserId: string, body: string): Promise<void> {
  try {
    await supabase.functions.invoke("send-sms-notification", {
      body: { targetUserId, body },
    });
  } catch {
    /* ignore — SMS is best-effort */
  }
}
