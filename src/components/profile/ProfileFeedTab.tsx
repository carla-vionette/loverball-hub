import TodaysHighlightCard from "./TodaysHighlightCard";
import LiveScoreBanner from "./LiveScoreBanner";
import HorizontalShelf from "./HorizontalShelf";
import MySportsFeed from "@/components/MySportsFeed";
import PointsStreakCard from "@/components/PointsStreakCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Trophy, Calendar } from "lucide-react";
import { useMemo } from "react";
import { LA_PRO_TEAMS, LA_D1_COLLEGES } from "@/lib/laTeamsConfig";

interface ProfileFeedTabProps {
  profile: {
    favorite_sports: string[] | null;
    favorite_teams_players: string[] | null;
    favorite_la_teams?: string[] | null;
    city: string | null;
  };
  followedTeamKeys: string[];
}

interface UpcomingGame {
  home: string;
  away: string;
  date: string;
  time: string;
  channel: string;
  channelBg: string;
  channelText: string;
  url: string;
  sport: string;
}

// Map of team keys to their upcoming game info
const TEAM_GAME_SCHEDULE: Record<string, UpcomingGame> = {
  sparks: { home: "LA Sparks", away: "Las Vegas Aces", date: "May 17", time: "7:00 PM", channel: "ESPN", channelBg: "bg-red-600", channelText: "text-white", url: "https://plus.espn.com", sport: "WNBA" },
  acfc: { home: "Angel City FC", away: "Portland Thorns", date: "Apr 12", time: "5:00 PM", channel: "CBS", channelBg: "bg-blue-700", channelText: "text-white", url: "https://www.paramountplus.com/sports", sport: "NWSL" },
  wave: { home: "San Diego Wave", away: "Houston Dash", date: "Apr 26", time: "4:00 PM", channel: "Paramount+", channelBg: "bg-blue-600", channelText: "text-white", url: "https://www.paramountplus.com/sports", sport: "NWSL" },
  lakers: { home: "Lakers", away: "Golden State Warriors", date: "Apr 15", time: "7:30 PM", channel: "TNT", channelBg: "bg-purple-700", channelText: "text-white", url: "https://www.tntdrama.com/sports", sport: "NBA" },
  clippers: { home: "Clippers", away: "Phoenix Suns", date: "Apr 14", time: "7:00 PM", channel: "ESPN", channelBg: "bg-red-600", channelText: "text-white", url: "https://plus.espn.com", sport: "NBA" },
  rams: { home: "LA Rams", away: "San Francisco 49ers", date: "Sep 14", time: "1:25 PM", channel: "FOX", channelBg: "bg-blue-500", channelText: "text-white", url: "https://www.foxsports.com", sport: "NFL" },
  chargers: { home: "LA Chargers", away: "Kansas City Chiefs", date: "Sep 7", time: "1:05 PM", channel: "CBS", channelBg: "bg-blue-700", channelText: "text-white", url: "https://www.paramountplus.com/sports", sport: "NFL" },
  dodgers: { home: "Dodgers", away: "San Diego Padres", date: "Apr 10", time: "7:10 PM", channel: "ESPN", channelBg: "bg-red-600", channelText: "text-white", url: "https://plus.espn.com", sport: "MLB" },
  angels: { home: "Angels", away: "Texas Rangers", date: "Apr 11", time: "6:38 PM", channel: "Apple TV+", channelBg: "bg-white", channelText: "text-[#1A1A1A]", url: "https://tv.apple.com", sport: "MLB" },
  kings: { home: "LA Kings", away: "Vegas Golden Knights", date: "Apr 17", time: "7:30 PM", channel: "ESPN+", channelBg: "bg-red-600", channelText: "text-white", url: "https://plus.espn.com", sport: "NHL" },
  ducks: { home: "Anaheim Ducks", away: "San Jose Sharks", date: "Apr 18", time: "7:00 PM", channel: "ESPN+", channelBg: "bg-red-600", channelText: "text-white", url: "https://plus.espn.com", sport: "NHL" },
  galaxy: { home: "LA Galaxy", away: "Austin FC", date: "Apr 19", time: "7:30 PM", channel: "Apple TV+", channelBg: "bg-white", channelText: "text-[#1A1A1A]", url: "https://tv.apple.com/us/mls-season-pass", sport: "MLS" },
  lafc: { home: "LAFC", away: "Portland Timbers", date: "Apr 20", time: "7:30 PM", channel: "Apple TV+", channelBg: "bg-white", channelText: "text-[#1A1A1A]", url: "https://tv.apple.com/us/mls-season-pass", sport: "MLS" },
  ucla: { home: "UCLA", away: "Oregon", date: "Nov 8", time: "12:30 PM", channel: "FOX", channelBg: "bg-blue-500", channelText: "text-white", url: "https://www.foxsports.com", sport: "NCAAF" },
  usc: { home: "USC", away: "Notre Dame", date: "Nov 29", time: "4:00 PM", channel: "NBC", channelBg: "bg-blue-800", channelText: "text-white", url: "https://www.peacocktv.com/sports", sport: "NCAAF" },
  pepperdine: { home: "Pepperdine", away: "Gonzaga", date: "Feb 1", time: "5:00 PM", channel: "ESPN+", channelBg: "bg-red-600", channelText: "text-white", url: "https://plus.espn.com", sport: "NCAAB" },
  lmu: { home: "LMU", away: "San Francisco", date: "Feb 8", time: "7:00 PM", channel: "ESPN+", channelBg: "bg-red-600", channelText: "text-white", url: "https://plus.espn.com", sport: "NCAAB" },
  csuf: { home: "CSUF", away: "UC Davis", date: "Feb 15", time: "5:00 PM", channel: "ESPN+", channelBg: "bg-red-600", channelText: "text-white", url: "https://plus.espn.com", sport: "NCAAB" },
  csun: { home: "CSUN", away: "UC Santa Barbara", date: "Feb 22", time: "4:00 PM", channel: "ESPN+", channelBg: "bg-red-600", channelText: "text-white", url: "https://plus.espn.com", sport: "NCAAB" },
  lbsu: { home: "LBSU", away: "Hawaii", date: "Mar 1", time: "7:00 PM", channel: "ESPN+", channelBg: "bg-red-600", channelText: "text-white", url: "https://plus.espn.com", sport: "NCAAB" },
  uci: { home: "UCI", away: "Cal Poly", date: "Feb 8", time: "5:00 PM", channel: "ESPN+", channelBg: "bg-red-600", channelText: "text-white", url: "https://plus.espn.com", sport: "NCAAB" },
};

