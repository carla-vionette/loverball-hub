import TodaysHighlightCard from "./TodaysHighlightCard";
import LiveScoreBanner from "./LiveScoreBanner";
import HorizontalShelf from "./HorizontalShelf";
import MySportsFeed from "@/components/MySportsFeed";
import PointsStreakCard from "@/components/PointsStreakCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Trophy, Calendar } from "lucide-react";

interface ProfileFeedTabProps {
  profile: {
    favorite_sports: string[] | null;
    favorite_teams_players: string[] | null;
    favorite_la_teams?: string[] | null;
    city: string | null;
  };
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

const UPCOMING_GAMES: UpcomingGame[] = [
  { home: "LA Sparks", away: "Las Vegas Aces", date: "May 17", time: "7:00 PM", channel: "ESPN", channelBg: "bg-red-600", channelText: "text-white", url: "https://plus.espn.com", sport: "WNBA" },
  { home: "Angel City FC", away: "Portland Thorns", date: "Apr 12", time: "5:00 PM", channel: "CBS", channelBg: "bg-blue-700", channelText: "text-white", url: "https://www.paramountplus.com/sports", sport: "NWSL" },
  { home: "NY Liberty", away: "Connecticut Sun", date: "May 20", time: "8:00 PM", channel: "TNT", channelBg: "bg-purple-700", channelText: "text-white", url: "https://www.tntdrama.com/sports", sport: "WNBA" },
  { home: "USWNT", away: "England", date: "Jun 7", time: "12:00 PM", channel: "Peacock", channelBg: "bg-black", channelText: "text-white", url: "https://www.peacocktv.com/sports", sport: "Soccer" },
  { home: "Bay FC", away: "OL Reign", date: "Apr 19", time: "3:30 PM", channel: "Apple TV+", channelBg: "bg-gray-800", channelText: "text-white", url: "https://tv.apple.com/us/mls-season-pass", sport: "NWSL" },
  { home: "Indiana Fever", away: "Chicago Sky", date: "May 24", time: "6:00 PM", channel: "ESPN+", channelBg: "bg-red-600", channelText: "text-white", url: "https://plus.espn.com", sport: "WNBA" },
];

const ProfileFeedTab = ({ profile }: ProfileFeedTabProps) => {
  const userTeams = [
    ...(profile.favorite_teams_players || []),
    ...(profile.favorite_la_teams || []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Live Score Banner */}
      <LiveScoreBanner userTeams={userTeams} />

      {/* Today's Highlight */}
      <TodaysHighlightCard userTeams={userTeams} />

      {/* Points & Streak */}
      <PointsStreakCard />

      {/* Your Teams Shelf */}
      {userTeams.length > 0 && (
        <HorizontalShelf title="Your Teams" emoji="🏟️">
          {userTeams.slice(0, 8).map((team, i) => (
            <Card
              key={i}
              className="min-w-[120px] p-3 flex flex-col items-center gap-2 text-center shrink-0 hover:border-primary/30 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground truncate max-w-[100px]">
                {team}
              </span>
            </Card>
          ))}
        </HorizontalShelf>
      )}

      {/* Where to Watch — Game Schedule */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">📺</span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Where to Watch</h3>
        </div>
        <div className="space-y-2">
          {UPCOMING_GAMES.map((game, i) => (
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

      {/* My Sports Feed */}
      <MySportsFeed
        userSports={profile.favorite_sports || []}
        userTeams={userTeams}
        userCity={profile.city}
      />
    </motion.div>
  );
};

export default ProfileFeedTab;
