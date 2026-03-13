import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { MapPin, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import BadgeUnlockAnimation from "@/components/BadgeUnlockAnimation";

interface EventCheckInProps {
  eventId: string;
  eventDate: string;
  eventCity?: string | null;
}

const CHECKIN_POINTS = 50;

export default function EventCheckIn({ eventId, eventDate, eventCity }: EventCheckInProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [earnedBadge, setEarnedBadge] = useState<{ type: string; emoji: string; label: string } | null>(null);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    supabase
      .from("check_ins")
      .select("id")
      .eq("user_id", user.id)
      .eq("event_id", eventId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setCheckedIn(true);
        setChecking(false);
      });
  }, [user, eventId]);

  // Check if event is today (allow check-in on event day only)
  const isEventDay = () => {
    const today = new Date().toISOString().split("T")[0];
    return eventDate === today;
  };

  const handleCheckIn = async () => {
    if (!user || checkedIn) return;
    setLoading(true);

    try {
      // 1. Insert check-in
      const { error: checkInError } = await supabase
        .from("check_ins")
        .insert({ user_id: user.id, event_id: eventId });
      if (checkInError) throw checkInError;

      // 2. Award points
      await supabase
        .from("point_transactions")
        .insert({
          user_id: user.id,
          points: CHECKIN_POINTS,
          reason: "Event check-in",
          event_id: eventId,
        });

      // 3. Update total_points on profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_points")
        .eq("id", user.id)
        .single();
      
      await supabase
        .from("profiles")
        .update({ total_points: (profile?.total_points || 0) + CHECKIN_POINTS })
        .eq("id", user.id);

      // 4. Check for badge awards
      const { data: checkInCount } = await supabase
        .from("check_ins")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      const totalCheckIns = (checkInCount as any)?.length ?? 1;

      // First check-in badge
      if (totalCheckIns <= 1) {
        const { error: badgeErr } = await supabase
          .from("badges")
          .insert({ user_id: user.id, badge_type: "first_checkin" });
        if (!badgeErr) {
          setEarnedBadge({ type: "first_checkin", emoji: "🏟️", label: "First Check-In" });
        }
      }

      // Road tripper badge — check if this is a new city
      if (eventCity) {
        const { data: pastCheckIns } = await supabase
          .from("check_ins")
          .select("event_id")
          .eq("user_id", user.id)
          .neq("event_id", eventId);

        if (pastCheckIns && pastCheckIns.length > 0) {
          const pastEventIds = pastCheckIns.map((c: any) => c.event_id);
          const { data: pastEvents } = await supabase
            .from("events")
            .select("city")
            .in("id", pastEventIds);
          
          const pastCities = new Set((pastEvents || []).map((e: any) => e.city?.toLowerCase()));
          if (!pastCities.has(eventCity.toLowerCase())) {
            const { error: badgeErr } = await supabase
              .from("badges")
              .insert({ user_id: user.id, badge_type: "road_tripper" });
            if (!badgeErr) {
              setEarnedBadge({ type: "road_tripper", emoji: "✈️", label: "Road Tripper" });
            }
          }
        }
      }

      // Update streak
      await updateStreak(user.id);

      setCheckedIn(true);
      toast({
        title: `+${CHECKIN_POINTS} points! 🎉`,
        description: "You've checked in to this event!",
      });
    } catch (err: any) {
      if (err?.code === "23505") {
        setCheckedIn(true);
      } else {
        toast({ title: "Check-in failed", description: err.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStreak = async (userId: string) => {
    const now = new Date();
    const yearWeek = `${now.getFullYear()}-W${String(getWeekNumber(now)).padStart(2, "0")}`;
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_streak, longest_streak, last_streak_week")
      .eq("id", userId)
      .single();
    
    if (!profile) return;

    const lastWeek = profile.last_streak_week;
    const prevWeekStr = getPrevWeek(yearWeek);

    let newStreak = profile.current_streak || 0;
    if (lastWeek === yearWeek) {
      // Already counted this week
      return;
    } else if (lastWeek === prevWeekStr) {
      // Consecutive week
      newStreak += 1;
    } else {
      // Streak broken or first week
      newStreak = 1;
    }

    await supabase
      .from("profiles")
      .update({
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, profile.longest_streak || 0),
        last_streak_week: yearWeek,
      })
      .eq("id", userId);
  };

  if (!user || checking) return null;

  // Show check-in only if user has RSVP'd going and it's event day
  const canCheckIn = isEventDay();

  if (checkedIn) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 bg-success/10 text-success rounded-full px-4 py-2 text-sm font-semibold"
      >
        <Check className="w-4 h-4" />
        Checked In · +{CHECKIN_POINTS} pts
      </motion.div>
    );
  }

  if (!canCheckIn) return null;

  return (
    <>
      <AnimatePresence>
        {earnedBadge && (
          <BadgeUnlockAnimation
            emoji={earnedBadge.emoji}
            label={earnedBadge.label}
            onDone={() => setEarnedBadge(null)}
          />
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Button
          onClick={handleCheckIn}
          disabled={loading}
          className="rounded-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2 shadow-lg"
          size="lg"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
          Check In
        </Button>
      </motion.div>
    </>
  );
}

function getWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getPrevWeek(yearWeek: string) {
  const [year, week] = yearWeek.split("-W").map(Number);
  if (week === 1) return `${year - 1}-W52`;
  return `${year}-W${String(week - 1).padStart(2, "0")}`;
}
