import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Users, Hand } from "lucide-react";
import FollowButton from "@/components/FollowButton";

interface AttendeeWithProfile {
  user_id: string;
  going_solo: boolean;
  profile: {
    id: string;
    name: string;
    profile_photo_url: string | null;
    city: string | null;
  };
  mutualEventCount: number;
}

interface Props {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AttendeeListModal = ({ eventId, open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const [attendees, setAttendees] = useState<AttendeeWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) fetchAttendees();
  }, [open, eventId]);

  const fetchAttendees = async () => {
    setLoading(true);

    const { data: guests } = await supabase
      .from("event_guests")
      .select(`
        user_id,
        going_solo,
        profile:profiles!inner (
          id,
          name,
          profile_photo_url,
          city
        )
      `)
      .eq("event_id", eventId)
      .eq("status", "going");

    if (!guests || guests.length === 0) {
      setAttendees([]);
      setLoading(false);
      return;
    }

    // Calculate mutual events if user is logged in
    let mutualMap = new Map<string, number>();
    if (user) {
      const { data: myEvents } = await supabase
        .from("event_guests")
        .select("event_id")
        .eq("user_id", user.id)
        .eq("status", "going");

      if (myEvents && myEvents.length > 0) {
        const myEventIds = myEvents.map((e) => e.event_id);
        const otherIds = (guests as any[]).map((g) => g.user_id).filter((id: string) => id !== user.id);

        if (otherIds.length > 0) {
          const { data: coAttendance } = await supabase
            .from("event_guests")
            .select("user_id, event_id")
            .in("event_id", myEventIds)
            .in("user_id", otherIds)
            .eq("status", "going");

          (coAttendance || []).forEach((a) => {
            mutualMap.set(a.user_id, (mutualMap.get(a.user_id) || 0) + 1);
          });
        }
      }
    }

    const result: AttendeeWithProfile[] = (guests as any[]).map((g) => ({
      user_id: g.user_id,
      going_solo: g.going_solo || false,
      profile: {
        id: g.profile.id,
        name: g.profile.name,
        profile_photo_url: g.profile.profile_photo_url,
        city: g.profile.city,
      },
      mutualEventCount: mutualMap.get(g.user_id) || 0,
    }));

    // Sort: solo first, then by mutual events
    result.sort((a, b) => {
      if (a.going_solo !== b.going_solo) return a.going_solo ? -1 : 1;
      return b.mutualEventCount - a.mutualEventCount;
    });

    setAttendees(result);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Attendees ({attendees.length})
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : attendees.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No attendees yet.</p>
        ) : (
          <div className="space-y-1">
            {attendees.map((a) => (
              <div
                key={a.user_id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="relative">
                  <Avatar className="w-12 h-12 border-2 border-primary/20">
                    <AvatarImage src={a.profile.profile_photo_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {a.profile.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {a.going_solo && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-warning flex items-center justify-center text-[10px]" title="Going solo 👋">
                      👋
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-foreground truncate">{a.profile.name}</span>
                    {a.going_solo && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-warning/40 text-warning">
                        Solo 👋
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {a.profile.city && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        {a.profile.city}
                      </span>
                    )}
                    {a.mutualEventCount > 0 && (
                      <span className="text-primary">
                        {a.mutualEventCount} mutual event{a.mutualEventCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                <FollowButton targetUserId={a.user_id} size="sm" />
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AttendeeListModal;
