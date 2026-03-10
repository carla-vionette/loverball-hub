import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Clock, Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import AttendeeProfileDrawer from "@/components/AttendeeProfileDrawer";
import BottomNav from "@/components/BottomNav";

interface FriendProfile {
  id: string;
  name: string;
  profile_photo_url: string | null;
  bio: string | null;
  favorite_sports: string[] | null;
  primary_role: string | null;
  city: string | null;
}

interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  friend_profile: FriendProfile | null;
}

const Friends = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [friends, setFriends] = useState<FriendshipRow[]>([]);
  const [pendingReceived, setPendingReceived] = useState<FriendshipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<FriendProfile | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch accepted friendships
    const { data: accepted } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status, created_at")
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    // Fetch pending received
    const { data: pending } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status, created_at")
      .eq("status", "pending")
      .eq("addressee_id", user.id);

    // Collect friend user IDs
    const friendIds = new Set<string>();
    (accepted || []).forEach((f) => {
      friendIds.add(f.requester_id === user.id ? f.addressee_id : f.requester_id);
    });
    (pending || []).forEach((f) => friendIds.add(f.requester_id));

    // Fetch profiles
    const ids = Array.from(friendIds);
    let profileMap: Record<string, FriendProfile> = {};
    if (ids.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, profile_photo_url, bio, favorite_sports, primary_role, city")
        .in("id", ids);
      (profiles || []).forEach((p: any) => {
        profileMap[p.id] = p;
      });
    }

    setFriends(
      (accepted || []).map((f) => {
        const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
        return { ...f, friend_profile: profileMap[friendId] || null };
      })
    );

    setPendingReceived(
      (pending || []).map((f) => ({
        ...f,
        friend_profile: profileMap[f.requester_id] || null,
      }))
    );

    setLoading(false);
  };

  const handleAccept = async (friendshipId: string, friendName: string) => {
    setActing(friendshipId);
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);
    if (!error) {
      toast({ title: "Accepted!", description: `You and ${friendName} are now friends.` });
      fetchAll();
    }
    setActing(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">My Friends</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">
        <Tabs defaultValue="friends">
          <TabsList className="w-full">
            <TabsTrigger value="friends" className="flex-1">
              <Users className="w-4 h-4 mr-1.5" />
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex-1">
              <Clock className="w-4 h-4 mr-1.5" />
              Requests ({pendingReceived.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-4 space-y-2">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No friends yet</p>
                <p className="text-sm">Attend events and connect with people!</p>
              </div>
            ) : (
              friends.map((f) => (
                <Card
                  key={f.id}
                  className="cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => {
                    if (f.friend_profile) {
                      setSelectedProfile(f.friend_profile);
                      setDrawerOpen(true);
                    }
                  }}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={f.friend_profile?.profile_photo_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {f.friend_profile?.name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{f.friend_profile?.name}</p>
                      {f.friend_profile?.primary_role && (
                        <p className="text-xs text-muted-foreground truncate">{f.friend_profile.primary_role}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      <Check className="w-3 h-3 mr-1" />
                      Friends
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-4 space-y-2">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : pendingReceived.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No pending requests</p>
              </div>
            ) : (
              pendingReceived.map((f) => (
                <Card key={f.id}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <Avatar
                      className="w-12 h-12 cursor-pointer"
                      onClick={() => {
                        if (f.friend_profile) {
                          setSelectedProfile(f.friend_profile);
                          setDrawerOpen(true);
                        }
                      }}
                    >
                      <AvatarImage src={f.friend_profile?.profile_photo_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {f.friend_profile?.name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{f.friend_profile?.name}</p>
                      <p className="text-xs text-muted-foreground">Wants to be friends</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAccept(f.id, f.friend_profile?.name || "User")}
                      disabled={acting === f.id}
                    >
                      {acting === f.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept"}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AttendeeProfileDrawer
        profile={selectedProfile}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
      <BottomNav />
    </div>
  );
};

export default Friends;
