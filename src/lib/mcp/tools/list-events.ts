import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_events",
  title: "List events",
  description:
    "List upcoming Loverball events (watch parties, meetups) visible to the signed-in member, newest date first.",
  inputSchema: {
    limit: z.number().int().optional().describe("Max events to return (default 20)."),
    search: z.string().optional().describe("Optional text to match against event titles."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, search }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const take = Math.min(Math.max(limit ?? 20, 1), 50);
    let query = supabase
      .from("events")
      .select("id,title,description,event_date,event_time,venue_name,location,city,visibility,image_url")
      .gte("event_date", new Date().toISOString().slice(0, 10))
      .order("event_date", { ascending: true })
      .limit(take);
    if (search?.trim()) query = query.ilike("title", `%${search.trim()}%`);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { events: data ?? [] },
    };
  },
});
