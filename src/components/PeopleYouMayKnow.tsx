import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Users, Trophy } from "lucide-react";
import AddFriendButton from "./AddFriendButton";

interface AttendeeProfile {
  id: string;
  name: string;
  profile_photo_url: string | null;
  favorite_la_teams: string[] | null;
  favorite_sports: string[] | null;
}

interface PeopleYouMayKnowProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PeopleYouMayKnow = ({ eventId, open, onOpenChange }: PeopleYouMayKnowProps) => {
  const { user } = useAuth();
  const [attendees, setAttendees] = useState<AttendeeProfile[]>([]);
  const [myTeams, setMyTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !user) return;

    const fetch = async () => {
      setLoading(true);

      // Get my teams
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("favorite_la_teams, favorite_teams_players")
        .eq("id", user.id)
        .maybeSingle();

      const teams = [
        ...((myProfile as any)?.favorite_la_teams || []),
        ...((myProfile as any)?.favorite_teams_players || []),
      ];
      setMyTeams(teams);

      // Get other attendees
      const { data: guests } = await supabase
        .from("event_guests")
        .select("user_id")
        .eq("event_id", eventId)
        .eq("status", "going")
        .neq("user_id", user.id);

      const ids = (guests || []).map((g) => g.user_id);
      if (ids.length === 0) {
        setAttendees([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, profile_photo_url, favorite_la_teams, favorite_sports")
        .in("id", ids);

      setAttendees((profiles as AttendeeProfile[]) || []);
      setLoading(false);
    };

    fetch();
  }, [open, eventId, user?.id]);

  const getMutualTeams = (attendee: AttendeeProfile): string[] => {
    const theirTeams = attendee.favorite_la_teams || [];
    return myTeams.filter((t) =>
      theirTeams.some((at) => at.toLowerCase() === t.toLowerCase())
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[75vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            People You May Know
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3 overflow-y-auto max-h-[55vh] pb-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : attendees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-30" />
              <p className="text-sm text-muted-foreground">No other attendees yet</p>
            </div>
          ) : (
            attendees.map((attendee) => {
              const mutuals = getMutualTeams(attendee);
              return (
                <div
                  key={attendee.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors"
                >
                  <Avatar className="w-12 h-12 border-2 border-primary/20">
                    <AvatarImage src={attendee.profile_photo_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {attendee.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {attendee.name}
                    </p>
                    {mutuals.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {mutuals.slice(0, 2).map((team) => (
                          <Badge
                            key={team}
                            variant="secondary"
                            className="text-[9px] px-1.5 py-0 gap-0.5"
                          >
                            <Trophy className="w-2.5 h-2.5" />
                            You both follow {team}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <AddFriendButton
                    targetUserId={attendee.id}
                    targetName={attendee.name}
                    mutualTeams={mutuals}
                    size="sm"
                  />
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PeopleYouMayKnow;
