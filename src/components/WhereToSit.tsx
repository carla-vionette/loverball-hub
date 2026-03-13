import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin } from "lucide-react";

interface Props {
  venueName?: string | null;
  eventType?: string | null;
}

// Simplified seating chart — shows recommended Loverball section
const STADIUM_SECTIONS: Record<string, { section: string; level: string; note: string }> = {
  default: { section: "112", level: "Lower Bowl", note: "Great views, close to the action" },
  "crypto.com arena": { section: "106", level: "Lower Bowl", note: "Near the tunnel, perfect for photos" },
  "sofi stadium": { section: "C228", level: "Mid Level", note: "Best sightlines in the house" },
  "bmo stadium": { section: "134", level: "General", note: "Supporter's side, great energy" },
  "dodger stadium": { section: "42FD", level: "Field Level", note: "Behind home plate vibes" },
  "dignity health sports park": { section: "121", level: "Sideline", note: "Close to the bench" },
};

const WhereToSit = ({ venueName, eventType }: Props) => {
  // Only for stadium/game events
  if (!eventType || eventType !== "game") return null;

  const key = venueName?.toLowerCase() || "default";
  const sectionInfo = STADIUM_SECTIONS[key] || STADIUM_SECTIONS.default;

  return (
    <Card className="mt-6 border-accent/20 bg-accent/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="w-4 h-4 text-accent" />
          Where to Sit
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Simple stadium visualization */}
        <div className="relative rounded-xl border border-border bg-background p-4 mb-4">
          <div className="flex flex-col items-center gap-3">
            {/* Field/Court */}
            <div className="w-full max-w-[200px] h-20 rounded-lg bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
              <span className="text-xs text-primary font-semibold">🏟️ Field / Court</span>
            </div>
            
            {/* Sections */}
            <div className="flex gap-2 w-full justify-center">
              {["108", "110", sectionInfo.section, "114", "116"].map((sec) => (
                <div
                  key={sec}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    sec === sectionInfo.section
                      ? "bg-accent text-accent-foreground ring-2 ring-accent/50 scale-110"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {sec}
                </div>
              ))}
            </div>

            {/* Upper sections */}
            <div className="flex gap-2 w-full justify-center opacity-50">
              {["208", "210", "212", "214", "216"].map((sec) => (
                <div key={sec} className="px-3 py-2 rounded-lg text-xs font-medium bg-muted/50 text-muted-foreground">
                  {sec}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendation card */}
        <div className="rounded-xl bg-accent/10 border border-accent/20 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Loverball fans are in Section {sectionInfo.section}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {sectionInfo.level} · {sectionInfo.note}
              </p>
              <Badge className="mt-2 bg-accent/15 text-accent text-[10px] border-0">
                Recommended section 💕
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhereToSit;
