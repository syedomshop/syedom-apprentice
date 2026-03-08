import { useEffect, useState, useRef, useCallback } from "react";
import { getCached, isFresh, setCache, TTL } from "@/lib/cache";

/**
 * Hook that serves cached data instantly, then refreshes in background if stale.
 * - First render: instant from localStorage (no loading spinner!)
 * - Background: fetches fresh data only if TTL expired
 * - Manual refresh available via `refetch`
 */
export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number; enabled?: boolean }
) {
  const ttl = options?.ttl ?? TTL.MEDIUM;
  const enabled = options?.enabled ?? true;

  const cached = getCached<T>(key);
  const [data, setData] = useState<T | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;
    
    // If we have fresh cached data and not forcing, skip
    if (!force && isFresh(key)) return;

    // If we have stale cache, show it but refresh in background
    if (data) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const fresh = await fetcherRef.current();
      setData(fresh);
      setCache(key, fresh, ttl);
    } catch (err) {
      console.error(`Cache fetch error [${key}]:`, err);
      // Keep stale data on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [key, enabled, ttl, data]);

  useEffect(() => {
    if (enabled) fetchData();
  }, [key, enabled]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return { data, loading, refreshing, refetch };
}
