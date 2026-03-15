import { useQuery } from "@tanstack/react-query";
import { fetchWnbaGamesByDate, formatSportsDate, hasApiKey, type WnbaGame } from "@/services/sportsDataApi";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Clock, Radio } from "lucide-react";

// ── Fallback sample games when API key isn't configured ──
const SAMPLE_GAMES: WnbaGame[] = [
  { GameID: 1, Season: 2026, Status: "InProgress", DateTime: new Date().toISOString(), HomeTeam: "LA Sparks", AwayTeam: "NY Liberty", HomeTeamScore: 67, AwayTeamScore: 72, HomeTeamID: 1, AwayTeamID: 2, Channel: "ESPN", Quarter: "Q3", TimeRemainingMinutes: 4, TimeRemainingSeconds: 32 },
  { GameID: 2, Season: 2026, Status: "Final", DateTime: new Date().toISOString(), HomeTeam: "Las Vegas Aces", AwayTeam: "Seattle Storm", HomeTeamScore: 89, AwayTeamScore: 84, HomeTeamID: 3, AwayTeamID: 4, Channel: "ABC", Quarter: null, TimeRemainingMinutes: null, TimeRemainingSeconds: null },
  { GameID: 3, Season: 2026, Status: "Scheduled", DateTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), HomeTeam: "Chicago Sky", AwayTeam: "Phoenix Mercury", HomeTeamScore: null, AwayTeamScore: null, HomeTeamID: 5, AwayTeamID: 6, Channel: "CBS Sports", Quarter: null, TimeRemainingMinutes: null, TimeRemainingSeconds: null },
  { GameID: 4, Season: 2026, Status: "InProgress", DateTime: new Date().toISOString(), HomeTeam: "Angel City FC", AwayTeam: "Portland Thorns", HomeTeamScore: 2, AwayTeamScore: 1, HomeTeamID: 7, AwayTeamID: 8, Channel: "Paramount+", Quarter: "2H", TimeRemainingMinutes: 22, TimeRemainingSeconds: 0 },
];

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

  if (isLoading && apiAvailable) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4"><Skeleton className="h-24 w-full" /></Card>
        ))}
      </div>
    );
  }

  if (error && apiAvailable) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-destructive">Failed to load scores. Please try again later.</p>
      </Card>
    );
  }

  // Use API data if available, otherwise fallback sample data
  const displayGames = (apiAvailable && games?.length) ? games : SAMPLE_GAMES;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {displayGames.map((game) => (
        <GameCard key={game.GameID} game={game} />
      ))}
    </div>
  );
};

export default LiveScores;
