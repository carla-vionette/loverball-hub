import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_rsvps",
  title: "List my RSVPs",
  description: "List the signed-in member's RSVPs with the event title and date for each.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("event_rsvps")
      .select("id,event_id,status,approval_status,attendance_status,created_at,events(title,event_date,venue_name)")
      .eq("user_id", ctx.getUserId() as string)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { rsvps: data ?? [] },
    };
  },
});
