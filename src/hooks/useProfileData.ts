import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ProfileData = {
  id: string;
  name: string;
  pronouns: string | null;
  city: string | null;
  age_range: string | null;
  favorite_sports: string[] | null;
  favorite_teams_players: string[] | null;
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

  return useQuery<ProfileBundle>({
    queryKey: ["profile-bundle", user?.id],
    enabled: !authLoading && !!user?.id,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      const uid = user!.id;
      const today = new Date().toISOString().split("T")[0];
      const [profileResult, rsvpResult, suggestedResult, settingsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, name, pronouns, city, age_range, favorite_sports, favorite_teams_players, sports_experience_types, other_interests, event_comfort_level, participation_preferences, bio, profile_photo_url"
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
      ]);

      if (profileResult.error || !profileResult.data) {
        return { profile: null, rsvpEvents: [], suggestedEvents: [], missingProfile: true };
      }

      const rsvpEvents = (rsvpResult.data || []).filter(
        (r: any) => r.event !== null
      ) as RSVPEvent[];

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
