import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNetworkQuality } from "@/hooks/useNetworkQuality";

export type ProfileData = {
  id: string;
  name: string;
  pronouns: string | null;
  city: string | null;
  age_range: string | null;
  favorite_sports: string[] | null;
  favorite_teams_players: string[] | null;
  favorite_la_teams: string[] | null;
  sports_experience_types: string[] | null;
  other_interests: string[] | null;
  event_comfort_level: string | null;
  participation_preferences: string[] | null;
  bio: string | null;
  profile_photo_url: string | null;
  membership_tier: string | null;
};

export type RSVPEvent = {
  id: string;
  status: string;
  rsvp_kind?: 'standard' | 'stadium' | 'bar';
  bar_name?: string | null;
  event: {
    id: string;
    title: string;
    event_date: string;
    event_time: string | null;
    venue_name: string | null;
    city: string | null;
    image_url: string | null;
  };
};

export type SuggestedEvent = {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  venue_name: string | null;
  city: string | null;
  image_url: string | null;
};

export type ProfileBundle = {
  profile: ProfileData | null;
  rsvpEvents: RSVPEvent[];
  suggestedEvents: SuggestedEvent[];
  missingProfile: boolean;
};

/**
 * Single consolidated hook for the Profile page.
 * Performs all 3 fetches in parallel and caches the result across navigations.
 */
export function useProfileData() {
  const { user, loading: authLoading } = useAuth();
  const { isSlow, saveData } = useNetworkQuality();

  return useQuery<ProfileBundle>({
    queryKey: ["profile-bundle", user?.id],
    enabled: !authLoading && !!user?.id,
    // Keep the bundle fresh: re-fetch on every mount and whenever the tab regains focus.
    // On slow/saver networks, extend cache lifetime aggressively to reduce data usage.
    staleTime: isSlow || saveData ? 5 * 60_000 : 15_000,
    gcTime: 5 * 60_000,
    refetchOnMount: isSlow || saveData ? false : "always",
    refetchOnWindowFocus: !saveData,
    refetchOnReconnect: true,
    queryFn: async () => {
      const uid = user!.id;
      const today = new Date().toISOString().split("T")[0];
      const [profileResult, rsvpResult, suggestedResult, settingsResult, externalRsvpResult] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, name, pronouns, city, age_range, favorite_sports, favorite_teams_players, favorite_la_teams, sports_experience_types, other_interests, event_comfort_level, participation_preferences, bio, profile_photo_url"
          )
          .eq("id", uid)
          .maybeSingle(),
        supabase
          .from("event_rsvps")
          .select(
            `id, status, event:events (id, title, event_date, event_time, venue_name, city, image_url)`
          )
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
        supabase
          .from("events")
          .select("id, title, event_date, event_time, venue_name, city, image_url")
          .gte("event_date", today)
          .eq("status", "published")
          .order("event_date", { ascending: true })
          .limit(4),
        supabase.rpc("get_my_account_settings" as any),
        supabase
          .from("external_event_rsvps")
          .select("id, event_id, rsvp_type, bar_name")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
      ]);

      if (profileResult.error || !profileResult.data) {
        return { profile: null, rsvpEvents: [], suggestedEvents: [], missingProfile: true };
      }

      const standardRsvps = (rsvpResult.data || [])
        .filter((r: any) => r.event !== null)
        .map((r: any) => ({ ...r, rsvp_kind: 'standard' as const })) as RSVPEvent[];

      // External (game/stadium/bar) RSVPs — event_id is free-form text. Look up matching
      // UUID-ish IDs in events to attach metadata; skip rows we can't enrich.
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const rawExt = (externalRsvpResult?.data || []) as Array<{ id: string; event_id: string; rsvp_type: string; bar_name: string | null }>;
      const lookupIds = Array.from(new Set(rawExt.map(r => r.event_id).filter(id => uuidRe.test(id))));
      let extEventsById: Record<string, any> = {};
      if (lookupIds.length > 0) {
        const { data: extEvents } = await supabase
          .from("events")
          .select("id, title, event_date, event_time, venue_name, city, image_url")
          .in("id", lookupIds);
        (extEvents || []).forEach((e: any) => { extEventsById[e.id] = e; });
      }
      const externalRsvps: RSVPEvent[] = rawExt
        .map(r => {
          const ev = extEventsById[r.event_id];
          if (!ev) return null;
          return {
            id: r.id,
            status: 'attending',
            rsvp_kind: r.rsvp_type === 'bar' ? ('bar' as const) : ('stadium' as const),
            bar_name: r.bar_name,
            event: ev,
          } as RSVPEvent;
        })
        .filter((x): x is RSVPEvent => x !== null);

      const rsvpEvents = [...standardRsvps, ...externalRsvps];

      const acct: any = settingsResult?.data || {};

      return {
        profile: { ...(profileResult.data as any), membership_tier: acct.membership_tier ?? null } as ProfileData,
        rsvpEvents,
        suggestedEvents: (suggestedResult.data || []) as SuggestedEvent[],
        missingProfile: false,
      };
    },
  });
}
