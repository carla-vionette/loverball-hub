// Free ZIP geocoding via Zippopotam.us + Nominatim (no API key required).
// Returns { zip_code, city, state, latitude, longitude } for a valid 5-digit US ZIP.

export interface ZipLocation {
  zip_code: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
}

export const isValidUsZip = (zip: string) => /^\d{5}$/.test(zip);

export async function resolveZip(zip: string): Promise<ZipLocation | null> {
  if (!isValidUsZip(zip)) return null;
  try {
    const r = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!r.ok) return null;
    const j = await r.json();
    const place = j?.places?.[0];
    if (!place) return null;
    const city = place["place name"] as string;
    const state = place["state abbreviation"] as string;

    // Nominatim for lat/lng (best effort — non-blocking on failure)
    let latitude: number | null = null;
    let longitude: number | null = null;
    try {
      // Zippopotam already returns lat/lng — prefer those, fall back to Nominatim.
      const zLat = parseFloat(place.latitude);
      const zLng = parseFloat(place.longitude);
      if (Number.isFinite(zLat) && Number.isFinite(zLng)) {
        latitude = zLat;
        longitude = zLng;
      } else {
        const n = await fetch(
          `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=us&format=json`,
          { headers: { "User-Agent": "Loverball/1.0 (carla@loverball.com)" } }
        );
        if (n.ok) {
          const nj = await n.json();
          const first = Array.isArray(nj) ? nj[0] : null;
          if (first) {
            latitude = parseFloat(first.lat);
            longitude = parseFloat(first.lon);
          }
        }
      }
    } catch { /* keep nulls */ }

    return { zip_code: zip, city, state, latitude, longitude };
  } catch {
    return null;
  }
}

// Haversine distance in miles between two lat/lng pairs.
export function distanceMiles(
  lat1: number, lng1: number, lat2: number, lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
