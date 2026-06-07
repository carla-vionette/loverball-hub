import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Beer, Check, Loader2 } from "lucide-react";
import { LA_SPORTS_BARS, type SportsBar } from "@/data/laSportsBars";
import { distanceMiles } from "@/lib/geocoding";
import { MOCK_EVENT_BARS } from "@/data/mockEvents";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId?: string;
  eventTitle?: string;
  selectedBarId?: string | null;
  userLoc?: { lat: number; lng: number } | null;
  onConfirm: (bar: SportsBar) => void | Promise<void>;
}

const MAX_RADIUS_MI = 5;

const WatchPartyBarModal = ({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  selectedBarId,
  userLoc,
  onConfirm,
}: Props) => {
  const [picked, setPicked] = useState<string | null>(selectedBarId ?? null);

  const recommendedIds = useMemo(
    () => new Set((eventId && MOCK_EVENT_BARS[eventId]?.map((b) => b.id)) || []),
    [eventId]
  );

  // Compute distances, sort nearest first, optionally filter to <= 5 mi.
  // Recommended bars for this event always float to the top regardless of
  // distance so they remain visible.
  const bars = useMemo(() => {
    const withDist = LA_SPORTS_BARS.map((b) => ({
      ...b,
      distance: userLoc ? distanceMiles(userLoc.lat, userLoc.lng, b.lat, b.lng) : null,
      recommended: recommendedIds.has(b.id),
    }));
    const sorted = [...withDist].sort((a, b) => {
      if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
      return (a.distance ?? 0) - (b.distance ?? 0);
    });
    if (!userLoc) return sorted;
    const near = sorted.filter((b) => b.recommended || (b.distance ?? Infinity) <= MAX_RADIUS_MI);
    return near.length > 0 ? near : sorted;
  }, [userLoc, recommendedIds]);


  const pickedBar = bars.find((b) => b.id === picked);
  const noneInRange = userLoc && bars.every((b) => (b.distance ?? Infinity) > MAX_RADIUS_MI);

  const handleConfirm = async () => {
    if (!pickedBar) return;
    await onConfirm(pickedBar);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl p-0 max-h-[85dvh] flex flex-col border-0"
        style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.18)" }} />
        </div>

        <SheetHeader className="px-5 pb-3 text-left flex-shrink-0">
          <span
            style={{
              fontFamily: "'Space Mono', ui-monospace, monospace",
              fontSize: 10,
              letterSpacing: "0.22em",
              color: "#FFFFFF",
              textTransform: "uppercase",
            }}
          >
            <Beer className="inline w-3 h-3 mr-1.5 -mt-0.5" />
            {userLoc ? `Within ${MAX_RADIUS_MI} miles` : "LA Sports Bars"}
          </span>
          <SheetTitle
            style={{
              fontFamily: "'Anton', Impact, sans-serif",
              fontSize: 28,
              lineHeight: 0.95,
              color: "#FFFFFF",
              textTransform: "uppercase",
              letterSpacing: "0.01em",
              marginTop: 4,
            }}
          >
            Where are you watching?
          </SheetTitle>
          {eventTitle && (
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: "italic",
                fontSize: 13,
                color: "rgba(248,248,248,0.6)",
                marginTop: 4,
              }}
            >
              {eventTitle}
            </p>
          )}
        </SheetHeader>

        <div className="overflow-y-auto px-5 pb-2 space-y-2 flex-1 min-h-0">
          {noneInRange && (
            <p
              className="text-center py-3 px-4 rounded-2xl"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: "italic",
                fontSize: 13,
                color: "rgba(248,248,248,0.6)",
                background: "rgba(45,212,191,0.06)",
                border: "1px dashed rgba(45,212,191,0.25)",
              }}
            >
              Nothing within {MAX_RADIUS_MI} miles — showing nearest spots.
            </p>
          )}

          {bars.length === 0 && (
            <div
              className="text-center py-10 px-6 rounded-2xl"
              style={{
                background: "rgba(20,20,21,0.6)",
                border: "1px dashed rgba(255,255,255,0.12)",
              }}
            >
              <p
                style={{
                  fontFamily: "'Anton', Impact, sans-serif",
                  fontSize: 18,
                  color: "#FFFFFF",
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                }}
              >
                Know a good spot?
              </p>
              <p
                className="mt-1.5"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: "italic",
                  fontSize: 13,
                  color: "rgba(248,248,248,0.6)",
                }}
              >
                Drop it in the chat ↓
              </p>
            </div>
          )}

          {bars.map((bar) => {
            const active = picked === bar.id;
            return (
              <button
                key={bar.id}
                onClick={() => setPicked(bar.id)}
                className="w-full text-left rounded-2xl p-3.5 transition-all"
                style={{
                  background: active ? "rgba(232,93,47,0.12)" : "rgba(20,20,21,0.6)",
                  border: active
                    ? "1px solid #E85D2F"
                    : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        style={{
                          fontFamily: "'Anton', Impact, sans-serif",
                          fontSize: 16,
                          color: "#FFFFFF",
                          textTransform: "uppercase",
                          letterSpacing: "0.01em",
                          lineHeight: 1.1,
                        }}
                      >
                        {bar.name}
                      </span>
                      {bar.recommended && (
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "rgba(232,93,47,0.18)",
                            border: "1px solid rgba(232,93,47,0.45)",
                            fontFamily: "'Space Mono', ui-monospace, monospace",
                            fontSize: 9,
                            color: "#E85D2F",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                          }}
                        >
                          Pick for this game
                        </span>
                      )}

                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <Star className="w-3 h-3" style={{ color: "#F5C518", fill: "#F5C518" }} />
                        <span
                          style={{
                            fontFamily: "'Inter', system-ui, sans-serif",
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#FAF5E9",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {bar.rating.toFixed(1)}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Space Mono', ui-monospace, monospace",
                            fontSize: 9,
                            color: "rgba(248,248,248,0.5)",
                          }}
                        >
                          ({bar.review_count.toLocaleString()})
                        </span>
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-3 mt-1"
                      style={{
                        fontFamily: "'Space Mono', ui-monospace, monospace",
                        fontSize: 10,
                        color: "rgba(248,248,248,0.6)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" style={{ color: "#E85D2F" }} />
                        {bar.neighborhood}
                      </span>
                      {bar.distance != null && (
                        <span style={{ color: "#2DD4BF" }}>
                          {bar.distance < 1 ? "<1" : bar.distance.toFixed(1)} mi
                        </span>
                      )}
                    </div>
                    <p
                      className="mt-1.5"
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontStyle: "italic",
                        fontSize: 12,
                        color: "rgba(248,248,248,0.6)",
                      }}
                    >
                      {bar.vibe}
                    </p>
                  </div>
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: active ? "#E85D2F" : "transparent",
                      border: active ? "1px solid #E85D2F" : "1px solid rgba(255,255,255,0.18)",
                      color: "#fff",
                    }}
                  >
                    {active && <Check className="w-3.5 h-3.5" />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Sticky confirm bar */}
        <div
          className="px-5 pt-3 pb-5 flex-shrink-0"
          style={{
            background: "linear-gradient(180deg, rgba(10,10,11,0) 0%, #0a0a0a 35%)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Button
            disabled={!pickedBar}
            onClick={handleConfirm}
            className="w-full rounded-full h-12 transition-all"
            style={{
              background: pickedBar ? "#E85D2F" : "rgba(255,255,255,0.08)",
              color: pickedBar ? "#fff" : "rgba(248,248,248,0.4)",
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {pickedBar ? `I'm watching at ${pickedBar.name} 🍺` : "Pick a bar to continue"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default WatchPartyBarModal;
