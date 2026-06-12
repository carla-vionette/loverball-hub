import { useEffect, useState } from "react";
import { Sparkles, BarChart3, Heart, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type FanMode = {
  womenFirst: boolean;
  statsMode: boolean;
  vibesMode: boolean;
  localMode: boolean;
};

const STORAGE_KEY = "lb_fan_mode_v2";
const DEFAULT: FanMode = { womenFirst: true, statsMode: false, vibesMode: true, localMode: true };

// Map between FanMode booleans and the `profiles.fan_modes text[]` column.
const MODE_KEYS: Record<keyof FanMode, string> = {
  womenFirst: "womens_first",
  statsMode: "stats",
  vibesMode: "vibes",
  localMode: "local",
};
const modeToArray = (m: FanMode): string[] =>
  (Object.keys(MODE_KEYS) as (keyof FanMode)[]).filter((k) => m[k]).map((k) => MODE_KEYS[k]);
const arrayToMode = (rows: string[] | null | undefined): FanMode => {
  const set = new Set(rows ?? []);
  return {
    womenFirst: set.has("womens_first"),
    statsMode:  set.has("stats"),
    vibesMode:  set.has("vibes"),
    localMode:  set.has("local"),
  };
};

export function useFanMode(): [FanMode, (next: Partial<FanMode>) => void] {
  const { user } = useAuth();
  const [mode, setMode] = useState<FanMode>(DEFAULT);

  // Hydrate from localStorage immediately, then from DB once user is known.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMode({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {/* ignore */}
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("fan_modes")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      // If the DB has any value at all, treat it as source of truth.
      if (data?.fan_modes && Array.isArray(data.fan_modes) && data.fan_modes.length > 0) {
        const next = arrayToMode(data.fan_modes as string[]);
        setMode(next);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {/* ignore */}
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const update = (next: Partial<FanMode>) => {
    setMode((prev) => {
      const merged = { ...prev, ...next };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch {/* ignore */}
      // Fire-and-forget DB sync — never block the UI on the round-trip.
      if (user) {
        supabase
          .from("profiles")
          .update({ fan_modes: modeToArray(merged) })
          .eq("id", user.id)
          .then(({ error }) => { if (error) console.warn("[fanMode] sync failed:", error.message); });
      }
      return merged;
    });
  };
  return [mode, update];
}

const PINK = "#E85D2F";
const PANEL = "#161616";
const BORDER = "1px solid rgba(250, 245, 233, 0.08)";

const Toggle = ({
  active, onClick, icon: Icon, label, hint,
}: { active: boolean; onClick: () => void; icon: any; label: string; hint: string }) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    className="flex-1 min-w-[140px] rounded-2xl px-3 py-3 text-left transition-all"
    style={{
      background: active ? "rgba(232,93,47,0.10)" : PANEL,
      border: active ? `1px solid ${PINK}` : BORDER,
    }}
  >
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5" style={{ color: active ? PINK : "rgba(250,245,233,0.55)" }} />
      <span
        className="text-[10.5px] uppercase"
        style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.18em", color: active ? "#FAF5E9" : "rgba(250,245,233,0.7)" }}
      >
        {label}
      </span>
      <span
        className="ml-auto text-[9px] uppercase tracking-widest"
        style={{ color: active ? PINK : "rgba(250,245,233,0.35)", fontFamily: "'Inter', sans-serif", fontWeight: 700 }}
      >
        {active ? "On" : "Off"}
      </span>
    </div>
    <p className="mt-1.5 text-[11px]" style={{ color: "rgba(250,245,233,0.55)", fontFamily: "'Inter', sans-serif" }}>
      {hint}
    </p>
  </button>
);

const PersonalizationControls = () => {
  const [mode, update] = useFanMode();
  return (
    <div className="flex flex-wrap gap-2">
      <Toggle
        active={mode.womenFirst}
        onClick={() => update({ womenFirst: !mode.womenFirst })}
        icon={Heart}
        label="Women's first"
        hint="Surface WNBA, NWSL, NCAA women's coverage at the top."
      />
      <Toggle
        active={mode.statsMode}
        onClick={() => update({ statsMode: !mode.statsMode })}
        icon={BarChart3}
        label="Stats mode"
        hint="Scores, standings and box scores get more room."
      />
      <Toggle
        active={mode.vibesMode}
        onClick={() => update({ vibesMode: !mode.vibesMode })}
        icon={Sparkles}
        label="Vibes mode"
        hint="Stories, watch parties and culture lead the feed."
      />
      <Toggle
        active={mode.localMode}
        onClick={() => update({ localMode: !mode.localMode })}
        icon={MapPin}
        label="Local mode"
        hint="Prioritize plans, bars and games near your city."
      />
    </div>
  );
};

export default PersonalizationControls;
