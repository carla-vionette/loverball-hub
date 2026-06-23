import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { resolveZip, isValidUsZip } from "@/lib/geocoding";
import { useToast } from "@/hooks/use-toast";

export interface AreaLocation {
  zip: string | null;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
}

const OVERRIDE_KEY = "lb:area:override";

function readOverride(): AreaLocation | null {
  try {
    const raw = sessionStorage.getItem(OVERRIDE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AreaLocation;
  } catch {
    return null;
  }
}

/**
 * Active browsing area for event filtering.
 *
 * - `home` is the member's saved profile ZIP/city/lat/lng.
 * - `override` is a temporary, session-only ZIP the member is browsing.
 * - `active` is whichever is currently in effect (override wins).
 *
 * Browsing another ZIP NEVER overwrites the saved profile location.
 * The saved home only changes via `saveAsHome()`.
 */
export function useActiveArea() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [home, setHome] = useState<AreaLocation | null>(null);
  const [override, setOverrideState] = useState<AreaLocation | null>(() => readOverride());
  const [loading, setLoading] = useState(true);

  // Load saved home area from profile
  useEffect(() => {
    if (!user) {
      setHome(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      // Location is owner-only — read via SECURITY DEFINER RPC instead of selecting
      // the columns directly (column SELECT is revoked from authenticated).
      const { data } = await supabase.rpc("get_my_location" as any);
      if (cancelled) return;
      if (data) {
        setHome({
          zip: (data as any).zip_code || null,
          city: (data as any).city || null,
          state: null,
          lat: (data as any).latitude ?? null,
          lng: (data as any).longitude ?? null,
        });
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const setOverride = useCallback(async (zip: string): Promise<boolean> => {
    const clean = zip.trim();
    if (!isValidUsZip(clean)) {
      toast({ title: "Invalid ZIP", description: "Enter a 5-digit US ZIP code.", variant: "destructive" });
      return false;
    }
    const loc = await resolveZip(clean);
    if (!loc) {
      toast({ title: "ZIP not found", description: "Try a different US ZIP code.", variant: "destructive" });
      return false;
    }
    const area: AreaLocation = {
      zip: loc.zip_code,
      city: loc.city,
      state: loc.state,
      lat: loc.latitude,
      lng: loc.longitude,
    };
    sessionStorage.setItem(OVERRIDE_KEY, JSON.stringify(area));
    setOverrideState(area);
    return true;
  }, [toast]);

  const clearOverride = useCallback(() => {
    sessionStorage.removeItem(OVERRIDE_KEY);
    setOverrideState(null);
  }, []);

  const saveAsHome = useCallback(async (): Promise<boolean> => {
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return false;
    }
    const target = override;
    if (!target || !target.zip) {
      toast({ title: "Nothing to save", description: "Enter a ZIP first.", variant: "destructive" });
      return false;
    }
    const { error } = await supabase
      .from("profiles_sensitive" as any)
      .upsert({
        id: user.id,
        zip_code: target.zip,
        latitude: target.lat,
        longitude: target.lng,
      } as any);
    if (!error) {
      await supabase
        .from("profiles")
        .update({ city: target.city } as any)
        .eq("id", user.id);
    }
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      return false;
    }
    setHome(target);
    clearOverride();
    toast({ title: "Home area updated", description: `Saved ${target.zip}${target.city ? ` · ${target.city}` : ""}.` });
    return true;
  }, [user, override, clearOverride, toast]);

  const active: AreaLocation | null = override ?? home;
  const isOverriding = !!override;

  return {
    home,
    override,
    active,
    isOverriding,
    loading,
    setOverride,
    clearOverride,
    saveAsHome,
  };
}
