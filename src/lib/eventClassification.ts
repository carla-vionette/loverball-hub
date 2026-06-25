/**
 * Central source of truth for event classification, filtering, and date bucketing.
 * Feed view, Calendar view, and filter chips all consume these helpers so the
 * same event always ends up in the same buckets.
 */
import { parseEventDate } from "@/lib/eventDate";

export type EventCategory = "external_sports" | "curated_culture" | "loverball_hosted";
export type EventFilter = "all" | EventCategory;

export interface ClassifiableEvent {
  event_type?: string | null;
  tier?: string | null;
  visibility?: string | null;
  host_user_id?: string | null;
  sport_tags?: string[] | null;
  event_tags?: string[] | null;
}

const SPORT_TYPES = new Set(["game", "watch_party"]);
const HOSTED_TYPES = new Set(["watch_party", "party", "panel", "salon", "networking"]);

export function isLoverballHosted(e: ClassifiableEvent): boolean {
  if (e.tier === "member") return true;
  if (e.visibility === "members_only") return true;
  if (e.event_type && HOSTED_TYPES.has(e.event_type)) return true;
  return false;
}

export function isSportsEvent(e: ClassifiableEvent): boolean {
  if (e.event_type && SPORT_TYPES.has(e.event_type)) return true;
  if ((e.sport_tags?.length ?? 0) > 0) return true;
  return false;
}

/**
 * Primary visual category for the card label. An event may match more than one
 * filter via `matchesFilter`, but it gets exactly one card label.
 * Loverball wins over Sports for hosted member events; pure games show as Sports.
 */
export function classifyEvent(e: ClassifiableEvent): EventCategory {
  if (e.event_type === "game") return "external_sports";
  if (isLoverballHosted(e)) return "loverball_hosted";
  if (isSportsEvent(e)) return "external_sports";
  return "curated_culture";
}

/**
 * Whether an event should appear under a given chip. Inclusive: a Loverball
 * watch_party with sport_tags shows in All + Sports + Loverball.
 */
export function matchesFilter(e: ClassifiableEvent, filter: EventFilter): boolean {
  if (filter === "all") return true;
  if (filter === "loverball_hosted") return isLoverballHosted(e);
  if (filter === "external_sports") return isSportsEvent(e);
  // curated_culture = non-sports, non-loverball
  return !isSportsEvent(e) && !isLoverballHosted(e);
}

export type EventBadge = "loverball_exclusive" | "members_only" | "going_only";

export function getEventBadges(e: ClassifiableEvent & { event_type?: string | null }): EventBadge[] {
  const badges: EventBadge[] = [];
  if (e.visibility === "members_only") badges.push("members_only");
  else if (e.tier === "member") badges.push("loverball_exclusive");
  // Watch parties at a fixed venue without remote viewing are "going only"
  if (e.event_type === "watch_party" && e.tier === "member") badges.push("going_only");
  return badges;
}

export const BADGE_LABELS: Record<EventBadge, string> = {
  loverball_exclusive: "Loverball Exclusive",
  members_only: "Members Only",
  going_only: "Going Only",
};

// ---------- Date bucketing ----------

export type DateBucket = "today" | "this_week" | "later";

export function bucketForDate(dateStr: string, now: Date = new Date()): DateBucket {
  const d = parseEventDate(dateStr);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  if (d < startOfTomorrow) return "today";
  if (d < endOfWeek) return "this_week";
  return "later";
}

export const BUCKET_LABELS: Record<DateBucket, string> = {
  today: "Today",
  this_week: "This Week",
  later: "Later",
};
