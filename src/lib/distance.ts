/**
 * Haversine distance helpers for the Events 50-mile rule.
 *
 * Distance returns are in miles. Null means "can't be determined" — the UI
 * should treat that as "show all options" rather than silently gating.
 */

export const VENUE_RADIUS_MILES = 50;

const R_MILES = 3958.8;

export function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R_MILES * 2 * Math.asin(Math.sqrt(a));
}

export interface EventLike {
  location_lat?: number | null;
  location_lng?: number | null;
  city?: string | null;
}
export interface ViewerLike {
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
}

/**
 * Distance from viewer to event venue, in miles.
 * Returns null when either side lacks coords AND city-based fallback can't decide.
 *
 * City-based fallback: when only city strings exist, equal cities → 0 mi
 * (treated as in-radius), different cities → null (UI shows watch-only).
 */
export function getEventDistanceMiles(
  event: EventLike,
  viewer: ViewerLike | null,
): number | null {
  if (!viewer) return null;
  if (
    typeof event.location_lat === "number" &&
    typeof event.location_lng === "number" &&
    typeof viewer.lat === "number" &&
    typeof viewer.lng === "number"
  ) {
    return haversineMiles(viewer.lat, viewer.lng, event.location_lat, event.location_lng);
  }
  if (event.city && viewer.city) {
    return event.city.trim().toLowerCase() === viewer.city.trim().toLowerCase() ? 0 : null;
  }
  return null;
}

/** True when the event is within VENUE_RADIUS_MILES of the viewer. */
export function isInVenueRadius(event: EventLike, viewer: ViewerLike | null): boolean {
  const d = getEventDistanceMiles(event, viewer);
  if (d === null) return true; // viewer has no location → don't strip Going option
  return d <= VENUE_RADIUS_MILES;
}

/** Whether the viewer has enough info to evaluate the 50-mile rule. */
export function viewerHasLocation(viewer: ViewerLike | null): boolean {
  if (!viewer) return false;
  return (
    (typeof viewer.lat === "number" && typeof viewer.lng === "number") ||
    !!viewer.city
  );
}

export function formatMiles(miles: number | null): string {
  if (miles === null) return "";
  if (miles < 0.5) return "< 1 mi";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}
