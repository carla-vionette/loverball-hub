import React from "react";
import { useProfileScores, type GameScore } from "@/hooks/useProfileScores";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, Radio, RefreshCw } from "lucide-react";

const STATUS_CONFIG: Record<
  GameScore["status"],
  { label: string; icon: typeof Trophy; className: string }
> = {
  live: { label: "LIVE", icon: Radio, className: "text-[#FF5D2E] animate-pulse" },
  final: { label: "Final", icon: Trophy, className: "text-muted-foreground" },
  upcoming: { label: "Upcoming", icon: Clock, className: "text-primary" },
};

const ScoreCard = ({ game }: { game: GameScore }) => {
  const config = STATUS_CONFIG[game.status];
  const StatusIcon = config.icon;

  return (
    <Card className="p-4 bg-card border-border/30 hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${config.className}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {game.status === "upcoming" ? game.statusDetail : config.label}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm text-foreground truncate mr-2">
            {game.awayTeam}
          </span>
          <span
            className={`text-lg font-bold tabular-nums ${
              game.status === "final" &&
              parseInt(game.awayScore) > parseInt(game.homeScore)
                ? "text-primary"
                : "text-foreground"
            }`}
          >
            {game.awayScore}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm text-foreground truncate mr-2">
            {game.homeTeam}
          </span>
          <span
            className={`text-lg font-bold tabular-nums ${
              game.status === "final" &&
              parseInt(game.homeScore) > parseInt(game.awayScore)
                ? "text-primary"
                : "text-foreground"
            }`}
          >
            {game.homeScore}
          </span>
        </div>
      </div>

      {game.status === "live" && game.statusDetail && (
        <p className="text-[10px] text-[#FF5D2E] font-semibold mt-2 pt-2 border-t border-border/20">
          {game.statusDetail}
        </p>
      )}
    </Card>
  );
};

const ProfileScores: React.FC = () => {
  const { games, loading, error, refetch } = useProfileScores();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-20 mb-3" />
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-5 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (error || games.length === 0) {
    return (
      <Card className="p-6 text-center bg-card border-border/30">
        <Radio className="w-8 h-8 text-primary mx-auto mb-3 opacity-60" />
        <p className="text-sm font-semibold text-foreground mb-1">
          No LA games right now
        </p>
        <p className="text-xs text-muted-foreground">
          Check back during game days for live scores and results.
        </p>
      </Card>
    );
  }

  const liveGames = games.filter((g) => g.status === "live");
  const recentGames = games.filter((g) => g.status === "final");
  const upcomingGames = games.filter((g) => g.status === "upcoming");
  const displayGames = [...liveGames, ...recentGames, ...upcomingGames].slice(0, 6);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {liveGames.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#FF5D2E] bg-[#FF5D2E]/10 px-2 py-0.5 rounded-full">
              <Radio className="w-3 h-3 animate-pulse" />
              {liveGames.length} Live
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={refetch}
          disabled={loading}
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayGames.map((game) => (
          <ScoreCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
};

export default ProfileScores;
