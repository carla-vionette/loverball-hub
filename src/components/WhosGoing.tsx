import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle } from "lucide-react";
import AttendeeProfileDrawer from "./AttendeeProfileDrawer";

interface GuestProfile {
  id: string;
  name: string;
  profile_photo_url: string | null;
  bio: string | null;
  favorite_sports: string[] | null;
  primary_role: string | null;
  city: string | null;
}

interface EventGuest {
  id: string;
  user_id: string;
  status: string;
  going_solo: boolean;
  profile: GuestProfile | null;
}

interface EventGuest {
  id: string;
  user_id: string;
  status: string;
  profile: GuestProfile | null;
}

interface Props {
  eventId: string;
  refreshKey?: number;
}

const WhosGoing = ({ eventId, refreshKey }: Props) => {
  const { user } = useAuth();
  const [guests, setGuests] = useState<EventGuest[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<GuestProfile | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchGuests();
  }, [eventId, refreshKey]);

  const fetchGuests = async () => {
    const { data, error } = await supabase
      .from("event_guests")
      .select(`
        id,
        user_id,
        status,
        going_solo,
        profile:profiles!inner (
          id,
          name,
          profile_photo_url,
          bio,
          favorite_sports,
          primary_role,
          city
        )
      `)
      .eq("event_id", eventId)
      .eq("status", "going");

    if (error) {
      return;
    }

    const transformed = (data || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      status: item.status,
      going_solo: item.going_solo || false,
      profile: item.profile
        ? {
            id: item.profile.id,
            name: item.profile.name,
            profile_photo_url: item.profile.profile_photo_url,
            bio: item.profile.bio,
            favorite_sports: item.profile.favorite_sports,
            primary_role: item.profile.primary_role,
            city: item.profile.city,
          }
        : null,
    }));

    setGuests(transformed);
  };

  const handleProfileClick = (profile: GuestProfile) => {
    setSelectedProfile(profile);
    setDrawerOpen(true);
  };

  const handleDmClick = (e: React.MouseEvent, profile: GuestProfile) => {
    e.stopPropagation();
    setSelectedProfile(profile);
    setDrawerOpen(true);
    // Small delay to let drawer open, then trigger compose
    setTimeout(() => {
      const btn = document.querySelector('[data-compose-trigger]');
      if (btn instanceof HTMLElement) btn.click();
    }, 300);
  };

  if (guests.length === 0) return null;

  return (
    <>
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Who's Going</h3>
          <span className="text-sm text-muted-foreground">({guests.length})</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {guests.map((guest) => (
            <button
              key={guest.id}
              onClick={() => guest.profile && handleProfileClick(guest.profile)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-secondary transition-colors"
            >
              <Avatar className="w-14 h-14 border-2 border-primary/20">
                <AvatarImage src={guest.profile?.profile_photo_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {guest.profile?.name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-0.5 w-full justify-center">
                <span className="text-xs font-medium text-foreground truncate">
                  {guest.profile?.name?.split(" ")[0] || "Guest"}
                </span>
                {user && guest.profile && guest.profile.id !== user.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0 text-muted-foreground hover:text-primary"
                    onClick={(e) => guest.profile && handleDmClick(e, guest.profile)}
                  >
                    <MessageCircle className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <AttendeeProfileDrawer
        profile={selectedProfile}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  );
};

export default WhosGoing;
