import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { haversineMiles, formatMiles } from "@/lib/distance";
import type { WatchSpotSelection } from "@/hooks/useEventRsvp";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewer: { lat: number | null; lng: number | null; city: string | null } | null;
  onConfirm: (spot: WatchSpotSelection) => Promise<void> | void;
}

interface WatchLocation {
  id: string;
  name: string;
  neighborhood: string | null;
  city: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  vibe_tags: string[];
}

export default function BarPickerSheet({ open, onOpenChange, viewer, onConfirm }: Props) {
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: spots = [], isLoading } = useQuery<WatchLocation[]>({
    queryKey: ["watch-locations-picker", viewer?.city ?? null],
    enabled: open,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      let q = supabase
        .from("watch_locations")
        .select("id, name, neighborhood, city, address, latitude, longitude, image_url, vibe_tags")
        .eq("status", "approved")
        .limit(80);
      if (viewer?.city) q = q.ilike("city", `%${viewer.city}%`);
      const { data, error } = await q;
      if (error) return [];
      return (data ?? []) as WatchLocation[];
    },
  });

  const sorted = [...spots]
    .map((s) => ({
      ...s,
      distance:
        viewer?.lat != null &&
        viewer?.lng != null &&
        s.latitude != null &&
        s.longitude != null
          ? haversineMiles(viewer.lat, viewer.lng, s.latitude, s.longitude)
          : null,
    }))
    .filter((s) => (query ? s.name.toLowerCase().includes(query.toLowerCase()) : true))
    .sort((a, b) => {
      if (a.distance == null && b.distance == null) return a.name.localeCompare(b.name);
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    });

  const pick = async (s: WatchLocation) => {
    setSubmitting(true);
    try {
      await onConfirm({ watch_location_id: s.id, bar_name: s.name });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const pickNone = async () => {
    setSubmitting(true);
    try {
      await onConfirm({ watch_location_id: null, bar_name: "Watching from home" });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0 bg-[#FAF5E9] border-t border-black/10">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-black/5">
          <SheetTitle className="font-['Playfair_Display'] text-2xl text-[#1A1A1A] text-left">
            Where are you watching?
          </SheetTitle>
          <p className="text-sm text-[#1A1A1A]/60 text-left font-['Inter']">
            Pick a watch party near you. Closest first.
          </p>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/40 mt-1" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search bars by name…"
              className="pl-9 bg-white border-black/10 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 rounded-full h-11"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 mt-1 text-[#1A1A1A]/40 hover:text-[#1A1A1A]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-[#1A1A1A]/60 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Finding spots…
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="font-['Playfair_Display'] italic text-lg text-[#1A1A1A]">
                No watch spots listed near you yet.
              </p>
              <p className="text-sm text-[#1A1A1A]/60 font-['Inter']">
                RSVP as watching anyway and we'll mark you as joining the broadcast.
              </p>
              <Button
                onClick={pickNone}
                disabled={submitting}
                className="bg-[#E8185A] hover:bg-[#E8185A]/90 text-white rounded-full h-11 px-6"
              >
                {submitting ? "Saving…" : "Watch from home"}
              </Button>
            </div>
          ) : (
            <ul className="space-y-2 pb-6">
              {sorted.map((s) => (
                <li key={s.id}>
                  <button
                    disabled={submitting}
                    onClick={() => pick(s)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white hover:bg-[#00B8A9]/10 border border-black/5 transition-colors text-left disabled:opacity-50"
                  >
                    {s.image_url ? (
                      <img
                        src={s.image_url}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl flex-shrink-0 bg-gradient-to-br from-[#00B8A9] to-[#E8185A]/70 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-['Inter'] font-semibold text-[#1A1A1A] truncate">
                        {s.name}
                      </div>
                      <div className="text-xs text-[#1A1A1A]/60 truncate">
                        {[s.neighborhood, s.city].filter(Boolean).join(" · ")}
                      </div>
                      {s.vibe_tags?.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {s.vibe_tags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="text-[10px] uppercase tracking-wider text-[#00B8A9] font-semibold"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {s.distance != null && (
                      <span className="text-xs font-mono text-[#1A1A1A]/50 flex-shrink-0">
                        {formatMiles(s.distance)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
