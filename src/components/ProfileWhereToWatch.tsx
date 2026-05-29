import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tv, ExternalLink } from "lucide-react";
import { getTeamWatchUrl } from "@/lib/teamLinksMap";
import { getTeamLeague } from "@/lib/teamLeagueMap";

/** Broadcast info for common team channels by league */
const LEAGUE_BROADCASTS: Record<string, string[]> = {
  NBA: ["ESPN", "TNT", "Spectrum SportsNet"],
  MLB: ["Spectrum SportsNet LA", "ESPN", "Apple TV+"],
  NFL: ["CBS", "Fox", "ESPN", "NBC"],
  MLS: ["Apple TV", "Fox Sports", "FS1"],
  NWSL: ["CBS Sports", "Paramount+", "Amazon Prime"],
  NHL: ["ESPN", "TNT", "Bally Sports"],
  WNBA: ["ESPN", "ABC", "ION"],
  NCAA: ["ESPN", "CBS", "Fox Sports"],
  FIFA: ["Fox Sports", "Telemundo"],
  F1: ["ESPN", "F1 TV"],
};

interface ProfileWhereToWatchProps {
  favoriteTeams?: string[];
}

const ProfileWhereToWatch: React.FC<ProfileWhereToWatchProps> = ({ favoriteTeams = [] }) => {
  const teams = Array.from(new Set(favoriteTeams.filter(t => typeof t === "string" && t.trim().length > 0)));

  if (teams.length === 0) {
    return (
      <Card className="p-6 text-center bg-card border-border/30">
        <Tv className="w-8 h-8 text-primary mx-auto mb-3 opacity-60" />
        <p className="text-sm font-semibold text-foreground mb-1">
          No favorite teams yet
        </p>
        <p className="text-xs text-muted-foreground">
          Add favorite teams in your profile to see where to watch them live.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {teams.map((teamName) => {
        const league = getTeamLeague(teamName) || "";
        const channels = (LEAGUE_BROADCASTS[league] || ["Check local listings"]).slice(0, 3);
        const watchUrl = getTeamWatchUrl(teamName);
        return (
          <Card
            key={teamName}
            className="p-4 bg-card border-border/30 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">
                    {teamName}
                  </span>
                  {league && (
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1.5 py-0 rounded-full border-border/30"
                    >
                      {league}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Tv className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  {channels.map((channel) => (
                    <span
                      key={channel}
                      className="inline-flex text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                    >
                      {channel}
                    </span>
                  ))}
                  {watchUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-2 rounded-full gap-1 ml-auto text-[#FF5D2E] hover:text-[#FF5D2E]"
                      onClick={() => window.open(watchUrl, "_blank")}
                    >
                      Schedule <ExternalLink className="w-2.5 h-2.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default ProfileWhereToWatch;
