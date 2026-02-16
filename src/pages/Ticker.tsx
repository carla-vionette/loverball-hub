import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  RefreshCw, Star, Share2, Calendar, Tv, Radio, Filter,
  ChevronRight, Trophy, Clock, AlertCircle
} from "lucide-react";

// Types
interface TeamInfo {
  name: string;
  abbreviation: string;
  score: string;
  logo: string;
  isLA: boolean;
}

interface GameData {
  id: string;
  sport: string;
  sportLabel: string;
  status: "live" | "final" | "scheduled";
  statusDetail: string;
  clock?: string;
  period?: number;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  startTime: string;
  venue?: string;
  broadcast?: string;
}

interface ScoreboardResponse {
  live: GameData[];
  final: GameData[];
  scheduled: GameData[];
  totalGames: number;
  updatedAt: string;
}

const SPORT_TABS = [
  { value: "all", label: "All" },
  { value: "nba", label: "NBA" },
  { value: "nfl", label: "NFL" },
  { value: "mlb", label: "MLB" },
  { value: "nhl", label: "NHL" },
  { value: "mls", label: "MLS" },
  { value: "ncaambb", label: "NCAAM" },
  { value: "ncaawbb", label: "NCAAW" },
];

const SPORT_EMOJI: Record<string, string> = {
  nba: "🏀", wnba: "🏀", nfl: "🏈", mlb: "⚾", nhl: "🏒",
  mls: "⚽", nwsl: "⚽", ncaambb: "🏀", ncaawbb: "🏀", ncaafb: "🏈",
};

// ─── Sub-components ──────────────────────────────────────────

function LivePulse() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
    </span>
  );
}

function TeamRow({ team, isWinner }: { team: TeamInfo; isWinner?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <img
          src={team.logo}
          alt={team.abbreviation}
          className="w-7 h-7 object-contain rounded bg-background/50 p-0.5 shrink-0"
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <span className={`text-sm font-semibold truncate ${team.isLA ? "text-primary" : "text-foreground"} ${isWinner ? "font-bold" : ""}`}>
          {team.abbreviation}
        </span>
      </div>
      <span className={`text-lg font-bold tabular-nums ${isWinner ? "text-foreground" : "text-muted-foreground"}`}>
        {team.score}
      </span>
    </div>
  );
}

