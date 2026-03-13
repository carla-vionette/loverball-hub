import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DesktopNav from "@/components/DesktopNav";
import BottomNav from "@/components/BottomNav";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Heart, X, Users, Sparkles, MapPin, UserPlus, Briefcase } from "lucide-react";
import PageError from "@/components/PageError";
import PageSkeleton from "@/components/PageSkeleton";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

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
  favorite_teams_players: string[] | null;
  age_range: string | null;
}

interface ScoredProfile extends MemberProfile {
  score: number;
  mutualTeams: string[];
  mutualSports: string[];
  sameCity: boolean;
  sameAge: boolean;
  mutualFriendsCount: number;
}

const Connections = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentUserProfile, setCurrentUserProfile] = useState<MemberProfile | null>(null);
  const [totalMembers, setTotalMembers] = useState(0);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [userMatches, setUserMatches] = useState<string[]>([]);
  const [allMatchPairs, setAllMatchPairs] = useState<{ a: string; b: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchProfiles();
    fetchCurrentUserProfile();
    fetchTotalMembers();
    fetchMatchData();
  }, [user]);

  const fetchCurrentUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, name, bio, profile_photo_url, favorite_sports, other_interests, city, neighborhood, primary_role, favorite_la_teams, favorite_teams_players, age_range")
      .eq("id", user.id)
      .maybeSingle();
    if (data) setCurrentUserProfile(data);
  };

  const fetchTotalMembers = async () => {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });
    setTotalMembers(count || 0);
  };

  const fetchMatchData = async () => {
    if (!user) return;
    // Get current user's matches for mutual friends calculation
    const { data: matches } = await supabase
      .from("matches")
      .select("user_a_id, user_b_id")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

    const myFriends = (matches || []).map(m =>
      m.user_a_id === user.id ? m.user_b_id : m.user_a_id
    );
    setUserMatches(myFriends);

    // Get all match pairs for mutual friends calculation
    const { data: allMatches } = await supabase
      .from("matches")
      .select("user_a_id, user_b_id");
    setAllMatchPairs((allMatches || []).map(m => ({ a: m.user_a_id, b: m.user_b_id })));
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
        .select("id, name, bio, profile_photo_url, favorite_sports, other_interests, city, neighborhood, primary_role, favorite_la_teams, favorite_teams_players, age_range")
        .not("id", "in", `(${excludeIds.join(",")})`)
        .limit(50);

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  // Calculate mutual friends for a given profile
  const getMutualFriendsCount = useCallback((profileId: string): number => {
    if (!user) return 0;
    // Get friends of the target profile
    const theirFriends = allMatchPairs
      .filter(m => m.a === profileId || m.b === profileId)
      .map(m => m.a === profileId ? m.b : m.a);
    // Intersection with my friends
    return theirFriends.filter(f => userMatches.includes(f) && f !== user.id).length;
  }, [user, userMatches, allMatchPairs]);

  // Extract team names from favorite_teams_players (free text) for matching
  const extractTeamMatches = useCallback((userTeams: string[] | null, profileTeams: string[] | null): string[] => {
    if (!userTeams?.length || !profileTeams?.length) return [];
    const normalize = (s: string) => s.toLowerCase().trim();
    const userNorm = userTeams.map(normalize);
    return profileTeams.filter(t => userNorm.some(ut => normalize(t).includes(ut) || ut.includes(normalize(t))));
  }, []);

  // Score and sort profiles
  const scoredProfiles = useMemo((): ScoredProfile[] => {
    if (!currentUserProfile) return profiles.map(p => ({
      ...p, score: 0, mutualTeams: [], mutualSports: [], sameCity: false, sameAge: false, mutualFriendsCount: 0
    }));

    return profiles.map(p => {
      let score = 0;

      // Same city
      const sameCity = !!(p.city && currentUserProfile.city && p.city.toLowerCase() === currentUserProfile.city.toLowerCase());
      if (sameCity) score += 3;

      // Mutual teams (from favorite_teams_players)
      const mutualTeams = extractTeamMatches(currentUserProfile.favorite_teams_players, p.favorite_teams_players);
      score += mutualTeams.length * 2;

      // Mutual sports
      const mutualSports = (currentUserProfile.favorite_sports || []).filter(
        s => p.favorite_sports?.includes(s)
      );
      score += mutualSports.length;

      // Same age range
      const sameAge = !!(p.age_range && currentUserProfile.age_range && p.age_range === currentUserProfile.age_range);
      if (sameAge) score += 1;

      // Mutual friends
      const mutualFriendsCount = getMutualFriendsCount(p.id);
      score += mutualFriendsCount * 3;

      // Bonus for having a photo
      if (p.profile_photo_url) score += 1;

      return { ...p, score, mutualTeams, mutualSports, sameCity, sameAge, mutualFriendsCount };
    }).sort((a, b) => b.score - a.score);
  }, [profiles, currentUserProfile, getMutualFriendsCount, extractTeamMatches]);

  const filteredSuggestions = useMemo(() => {
    let filtered = scoredProfiles.filter(p => !connectedIds.has(p.id));
    if (activeFilter === "team") {
      filtered = filtered.filter(p => p.mutualTeams.length > 0 || p.mutualSports.length > 0);
    }
    if (activeFilter === "location") {
      filtered = filtered.filter(p => p.sameCity);
    }
    return filtered;
  }, [scoredProfiles, activeFilter, connectedIds]);

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

      setConnectedIds(prev => new Set([...prev, targetId]));
    } catch (err) {
      console.error("Error connecting:", err);
    }
  };

  const currentProfile = profiles[currentIndex];

  const filterCounts = useMemo(() => {
    const notConnected = scoredProfiles.filter(p => !connectedIds.has(p.id));
    return {
      all: notConnected.length,
      team: notConnected.filter(p => p.mutualTeams.length > 0 || p.mutualSports.length > 0).length,
      location: notConnected.filter(p => p.sameCity).length,
    };
  }, [scoredProfiles, connectedIds]);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 md:pl-64">
      <DesktopNav />
      <MobileHeader />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Community Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Users className="w-4 h-4" />
            Join {totalMembers.toLocaleString()} sports lovers in LA
          </div>
          <h1 className="text-3xl font-sans font-semibold mb-2">Connections</h1>
          <p className="text-muted-foreground text-sm">Discover & connect with fellow sports lovers</p>
        </div>

        {loading ? (
          <PageSkeleton variant="cards" count={8} />
        ) : (
          <>
            {/* Swipe card section */}
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
                  <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-5 text-sm">
                    All ({filterCounts.all})
                  </TabsTrigger>
                  <TabsTrigger value="team" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-5 text-sm">
                    By Team ({filterCounts.team})
                  </TabsTrigger>
                  <TabsTrigger value="location" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-5 text-sm">
                    By Location ({filterCounts.location})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredSuggestions.slice(0, 15).map((profile) => (
                  <HoverCard key={profile.id} openDelay={300} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border-border/50 cursor-pointer">
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
                          {profile.mutualFriendsCount > 0 && (
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-background/90 text-foreground text-[10px] backdrop-blur-sm border-0 gap-1">
                                <Users className="w-3 h-3" />
                                {profile.mutualFriendsCount} mutual
                              </Badge>
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
                          {profile.mutualTeams.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {profile.mutualTeams.slice(0, 2).map(team => (
                                <Badge key={team} variant="outline" className="text-[10px] px-1.5 py-0 rounded-sm border-primary/30 text-primary/80">{team}</Badge>
                              ))}
                            </div>
                          )}
                          {profile.mutualSports.length > 0 && profile.mutualTeams.length === 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {profile.mutualSports.slice(0, 2).map(sport => (
                                <Badge key={sport} variant="secondary" className="text-[10px] px-1.5 py-0">{sport}</Badge>
                              ))}
                            </div>
                          )}
                          <Button size="sm" className="w-full mt-3 rounded-full text-xs h-8" onClick={() => handleConnect(profile.id)}>
                            <UserPlus className="w-3 h-3 mr-1" /> Connect
                          </Button>
                        </div>
                      </Card>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80" side="top" align="center">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-12 h-12 flex-shrink-0">
                          {profile.profile_photo_url && <AvatarImage src={profile.profile_photo_url} alt={profile.name} />}
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {profile.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm">{profile.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            {profile.city && (
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-3 h-3" /> {profile.city}
                              </span>
                            )}
                            {profile.primary_role && (
                              <span className="flex items-center gap-0.5">
                                <Briefcase className="w-3 h-3" /> {profile.primary_role}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {profile.bio && (
                        <p className="text-xs text-muted-foreground mt-3 line-clamp-3">{profile.bio}</p>
                      )}
                      {(profile.mutualTeams.length > 0 || profile.mutualSports.length > 0) && (
                        <div className="mt-3">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Shared interests</p>
                          <div className="flex flex-wrap gap-1">
                            {profile.mutualTeams.map(t => (
                              <Badge key={t} variant="outline" className="text-[10px] border-primary/30 text-primary">{t}</Badge>
                            ))}
                            {profile.mutualSports.slice(0, 3).map(s => (
                              <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {profile.mutualFriendsCount > 0 && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {profile.mutualFriendsCount} mutual {profile.mutualFriendsCount === 1 ? "friend" : "friends"}
                        </p>
                      )}
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </div>

              {filteredSuggestions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No results for this filter. Try a different tab.
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
