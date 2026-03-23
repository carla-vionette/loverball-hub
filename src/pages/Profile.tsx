import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MobileHeader from "@/components/MobileHeader";
import DesktopNav from "@/components/DesktopNav";
import BottomNav from "@/components/BottomNav";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileFeedTab from "@/components/profile/ProfileFeedTab";
import ProfileTeamsTab from "@/components/profile/ProfileTeamsTab";
import ProfileEventsTab from "@/components/profile/ProfileEventsTab";
import ProfileStatsTab from "@/components/profile/ProfileStatsTab";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Users } from "lucide-react";
import { motion } from "framer-motion";

type ProfileData = {
  id: string;
  name: string;
  pronouns: string | null;
  city: string | null;
  bio: string | null;
  profile_photo_url: string | null;
  membership_tier: string | null;
  username?: string | null;
  favorite_sports: string[] | null;
  favorite_teams_players: string[] | null;
  favorite_la_teams?: string[] | null;
};

type RSVPEvent = {
  id: string;
  status: string;
  event: {
    id: string;
    title: string;
    event_date: string;
    event_time: string | null;
    venue_name: string | null;
    city: string | null;
    image_url: string | null;
  };
};

const Profile = () => {
const [profile, setProfile] = useState<ProfileData | null>(null);
  const [rsvpEvents, setRsvpEvents] = useState<RSVPEvent[]>([]);
  const [followedTeamKeys, setFollowedTeamKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState<"followers" | "following" | null>(null);
  const { toast } = useToast();

  const goTo = (path: string) => {
    window.location.href = path;
  };

  useEffect(() => {
    let cancelled = false;
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) {
          if (!cancelled) goTo("/auth");
          return;
        }

        const [profileResult, rsvpResult, teamFollowsResult] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase
            .from("event_rsvps")
            .select(
              `id, status, event:events (id, title, event_date, event_time, venue_name, city, image_url)`
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("team_follows")
            .select("team_key")
            .eq("user_id", user.id),
        ]);

        if (cancelled) return;
        if (profileResult.error || !profileResult.data) {
          goTo("/onboarding");
          return;
        }

        setProfile(profileResult.data as unknown as ProfileData);
        if (rsvpResult.data) {
          setRsvpEvents(
            rsvpResult.data.filter((r) => r.event !== null) as RSVPEvent[]
          );
        }
        if (teamFollowsResult.data) {
          setFollowedTeamKeys(teamFollowsResult.data.map((d) => d.team_key));
        }
      } catch {
        if (!cancelled) goTo("/onboarding");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const confirmLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out", description: "You have been logged out successfully." });
    goTo("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader />
        <DesktopNav />
        <BottomNav />
        <main className="md:ml-64 pb-20 md:pb-8 pt-16 md:pt-2">
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-muted" />
              <div className="h-6 w-40 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pb-20 md:pb-8 pt-16 md:pt-2">
        <div className="max-w-4xl mx-auto px-4 pt-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Profile Header */}
            <ProfileHeader
              profile={profile}
              isOwnProfile={true}
              onEditProfile={() => goTo("/profile/edit")}
              onOpenFollowers={() => setShowFollowersModal("followers")}
              onOpenFollowing={() => setShowFollowersModal("following")}
              onDMs={() => goTo("/dms")}
              onSettings={() => goTo("/settings")}
              onLogout={() => setShowLogoutConfirm(true)}
            />

            {/* Tabbed Navigation */}
            <Tabs defaultValue="feed" className="w-full">
              <TabsList className="w-full grid grid-cols-4 bg-muted/50 rounded-xl p-1">
                <TabsTrigger
                  value="feed"
                  className="rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Feed
                </TabsTrigger>
                <TabsTrigger
                  value="teams"
                  className="rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Teams
                </TabsTrigger>
                <TabsTrigger
                  value="events"
                  className="rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Events
                </TabsTrigger>
                <TabsTrigger
                  value="stats"
                  className="rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Stats
                </TabsTrigger>
              </TabsList>

              <TabsContent value="feed" className="mt-4">
                <ProfileFeedTab profile={profile} followedTeamKeys={followedTeamKeys} />
              </TabsContent>

              <TabsContent value="teams" className="mt-4">
                <ProfileTeamsTab />
              </TabsContent>

              <TabsContent value="events" className="mt-4">
                <ProfileEventsTab rsvpEvents={rsvpEvents} onNavigate={goTo} />
              </TabsContent>

              <TabsContent value="stats" className="mt-4">
                <ProfileStatsTab userId={profile.id} />
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>

      {/* Logout Confirmation */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Followers/Following Sheet */}
      <Sheet open={!!showFollowersModal} onOpenChange={() => setShowFollowersModal(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {showFollowersModal === "followers" ? "Followers" : "Following"}
            </SheetTitle>
          </SheetHeader>
          <div className="py-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {showFollowersModal === "followers"
                ? "No followers yet"
                : "Not following anyone yet"}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Connect with others at events to grow your network!
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Profile;