// Default fallback games if user has no teams
const FALLBACK_GAMES: UpcomingGame[] = [
  TEAM_GAME_SCHEDULE.sparks,
  TEAM_GAME_SCHEDULE.acfc,
  TEAM_GAME_SCHEDULE.lakers,
  TEAM_GAME_SCHEDULE.dodgers,
  TEAM_GAME_SCHEDULE.lafc,
];

// Build a lookup from team key to display info
const ALL_TEAMS_MAP = new Map<string, { name: string; shortName: string; league: string; emoji: string }>();
const SPORT_EMOJIS: Record<string, string> = {
  Basketball: "🏀", Football: "🏈", Baseball: "⚾", Hockey: "🏒", Soccer: "⚽", College: "🎓",
};
LA_PRO_TEAMS.forEach((t) => {
  const key = t.shortName.toLowerCase().replace(/\s/g, "-");
  ALL_TEAMS_MAP.set(key, { name: t.name, shortName: t.shortName, league: t.league, emoji: SPORT_EMOJIS[t.sport] || "🏅" });
});
LA_D1_COLLEGES.forEach((t) => {
  const key = t.shortName.toLowerCase().replace(/\s/g, "-");
  ALL_TEAMS_MAP.set(key, { name: t.name, shortName: t.shortName, league: t.conference, emoji: "🎓" });
});

