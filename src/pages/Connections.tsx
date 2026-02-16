import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DesktopNav from "@/components/DesktopNav";
import BottomNav from "@/components/BottomNav";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Heart, X, Users, Sparkles, MapPin, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

interface MemberProfile {
  id: string;
  name: string;
  bio: string | null;
  profile_photo_url: string | null;
  favorite_sports: string[] | null;
  other_interests: string[] | null;
  city: string | null;
  neighborhood: string | null;
  primary_role: string | null;
  favorite_la_teams: string[] | null;
}

const Connections = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [suggestedProfiles, setSuggestedProfiles] = useState<MemberProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentUserProfile, setCurrentUserProfile] = useState<MemberProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchProfiles();
    fetchCurrentUserProfile();
  }, [user]);

  const fetchCurrentUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, name, bio, profile_photo_url, favorite_sports, other_interests, city, neighborhood, primary_role, favorite_la_teams")
      .eq("id", user.id)
      .maybeSingle();
    if (data) setCurrentUserProfile(data);
  };

  const fetchProfiles = async () => {
    if (!user) return;
    try {
      const { data: swipedData } = await supabase
        .from("swipes")
        .select("target_user_id")
        .eq("swiper_id", user.id);

      const swipedIds = swipedData?.map((s) => s.target_user_id) || [];
      const excludeIds = [user.id, ...swipedIds];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, bio, profile_photo_url, favorite_sports, other_interests, city, neighborhood, primary_role, favorite_la_teams")
        .not("id", "in", `(${excludeIds.join(",")})`)
        .limit(50);

      if (error) throw error;
      const allProfiles = data || [];
      setProfiles(allProfiles);
      setSuggestedProfiles(allProfiles);
    } catch (err) {
      console.error("Error fetching profiles:", err);
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = useCallback(async (direction: "left" | "right") => {
    if (!user || swiping || currentIndex >= profiles.length) return;
    setSwiping(true);
    setSwipeDirection(direction);

    const targetUser = profiles[currentIndex];
    try {
      await supabase.from("swipes").insert({
        swiper_id: user.id,
        target_user_id: targetUser.id,
        direction,
      });

      if (direction === "right") {
        const { data: mutual } = await supabase
          .from("matches")
          .select("id")
          .or(`and(user_a_id.eq.${user.id},user_b_id.eq.${targetUser.id}),and(user_a_id.eq.${targetUser.id},user_b_id.eq.${user.id})`)
          .maybeSingle();

        if (mutual) {
          toast.success("It's a match! 🎉", {
            description: `You and ${targetUser.name} connected!`,
          });
        }
      }

      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setSwipeDirection(null);
        setSwiping(false);
      }, 300);
    } catch (err) {
      console.error("Error swiping:", err);
      setSwiping(false);
      setSwipeDirection(null);
    }
  }, [user, swiping, currentIndex, profiles]);

  const handleConnect = async (targetId: string) => {
    if (!user) return;
    try {
      await supabase.from("swipes").insert({
        swiper_id: user.id,
        target_user_id: targetId,
        direction: "right",
      });

      const { data: mutual } = await supabase
        .from("matches")
        .select("id")
        .or(`and(user_a_id.eq.${user.id},user_b_id.eq.${targetId}),and(user_a_id.eq.${targetId},user_b_id.eq.${user.id})`)
        .maybeSingle();

      if (mutual) {
        toast.success("It's a match! 🎉");
      } else {
        toast.success("Connection request sent!");
      }

      setSuggestedProfiles(prev => prev.filter(p => p.id !== targetId));
    } catch (err) {
      console.error("Error connecting:", err);
    }
  };

  const getMutualTeams = (profile: MemberProfile): string[] => {
    if (!currentUserProfile?.favorite_la_teams || !profile.favorite_la_teams) return [];
    return currentUserProfile.favorite_la_teams.filter(t => profile.favorite_la_teams?.includes(t));
  };

  const filteredSuggestions = suggestedProfiles.filter(p => {
    if (activeFilter === "all") return true;
    if (activeFilter === "team") return getMutualTeams(p).length > 0;
    if (activeFilter === "location") return p.city && currentUserProfile?.city && p.city === currentUserProfile.city;
    return true;
  });

  const currentProfile = profiles[currentIndex];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 md:pl-64">
      <DesktopNav />
      <MobileHeader />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-sans font-semibold mb-2">Connections</h1>
          <p className="text-muted-foreground text-sm">Discover & connect with fellow sports lovers</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Swipe card section - only if there are unswiped profiles */}
            {currentProfile && (
              <div className="max-w-lg mx-auto mb-12">
                <div className="relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentProfile.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        x: swipeDirection === "left" ? -300 : swipeDirection === "right" ? 300 : 0,
                        rotate: swipeDirection === "left" ? -15 : swipeDirection === "right" ? 15 : 0,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-card rounded-3xl overflow-hidden shadow-lg border border-border/30"
                    >
                      <div className="aspect-[3/4] bg-secondary/30 relative">
                        {currentProfile.profile_photo_url ? (
                          <img src={currentProfile.profile_photo_url} alt={currentProfile.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Users className="h-20 w-20 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <h2 className="text-2xl font-semibold mb-1">{currentProfile.name}</h2>
                          {currentProfile.city && (
                            <p className="text-white/70 text-sm mb-3">
                              {currentProfile.neighborhood ? `${currentProfile.neighborhood}, ` : ""}{currentProfile.city}
                            </p>
                          )}
                          {currentProfile.bio && <p className="text-white/80 text-sm line-clamp-2 mb-3">{currentProfile.bio}</p>}
                          <div className="flex flex-wrap gap-1.5">
                            {currentProfile.favorite_sports?.slice(0, 4).map((sport) => (
                              <Badge key={sport} variant="secondary" className="bg-white/20 text-white border-0 text-xs backdrop-blur-sm">{sport}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <div className="flex justify-center gap-6 mt-6">
                    <Button size="lg" variant="outline" className="w-16 h-16 rounded-full border-2 border-destructive/30 hover:bg-destructive/10 hover:border-destructive" onClick={() => handleSwipe("left")} disabled={swiping}>
                      <X className="h-7 w-7 text-destructive" />
                    </Button>
                    <Button size="lg" className="w-16 h-16 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg" onClick={() => handleSwipe("right")} disabled={swiping}>
                      <Heart className="h-7 w-7" />
                    </Button>
                  </div>
                  <p className="text-center text-muted-foreground text-xs mt-4">{profiles.length - currentIndex - 1} more people to discover</p>
                </div>
              </div>
            )}

            {/* Suggested For You Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-sans font-semibold">Suggested For You</h2>
              </div>

              <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mb-6">
                <TabsList className="bg-card rounded-full p-1 border border-border/20">
                  <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-5 text-sm">All</TabsTrigger>
                  <TabsTrigger value="team" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-5 text-sm">By Team</TabsTrigger>
                  <TabsTrigger value="location" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-5 text-sm">By Location</TabsTrigger>
                </TabsList>
              </Tabs>

              {filteredSuggestions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No suggestions match this filter. Try another!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredSuggestions.slice(0, 12).map((profile) => {
                    const mutualTeams = getMutualTeams(profile);
                    return (
                      <Card key={profile.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 border-border/50">
                        <div className="aspect-square bg-secondary/30 relative overflow-hidden">
                          {profile.profile_photo_url ? (
                            <img src={profile.profile_photo_url} alt={profile.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10">
                              <span className="text-3xl font-semibold text-primary/40">
                                {profile.name.split(" ").map(n => n[0]).join("")}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-sm truncate">{profile.name}</h3>
                          {profile.city && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{profile.city}</span>
                            </div>
                          )}
                          {mutualTeams.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {mutualTeams.slice(0, 2).map(team => (
                                <Badge key={team} variant="outline" className="text-[10px] px-1.5 py-0 rounded-sm border-primary/30 text-primary/80">{team}</Badge>
                              ))}
                            </div>
                          )}
                          <Button size="sm" className="w-full mt-3 rounded-full text-xs h-8" onClick={() => handleConnect(profile.id)}>
                            <UserPlus className="w-3 h-3 mr-1" /> Connect
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Connections;
