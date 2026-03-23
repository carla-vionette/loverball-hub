import TodaysHighlightCard from "./TodaysHighlightCard";
import LiveScoreBanner from "./LiveScoreBanner";
import HorizontalShelf from "./HorizontalShelf";
import MySportsFeed from "@/components/MySportsFeed";
import PointsStreakCard from "@/components/PointsStreakCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Tv, Trophy } from "lucide-react";

interface ProfileFeedTabProps {
  profile: {
    favorite_sports: string[] | null;
    favorite_teams_players: string[] | null;
    favorite_la_teams?: string[] | null;
    city: string | null;
  };
}

const STREAMING_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  espn: { label: "ESPN+", bg: "bg-red-600", text: "text-white" },
  tnt: { label: "TNT", bg: "bg-blue-700", text: "text-white" },
  peacock: { label: "Peacock", bg: "bg-black", text: "text-white" },
  appletv: { label: "Apple TV+", bg: "bg-gray-800", text: "text-white" },
  paramount: { label: "Paramount+", bg: "bg-blue-500", text: "text-white" },
};

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

      {/* Where to Watch Shelf */}
      <HorizontalShelf title="Where to Watch" emoji="📺">
        {Object.entries(STREAMING_BADGES).map(([key, badge]) => (
          <div
            key={key}
            className={`min-w-[100px] shrink-0 rounded-xl ${badge.bg} ${badge.text} p-3 flex flex-col items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity`}
          >
            <Tv className="w-5 h-5" />
            <span className="text-[11px] font-bold">{badge.label}</span>
          </div>
        ))}
      </HorizontalShelf>

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