const ProfileFeedTab = ({ profile, followedTeamKeys }: ProfileFeedTabProps) => {
  // Merge DB team follows with profile arrays for display names used by news feed
  const resolvedTeamNames = useMemo(() => {
    const names = new Set<string>();
    // From DB team_follows
    for (const key of followedTeamKeys) {
      const info = ALL_TEAMS_MAP.get(key);
      if (info) {
        names.add(info.shortName);
        names.add(info.name);
      } else {
        names.add(key);
      }
    }
    // Also include profile arrays as fallback
    for (const t of profile.favorite_teams_players || []) names.add(t);
    for (const t of profile.favorite_la_teams || []) names.add(t);
    return Array.from(names);
  }, [followedTeamKeys, profile.favorite_teams_players, profile.favorite_la_teams]);

  // Build team display list from DB follows
  const teamDisplayList = useMemo(() => {
    return followedTeamKeys
      .map((key) => {
        const info = ALL_TEAMS_MAP.get(key);
        return info ? { key, ...info } : { key, name: key, shortName: key, league: "", emoji: "🏅" };
      });
  }, [followedTeamKeys]);

  // Build personalized game schedule from followed teams
  const personalizedGames = useMemo(() => {
    if (followedTeamKeys.length === 0) return FALLBACK_GAMES;
    const games: UpcomingGame[] = [];
    for (const key of followedTeamKeys) {
      const game = TEAM_GAME_SCHEDULE[key];
      if (game) games.push(game);
    }
    return games.length > 0 ? games : FALLBACK_GAMES;
  }, [followedTeamKeys]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Live Score Banner */}
      <LiveScoreBanner userTeams={resolvedTeamNames} />

      {/* Today's Highlight */}
      <TodaysHighlightCard userTeams={resolvedTeamNames} />

      {/* Points & Streak */}
      <PointsStreakCard />

      {/* Your Teams Shelf — from DB */}
      {teamDisplayList.length > 0 && (
        <HorizontalShelf title="Your Teams" emoji="🏟️">
          {teamDisplayList.slice(0, 8).map((team) => (
            <Card
              key={team.key}
              className="min-w-[120px] p-3 flex flex-col items-center gap-2 text-center shrink-0 hover:border-primary/30 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                {team.emoji}
              </div>
              <span className="text-xs font-semibold text-foreground truncate max-w-[100px]">
                {team.shortName}
              </span>
              <span className="text-[10px] text-muted-foreground">{team.league}</span>
            </Card>
          ))}
        </HorizontalShelf>
      )}

      {/* Where to Watch — Personalized Game Schedule */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">📺</span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Where to Watch</h3>
          {followedTeamKeys.length > 0 && (
            <span className="text-[10px] text-muted-foreground ml-auto">Based on your teams</span>
          )}
        </div>
        <div className="space-y-2">
          {personalizedGames.map((game, i) => (
            <a
              key={i}
              href={game.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card hover:bg-muted/50 hover:scale-[1.01] transition-all duration-200 cursor-pointer"
            >
              {/* Matchup */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {game.away} <span className="text-muted-foreground font-normal">vs</span> {game.home}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary">
                    {game.sport}
                  </Badge>
                </div>
              </div>

              {/* Date/Time */}
              <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                <Calendar className="w-3 h-3" />
                <span className="text-[11px] whitespace-nowrap">{game.date} · {game.time}</span>
              </div>

              {/* Channel Badge */}
              <span className={`${game.channelBg} ${game.channelText} text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 uppercase tracking-wide`}>
                {game.channel}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* My Sports Feed — personalized with DB teams */}
      <MySportsFeed
        userSports={profile.favorite_sports || []}
        userTeams={resolvedTeamNames}
        userCity={profile.city}
      />
    </motion.div>
  );
};

export default ProfileFeedTab;
