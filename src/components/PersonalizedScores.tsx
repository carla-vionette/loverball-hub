import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Clock, Radio, RefreshCw, ChevronRight } from "lucide-react";
import { TEAM_PERFORMANCE } from "@/lib/mockStatsData";
import { motion } from "framer-motion";

interface GameScore {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "live" | "final" | "upcoming";
  gameTime: string;
  league: string;
  channel: string | null;
  quarter?: string | null;
}

interface PersonalizedScoresProps {
  userTeams: string[];
  userSports: string[];
}

const STATUS_CONFIG: Record<string, { label: string; dotClass: string; textClass: string }> = {
  live: { label: "LIVE", dotClass: "bg-red-500 animate-pulse", textClass: "text-red-500 font-bold" },
  final: { label: "Final", dotClass: "bg-muted-foreground", textClass: "text-muted-foreground" },
  upcoming: { label: "Upcoming", dotClass: "bg-primary", textClass: "text-primary" },
};

function generatePersonalizedScores(userTeams: string[]): GameScore[] {
  const games: GameScore[] = [];
  const teamData = TEAM_PERFORMANCE;

  for (const team of teamData) {
    if (team.nextGame === "Offseason" || team.nextGame.startsWith("Season")) continue;

    const isLive = Math.random() > 0.7;
    const isFinal = !isLive && Math.random() > 0.5;
    const status: GameScore["status"] = isLive ? "live" : isFinal ? "final" : "upcoming";

    const opponent = team.nextGame.replace(/^[@vs]+ /, "").split(" · ")[0].trim();
    const isAway = team.nextGame.startsWith("@");

    const channels = ["ESPN", "TNT", "CBS Sports", "Amazon Prime", "Paramount+", "Apple TV+", "NBC Sports", "FS1"];
    const channel = channels[Math.floor(Math.random() * channels.length)];

    const homeTeam = isAway ? opponent : team.name;
    const awayTeam = isAway ? team.name : opponent;

    games.push({
      id: `${team.slug}-${Date.now()}`,
      homeTeam,
      awayTeam,
      homeScore: status === "upcoming" ? null : Math.floor(Math.random() * 40) + 70,
      awayScore: status === "upcoming" ? null : Math.floor(Math.random() * 40) + 70,
      status,
      gameTime: team.nextGame.split(" · ")[1] || "Today 7:00 PM",
      league: team.league,
      channel,
      quarter: isLive ? `Q${Math.floor(Math.random() * 4) + 1} ${Math.floor(Math.random() * 12)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}` : null,
    });
  }

  return games.sort((a, b) => {
    const order = { live: 0, final: 1, upcoming: 2 };
    return order[a.status] - order[b.status];
  });
}

const ScoreCard = ({ game }: { game: GameScore }) => {
  const config = STATUS_CONFIG[game.status];
  const homeWinning = (game.homeScore ?? 0) > (game.awayScore ?? 0);
  const awayWinning = (game.awayScore ?? 0) > (game.homeScore ?? 0);

  return (
    <Card className="p-4 bg-card border-border/30 hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-full border-border/30">
          {game.league}
        </Badge>
        <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${config.textClass}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
          {game.status === "live" && game.quarter ? game.quarter : config.label}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className={`text-sm ${awayWinning && game.status !== "upcoming" ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
            {game.awayTeam}
          </span>
          <span className={`text-lg tabular-nums ${awayWinning && game.status === "final" ? "font-bold text-primary" : "font-bold text-foreground"}`}>
            {game.awayScore ?? "-"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-sm ${homeWinning && game.status !== "upcoming" ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
            {game.homeTeam}
          </span>
          <span className={`text-lg tabular-nums ${homeWinning && game.status === "final" ? "font-bold text-primary" : "font-bold text-foreground"}`}>
            {game.homeScore ?? "-"}
          </span>
        </div>
      </div>

      {(game.channel || game.status === "upcoming") && (
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/20">
          {game.channel && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Radio className="w-3 h-3" /> {game.channel}
            </span>
          )}
          {game.status === "upcoming" && (
            <span className="text-[10px] text-primary font-medium">{game.gameTime}</span>
          )}
        </div>
      )}
    </Card>
  );
};

const PersonalizedScores: React.FC<PersonalizedScoresProps> = ({ userTeams, userSports }) => {
  const [games, setGames] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const loadScores = useCallback(() => {
    setLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      const scores = generatePersonalizedScores(userTeams);
      setGames(scores);
      setLoading(false);
    }, 800);
  }, [userTeams]);

  useEffect(() => {
    loadScores();
    const interval = setInterval(loadScores, 60_000);
    return () => clearInterval(interval);
  }, [loadScores]);

  const visibleGames = showAll ? games : games.slice(0, 4);

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#FF5D2E]" />
            <span className="text-sm font-medium tracking-wider uppercase text-foreground/50">
              Recent & Live Scores
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={loading}
            onClick={loadScores}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Scores for your favorite teams</p>
      </div>

      {loading ? (
        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="px-5 pb-8 text-center">
          <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">No recent games for your teams right now.</p>
          <p className="text-xs text-muted-foreground mt-1">Check back during game days!</p>
        </div>
      ) : (
        <>
          <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visibleGames.map((game, i) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ScoreCard game={game} />
              </motion.div>
            ))}
          </div>
          {games.length > 4 && (
            <div className="px-5 pb-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary gap-1"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Show less" : `Show all ${games.length} games`}
                <ChevronRight className={`w-3 h-3 transition-transform ${showAll ? "rotate-90" : ""}`} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PersonalizedScores;
