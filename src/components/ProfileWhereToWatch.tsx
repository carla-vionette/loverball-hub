import React, { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tv, Search, Calendar, X, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getTeamLeague } from "@/lib/teamLeagueMap";

interface Game {
  id: string;
  league: string;
  sport: string;
  status: "live" | "scheduled" | "final";
  statusDetail: string;
  startTime: string;
  homeTeam: { name: string; abbreviation: string; logo: string };
  awayTeam: { name: string; abbreviation: string; logo: string };
  broadcasts: string[];
  venue?: string;
  matchedTeam?: string;
}

interface WhereToWatchResponse {
  games: Game[];
  totalGames: number;
  updatedAt: string;
  source: string;
}

interface Props {
  favoriteTeams?: string[];
}

function formatGameTime(iso: string): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: "", time: "" };
  const today = new Date();
  const tmw = new Date(today);
  tmw.setDate(tmw.getDate() + 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  let dateLabel = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  if (sameDay(d, today)) dateLabel = "Today";
  else if (sameDay(d, tmw)) dateLabel = "Tomorrow";
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return { date: dateLabel, time };
}

async function fetchWhereToWatch(
  teams: string[],
  query: string,
): Promise<WhereToWatchResponse> {
  const { data, error } = await supabase.functions.invoke("where-to-watch", {
    body: { teams, query, days: 7 },
  });
  if (error) throw error;
  return data as WhereToWatchResponse;
}

const GameCard: React.FC<{ game: Game }> = ({ game }) => {
  const { date, time } = formatGameTime(game.startTime);
  const channels = game.broadcasts.length > 0 ? game.broadcasts.slice(0, 3) : [];
  const isLive = game.status === "live";

  return (
    <Card className="p-4 bg-card border-border/30 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 rounded-full border-border/30"
          >
            {game.league}
          </Badge>
          {isLive && (
            <Badge className="text-[9px] px-1.5 py-0 rounded-full bg-red-500/15 text-red-500 border-0 gap-1">
              <Radio className="w-2.5 h-2.5" /> LIVE
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground truncate">
            {isLive ? game.statusDetail : `${date} · ${time}`}
          </span>
        </div>
      </div>

      <div className="text-sm font-semibold text-foreground mb-2 truncate">
        {game.awayTeam.name} <span className="text-muted-foreground font-normal">@</span> {game.homeTeam.name}
      </div>

      {channels.length > 0 ? (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tv className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          {channels.map((channel) => (
            <span
              key={channel}
              className="inline-flex text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full"
            >
              {channel}
            </span>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Tv className="w-3 h-3" /> Check local listings
        </div>
      )}
    </Card>
  );
};

const ProfileWhereToWatch: React.FC<Props> = ({ favoriteTeams = [] }) => {
  const teams = useMemo(
    () =>
      Array.from(
        new Set(
          (favoriteTeams || [])
            .filter((t) => typeof t === "string" && t.trim().length > 0)
            .map((t) => t.trim()),
        ),
      ),
    [favoriteTeams],
  );

  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const isSearching = debouncedQuery.length > 1;
  const queryTeams = isSearching ? [] : teams;

  const { data, isLoading, isError, refetch } = useQuery<WhereToWatchResponse>({
    queryKey: ["where-to-watch", queryTeams.sort().join(","), debouncedQuery],
    queryFn: () => fetchWhereToWatch(queryTeams, isSearching ? debouncedQuery : ""),
    enabled: isSearching || queryTeams.length > 0,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const games = data?.games || [];

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search any team, league, or game…"
          className="pl-9 pr-9 h-10 rounded-full bg-card border-border/40"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => setSearchInput("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Header context */}
      {!isSearching && teams.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <p className="text-xs text-muted-foreground">
            Your teams' upcoming games · next 7 days
          </p>
        </div>
      )}
      {isSearching && (
        <div className="flex items-center gap-2 px-1">
          <Search className="w-3.5 h-3.5 text-primary" />
          <p className="text-xs text-muted-foreground">
            Results for "{debouncedQuery}"
          </p>
        </div>
      )}

      {/* Empty initial state — no favorite teams and no search */}
      {!isSearching && teams.length === 0 && (
        <Card className="p-6 text-center bg-card border-border/30">
          <Tv className="w-8 h-8 text-primary mx-auto mb-3 opacity-60" />
          <p className="text-sm font-semibold text-foreground mb-1">
            No favorite teams yet
          </p>
          <p className="text-xs text-muted-foreground">
            Add favorite teams in your profile or search any team above to see where to watch.
          </p>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <Card className="p-4 bg-card border-border/30">
          <p className="text-xs text-muted-foreground mb-2">
            Couldn't load broadcast info right now.
          </p>
          <button
            onClick={() => refetch()}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Try again
          </button>
        </Card>
      )}

      {/* Results */}
      {!isLoading && !isError && (isSearching || teams.length > 0) && games.length === 0 && (
        <Card className="p-5 text-center bg-card border-border/30">
          <Tv className="w-7 h-7 text-primary mx-auto mb-2 opacity-60" />
          <p className="text-xs text-muted-foreground">
            {isSearching
              ? "No upcoming games found for that team or league in the next 7 days."
              : "No upcoming games scheduled for your teams in the next 7 days."}
          </p>
        </Card>
      )}

      {!isLoading && games.length > 0 && (
        <div className="space-y-2">
          {games.slice(0, 12).map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      )}

      {/* Last updated */}
      {data?.updatedAt && games.length > 0 && (
        <p className="text-[10px] text-muted-foreground/70 text-right pr-1">
          Updated {new Date(data.updatedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · {data.source}
        </p>
      )}

      {/* Hidden meta — keeps league mapping in scope for tree-shaking */}
      <span className="sr-only">{teams.map((t) => getTeamLeague(t)).join(",")}</span>
    </div>
  );
};

export default ProfileWhereToWatch;
