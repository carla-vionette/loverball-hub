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

  // No API key — show "coming soon" instead of fake data
  if (!apiAvailable) {
    return (
      <Card className="p-8 text-center bg-card border-border/30">
        <Radio className="w-8 h-8 text-primary mx-auto mb-3 opacity-60" />
        <p className="text-sm font-semibold text-foreground mb-1">Live scores coming soon</p>
        <p className="text-xs text-muted-foreground">Real-time WNBA &amp; NWSL scores will appear here during the season.</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4"><Skeleton className="h-24 w-full" /></Card>
        ))}
      </div>
    );
  }

  if (error || !games?.length) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground">No games scheduled today. Check back during game days!</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {games.map((game) => (
        <GameCard key={game.GameID} game={game} />
      ))}
    </div>
  );
};

export default LiveScores;
