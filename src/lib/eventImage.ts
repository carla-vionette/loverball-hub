import soccerAsset from "@/assets/sports/soccer.png.asset.json";
import basketballAsset from "@/assets/sports/basketball.png.asset.json";
import footballAsset from "@/assets/sports/football.png.asset.json";
import volleyballAsset from "@/assets/sports/volleyball.png.asset.json";
import tennisAsset from "@/assets/sports/tennis.png.asset.json";
import softballBaseballAsset from "@/assets/sports/softball-baseball.png.asset.json";

// Centralized event cover image resolution + onError fallback handling.
// Order: events.image_url → events.banner_image → sport-specific fallback → /og-image.png

export const FALLBACK_EVENT_IMAGE = "/og-image.png";

const SPORT_IMAGE_MAP: Record<string, string> = {
  soccer: soccerAsset.url,
  football: footballAsset.url,
  basketball: basketballAsset.url,
  volleyball: volleyballAsset.url,
  tennis: tennisAsset.url,
  softball: softballBaseballAsset.url,
  baseball: softballBaseballAsset.url,
};

function normalizeSportLabel(value: string): string | null {
  const v = value.trim().toLowerCase();
  if (!v) return null;

  if (v.includes("softball")) return "softball";
  if (v.includes("baseball")) return "baseball";
  if (v.includes("basketball") || v.includes("wnba") || v.includes("nba")) return "basketball";
  if (v.includes("soccer") || v.includes("futbol") || v.includes("football club") || v.includes("fc ") || v.endsWith(" fc") || v.includes("nwsl") || v.includes("mls")) return "soccer";
  if (v.includes("football") || v.includes("nfl") || v.includes("ncaa football")) return "football";
  if (v.includes("volleyball")) return "volleyball";
  if (v.includes("tennis") || v.includes("wta") || v.includes("atp")) return "tennis";

  return null;
}

export function resolveSportImage(ev: {
  sport_tags?: string[] | null;
  event_tags?: string[] | null;
  event_type?: string | null;
  title?: string | null;
  description?: string | null;
  venue_name?: string | null;
  city?: string | null;
} | null | undefined): string | null {
  if (!ev) return null;

  const candidates = [
    ...(ev.sport_tags || []),
    ...(ev.event_tags || []),
    ev.event_type || "",
    ev.title || "",
    ev.description || "",
    ev.venue_name || "",
    ev.city || "",
  ];

  for (const candidate of candidates) {
    const normalized = normalizeSportLabel(candidate);
    if (normalized) return SPORT_IMAGE_MAP[normalized];
  }

  return null;
}

export function resolveEventImage(ev: {
  image_url?: string | null;
  banner_image?: string | null;
  sport_tags?: string[] | null;
  event_tags?: string[] | null;
  event_type?: string | null;
  title?: string | null;
  description?: string | null;
  venue_name?: string | null;
  city?: string | null;
} | null | undefined): string {
  if (!ev) return FALLBACK_EVENT_IMAGE;

  const a = (ev.image_url || "").trim();
  if (a) return a;

  const b = (ev.banner_image || "").trim();
  if (b) return b;

  return resolveSportImage(ev) || FALLBACK_EVENT_IMAGE;
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
