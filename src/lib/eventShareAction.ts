import { buildShareSummary, type ShareableEvent } from "./eventShare";
import { trackEvent } from "./analytics";

const SITE = "https://www.loverball.com";
const SUPABASE_OG = "https://nfjavjfxgxrpvieinpdp.supabase.co/functions/v1/event-og-meta";

/** Canonical, public, crawler-friendly URL for an event. */
export const buildEventShareUrl = (eventId: string) => `${SITE}/e/${eventId}`;

/**
 * Crawler-targeted URL used in SMS/iMessage. The edge function returns static
 * HTML with the event's cover image as og:image and redirects browsers to /e/:id.
 */
export const buildEventSmsShareUrl = (eventId: string) =>
  `${SUPABASE_OG}?id=${eventId}&v=2`;

interface ShareEventInput {
  id: string;
  event: ShareableEvent;
  surface: "event_detail" | "event_card" | "homepage" | "events_list";
  onCopied?: () => void;
  onFailed?: (err: unknown) => void;
}

/**
 * Shared share-action used by event detail + event card.
 * 1. Tries Web Share API
 * 2. Falls back to clipboard
 * 3. Fires analytics for every branch
 */
export async function shareEvent({ id, event, surface, onCopied, onFailed }: ShareEventInput) {
  const url = buildEventShareUrl(id);
  const summary = buildShareSummary(event);
  const text = `${summary}\n\n${url}`;

  const baseProps = {
    event_id: id,
    event_title: event.title,
    source_surface: surface,
  };

  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: event.title, text, url });
        trackEvent("user_behavior", "event_share_native_success", baseProps);
        return;
      } catch (err) {
        // user dismissed — not a failure
        if ((err as DOMException)?.name === "AbortError") return;
        // fall through to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      trackEvent("user_behavior", "event_share_link_copied", baseProps);
      onCopied?.();
      return;
    }
    throw new Error("No share or clipboard API available");
  } catch (err) {
    trackEvent("user_behavior", "event_share_failed", {
      ...baseProps,
      error: err instanceof Error ? err.message : "unknown",
    });
    onFailed?.(err);
  }
}

export function trackShareClicked(id: string, title: string, surface: ShareEventInput["surface"]) {
  trackEvent("user_behavior", "event_share_clicked", {
    event_id: id,
    event_title: title,
    source_surface: surface,
  });
}
