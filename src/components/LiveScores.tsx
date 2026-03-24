import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar, Trophy, Clock } from "lucide-react";

/**
 * LiveScores — Shows live/upcoming games for women's leagues.
 *
 * TODO: Real API integration
 * ─────────────────────────
 * When a SportsDataIO (or similar) API key is available, replace the empty
 * states below with live data fetched via a backend edge function
 * (e.g. supabase/functions/sports-data-proxy) to avoid CORS issues.
 *
 * Endpoints to integrate:
 *   WNBA:  https://api.sportsdata.io/v3/wnba/scores/json/GamesByDate/{date}
 *   NWSL:  https://api.sportsdata.io/v3/soccer/scores/json/GamesByDate/nwsl/{date}
 *   NCAAW: https://api.sportsdata.io/v3/cbb/scores/json/GamesByDate/{date} (filter women's)
 */

interface LeagueInfo {
  key: string;
  name: string;
  seasonStatus: string;
  seasonNote: string;
  icon: string;
}

const LEAGUES: LeagueInfo[] = [
  {
    key: "wnba",
    name: "WNBA",
    seasonStatus: "Season starts May 2026",
    seasonNote: "The 2026 WNBA season tips off in May. Check back for live scores, standings, and game schedules.",
    icon: "🏀",
  },
  {
    key: "nwsl",
    name: "NWSL",
    seasonStatus: "Season underway — March 2026",
    seasonNote: "The 2026 NWSL season is in progress. Connect a sports data API to see live scores and results.",
    icon: "⚽",
  },
  {
    key: "ncaaw",
    name: "NCAAW",
    seasonStatus: "March Madness — March 2026",
    seasonNote: "The 2026 NCAA Women's Basketball Tournament is happening now. Connect a sports data API to see live scores.",
    icon: "🏀",
  },
];

const LeagueEmptyState = ({ league }: { league: LeagueInfo }) => (
  <div className="py-8">
    <EmptyState
      icon={league.key === "ncaaw" ? Trophy : league.key === "nwsl" ? Clock : Calendar}
      title={`No live ${league.name} games right now`}
      description={league.seasonNote}
    />
    <div className="flex justify-center mt-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-accent">
        {league.icon} {league.seasonStatus}
      </span>
    </div>
  </div>
);

const LiveScores = () => {
  const [activeLeague, setActiveLeague] = useState("wnba");

  return (
    <Tabs value={activeLeague} onValueChange={setActiveLeague}>
      <TabsList className="w-full">
        {LEAGUES.map((l) => (
          <TabsTrigger key={l.key} value={l.key} className="flex-1 text-xs font-bold uppercase tracking-wider">
            {l.icon} {l.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {LEAGUES.map((league) => (
        <TabsContent key={league.key} value={league.key}>
          <Card className="border-border/30">
            {/* TODO: Replace with real game cards when API is connected */}
            <LeagueEmptyState league={league} />
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default LiveScores;
