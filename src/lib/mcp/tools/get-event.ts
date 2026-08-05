import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_event",
  title: "Get event details",
  description: "Fetch full details for one Loverball event by its id, plus the number of confirmed attendees.",
  inputSchema: { event_id: z.string().describe("The event id (uuid).") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ event_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("events")
      .select(
        "id,title,description,event_date,event_time,end_time,venue_name,location,location_map_url,city,event_type,sport_tags,event_tags,price,capacity,visibility,image_url,status"
      )
      .eq("id", event_id)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Event not found" }], isError: true };

    const { count } = await supabase
      .from("event_rsvps")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event_id)
      .eq("status", "going");

    const event = { ...data, going_count: count ?? 0 };
    return {
      content: [{ type: "text", text: JSON.stringify(event) }],
      structuredContent: { event },
    };
  },
});
