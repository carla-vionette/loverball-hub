import React, { useEffect, useState } from "react";
import { useProfileScores, useSportsSearch, type GameScore } from "@/hooks/useProfileScores";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Clock, Radio, RefreshCw, Search, Loader2 } from "lucide-react";



const STATUS_CONFIG: Record<
  GameScore["status"],
  { label: string; icon: typeof Trophy; className: string }
> = {
  live: { label: "LIVE", icon: Radio, className: "text-[#E85D2F] animate-pulse" },
  final: { label: "Final", icon: Trophy, className: "text-muted-foreground" },
  upcoming: { label: "Upcoming", icon: Clock, className: "text-primary" },
};

const ScoreCard = ({ game }: { game: GameScore }) => {
  const config = STATUS_CONFIG[game.status];
  const StatusIcon = config.icon;

  const openEspn = () => {
    const query = encodeURIComponent(`${game.awayTeam} vs ${game.homeTeam}`);
    const url = `https://www.espn.com/search/_/q/${query}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Card
      onClick={openEspn}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEspn(); } }}
      className="p-4 bg-card border-border/30 hover:border-primary/30 transition-colors cursor-pointer"
    >
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
        <p className="text-[10px] text-[#E85D2F] font-semibold mt-2 pt-2 border-t border-border/20">
          {game.statusDetail}
        </p>
      )}
    </Card>
  );
};

interface ProfileScoresProps {
  favoriteTeams?: string[];
}

const ProfileScores: React.FC<ProfileScoresProps> = ({ favoriteTeams = [] }) => {
  const { games, loading, error, refetch, hasFavorites } = useProfileScores(favoriteTeams);
  const { results: searchResults, loading: searching, error: searchError, search, clear } = useSportsSearch();
  const [query, setQuery] = useState("");

  // Debounced API search whenever query changes.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { clear(); return; }
    const t = setTimeout(() => { search(q); }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const SearchBar = (
    <div className="relative mb-3">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
        style={{ color: "#6B6B6B" }}
      />
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search any team, city, or league (NBA, MLB, MLS...)"
        className="h-9 pl-9 pr-9 text-sm rounded-full placeholder:text-[#6B6B6B]"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E8E3DC",
          color: "#1A1A1A",
        }}
      />
      {searching && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
      )}
    </div>
  );

  const hasQuery = query.trim().length >= 2;

  // Initial loading state (only when no query is active).
  if (loading && !hasQuery) {
    return (
      <div>
        {SearchBar}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-5 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Source of truth: when the user is searching, use API results; otherwise show feed.
  const sourceGames: GameScore[] = hasQuery ? searchResults : games;
  const liveGames = sourceGames.filter((g) => g.status === "live");
  const recentGames = sourceGames.filter((g) => g.status === "final");
  const upcomingGames = sourceGames.filter((g) => g.status === "upcoming");
  const ordered = [...liveGames, ...recentGames, ...upcomingGames];
  const displayGames = ordered.slice(0, hasQuery ? 12 : 6);

  // Empty / error fallback when no query.
  if (!hasQuery && (error || sourceGames.length === 0)) {
    return (
      <div>
        {SearchBar}
        <Card className="p-6 text-center bg-card border-border/30">
          <Radio className="w-8 h-8 text-primary mx-auto mb-3 opacity-60" />
          <p className="text-sm font-semibold text-foreground mb-1">
            {hasFavorites ? "No games for your favorite teams right now" : "No games right now"}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasFavorites
              ? "We'll show live scores here the moment your teams take the floor."
              : "Search any team, city, or league above to pull live, recent, and upcoming games."}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {SearchBar}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {liveGames.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#E85D2F] bg-[#E85D2F]/10 px-2 py-0.5 rounded-full">
              <Radio className="w-3 h-3 animate-pulse" />
              {liveGames.length} Live
            </span>
          )}
          {hasQuery && !searching && (
            <span className="text-[10px] text-muted-foreground">
              {displayGames.length} result{displayGames.length === 1 ? "" : "s"} for "{query.trim()}"
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={hasQuery ? () => search(query.trim()) : refetch}
          disabled={loading || searching}
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-muted-foreground ${(loading || searching) ? "animate-spin" : ""}`}
          />
        </Button>
      </div>
      {displayGames.length === 0 ? (
        <Card className="p-4 text-center bg-card border-border/30">
          <p className="text-xs text-muted-foreground">
            {searching
              ? `Searching for "${query.trim()}"...`
              : searchError
                ? "Search is temporarily unavailable. Try again in a moment."
                : `No games found for "${query.trim()}". Try a team name, city, or league (NBA, WNBA, MLB, MLS...).`}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayGames.map((game) => (
            <ScoreCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
};



export default ProfileScores;
