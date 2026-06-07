import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Beer, Check } from "lucide-react";
import { LA_SPORTS_BARS, type SportsBar } from "@/data/laSportsBars";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventTitle?: string;
  selectedBarId?: string | null;
  onSelect: (bar: SportsBar) => void | Promise<void>;
}

const WatchPartyBarModal = ({ open, onOpenChange, eventTitle, selectedBarId, onSelect }: Props) => {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const bars = query
    ? LA_SPORTS_BARS.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.neighborhood.toLowerCase().includes(query) ||
          b.vibe.toLowerCase().includes(query)
      )
    : LA_SPORTS_BARS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg rounded-3xl max-h-[85vh] flex flex-col"
        style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <DialogHeader>
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
            Pick your watch spot
          </span>
          <DialogTitle
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
            Watch Party
          </DialogTitle>
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
        </DialogHeader>

        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search bars or neighborhoods…"
            className="pl-9 rounded-full bg-muted/40 border-border/20"
            style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13 }}
          />
        </div>

        <div className="overflow-y-auto -mx-2 px-2 space-y-2 mt-1 pb-1">
          {bars.length === 0 && (
            <p
              className="text-center py-8"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: "italic",
                fontSize: 13,
                color: "rgba(248,248,248,0.5)",
              }}
            >
              No bars match "{q}"
            </p>
          )}
          {bars.map((bar) => {
            const active = selectedBarId === bar.id;
            return (
              <button
                key={bar.id}
                onClick={() => onSelect(bar)}
                className="w-full text-left rounded-2xl p-3 transition-all hover:translate-y-[-1px]"
                style={{
                  background: active ? "rgba(232,93,47,0.12)" : "rgba(20,20,21,0.6)",
                  border: active ? "1px solid #E85D2F" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div
                      style={{
                        fontFamily: "'Anton', Impact, sans-serif",
                        fontSize: 16,
                        color: "#FFFFFF",
                        textTransform: "uppercase",
                        letterSpacing: "0.01em",
                      }}
                    >
                      {bar.name}
                    </div>
                    <div
                      className="flex items-center gap-1.5 mt-0.5"
                      style={{
                        fontFamily: "'Space Mono', ui-monospace, monospace",
                        fontSize: 10,
                        color: "rgba(248,248,248,0.55)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      <MapPin className="w-3 h-3" style={{ color: "#E85D2F" }} />
                      {bar.neighborhood}
                    </div>
                    <p
                      className="mt-1.5"
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontStyle: "italic",
                        fontSize: 12,
                        color: "rgba(248,248,248,0.65)",
                      }}
                    >
                      {bar.vibe}
                    </p>
                  </div>
                  {active && (
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: "#E85D2F", color: "#fff" }}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="ghost"
            className="flex-1 rounded-full h-10"
            style={{
              color: "rgba(248,248,248,0.6)",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WatchPartyBarModal;
