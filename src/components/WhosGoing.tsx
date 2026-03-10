import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
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
  profile: GuestProfile | null;
}

interface Props {
  eventId: string;
  refreshKey?: number;
}

const WhosGoing = ({ eventId, refreshKey }: Props) => {
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
      console.error("Error fetching guests:", error);
      return;
    }

    const transformed = (data || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      status: item.status,
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
              <span className="text-xs font-medium text-foreground truncate w-full text-center">
                {guest.profile?.name?.split(" ")[0] || "Guest"}
              </span>
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
