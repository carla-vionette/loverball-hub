import { useState, useEffect, useRef } from "react";

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

/**
 * Fetch with client-side memory cache (1 hour TTL default).
 * Falls back to stale data on error.
 */
export function useCachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number; enabled?: boolean }
) {
  const { ttl = 3_600_000, enabled = true } = options ?? {};
  const [data, setData] = useState<T | null>(() => {
    const cached = memoryCache.get(key) as CacheEntry<T> | undefined;
    return cached && cached.expiry > Date.now() ? cached.data : null;
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) return;

    const cached = memoryCache.get(key) as CacheEntry<T> | undefined;
    if (cached && cached.expiry > Date.now()) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetcherRef.current()
      .then((result) => {
        if (cancelled) return;
        memoryCache.set(key, { data: result, expiry: Date.now() + ttl });
        setData(result);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
        // Serve stale if available
        if (cached) setData(cached.data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [key, ttl, enabled]);

  const refetch = () => {
    memoryCache.delete(key);
    setLoading(true);
    fetcherRef.current()
      .then((result) => {
        memoryCache.set(key, { data: result, expiry: Date.now() + ttl });
        setData(result);
        setError(null);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  };

  return { data, loading, error, refetch };
}

/** Clear entire cache or a specific key */
export function clearCache(key?: string) {
  if (key) memoryCache.delete(key);
  else memoryCache.clear();
}
