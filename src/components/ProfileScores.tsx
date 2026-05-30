import React, { useState, useMemo } from "react";
import { useProfileScores, type GameScore } from "@/hooks/useProfileScores";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Clock, Radio, RefreshCw, Search } from "lucide-react";


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
  const [query, setQuery] = useState("");

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
        placeholder="Search teams or leagues..."
        className="h-9 pl-9 text-sm rounded-full placeholder:text-[#6B6B6B]"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E8E3DC",
          color: "#1A1A1A",
        }}
      />
    </div>
  );


  if (loading) {
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

  if (error || games.length === 0) {
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
              : "Add favorite teams in your profile to see real-time scores here."}
          </p>
        </Card>
      </div>
    );
  }

  const liveGames = games.filter((g) => g.status === "live");
  const recentGames = games.filter((g) => g.status === "final");
  const upcomingGames = games.filter((g) => g.status === "upcoming");
  const ordered = [...liveGames, ...recentGames, ...upcomingGames];
  const q = query.trim().toLowerCase();
  const filtered = q
    ? ordered.filter((g) =>
        `${g.awayTeam} ${g.homeTeam} ${g.sport ?? ""} ${g.statusDetail ?? ""}`
          .toLowerCase()
          .includes(q)
      )
    : ordered;
  const displayGames = filtered.slice(0, 6);

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
      {displayGames.length === 0 ? (
        <Card className="p-4 text-center bg-card border-border/30">
          <p className="text-xs text-muted-foreground">No results for "{query}"</p>
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
