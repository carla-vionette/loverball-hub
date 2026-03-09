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

// Client-side fallback if edge function fails entirely
const FALLBACK_ITEMS: LiveSportsItem[] = [
  { text: 'TONIGHT: NBA — PHI vs CLE — 4:00 PM PT', sport: '🏀', isLive: false, dateTime: '2026-03-10T00:00:00Z' },
  { text: 'TONIGHT: NBA — MEM vs BKN — 4:30 PM PT', sport: '🏀', isLive: false, dateTime: '2026-03-10T00:30:00Z' },
  { text: 'TONIGHT: NBA — DEN vs OKC — 4:30 PM PT', sport: '🏀', isLive: false, dateTime: '2026-03-10T00:30:00Z' },
  { text: 'TONIGHT: NBA — GSW vs UTA — 6:00 PM PT', sport: '🏀', isLive: false, dateTime: '2026-03-10T02:00:00Z' },
  { text: 'TONIGHT: NBA — NYK vs LAC — 7:00 PM PT', sport: '🏀', isLive: false, dateTime: '2026-03-10T03:00:00Z' },
  { text: 'TODAY: NHL — LA Kings vs Columbus — 1:00 PM PT', sport: '🏒', isLive: false, dateTime: '2026-03-09T21:00:00Z' },
  { text: 'TONIGHT: NHL — NY Rangers vs PHI — 4:00 PM PT', sport: '🏒', isLive: false, dateTime: '2026-03-10T00:00:00Z' },
  { text: 'TONIGHT: NHL — Calgary vs WSH — 4:00 PM PT', sport: '🏒', isLive: false, dateTime: '2026-03-10T00:00:00Z' },
  { text: 'TONIGHT: NHL — Utah vs CHI — 5:30 PM PT', sport: '🏒', isLive: false, dateTime: '2026-03-10T01:30:00Z' },
  { text: 'TONIGHT: NHL — Ottawa vs VAN — 6:00 PM PT', sport: '🏒', isLive: false, dateTime: '2026-03-10T02:00:00Z' },
];

export function useLiveSportsBadge() {
  const [data, setData] = useState<LiveSportsData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data: result, error } = await supabase.functions.invoke('womens-sports-live');
      if (error) throw error;
      if (result?.items?.length > 0) {
        setData(result);
      } else {
        throw new Error('No items returned');
      }
    } catch (err) {
      console.error('Failed to fetch live sports, using fallback:', err);
      setData({ items: FALLBACK_ITEMS, updatedAt: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3 * 60 * 1000); // refresh every 3 min
    return () => clearInterval(interval);
  }, [fetchData]);

  // Rotate through items every 5 seconds
  useEffect(() => {
    if (!data?.items.length || data.items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % data.items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [data]);

  const currentItem = data?.items[currentIndex] ?? null;

  return { currentItem, loading, itemCount: data?.items.length ?? 0 };
}
