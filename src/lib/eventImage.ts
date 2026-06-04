// Centralized event cover image resolution + onError fallback handling.
// Order: events.image_url → events.banner_image → /og-image.png

export const FALLBACK_EVENT_IMAGE = "/og-image.png";

export function resolveEventImage(ev: {
  image_url?: string | null;
  banner_image?: string | null;
} | null | undefined): string {
  if (!ev) return FALLBACK_EVENT_IMAGE;
  const a = (ev.image_url || "").trim();
  if (a) return a;
  const b = (ev.banner_image || "").trim();
  if (b) return b;
  return FALLBACK_EVENT_IMAGE;
}

/** onError handler that swaps a broken image to the branded fallback. */
export function handleEventImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>
) {
  const img = e.currentTarget;
  if (img.dataset.fallbackApplied === "1") return;
  img.dataset.fallbackApplied = "1";
  img.src = FALLBACK_EVENT_IMAGE;
}
