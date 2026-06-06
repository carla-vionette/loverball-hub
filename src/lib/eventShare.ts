import { format } from "date-fns";
import { parseEventDate } from "./eventDate";


function fmtTime(t: string) {
  const [h, m] = t.split(":");
  const d = new Date();
  d.setHours(parseInt(h), parseInt(m));
  return format(d, "h:mm a");
}

export interface ShareableEvent {
  title: string;
  description?: string | null;
  event_date: string;
  event_time?: string | null;
  venue_name?: string | null;
  city?: string | null;
}

/**
 * Builds a rich, multi-line share summary for clipboard / native share.
 * Includes title, date/time, venue, and a short description.
 */
export function buildShareSummary(ev: ShareableEvent): string {
  const dateStr = format(parseEventDate(ev.event_date), "EEE, MMM d, yyyy");
  const timeStr = ev.event_time ? fmtTime(ev.event_time) : "";
  const locStr = [ev.venue_name, ev.city].filter(Boolean).join(", ");

  const parts: string[] = [];
  parts.push(ev.title);
  parts.push("");
  parts.push(`${dateStr}${timeStr ? ` @ ${timeStr}` : ""}`);
  if (locStr) parts.push(locStr);

  if (ev.description) {
    const clean = ev.description.replace(/\s+/g, " ").trim();
    const truncated = clean.length > 140 ? clean.slice(0, 140) + "..." : clean;
    parts.push("");
    parts.push(truncated);
  }

  return parts.join("\n");
}

/**
 * Builds a concise, single-line preview description for OG meta / SharePreview cards.
 * Format: "Fri, Jun 12 @ 7:00 PM · The Venue, LA. Short description..."
 */
export function buildSharePreviewDescription(ev: ShareableEvent): string {
  const dateStr = format(parseEventDate(ev.event_date), "EEE, MMM d, yyyy");
  const timeStr = ev.event_time ? fmtTime(ev.event_time) : "";
  const locStr = [ev.venue_name, ev.city].filter(Boolean).join(", ");

  let desc = `${dateStr}${timeStr ? ` @ ${timeStr}` : ""}`;
  if (locStr) desc += ` · ${locStr}`;

  if (ev.description) {
    const clean = ev.description.replace(/\s+/g, " ").trim();
    const truncated = clean.length > 120 ? clean.slice(0, 120) + "..." : clean;
    desc += `. ${truncated}`;
  }

  return desc;
}
