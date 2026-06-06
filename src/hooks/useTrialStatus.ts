import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const TRIAL_DAYS = 30;

export interface TrialStatus {
  loading: boolean;
  /** User has an active paid membership. */
  isPaid: boolean;
  /** Existing user before beta launch — bypasses trial. */
  isGrandfathered: boolean;
  /** ms remaining before trial ends (0 if expired). */
  msRemaining: number;
  daysRemaining: number;
  inTrial: boolean;
  /** True only when not paid, not grandfathered, and clock has run out. */
  isExpired: boolean;
}

const DEFAULT: TrialStatus = {
  loading: true,
  isPaid: false,
  isGrandfathered: false,
  msRemaining: 0,
  daysRemaining: 0,
  inTrial: false,
  isExpired: false,
};

export const useTrialStatus = (): TrialStatus => {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<TrialStatus>(DEFAULT);

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;
    if (!user) {
      setStatus({ ...DEFAULT, loading: false });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("trial_started_at, grandfathered, membership_tier, created_at")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      const grandfathered = !!data?.grandfathered;
      const tier = (data?.membership_tier ?? "free") as string;
      const isPaid = tier !== "free" && tier !== "pending";
      const startedAt = data?.trial_started_at
        ? new Date(data.trial_started_at).getTime()
        : data?.created_at
        ? new Date(data.created_at).getTime()
        : Date.now();
      const endsAt = startedAt + TRIAL_DAYS * 24 * 60 * 60 * 1000;
      const msRemaining = Math.max(0, endsAt - Date.now());
      const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
      const inTrial = msRemaining > 0;
      const isExpired = !isPaid && !grandfathered && msRemaining === 0;

      setStatus({
        loading: false,
        isPaid,
        isGrandfathered: grandfathered,
        msRemaining,
        daysRemaining,
        inTrial,
        isExpired,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);

  return status;
};
