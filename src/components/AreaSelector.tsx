import { useState } from "react";
import { MapPin, X, Home, BookmarkPlus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useActiveArea } from "@/hooks/useActiveArea";

interface Props {
  /** Compact horizontal layout for tight contexts. Defaults to false. */
  compact?: boolean;
  className?: string;
}

const AreaSelector = ({ compact = false, className = "" }: Props) => {
  const { home, override, active, isOverriding, setOverride, clearOverride, saveAsHome } = useActiveArea();
  const [zipInput, setZipInput] = useState("");
  const [busy, setBusy] = useState<"apply" | "save" | null>(null);

  const handleApply = async () => {
    if (!zipInput.trim()) return;
    setBusy("apply");
    const ok = await setOverride(zipInput);
    setBusy(null);
    if (ok) setZipInput("");
  };

  const handleSave = async () => {
    setBusy("save");
    await saveAsHome();
    setBusy(null);
  };

  const statusLabel = (() => {
    if (!active) return "Set your area";
    const label = active.zip || active.city || "your area";
    return isOverriding ? `Browsing ${label} temporarily` : `Showing events near ${label}`;
  })();

  return (
    <div
      className={`rounded-2xl border border-border/40 bg-card/50 p-3 ${compact ? "" : "md:p-4"} ${className}`}
      role="region"
      aria-label="Event area selector"
    >
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-4 h-4 text-primary shrink-0" />
        <span className="text-xs font-semibold tracking-wider uppercase text-foreground/80 truncate">
          {statusLabel}
        </span>
      </div>

      {isOverriding && home?.zip && (
        <p className="text-[11px] text-muted-foreground mb-2">
          Your saved home area is <span className="font-semibold text-foreground">{home.zip}</span>.
          This view is temporary.
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          inputMode="numeric"
          pattern="\d*"
          maxLength={5}
          placeholder={isOverriding ? "Try another ZIP" : "Enter a ZIP to browse another area"}
          value={zipInput}
          onChange={(e) => setZipInput(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
          onKeyDown={(e) => { if (e.key === "Enter") handleApply(); }}
          className="h-9 rounded-full text-sm flex-1"
          aria-label="ZIP code"
        />
        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            disabled={zipInput.length !== 5 || busy === "apply"}
            className="rounded-full h-9 px-4 text-xs"
          >
            {busy === "apply" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Browse"}
          </Button>
          {isOverriding && (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={clearOverride}
                className="rounded-full h-9 px-3 text-xs gap-1"
              >
                <Home className="w-3.5 h-3.5" />
                Back to my area
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleSave}
                disabled={busy === "save"}
                className="rounded-full h-9 px-3 text-xs gap-1"
                title="Update your saved home ZIP to this area"
              >
                {busy === "save" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                Save as my home area
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AreaSelector;
