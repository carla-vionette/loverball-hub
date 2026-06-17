import { useState } from "react";
import { MapPin, Tv, Check, Loader2, X } from "lucide-react";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import { isInVenueRadius, type EventLike, type ViewerLike } from "@/lib/distance";
import BarPickerSheet from "./BarPickerSheet";

interface Props {
  eventId: string;
  event: EventLike;
  viewer: ViewerLike | null;
  /** Compact = inline card variant. Default = full detail variant. */
  variant?: "compact" | "detail";
  onChanged?: () => void;
}

const RASPBERRY = "#E85D2F";
const TEAL = "#1A1A1A";

export default function RsvpControl({ eventId, event, viewer, variant = "detail", onChanged }: Props) {
  const { rsvp, mode, pending, rsvpGoing, rsvpWatching, cancel } = useEventRsvp(eventId);
  const [pickerOpen, setPickerOpen] = useState(false);

  const inRadius = isInVenueRadius(event, viewer);
  const supportsWatching = (event as any).event_type === "game" || (event as any).event_type === "watch_party";

  const handleGoing = async () => {
    if (mode === "going") {
      await cancel();
    } else {
      await rsvpGoing();
    }
    onChanged?.();
  };

  const openPicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPickerOpen(true);
  };

  const buttonBase =
    variant === "compact"
      ? "px-4 py-1.5 rounded-full text-[11px] uppercase tracking-[0.16em] font-['Space_Mono',ui-monospace,monospace] inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
      : "px-6 py-3 rounded-full text-xs uppercase tracking-[0.16em] font-['Space_Mono',ui-monospace,monospace] inline-flex items-center gap-2 transition-colors disabled:opacity-50";

  return (
    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap items-center gap-2">
        {inRadius && (
          <button
            type="button"
            disabled={pending}
            onClick={(e) => {
              e.stopPropagation();
              handleGoing();
            }}
            className={buttonBase}
            style={
              mode === "going"
                ? { background: RASPBERRY, color: "#fff" }
                : { background: "transparent", color: "#1A1A1A", border: `1.5px solid ${RASPBERRY}` }
            }
            aria-pressed={mode === "going"}
          >
            {pending && mode === "going" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : mode === "going" ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <MapPin className="w-3.5 h-3.5" />
            )}
            {mode === "going" ? "Going" : "Going"}
          </button>
        )}

        {supportsWatching && (
          <button
            type="button"
            disabled={pending}
            onClick={
              mode === "watching"
                ? openPicker
                : openPicker
            }
            className={buttonBase}
            style={
              mode === "watching"
                ? { background: TEAL, color: "#fff" }
                : { background: "transparent", color: "#1A1A1A", border: `1.5px solid ${TEAL}` }
            }
            aria-pressed={mode === "watching"}
          >
            {pending && mode === "watching" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : mode === "watching" ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Tv className="w-3.5 h-3.5" />
            )}
            {mode === "watching" ? "Watching" : "Watching"}
          </button>
        )}

        {rsvp && (
          <button
            type="button"
            disabled={pending}
            onClick={async (e) => {
              e.stopPropagation();
              await cancel();
              onChanged?.();
            }}
            className="text-xs text-[#1A1A1A]/50 hover:text-[#E8185A] font-['Inter'] inline-flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Cancel
          </button>
        )}
      </div>

      {mode === "watching" && rsvp?.bar_name && (
        <div className="text-xs font-['Inter'] text-[#1A1A1A]/70">
          Watching at <span className="font-semibold text-[#1A1A1A]">{rsvp.bar_name}</span>
          {" · "}
          <button
            onClick={openPicker}
            className="underline underline-offset-2 hover:text-[#00B8A9]"
          >
            change
          </button>
        </div>
      )}

      {!inRadius && variant === "detail" && (
        <p className="text-[11px] text-[#1A1A1A]/50 font-['Inter']">
          Venue is more than 50 miles away — watch with fans near you instead.
        </p>
      )}

      <BarPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        viewer={
          viewer
            ? { lat: viewer.lat ?? null, lng: viewer.lng ?? null, city: viewer.city ?? null }
            : null
        }
        onConfirm={async (spot) => {
          await rsvpWatching(spot);
          onChanged?.();
        }}
      />
    </div>
  );
}
