import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AttendeeLite {
  id: string;
  name: string;
  profile_photo_url: string | null;
  city?: string | null;
}
export interface WatchPartyGroup {
  watch_location_id: string | null;
  bar_name: string | null;
  neighborhood: string | null;
  city: string | null;
  image_url: string | null;
  distance_mi: number | null;
  attendee_count: number;
  attendees: AttendeeLite[];
}
export interface GoingGraphData {
  stadium: { attendees: AttendeeLite[]; total: number };
  watch_parties: { groups: WatchPartyGroup[]; total: number };
}

const EMPTY: GoingGraphData = {
  stadium: { attendees: [], total: 0 },
  watch_parties: { groups: [], total: 0 },
};

export function useGoingGraph(
  eventId: string | undefined,
  viewer: { lat: number | null; lng: number | null } | null,
  refreshKey = 0,
) {
  const [data, setData] = useState<GoingGraphData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    const { data: row, error: err } = await supabase.rpc("get_event_going_graph" as never, {
      p_event_id: eventId,
      p_viewer_lat: viewer?.lat ?? null,
      p_viewer_lng: viewer?.lng ?? null,
    } as never);
    if (err) {
      setError(err.message);
      setData(EMPTY);
      setLoading(false);
      return;
    }
    setData((row as unknown as GoingGraphData) ?? EMPTY);
    setLoading(false);
  }, [eventId, viewer?.lat, viewer?.lng]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return { data, loading, error, refresh: load };
}
