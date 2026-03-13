import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Award } from "lucide-react";

const BADGE_CONFIG: Record<string, { label: string; emoji: string; description: string }> = {
  first_game: { label: "First Game", emoji: "🎉", description: "Attended your first event" },
  solo_queen: { label: "Solo Queen", emoji: "👑", description: "Went solo to 3 events" },
  five_peat: { label: "5-Peat", emoji: "🔥", description: "Attended 5 events" },
  social_butterfly: { label: "Social Butterfly", emoji: "🦋", description: "Made 5 friends" },
  watch_party_host: { label: "Party Host", emoji: "📺", description: "Hosted a watch party" },
  early_bird: { label: "Early Bird", emoji: "🐦", description: "RSVP'd first to an event" },
  streak_3: { label: "3-Week Streak", emoji: "⚡", description: "3 events in 3 weeks" },
  mvp: { label: "MVP", emoji: "🏆", description: "Community MVP" },
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

      <div className="grid grid-cols-4 gap-3">
        {allBadges.map(([key, config], i) => {
          const earned = earnedBadges.includes(key);
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center text-center gap-1"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${
                  earned
                    ? "bg-accent/15 shadow-sm"
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
