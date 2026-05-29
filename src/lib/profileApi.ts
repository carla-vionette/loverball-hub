import { supabase } from "@/integrations/supabase/client";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-member-profiles`;

interface ProfileQueryOptions {
  excludeIds?: string[];
  includeIds?: string[];
  singleId?: string;
  selectFields?: string;
}

interface ProfileApiResponse<T> {
  data: T | null;
  error: string | null;
  rateLimited?: boolean;
}

// In-memory cache + in-flight dedup to avoid hitting the 100/15min rate limit
const CACHE_TTL_MS = 60_000; // 60s
const cache = new Map<string, { ts: number; data: any }>();
const inflight = new Map<string, Promise<ProfileApiResponse<any>>>();

/**
 * Rate-limited profile API that prevents bulk scraping
 * Limits: 100 queries per 15 minutes per user
 */
export async function fetchProfiles<T = any>(
  options: ProfileQueryOptions = {}
): Promise<ProfileApiResponse<T>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return { data: null, error: "Not authenticated" };
    }

    const params = new URLSearchParams();

    if (options.excludeIds?.length) {
      params.set("exclude", options.excludeIds.join(","));
    }
    if (options.includeIds?.length) {
      params.set("include", options.includeIds.join(","));
    }
    if (options.singleId) {
      params.set("id", options.singleId);
    }
    if (options.selectFields) {
      params.set("select", options.selectFields);
    }

    const qs = params.toString();
    const cacheKey = `${session.user.id}::${qs}`;

    // Serve from cache when fresh
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return { data: cached.data, error: null };
    }

    // Dedup concurrent identical requests
    const existing = inflight.get(cacheKey);
    if (existing) return existing as Promise<ProfileApiResponse<T>>;

    const url = `${FUNCTION_URL}?${qs}`;

    const promise = (async (): Promise<ProfileApiResponse<T>> => {
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({}));
        // Serve stale cache if available so the UI doesn't blank out
        if (cached) return { data: cached.data, error: null };
        return {
          data: null,
          error: errorData.message || "Rate limit exceeded. Please try again later.",
          rateLimited: true
        };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { data: null, error: errorData.error || "Failed to fetch profiles" };
      }

      const result = await response.json();
      cache.set(cacheKey, { ts: Date.now(), data: result.data });
      return { data: result.data, error: null };
    })().finally(() => {
      inflight.delete(cacheKey);
    });

    inflight.set(cacheKey, promise);
    return promise;

  } catch (error) {
    return { data: null, error: "Network error fetching profiles" };
  }
}


/**
 * Fetch all profiles except specified IDs
 */
export async function fetchAllProfiles(
  excludeIds: string[] = [],
  selectFields?: string
) {
  return fetchProfiles({
    excludeIds,
    selectFields
  });
}

/**
 * Fetch specific profiles by IDs
 */
export async function fetchProfilesByIds(
  ids: string[],
  selectFields?: string
) {
  return fetchProfiles({
    includeIds: ids,
    selectFields
  });
}

/**
 * Fetch a single profile by ID
 */
export async function fetchProfileById(
  id: string,
  selectFields?: string
) {
  return fetchProfiles({
    singleId: id,
    selectFields
  });
}
