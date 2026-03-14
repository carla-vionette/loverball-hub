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

export default function EventCheckIn({ eventId, eventDate }: EventCheckInProps) {
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

  const isEventDay = () => {
    const today = new Date().toISOString().split("T")[0];
    return eventDate === today;
  };

  const handleCheckIn = async () => {
    if (!user || checkedIn) return;
    setLoading(true);

    try {
      // Call the secure edge function instead of direct DB writes
      const { data, error } = await supabase.functions.invoke("award-checkin-points", {
        body: { event_id: eventId },
      });

      if (error) throw new Error(error.message || "Check-in failed");

      if (data?.already_checked_in) {
        setCheckedIn(true);
        return;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Handle badge unlock
      if (data?.earned_badge) {
        setEarnedBadge(data.earned_badge);
      }

      setCheckedIn(true);
      toast({
        title: `+${CHECKIN_POINTS} points! 🎉`,
        description: "You've checked in to this event!",
      });
    } catch (err: any) {
      toast({ title: "Check-in failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!user || checking) return null;

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
