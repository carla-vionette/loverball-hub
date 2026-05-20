import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * LiveScores — Pulls real scoreboard data for LA teams via the
 * `sports-scoreboard` edge function (ESPN-backed). Shows live, recent
 * (final), and upcoming (scheduled) games. Filtered by league tab.
 */

interface Team {
  name: string;
  abbreviation: string;
  score: string;
  logo: string;
  isLA: boolean;
}

interface Game {
  id: string;
  sport: string;
  sportLabel: string;
  status: "live" | "final" | "scheduled";
  statusDetail: string;
  clock?: string;
  period?: number;
  homeTeam: Team;
  awayTeam: Team;
  startTime: string;
  venue?: string;
  broadcast?: string;
}

interface ScoreboardResponse {
  live: Game[];
  final: Game[];
  scheduled: Game[];
  totalGames: number;
  updatedAt: string;
}

const LEAGUES = [
  { key: "all", label: "All", icon: "🏆" },
  { key: "wnba", label: "WNBA", icon: "🏀" },
  { key: "nwsl", label: "NWSL", icon: "⚽" },
  { key: "ncaawbb", label: "NCAAW", icon: "🏀" },
  { key: "nba", label: "NBA", icon: "🏀" },
  { key: "mlb", label: "MLB", icon: "⚾" },
  { key: "nhl", label: "NHL", icon: "🏒" },
] as const;

async function fetchScoreboard(): Promise<ScoreboardResponse> {
  const { data, error } = await supabase.functions.invoke("sports-scoreboard", {
    body: { sports: "all", dateRange: "today" },
  });
  if (error) throw error;
  return data as ScoreboardResponse;
}

const GameRow = ({ game }: { game: Game }) => {
  const isLive = game.status === "live";
  return (
    <div className="flex items-center gap-3 py-3 px-3 border-b border-border/20 last:border-b-0">
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <img
            src={game.awayTeam.logo}
            alt=""
            className="w-5 h-5 object-contain"
            onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
          />
          <span className={`text-sm truncate ${game.awayTeam.isLA ? "font-bold text-foreground" : "text-foreground/80"}`}>
            {game.awayTeam.name}
          </span>
          <span className="ml-auto text-sm font-bold tabular-nums text-foreground">
            {game.awayTeam.score}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <img
            src={game.homeTeam.logo}
            alt=""
            className="w-5 h-5 object-contain"
            onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
          />
          <span className={`text-sm truncate ${game.homeTeam.isLA ? "font-bold text-foreground" : "text-foreground/80"}`}>
            {game.homeTeam.name}
          </span>
          <span className="ml-auto text-sm font-bold tabular-nums text-foreground">
            {game.homeTeam.score}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0 min-w-[68px]">
        <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-foreground/5 text-muted-foreground">
          {game.sportLabel}
        </span>
        {isLive ? (
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            {game.statusDetail || "Live"}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground">{game.statusDetail}</span>
        )}
      </div>
    </div>
  );
};

const LiveScores = () => {
  const [tab, setTab] = useState<string>("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["sports-scoreboard-today"],
    queryFn: fetchScoreboard,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const allGames = useMemo<Game[]>(() => {
    if (!data) return [];
    return [...(data.live ?? []), ...(data.final ?? []), ...(data.scheduled ?? [])];
  }, [data]);

  const filtered = useMemo(() => {
    const games = tab === "all" ? allGames : allGames.filter((g) => g.sport === tab);
    // Surface live first, then scheduled (soonest), then finals (most recent)
    const liveGames = games.filter((g) => g.status === "live");
    const scheduled = games
      .filter((g) => g.status === "scheduled")
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const finals = games
      .filter((g) => g.status === "final")
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    return [...liveGames, ...scheduled, ...finals];
  }, [allGames, tab]);

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
        {LEAGUES.map((l) => (
          <TabsTrigger
            key={l.key}
            value={l.key}
            className="text-xs font-bold uppercase tracking-wider shrink-0"
          >
            {l.icon} {l.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {LEAGUES.map((league) => (
        <TabsContent key={league.key} value={league.key} className="mt-2">
          <Card className="border-border/30">
            {isLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : isError ? (
              <div className="py-8">
                <EmptyState
                  icon={Calendar}
                  title="Scores unavailable"
                  description="We couldn't reach the scoreboard right now. Pull to refresh in a moment."
                />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  icon={Calendar}
                  title={`No ${league.label === "All" ? "" : league.label + " "}games for LA teams today`}
                  description="Scores will appear here as soon as games are scheduled or in progress."
                />
              </div>
            ) : (
              <div>
                {filtered.map((g) => (
                  <GameRow key={g.id} game={g} />
                ))}
                {data?.updatedAt && (
                  <div className="px-3 py-2 text-[10px] text-muted-foreground flex items-center gap-1.5 border-t border-border/20">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    Updated {new Date(data.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </div>
                )}
              </div>
            )}
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default LiveScores;
