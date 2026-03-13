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

    const url = `${FUNCTION_URL}?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
        "Content-Type": "application/json"
      }
    });

    if (response.status === 429) {
      const errorData = await response.json();
      return { 
        data: null, 
        error: errorData.message || "Rate limit exceeded. Please try again later.",
        rateLimited: true 
      };
    }

    if (!response.ok) {
      const errorData = await response.json();
      return { data: null, error: errorData.error || "Failed to fetch profiles" };
    }

    const result = await response.json();
    return { data: result.data, error: null };

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
