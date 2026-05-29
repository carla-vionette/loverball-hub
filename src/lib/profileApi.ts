import { supabase } from "@/integrations/supabase/client";

interface ProfileQueryOptions {
  excludeIds?: string[];
  includeIds?: string[];
  singleId?: string;
  selectFields?: string;
}

export interface ProfileApiResponse<T> {
  data: T | null;
  error: string | null;
  rateLimited?: boolean;
}

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { ts: number; data: unknown }>();
const inflight = new Map<string, Promise<ProfileApiResponse<any>>>();

function normalizeIds(ids?: string[]) {
  if (!ids?.length) return [];
  return Array.from(new Set(ids.filter(Boolean))).sort();
}

export async function fetchProfiles<T = any>(
  options: ProfileQueryOptions = {}
): Promise<ProfileApiResponse<T>> {
  try {
    const normalizedOptions: ProfileQueryOptions = {
      ...options,
      includeIds: normalizeIds(options.includeIds),
      excludeIds: normalizeIds(options.excludeIds),
    };

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return { data: null, error: "Not authenticated" };
    }

    const cacheKey = JSON.stringify({
      userId: session.user.id,
      includeIds: normalizedOptions.includeIds,
      excludeIds: normalizedOptions.excludeIds,
      singleId: normalizedOptions.singleId ?? null,
      selectFields: normalizedOptions.selectFields ?? "*",
    });

    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return { data: cached.data as T, error: null };
    }

    const pending = inflight.get(cacheKey);
    if (pending) {
      return pending as Promise<ProfileApiResponse<T>>;
    }

    const promise = (async (): Promise<ProfileApiResponse<T>> => {
      const selectFields = normalizedOptions.selectFields || "*";
      let query = supabase.from("profiles").select(selectFields);

      if (normalizedOptions.singleId) {
        const { data, error } = await query
          .eq("id", normalizedOptions.singleId)
          .maybeSingle();

        if (error) {
          return { data: null, error: error.message || "Failed to fetch profiles" };
        }

        cache.set(cacheKey, { ts: Date.now(), data });
        return { data: data as T, error: null };
      }

      if (normalizedOptions.includeIds?.length) {
        query = query.in("id", normalizedOptions.includeIds);
      }

      if (normalizedOptions.excludeIds?.length) {
        query = query.not("id", "in", `(${normalizedOptions.excludeIds.join(",")})`);
      }

      const { data, error } = await query;
      if (error) {
        return { data: null, error: error.message || "Failed to fetch profiles" };
      }

      cache.set(cacheKey, { ts: Date.now(), data: data ?? [] });
      return { data: (data ?? []) as T, error: null };
    })().finally(() => {
      inflight.delete(cacheKey);
    });

    inflight.set(cacheKey, promise);
    return promise;
  } catch {
    return { data: null, error: "Network error fetching profiles" };
  }
}

export async function fetchAllProfiles(
  excludeIds: string[] = [],
  selectFields?: string
) {
  return fetchProfiles({
    excludeIds,
    selectFields,
  });
}

export async function fetchProfilesByIds(
  ids: string[],
  selectFields?: string
) {
  if (!ids.length) {
    return { data: [], error: null };
  }

  return fetchProfiles({
    includeIds: ids,
    selectFields,
  });
}

export async function fetchProfileById(
  id: string,
  selectFields?: string
) {
  return fetchProfiles({
    singleId: id,
    selectFields,
  });
}