function LiveGameCard({ game }: { game: GameData }) {
  const homeScore = parseInt(game.homeTeam.score);
  const awayScore = parseInt(game.awayTeam.score);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="border-destructive/30 bg-gradient-to-br from-card to-destructive/5 min-w-[260px]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LivePulse />
              <Badge variant="destructive" className="text-xs px-2 py-0.5">LIVE</Badge>
              <span className="text-xs text-muted-foreground">{game.sportLabel}</span>
            </div>
            <span className="text-xs font-medium text-destructive">{game.statusDetail}</span>
          </div>
          <div className="space-y-2">
            <TeamRow team={game.awayTeam} isWinner={awayScore > homeScore} />
            <TeamRow team={game.homeTeam} isWinner={homeScore > awayScore} />
          </div>
          {game.broadcast && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
              <Tv className="w-3 h-3" /> {game.broadcast}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function GameCard({ game, variant = "default" }: { game: GameData; variant?: "default" | "compact" }) {
  const isFinal = game.status === "final";
  const homeScore = parseInt(game.homeTeam.score);
  const awayScore = parseInt(game.awayTeam.score);
  const gameTime = new Date(game.startTime);

  if (variant === "compact") {
    return (
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
        <div className="flex items-center gap-3 py-3 px-4 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
          <span className="text-base">{SPORT_EMOJI[game.sport] || "🏆"}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <img src={game.awayTeam.logo} alt="" className="w-5 h-5 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <span className={`text-sm truncate ${game.awayTeam.isLA ? "text-primary font-semibold" : ""}`}>{game.awayTeam.abbreviation}</span>
                <span className="text-sm font-bold tabular-nums">{game.awayTeam.score}</span>
              </div>
              <span className="text-xs text-muted-foreground">vs</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm font-bold tabular-nums">{game.homeTeam.score}</span>
                <span className={`text-sm truncate ${game.homeTeam.isLA ? "text-primary font-semibold" : ""}`}>{game.homeTeam.abbreviation}</span>
                <img src={game.homeTeam.logo} alt="" className="w-5 h-5 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            {isFinal ? (
              <Badge variant="secondary" className="text-xs">Final</Badge>
            ) : (
              <span className="text-xs text-muted-foreground">{gameTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">{SPORT_EMOJI[game.sport] || "🏆"} {game.sportLabel}</Badge>
            {isFinal ? (
              <Badge variant="secondary" className="text-xs">Final</Badge>
            ) : (
              <span className="text-xs text-muted-foreground">
                {gameTime.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" })} PT
              </span>
            )}
          </div>
          <div className="space-y-2">
            <TeamRow team={game.awayTeam} isWinner={isFinal && awayScore > homeScore} />
            <TeamRow team={game.homeTeam} isWinner={isFinal && homeScore > awayScore} />
          </div>
          <div className="flex items-center justify-between pt-1">
            {game.broadcast && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Tv className="w-3 h-3" /> {game.broadcast}
              </div>
            )}
            {game.venue && (
              <span className="text-xs text-muted-foreground truncate ml-auto">{game.venue}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i}><CardContent className="p-4 space-y-3">
            <Skeleton className="h-5 w-20" />
            <div className="space-y-2">
              <div className="flex items-center justify-between"><Skeleton className="h-7 w-32" /><Skeleton className="h-6 w-8" /></div>
              <div className="flex items-center justify-between"><Skeleton className="h-7 w-32" /><Skeleton className="h-6 w-8" /></div>
            </div>
            <Skeleton className="h-4 w-24" />
          </CardContent></Card>
        ))}
      </div>
      <div className="space-y-1">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
      </div>
    </div>
  );
}

function EmptyState({ title, description, icon: Icon }: { title: string; description: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4"><Icon className="w-8 h-8 text-muted-foreground" /></div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────

const Ticker = () => {
  const [data, setData] = useState<ScoreboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSport, setActiveSport] = useState("all");
  const [activeSection, setActiveSection] = useState<"today" | "recent" | "upcoming">("today");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async (dateRange: string) => {
    try {
      const sports = activeSport === "all" ? "all" : activeSport;
      const { data: resp, error: err } = await supabase.functions.invoke("sports-scoreboard", {
        body: { sports, dateRange },
      });
      if (err) throw err;
      if (resp) {
        setData(resp);
        setError(null);
        setLastRefresh(new Date());
      }
    } catch (e) {
      console.error("Scoreboard fetch error:", e);
      setError("Unable to load scores. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeSport]);

  useEffect(() => {
    setIsLoading(true);
    fetchData(activeSection === "today" ? "today" : activeSection === "recent" ? "recent" : "upcoming");
  }, [activeSection, fetchData]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(activeSection === "today" ? "today" : activeSection === "recent" ? "recent" : "upcoming");
    }, 30000);
    return () => clearInterval(interval);
  }, [activeSection, fetchData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData(activeSection === "today" ? "today" : activeSection === "recent" ? "recent" : "upcoming");
  };

  // Filter by sport
  const filterBySport = (games: GameData[]) => {
    if (activeSport === "all") return games;
    return games.filter(g => g.sport === activeSport || g.sportLabel.toLowerCase() === activeSport.toLowerCase());
  };

  const liveGames = filterBySport(data?.live || []);
  const finalGames = filterBySport(data?.final || []);
  const scheduledGames = filterBySport(data?.scheduled || []);

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pb-20 pt-20 md:pt-8 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-sans font-bold text-foreground">LA Sports Scores</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Live scores & schedules for Greater LA teams
              </p>
            </div>
            <div className="flex items-center gap-2">
              {lastRefresh && (
                <span className="text-xs text-muted-foreground hidden sm:block">
                  Updated {lastRefresh.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Sport Tabs */}
          <ScrollArea className="w-full">
            <Tabs value={activeSport} onValueChange={setActiveSport}>
              <TabsList className="inline-flex w-auto">
                {SPORT_TABS.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value} className="text-xs px-3">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Section Tabs */}
          <Tabs value={activeSection} onValueChange={(v) => setActiveSection(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today" className="text-sm">
                <Radio className="w-3.5 h-3.5 mr-1.5" /> Today
              </TabsTrigger>
              <TabsTrigger value="recent" className="text-sm">
                <Trophy className="w-3.5 h-3.5 mr-1.5" /> Recent
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="text-sm">
                <Calendar className="w-3.5 h-3.5 mr-1.5" /> Upcoming
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Error State */}
          {error && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{error}</p>
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={handleRefresh}>Try again</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading */}
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={`${activeSection}-${activeSport}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-8">

                {/* Live Games */}
                {liveGames.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <LivePulse />
                      <h2 className="text-lg font-semibold text-foreground">Live Now</h2>
                      <Badge variant="destructive" className="text-xs">{liveGames.length}</Badge>
                    </div>
                    <ScrollArea className="w-full">
                      <div className="flex gap-4 pb-2">
                        {liveGames.map((g, i) => (
                          <div key={g.id} className="min-w-[260px] max-w-[300px]">
                            <LiveGameCard game={g} />
                          </div>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </section>
                )}

                {/* Scheduled / Today's Games */}
                {activeSection === "today" && scheduledGames.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-muted-foreground" /> Today's Games
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {scheduledGames.map((g, i) => (
                        <motion.div key={g.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                          <GameCard game={g} />
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Final Scores */}
                {finalGames.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-muted-foreground" />
                      {activeSection === "recent" ? "Recent Results" : "Final Scores"}
                    </h2>
                    {activeSection === "recent" ? (
                      <Card>
                        <div className="divide-y divide-border/50">
                          {finalGames.map((g, i) => <GameCard key={g.id} game={g} variant="compact" />)}
                        </div>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {finalGames.map((g, i) => (
                          <motion.div key={g.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <GameCard game={g} />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* Upcoming */}
                {activeSection === "upcoming" && scheduledGames.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-muted-foreground" /> Upcoming Games
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {scheduledGames.map((g, i) => (
                        <motion.div key={g.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                          <GameCard game={g} />
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Empty state */}
                {liveGames.length === 0 && finalGames.length === 0 && scheduledGames.length === 0 && (
                  <EmptyState
                    icon={activeSection === "today" ? Radio : activeSection === "recent" ? Trophy : Calendar}
                    title={activeSection === "today" ? "No games today" : activeSection === "recent" ? "No recent results" : "No upcoming games"}
                    description="Try selecting a different sport or check back later for updates."
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
};

export default Ticker;
