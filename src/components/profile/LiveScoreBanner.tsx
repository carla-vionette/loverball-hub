import { Card } from "@/components/ui/card";
import { Radio } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchWnbaGamesByDate, formatSportsDate, hasApiKey } from "@/services/sportsDataApi";
import { useNetworkQuality } from "@/hooks/useNetworkQuality";

const LiveScoreBanner = ({ userTeams }: { userTeams: string[] }) => {
  const { isSlow, saveData } = useNetworkQuality();
  const { data: games } = useQuery({
    queryKey: ["live-scores-banner"],
    queryFn: () => fetchWnbaGamesByDate(formatSportsDate(new Date())),
    enabled: hasApiKey(),
    // Stop background polling on slow/saver networks; user can pull-to-refresh.
    refetchInterval: isSlow || saveData ? false : 60000,
    staleTime: isSlow || saveData ? 5 * 60_000 : 30_000,
    refetchOnWindowFocus: !saveData,
  });

  if (!games || !hasApiKey()) return null;

  const liveGame = games.find(
    (g) =>
      g.Status === "InProgress" &&
      userTeams.some(
        (t) =>
          t.toLowerCase().includes(g.HomeTeam.toLowerCase()) ||
          t.toLowerCase().includes(g.AwayTeam.toLowerCase())
      )
  );

  if (!liveGame) return null;

  return (
    <Card className="relative overflow-hidden border-accent/30 bg-gradient-to-r from-accent/10 to-primary/10">
      <div className="p-4 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <Radio className="w-4 h-4 text-accent" />
        </div>
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-sm text-foreground">{liveGame.AwayTeam}</span>
            <span className="text-lg font-bold tabular-nums text-foreground">
              {liveGame.AwayTeamScore ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">-</span>
            <span className="text-lg font-bold tabular-nums text-foreground">
              {liveGame.HomeTeamScore ?? 0}
            </span>
            <span className="font-semibold text-sm text-foreground">{liveGame.HomeTeam}</span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
            LIVE
          </span>
        </div>
      </div>
    </Card>
  );
};

export default LiveScoreBanner;
