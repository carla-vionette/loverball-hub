import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LiveSportsItem {
  text: string;
  isLive: boolean;
  sport: string;
  dateTime: string;
}

interface LiveSportsData {
  items: LiveSportsItem[];
  updatedAt: string;
}

export function useLiveSportsBadge() {
  const [data, setData] = useState<LiveSportsData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data: result, error } = await supabase.functions.invoke('womens-sports-live');
      if (error) throw error;
      if (result) setData(result);
    } catch (err) {
      console.error('Failed to fetch live sports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [fetchData]);

  // Rotate through items every 6 seconds
  useEffect(() => {
    if (!data?.items.length || data.items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % data.items.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [data]);

  const currentItem = data?.items[currentIndex] ?? null;

  return { currentItem, loading, itemCount: data?.items.length ?? 0 };
}
