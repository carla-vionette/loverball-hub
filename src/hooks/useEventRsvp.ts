import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type RsvpMode = "going" | "watching";

export interface MyRsvp {
  status: string;
  rsvp_type: "stadium" | "bar" | null;
  watch_location_id: string | null;
  bar_name: string | null;
}

export interface WatchSpotSelection {
  watch_location_id: string | null;
  bar_name: string;
}

interface UseEventRsvpResult {
  rsvp: MyRsvp | null;
  mode: RsvpMode | null;
  loading: boolean;
  pending: boolean;
  /** RSVP as Going (at the venue). Optimistic. */
  rsvpGoing: () => Promise<void>;
  /** RSVP as Watching at a chosen spot. Optimistic. */
  rsvpWatching: (spot: WatchSpotSelection) => Promise<void>;
  /** Cancel the user's RSVP. */
  cancel: () => Promise<void>;
  refresh: () => Promise<void>;
}

const ACTIVE_STATUSES = ["attending", "approved", "confirmed", "going"] as const;

// Lightweight pub/sub so multiple useEventRsvp() instances for the same event
// stay in sync (e.g. RSVP button updates the chat panel without a refresh).
type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();
function notify(eventId: string) {
  listeners.get(eventId)?.forEach((fn) => {
    try { fn(); } catch { /* noop */ }
  });
}
function subscribe(eventId: string, fn: Listener) {
  if (!listeners.has(eventId)) listeners.set(eventId, new Set());
  listeners.get(eventId)!.add(fn);
  return () => {
    listeners.get(eventId)?.delete(fn);
  };
}

export function useEventRsvp(eventId: string | undefined): UseEventRsvpResult {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rsvp, setRsvp] = useState<MyRsvp | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || !eventId) {
      setRsvp(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("event_rsvps")
      .select("status, rsvp_type, watch_location_id, bar_name")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (data && (ACTIVE_STATUSES as readonly string[]).includes(data.status)) {
      setRsvp({
        status: data.status,
        rsvp_type: (data.rsvp_type as MyRsvp["rsvp_type"]) ?? null,
        watch_location_id: (data as { watch_location_id: string | null }).watch_location_id ?? null,
        bar_name: data.bar_name ?? null,
      });
    } else {
      setRsvp(null);
    }
    setLoading(false);
  }, [user, eventId]);

  useEffect(() => {
    refresh();
    if (!eventId) return;
    return subscribe(eventId, () => { refresh(); });
  }, [refresh, eventId]);

  const requireAuth = useCallback(() => {
    if (!user) {
      toast({ title: "Sign in to RSVP", description: "Create an account to lock in your spot." });
      return false;
    }
    return true;
  }, [user, toast]);

  const rsvpGoing = useCallback(async () => {
    if (!eventId || !requireAuth() || !user) return;
    const previous = rsvp;
    setRsvp({
      status: "attending",
      rsvp_type: "stadium",
      watch_location_id: null,
      bar_name: null,
    });
    setPending(true);
    const { error } = await supabase.from("event_rsvps").upsert(
      {
        event_id: eventId,
        user_id: user.id,
        status: "attending",
        rsvp_type: "stadium",
        watch_location_id: null,
        bar_name: null,
        bar_id: null,
      },
      { onConflict: "event_id,user_id" },
    );
    setPending(false);
    if (error) {
      setRsvp(previous);
      toast({ title: "Couldn't RSVP", description: error.message, variant: "destructive" });
      return;
    }
    notify(eventId);
    toast({ title: "You're going — at the venue 🏟️" });
  }, [eventId, requireAuth, user, rsvp, toast]);

  const rsvpWatching = useCallback(
    async (spot: WatchSpotSelection) => {
      if (!eventId || !requireAuth() || !user) return;
      const previous = rsvp;
      setRsvp({
        status: "attending",
        rsvp_type: "bar",
        watch_location_id: spot.watch_location_id,
        bar_name: spot.bar_name,
      });
      setPending(true);
      const { error } = await supabase.from("event_rsvps").upsert(
        {
          event_id: eventId,
          user_id: user.id,
          status: "attending",
          rsvp_type: "bar",
          watch_location_id: spot.watch_location_id,
          bar_name: spot.bar_name,
          bar_id: spot.watch_location_id, // legacy mirror for backwards compat
        },
        { onConflict: "event_id,user_id" },
      );
      setPending(false);
      if (error) {
        setRsvp(previous);
        toast({ title: "Couldn't RSVP", description: error.message, variant: "destructive" });
        return;
      }
      notify(eventId);
      toast({ title: `Watching at ${spot.bar_name} 📺` });
    },
    [eventId, requireAuth, user, rsvp, toast],
  );

  const cancel = useCallback(async () => {
    if (!eventId || !user) return;
    const previous = rsvp;
    setRsvp(null);
    setPending(true);
    const { error } = await supabase
      .from("event_rsvps")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", user.id);
    setPending(false);
    if (error) {
      setRsvp(previous);
      toast({ title: "Couldn't cancel", description: error.message, variant: "destructive" });
      return;
    }
    notify(eventId);
    toast({ title: "RSVP canceled" });
  }, [eventId, user, rsvp, toast]);

  const mode: RsvpMode | null = rsvp
    ? rsvp.rsvp_type === "bar"
      ? "watching"
      : "going"
    : null;

  return { rsvp, mode, loading, pending, rsvpGoing, rsvpWatching, cancel, refresh };
}
