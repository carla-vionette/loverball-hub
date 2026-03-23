import { useQuery } from "@tanstack/react-query";
import { fetchWnbaGamesByDate, formatSportsDate, hasApiKey, type WnbaGame } from "@/services/sportsDataApi";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Clock, Radio } from "lucide-react";

const statusConfig: Record<string, { label: string; icon: typeof Trophy; className: string }> = {
  Final: { label: "Final", icon: Trophy, className: "text-muted-foreground" },
  InProgress: { label: "LIVE", icon: Radio, className: "text-accent animate-pulse" },
  Scheduled: { label: "Upcoming", icon: Clock, className: "text-primary" },
};

const GameCard = ({ game }: { game: WnbaGame }) => {
  const status = statusConfig[game.Status] || statusConfig.Scheduled;
  const StatusIcon = status.icon;
  const gameTime = game.DateTime
    ? new Date(game.DateTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "TBD";

  return (
    <Card className="p-4 bg-card border-border/30 hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {game.GameID <= 3 ? "WNBA" : "NWSL"}
        </span>
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${status.className}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {game.Status === "Scheduled" ? gameTime : status.label}
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm text-foreground">{game.AwayTeam}</span>
          <span className={`text-lg font-bold tabular-nums ${game.Status === "Final" && (game.AwayTeamScore ?? 0) > (game.HomeTeamScore ?? 0) ? "text-primary" : "text-foreground"}`}>
            {game.AwayTeamScore ?? "-"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm text-foreground">{game.HomeTeam}</span>
          <span className={`text-lg font-bold tabular-nums ${game.Status === "Final" && (game.HomeTeamScore ?? 0) > (game.AwayTeamScore ?? 0) ? "text-primary" : "text-foreground"}`}>
            {game.HomeTeamScore ?? "-"}
          </span>
        </div>
      </div>

      {game.Channel && (
        <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/20">{game.Channel}</p>
      )}
    </Card>
  );
};

const LiveScores = () => {
  const today = formatSportsDate();
  const apiAvailable = hasApiKey();

  const { data: games, isLoading, error } = useQuery({
    queryKey: ["wnba-scores", today],
    queryFn: () => fetchWnbaGamesByDate(today),
    refetchInterval: 60_000,
    enabled: apiAvailable,
  });

  const FALLBACK_GAMES: WnbaGame[] = [
    { GameID: 901, Season: 2026, Status: "Final", DateTime: new Date().toISOString(), HomeTeam: "LVA", AwayTeam: "LAS", HomeTeamScore: 92, AwayTeamScore: 84, HomeTeamID: 1, AwayTeamID: 6, Channel: "ESPN", Quarter: null, TimeRemainingMinutes: null, TimeRemainingSeconds: null },
    { GameID: 902, Season: 2026, Status: "InProgress", DateTime: new Date().toISOString(), HomeTeam: "NYL", AwayTeam: "SEA", HomeTeamScore: 56, AwayTeamScore: 61, HomeTeamID: 2, AwayTeamID: 3, Channel: "ESPN2", Quarter: "3rd", TimeRemainingMinutes: 4, TimeRemainingSeconds: 32 },
    { GameID: 903, Season: 2026, Status: "Scheduled", DateTime: new Date(Date.now() + 3 * 3600000).toISOString(), HomeTeam: "MIN", AwayTeam: "CON", HomeTeamScore: null, AwayTeamScore: null, HomeTeamID: 4, AwayTeamID: 5, Channel: "CBS Sports", Quarter: null, TimeRemainingMinutes: null, TimeRemainingSeconds: null },
    { GameID: 904, Season: 2026, Status: "Final", DateTime: new Date().toISOString(), HomeTeam: "CHI", AwayTeam: "PHO", HomeTeamScore: 78, AwayTeamScore: 85, HomeTeamID: 7, AwayTeamID: 8, Channel: "Peacock", Quarter: null, TimeRemainingMinutes: null, TimeRemainingSeconds: null },
  ];

  const displayGames = (games?.length) ? games : FALLBACK_GAMES;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4"><Skeleton className="h-24 w-full" /></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {displayGames.map((game) => (
        <GameCard key={game.GameID} game={game} />
      ))}
    </div>
  );
};

export default LiveScores;
