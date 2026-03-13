import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Flame, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface PointTransaction {
  id: string;
  points: number;
  reason: string;
  event_id: string | null;
  created_at: string;
  event_title?: string;
}

export default function PointsStreakCard() {
  const { user } = useAuth();
  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [recentActivity, setRecentActivity] = useState<PointTransaction[]>([]);
  const [showActivity, setShowActivity] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Fetch profile stats
    supabase
      .from("profiles")
      .select("total_points, current_streak")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setTotalPoints((data as any).total_points || 0);
          setStreak((data as any).current_streak || 0);
        }
      });

    // Fetch recent point activity
    supabase
      .from("point_transactions")
      .select("id, points, reason, event_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(async ({ data }) => {
        if (!data || data.length === 0) return;
        
        // Enrich with event titles
        const eventIds = data.filter(d => d.event_id).map(d => d.event_id!);
        let eventMap: Record<string, string> = {};
        if (eventIds.length > 0) {
          const { data: events } = await supabase
            .from("events")
            .select("id, title")
            .in("id", eventIds);
          if (events) {
            eventMap = Object.fromEntries(events.map(e => [e.id, e.title]));
          }
        }

        setRecentActivity(
          data.map(d => ({
            ...d,
            event_title: d.event_id ? eventMap[d.event_id] : undefined,
          }))
        );
      });
  }, [user]);

  if (!user) return null;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      {/* Points & Streak Header */}
      <div className="flex items-center gap-4">
        {/* Points */}
        <div className="flex-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
            <Star className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-foreground">{totalPoints.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Points</p>
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${streak > 0 ? "bg-warning/15" : "bg-muted/50"}`}>
            <Flame className={`w-5 h-5 ${streak > 0 ? "text-warning" : "text-muted-foreground"}`} />
          </div>
          <div>
            <p className={`text-2xl font-display font-bold ${streak > 0 ? "text-foreground" : "text-muted-foreground"}`}>{streak}</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {streak === 1 ? "Week" : "Weeks"}
            </p>
          </div>
        </div>
      </div>

      {/* Streak message */}
      {streak > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-foreground/70 bg-warning/10 rounded-full px-3 py-1.5 inline-flex items-center gap-1.5"
        >
          🔥 {streak}-week streak! Keep it going!
        </motion.div>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div>
          <button
            onClick={() => setShowActivity(!showActivity)}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary"
          >
            <TrendingUp className="w-3 h-3" />
            Recent Activity
          </button>

          {showActivity && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mt-2 space-y-1.5"
            >
              {recentActivity.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/20 last:border-0">
                  <span className="text-foreground/70 truncate max-w-[200px]">
                    {tx.event_title ? `${tx.reason} — ${tx.event_title}` : tx.reason}
                  </span>
                  <span className="font-semibold text-accent flex-shrink-0">+{tx.points} pts</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
