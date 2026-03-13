import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Award } from "lucide-react";

const BADGE_CONFIG: Record<string, { label: string; emoji: string; description: string }> = {
  first_checkin: { label: "First Check-In", emoji: "🏟️", description: "Checked in to your first event" },
  solo_queen: { label: "Solo Queen", emoji: "👑", description: "Attended alone 3 times" },
  streak_3: { label: "3-Game Streak", emoji: "🔥", description: "3 events in 3 weeks" },
  watch_party_host: { label: "Watch Party Host", emoji: "🎉", description: "Hosted a watch party" },
  new_fan: { label: "New Fan", emoji: "⭐", description: "First game of a new sport" },
  road_tripper: { label: "Road Tripper", emoji: "✈️", description: "Attended in a new city" },
};

interface BadgeShelfProps {
  userId?: string;
}

export default function BadgeShelf({ userId }: BadgeShelfProps) {
  const { user } = useAuth();
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (!targetUserId) return;
    supabase
      .from("badges")
      .select("badge_type")
      .eq("user_id", targetUserId)
      .then(({ data }) => {
        if (data) setEarnedBadges(data.map((b: any) => b.badge_type));
      });
  }, [targetUserId]);

  const allBadges = Object.entries(BADGE_CONFIG);

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-4 h-4 text-accent" />
        <h3 className="font-display text-base font-bold">Badges</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {earnedBadges.length}/{allBadges.length}
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {allBadges.map(([key, config], i) => {
          const earned = earnedBadges.includes(key);
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center text-center gap-1.5"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                  earned
                    ? "bg-accent/15 shadow-sm ring-2 ring-accent/20"
                    : "bg-muted/50 opacity-40 grayscale"
                }`}
              >
                {config.emoji}
              </div>
              <span className={`text-[10px] font-medium leading-tight ${earned ? "text-foreground" : "text-muted-foreground"}`}>
                {config.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
