import { useEffect, useState } from "react";
import { Sparkles, BarChart3, Heart } from "lucide-react";

export type FanMode = {
  womenFirst: boolean;
  statsMode: boolean;
  vibesMode: boolean;
};

const STORAGE_KEY = "lb_fan_mode_v1";
const DEFAULT: FanMode = { womenFirst: true, statsMode: false, vibesMode: true };

export function useFanMode(): [FanMode, (next: Partial<FanMode>) => void] {
  const [mode, setMode] = useState<FanMode>(DEFAULT);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMode({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {}
  }, []);
  const update = (next: Partial<FanMode>) => {
    setMode((prev) => {
      const merged = { ...prev, ...next };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch {}
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
    </div>
  );
};

export default PersonalizationControls;
