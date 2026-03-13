import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, HeartOff, Trophy } from "lucide-react";
import { LA_PRO_TEAMS, LA_D1_COLLEGES } from "@/lib/laTeamsConfig";

interface TeamItem {
  key: string;
  name: string;
  shortName: string;
  league: string;
  sport: string;
  emoji: string;
}

const SPORT_EMOJIS: Record<string, string> = {
  Basketball: "🏀",
  Football: "🏈",
  Baseball: "⚾",
  Hockey: "🏒",
  Soccer: "⚽",
};

const ALL_TEAMS: TeamItem[] = [
  ...LA_PRO_TEAMS.map((t) => ({
    key: t.shortName.toLowerCase().replace(/\s/g, "-"),
    name: t.name,
    shortName: t.shortName,
    league: t.league,
    sport: t.sport,
    emoji: SPORT_EMOJIS[t.sport] || "🏅",
  })),
  ...LA_D1_COLLEGES.map((t) => ({
    key: t.shortName.toLowerCase().replace(/\s/g, "-"),
    name: t.name,
    shortName: t.shortName,
    league: t.conference,
    sport: "College",
    emoji: "🎓",
  })),
];

const LEAGUE_FILTERS = ["All", "WNBA", "NWSL", "NBA", "NFL", "MLB", "NHL", "MLS", "College"];

const TeamFollowSection = () => {
  const { user } = useAuth();
  const [followedTeams, setFollowedTeams] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("team_follows")
      .select("team_key")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setFollowedTeams(new Set(data.map((d) => d.team_key)));
        setLoading(false);
      });
  }, [user?.id]);

  const toggleFollow = async (teamKey: string) => {
    if (!user) return;
    const newSet = new Set(followedTeams);
    if (newSet.has(teamKey)) {
      newSet.delete(teamKey);
      await supabase.from("team_follows").delete().eq("user_id", user.id).eq("team_key", teamKey);
    } else {
      newSet.add(teamKey);
      await supabase.from("team_follows").insert({ user_id: user.id, team_key: teamKey });
    }
    setFollowedTeams(newSet);
  };

  const filtered = filter === "All"
    ? ALL_TEAMS
    : filter === "College"
      ? ALL_TEAMS.filter((t) => t.sport === "College")
      : ALL_TEAMS.filter((t) => t.league === filter);

  // Show followed teams first
  const sorted = [...filtered].sort((a, b) => {
    const aFollowed = followedTeams.has(a.key) ? 0 : 1;
    const bFollowed = followedTeams.has(b.key) ? 0 : 1;
    return aFollowed - bFollowed;
  });

  return (
    <section className="mb-8">
      <h2 className="font-display text-lg font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-warning" /> Teams
      </h2>

      {/* League filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
        {LEAGUE_FILTERS.map((l) => (
          <button
            key={l}
            onClick={() => setFilter(l)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === l
                ? "bg-primary text-primary-foreground"
                : "border border-foreground/20 text-foreground hover:bg-secondary"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {sorted.map((team) => {
          const isFollowed = followedTeams.has(team.key);
          return (
            <Card
              key={team.key}
              className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                isFollowed ? "border-primary/30 bg-primary/5" : ""
              }`}
              onClick={() => toggleFollow(team.key)}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{team.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{team.shortName}</p>
                  <p className="text-[10px] text-muted-foreground">{team.league}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 shrink-0 ${isFollowed ? "text-accent" : "text-muted-foreground"}`}
                  onClick={(e) => { e.stopPropagation(); toggleFollow(team.key); }}
                >
                  {isFollowed ? <Heart className="w-4 h-4 fill-current" /> : <Heart className="w-4 h-4" />}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {followedTeams.size > 0 && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Following {followedTeams.size} team{followedTeams.size > 1 ? "s" : ""} · Your event feed will prioritize these teams
        </p>
      )}
    </section>
  );
};

export default TeamFollowSection;
