import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Calendar, Heart, Users, Trophy, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}

const StatCard = ({ icon: Icon, label, value, color }: StatCardProps) => (
  <Card className="p-4 flex flex-col items-center gap-2 text-center">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <span className="text-2xl font-display font-bold text-foreground">{value}</span>
    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
  </Card>
);

const ProfileStatsTab = ({ userId }: { userId: string }) => {
  const [stats, setStats] = useState({
    eventsAttended: 0,
    friendsMade: 0,
    contentLiked: 0,
    teamsFollowed: 0,
  });

  useEffect(() => {
    const load = async () => {
      const [rsvps, friends, likes, teams] = await Promise.all([
        supabase
          .from("event_rsvps")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("follows")
          .select("id", { count: "exact", head: true })
          .eq("follower_id", userId),
        supabase
          .from("post_likes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("team_follows")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);

      setStats({
        eventsAttended: rsvps.count ?? 0,
        friendsMade: friends.count ?? 0,
        contentLiked: likes.count ?? 0,
        teamsFollowed: teams.count ?? 0,
      });
    };
    load();
  }, [userId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Calendar}
          label="Events Attended"
          value={stats.eventsAttended}
          color="bg-primary/15 text-primary"
        />
        <StatCard
          icon={Users}
          label="Friends Made"
          value={stats.friendsMade}
          color="bg-accent/15 text-accent"
        />
        <StatCard
          icon={Heart}
          label="Content Liked"
          value={stats.contentLiked}
          color="bg-destructive/15 text-destructive"
        />
        <StatCard
          icon={Trophy}
          label="Teams Followed"
          value={stats.teamsFollowed}
          color="bg-warning/15 text-warning"
        />
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Engagement Level
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  (stats.eventsAttended * 10 +
                    stats.friendsMade * 5 +
                    stats.contentLiked * 2 +
                    stats.teamsFollowed * 8) /
                    2
                )}%`,
              }}
            />
          </div>
          <span className="text-xs font-semibold text-foreground">
            {stats.eventsAttended >= 10
              ? "MVP 🏆"
              : stats.eventsAttended >= 5
                ? "All-Star ⭐"
                : stats.eventsAttended >= 1
                  ? "Rising Fan 🔥"
                  : "New Fan 🌟"}
          </span>
        </div>
      </Card>
    </motion.div>
  );
};

export default ProfileStatsTab;
