import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HomepageData {
  trending_news: Array<{
    id: string;
    title: string;
    summary: string;
    source: string;
    source_url: string;
    image_url: string | null;
    category: string;
    sport_tags: string[];
    team_tags: string[];
    created_at: string;
  }>;
  upcoming_events: Array<{
    id: string;
    title: string;
    event_date: string;
    event_time: string | null;
    venue_name: string | null;
    city: string | null;
    location: string | null;
    event_type: string | null;
    image_url: string | null;
    slug: string | null;
    sport_tags: string[] | null;
    tier: string | null;
    visibility: string;
  }>;
  ticker_items: Array<{
    id: string;
    title: string;
    item_type: string;
    tag: string | null;
    link_url: string | null;
    starts_at: string | null;
  }>;
  fetched_at: string;
}

let _cache: { data: HomepageData; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useHomepageData() {
  const [data, setData] = useState<HomepageData | null>(_cache?.data ?? null);
  const [loading, setLoading] = useState(!_cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
      setData(_cache.data);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const { data: result, error: fnError } = await supabase.functions.invoke(
          "homepage-data"
        );
        if (fnError) throw fnError;
        const payload = result as HomepageData;
        _cache = { data: payload, ts: Date.now() };
        setData(payload);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}
