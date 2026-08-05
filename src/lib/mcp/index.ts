import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listEventsTool from "./tools/list-events";
import getEventTool from "./tools/get-event";
import listMyRsvpsTool from "./tools/list-my-rsvps";
import rsvpToEventTool from "./tools/rsvp-to-event";
import getMyProfileTool from "./tools/get-my-profile";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "loverball-hub",
  title: "loverball-hub",
  version: "0.1.0",
  instructions:
    "Tools for Loverball, a women's sports community app in LA. Browse upcoming events and watch parties, look up event details, manage the signed-in member's RSVPs, and read their profile.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listEventsTool, getEventTool, listMyRsvpsTool, rsvpToEventTool, getMyProfileTool],
});
