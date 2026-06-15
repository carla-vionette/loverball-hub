export type WatchSpotSource =
  | "official"
  | "partner"
  | "curated"
  | "community"
  | "places"
  | "fallback";

export interface WatchSpot {
  id: string;
  source: WatchSpotSource;
  name: string;
  neighborhood?: string;
  city: string;
  distanceMi?: number;
  rating?: number;
  reviewCount?: number;
  vibe?: string;
  vibeTags: string[];
  lat?: number;
  lng?: number;
  website?: string;
  mapsUrl: string;
  watchingCount: number;
  rank: number;
  watchLocationId?: string;
  placeExternalId?: string;
  eventId?: string;
  eventSlug?: string;
}

export interface WatchContext {
  kind: "game" | "event";
  externalGameId?: string;
  eventId?: string;
  league?: string;
  homeTeam?: string;
  awayTeam?: string;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  startTime?: string;
  /** Optional title used in headers ("Sparks vs Liberty") */
  title?: string;
}

export type WatchState =
  | "loading"
  | "live-ok"
  | "places-failed-curated"
  | "no-local-suggested"
  | "empty"
  | "error";

export interface FriendCheckin {
  user_id: string;
  name: string | null;
  profile_photo_url: string | null;
  watch_location_id: string | null;
  place_external_id: string | null;
  place_name: string | null;
}
