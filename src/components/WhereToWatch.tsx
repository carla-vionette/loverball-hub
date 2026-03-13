import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Tv, ExternalLink, Navigation } from "lucide-react";

interface Venue {
  name: string;
  distance: string;
  address: string;
  hasLoverballMeetup: boolean;
  mapsUrl: string;
}

// Mock nearby venues — in production, this would come from a Places API
const MOCK_VENUES: Venue[] = [
  { name: "The Parlor", distance: "0.3 mi", address: "1510 N Highland Ave", hasLoverballMeetup: true, mapsUrl: "https://maps.google.com" },
  { name: "33 Taps", distance: "0.5 mi", address: "5401 W Pico Blvd", hasLoverballMeetup: false, mapsUrl: "https://maps.google.com" },
  { name: "Backyard Sports Bar", distance: "0.8 mi", address: "2120 Colorado Blvd", hasLoverballMeetup: true, mapsUrl: "https://maps.google.com" },
  { name: "Big Wangs", distance: "1.1 mi", address: "5300 Lankershim Blvd", hasLoverballMeetup: false, mapsUrl: "https://maps.google.com" },
  { name: "Cable's Sports Bar", distance: "1.4 mi", address: "2721 Sunset Blvd", hasLoverballMeetup: false, mapsUrl: "https://maps.google.com" },
];

interface Props {
  eventCity?: string | null;
  eventType?: string | null;
}

const WhereToWatch = ({ eventCity, eventType }: Props) => {
  const [view, setView] = useState<"list" | "map">("list");

  // Only show for watch parties or games
  if (!eventType || !["watch_party", "game"].includes(eventType)) return null;

  return (
    <Card className="mt-6 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Tv className="w-4 h-4 text-primary" />
          Where to Watch
        </CardTitle>
        <div className="flex gap-1 mt-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setView("list")}
          >
            List
          </Button>
          <Button
            variant={view === "map" ? "default" : "outline"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setView("map")}
          >
            Map
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {view === "map" ? (
          <div className="rounded-xl overflow-hidden border border-border bg-muted h-48 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Map view — {eventCity || "Los Angeles"} area</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Showing {MOCK_VENUES.length} venues nearby</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {MOCK_VENUES.map((venue) => (
              <div
                key={venue.name}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:bg-muted/50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Tv className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground truncate">{venue.name}</span>
                    {venue.hasLoverballMeetup && (
                      <Badge className="bg-accent/15 text-accent text-[10px] border-0 shrink-0">
                        Loverball meetup 💕
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Navigation className="w-3 h-3" />
                    <span>{venue.distance}</span>
                    <span>·</span>
                    <span className="truncate">{venue.address}</span>
                  </div>
                </div>
                <a
                  href={venue.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhereToWatch;
