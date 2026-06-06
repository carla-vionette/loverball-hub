import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useActiveArea } from "@/hooks/useActiveArea";

/**
 * Soft nudge shown on the Events tab when the member has no saved ZIP
 * (and no temporary override). Tapping the prompt reveals an inline ZIP
 * field that saves to the profile so future visits auto-populate local
 * games.
 */
const ZipPromptCard = ({ onSaved }: { onSaved?: () => void }) => {
  const { setOverride, saveAsHome } = useActiveArea();
  const [expanded, setExpanded] = useState(false);
  const [zip, setZip] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (zip.length !== 5) return;
    setBusy(true);
    const ok = await setOverride(zip);
    if (ok) {
      await saveAsHome();
      onSaved?.();
    }
    setBusy(false);
  };

  return (
    <div
      className="mb-6 rounded-[20px] overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(232,93,47,0.10), rgba(45,212,191,0.08))",
        border: "1px solid rgba(232,93,47,0.25)",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 text-left p-4"
      >
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "rgba(232,93,47,0.18)", border: "1px solid rgba(232,93,47,0.4)" }}
        >
          <MapPin className="w-5 h-5" style={{ color: "#E85D2F" }} />
        </span>
        <div className="min-w-0 flex-1">
          <div
            style={{
              fontFamily: "'Anton', Impact, sans-serif",
              fontSize: 18,
              lineHeight: 1.05,
              color: "#FFFFFF",
              textTransform: "uppercase",
              letterSpacing: "0.01em",
            }}
          >
            Set your city to see local games
          </div>
          <div
            className="mt-1"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: "italic",
              fontSize: 13,
              color: "rgba(248,248,248,0.65)",
            }}
          >
            Add your ZIP — we'll surface pro &amp; college matchups near you.
          </div>
        </div>
        <span
          style={{
            fontFamily: "'Space Mono', ui-monospace, monospace",
            fontSize: 10,
            letterSpacing: "0.18em",
            color: "#E85D2F",
            textTransform: "uppercase",
          }}
        >
          {expanded ? "Close" : "Add ZIP"}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 flex flex-col sm:flex-row gap-2">
          <Input
            inputMode="numeric"
            pattern="\d*"
            maxLength={5}
            placeholder="ZIP code"
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            className="h-11 text-sm flex-1 bg-background"
            aria-label="ZIP code"
            autoFocus
          />
          <Button
            type="button"
            onClick={submit}
            disabled={zip.length !== 5 || busy}
            className="h-11 rounded-full px-5"
            style={{
              background: "#E85D2F",
              color: "#fff",
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save city"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ZipPromptCard;
