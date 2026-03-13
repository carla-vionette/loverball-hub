import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, X } from "lucide-react";

interface MutualUser {
  id: string;
  name: string;
  profile_photo_url: string | null;
  mutualCount: number;
}

const YouveMetCard = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<MutualUser[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    fetchMutualAttendees();
  }, [user?.id]);

  const fetchMutualAttendees = async () => {
    if (!user) return;

    // Get events the current user attended
    const { data: myEvents } = await supabase
      .from("event_guests")
      .select("event_id")
      .eq("user_id", user.id)
      .eq("status", "going");

    if (!myEvents || myEvents.length === 0) return;

    const eventIds = myEvents.map((e) => e.event_id);

    // Get other users at the same events
    const { data: coAttendees } = await supabase
      .from("event_guests")
      .select("user_id, event_id")
      .in("event_id", eventIds)
      .eq("status", "going")
      .neq("user_id", user.id);

    if (!coAttendees || coAttendees.length === 0) return;

    // Count mutual events per user
    const countMap = new Map<string, number>();
    coAttendees.forEach((a) => {
      countMap.set(a.user_id, (countMap.get(a.user_id) || 0) + 1);
    });

    // Filter users with 2+ mutual events
    const qualifiedIds = Array.from(countMap.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (qualifiedIds.length === 0) return;

    // Check which ones user already follows
    const { data: existing } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .in("following_id", qualifiedIds.map(([id]) => id));

    const alreadyFollowing = new Set((existing || []).map((f) => f.following_id));

    const unfollowed = qualifiedIds.filter(([id]) => !alreadyFollowing.has(id));
    if (unfollowed.length === 0) return;

    // Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, profile_photo_url")
      .in("id", unfollowed.map(([id]) => id));

    if (!profiles) return;

    const result: MutualUser[] = profiles.map((p) => ({
      id: p.id,
      name: p.name,
      profile_photo_url: p.profile_photo_url,
      mutualCount: countMap.get(p.id) || 0,
    }));

    setSuggestions(result);
  };

  const handleFollow = async (targetId: string) => {
    if (!user) return;
    await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
    setSuggestions((prev) => prev.filter((s) => s.id !== targetId));
  };

  const handleDismiss = (targetId: string) => {
    setDismissed((prev) => new Set(prev).add(targetId));
  };

  const visible = suggestions.filter((s) => !dismissed.has(s.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground px-1">You've met</h3>
      {visible.map((person) => (
        <Card key={person.id} className="overflow-hidden border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-primary/20">
              <AvatarImage src={person.profile_photo_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {person.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{person.name}</p>
              <p className="text-xs text-muted-foreground">
                You both went to {person.mutualCount} events! Add her?
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button size="sm" onClick={() => handleFollow(person.id)} className="h-8 text-xs">
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                Follow
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => handleDismiss(person.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default YouveMetCard;
