import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "rsvp_to_event",
  title: "RSVP to an event",
  description:
    "Create or update the signed-in member's RSVP for a Loverball event. Status is 'going' or 'not_going'.",
  inputSchema: {
    event_id: z.string().describe("The event id (uuid)."),
    status: z.enum(["going", "not_going"]).describe("RSVP status."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ event_id, status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const user_id = ctx.getUserId() as string;

    const { data: existing } = await supabase
      .from("event_rsvps")
      .select("id")
      .eq("event_id", event_id)
      .eq("user_id", user_id)
      .maybeSingle();

    const { data, error } = existing
      ? await supabase.from("event_rsvps").update({ status }).eq("id", existing.id).select().maybeSingle()
      : await supabase.from("event_rsvps").insert({ event_id, user_id, status }).select().maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `RSVP saved: ${status}` }],
      structuredContent: { rsvp: data },
    };
  },
});
