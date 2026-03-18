import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MobileHeader from "@/components/MobileHeader";
import DesktopNav from "@/components/DesktopNav";
import BottomNav from "@/components/BottomNav";
import { useFollow } from "@/hooks/useFollow";

import ProfileHeader from "@/components/profile/ProfileHeader";
import TeamBadgesRow from "@/components/profile/TeamBadgesRow";
import ProfilePostsTab from "@/components/profile/ProfilePostsTab";
import ProfileEventsTab from "@/components/profile/ProfileEventsTab";
import ProfileSavedTab from "@/components/profile/ProfileSavedTab";
import FollowListSheet from "@/components/profile/FollowListSheet";
import MySportsFeed from "@/components/MySportsFeed";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type ProfileData = {
  id: string;
  name: string;
  username?: string | null;
  pronouns: string | null;
  city: string | null;
  bio: string | null;
  profile_photo_url: string | null;
  membership_tier: string | null;
  favorite_sports: string[] | null;
  favorite_teams_players: string[] | null;
  favorite_la_teams: string[] | null;
};

const Profile = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [postsCount, setPostsCount] = useState(0);
  const [showFollowList, setShowFollowList] = useState<"followers" | "following" | null>(null);

  const goTo = (path: string) => { window.location.href = path; };

  useEffect(() => {
    let cancelled = false;
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { if (!cancelled) goTo("/auth"); return; }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, username, pronouns, city, bio, profile_photo_url, membership_tier, favorite_sports, favorite_teams_players, favorite_la_teams")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (error || !data) { goTo("/onboarding"); return; }
      setProfile(data);
      setLoading(false);
    };
    fetchProfile();
    return () => { cancelled = true; };
  }, []);

  const { followerCount, followingCount } = useFollow(profile?.id);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader />
        <DesktopNav />
        <BottomNav />
        <main className="md:ml-64 pb-20 md:pb-8 pt-16 md:pt-2">
          <div className="max-w-lg mx-auto flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  const allTeams = [
    ...(profile.favorite_teams_players || []),
    ...(profile.favorite_la_teams || []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pb-20 md:pb-8 pt-16 md:pt-2">
        <div className="max-w-lg mx-auto">
          {/* Profile Header */}
          <ProfileHeader
            profile={profile}
            isOwnProfile={true}
            postsCount={postsCount}
            followerCount={followerCount}
            followingCount={followingCount}
            onClickFollowers={() => setShowFollowList("followers")}
            onClickFollowing={() => setShowFollowList("following")}
            onAvatarUpdated={(url) => setProfile(prev => prev ? { ...prev, profile_photo_url: url } : prev)}
          />

          {/* Team Badges Row */}
          <TeamBadgesRow teams={allTeams} />

          {/* Tabs */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="w-full rounded-none border-b border-border/30 bg-transparent h-auto p-0">
              <TabsTrigger
                value="posts"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-xs font-semibold uppercase tracking-wider"
              >
                Posts
              </TabsTrigger>
              <TabsTrigger
                value="feed"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-xs font-semibold uppercase tracking-wider"
              >
                My Feed
              </TabsTrigger>
              <TabsTrigger
                value="events"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-xs font-semibold uppercase tracking-wider"
              >
                Events
              </TabsTrigger>
              <TabsTrigger
                value="saved"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-xs font-semibold uppercase tracking-wider"
              >
                Saved
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-0">
              <ProfilePostsTab userId={profile.id} onPostsLoaded={setPostsCount} />
            </TabsContent>

            <TabsContent value="feed" className="mt-0 p-4">
              <MySportsFeed
                userSports={profile.favorite_sports || []}
                userTeams={allTeams}
                userCity={profile.city}
              />
            </TabsContent>

            <TabsContent value="events" className="mt-0">
              <ProfileEventsTab userId={profile.id} />
            </TabsContent>

            <TabsContent value="saved" className="mt-0">
              <ProfileSavedTab userId={profile.id} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Follow list sheet */}
      <FollowListSheet
        userId={profile.id}
        type={showFollowList}
        onClose={() => setShowFollowList(null)}
      />
    </div>
  );
};

export default Profile;
