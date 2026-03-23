import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tv, ExternalLink, Calendar } from "lucide-react";
import { TEAM_PERFORMANCE } from "@/lib/mockStatsData";
import { getTeamWatchUrl } from "@/lib/teamLinksMap";

interface UpcomingGame {
  team: string;
  opponent: string;
  date: string;
  league: string;
  channels: string[];
  watchUrl: string;
  logo: string;
}

/** Broadcast info for common LA-team channels */
const LEAGUE_BROADCASTS: Record<string, string[]> = {
  NBA: ["ESPN", "TNT", "Spectrum SportsNet"],
  MLB: ["Spectrum SportsNet LA", "ESPN", "Apple TV+"],
  NFL: ["CBS", "Fox", "ESPN", "NBC"],
  MLS: ["Apple TV", "Fox Sports", "FS1"],
  NWSL: ["CBS Sports", "Paramount+", "Amazon Prime"],
  NHL: ["ESPN", "TNT", "Bally Sports"],
  WNBA: ["ESPN", "ABC", "ION"],
};

function getChannelsForLeague(league: string): string[] {
  return LEAGUE_BROADCASTS[league] || ["Check local listings"];
}

function buildUpcomingGames(): UpcomingGame[] {
  const games: UpcomingGame[] = [];

  for (const team of TEAM_PERFORMANCE) {
    if (
      team.nextGame === "Offseason" ||
      team.nextGame.startsWith("Season")
    )
      continue;

    const match = team.nextGame.match(
      /^([@vs]+\.?\s*)(.+?)\s*·\s*(.+)$/
    );
    const opponent = match ? match[2].trim() : team.nextGame;
    const date = match ? match[3].trim() : "";

    const channels = getChannelsForLeague(team.league);

    games.push({
      team: team.name,
      opponent,
      date,
      league: team.league,
      channels: channels.slice(0, 3),
      watchUrl: team.watchUrl || getTeamWatchUrl(team.name),
      logo: team.logo,
    });
  }

  return games;
}

const ProfileWhereToWatch: React.FC = () => {
  const upcomingGames = buildUpcomingGames();

  if (upcomingGames.length === 0) {
    return (
      <Card className="p-6 text-center bg-card border-border/30">
        <Tv className="w-8 h-8 text-primary mx-auto mb-3 opacity-60" />
        <p className="text-sm font-semibold text-foreground mb-1">
          No upcoming games
        </p>
        <p className="text-xs text-muted-foreground">
          Your favorite teams are in the off-season. Check back when games
          resume!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {upcomingGames.map((game) => (
        <Card
          key={`${game.team}-${game.date}`}
          className="p-4 bg-card border-border/30 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-start gap-3">
            <img
              src={game.logo}
              alt={game.team}
              className="w-10 h-10 object-contain rounded-lg bg-foreground/5 p-0.5 flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-semibold text-foreground">
                  {game.team}
                </span>
                <span className="text-xs text-muted-foreground">vs</span>
                <span className="text-sm font-medium text-foreground">
                  {game.opponent}
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] px-1.5 py-0 rounded-full border-border/30"
                >
                  {game.league}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                <Calendar className="w-3 h-3" />
                <span>{game.date}</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Tv className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                {game.channels.map((channel) => (
                  <span
                    key={channel}
                    className="inline-flex text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                  >
                    {channel}
                  </span>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] px-2 rounded-full gap-1 ml-auto text-[#FF5D2E] hover:text-[#FF5D2E]"
                  onClick={() => window.open(game.watchUrl, "_blank")}
                >
                  Watch <ExternalLink className="w-2.5 h-2.5" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ProfileWhereToWatch;
