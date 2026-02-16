import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DesktopNav from "@/components/DesktopNav";
import BottomNav from "@/components/BottomNav";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Heart, X, Users, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
}

const Connections = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchProfiles();
  }, [user]);

  const fetchProfiles = async () => {
    if (!user) return;
    try {
      // Get already swiped user IDs
      const { data: swipedData } = await supabase
        .from("swipes")
        .select("target_user_id")
        .eq("swiper_id", user.id);

      const swipedIds = swipedData?.map((s) => s.target_user_id) || [];
      const excludeIds = [user.id, ...swipedIds];

      // Get member profiles excluding self and already swiped
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, bio, profile_photo_url, favorite_sports, other_interests, city, neighborhood, primary_role")
        .not("id", "in", `(${excludeIds.join(",")})`)
        .limit(50);

      if (error) throw error;
      setProfiles(data || []);
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
        // Check for mutual match
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

      // Brief delay so animation plays
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

  const currentProfile = profiles[currentIndex];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 md:pl-64">
      <DesktopNav />
      <MobileHeader />

      <main className="container mx-auto px-4 py-6 max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-sans font-semibold mb-2">Connections</h1>
          <p className="text-muted-foreground text-sm">Discover & connect with fellow sports lovers</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !currentProfile ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="h-10 w-10 text-accent-foreground" />
            </div>
            <h2 className="text-xl font-sans font-semibold mb-2">All caught up!</h2>
            <p className="text-muted-foreground max-w-xs">
              You've seen everyone for now. Check back later for new members.
            </p>
          </div>
        ) : (
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
                {/* Photo */}
                <div className="aspect-[3/4] bg-secondary/30 relative">
                  {currentProfile.profile_photo_url ? (
                    <img
                      src={currentProfile.profile_photo_url}
                      alt={currentProfile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="h-20 w-20 text-muted-foreground/30" />
                    </div>
                  )}

                  {/* Gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

                  {/* Info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h2 className="text-2xl font-semibold mb-1">{currentProfile.name}</h2>
                    {currentProfile.city && (
                      <p className="text-white/70 text-sm mb-3">
                        {currentProfile.neighborhood ? `${currentProfile.neighborhood}, ` : ""}
                        {currentProfile.city}
                      </p>
                    )}
                    {currentProfile.primary_role && (
                      <p className="text-white/80 text-xs mb-2">{currentProfile.primary_role}</p>
                    )}
                    {currentProfile.bio && (
                      <p className="text-white/80 text-sm line-clamp-2 mb-3">{currentProfile.bio}</p>
                    )}

                    {/* Interests */}
                    <div className="flex flex-wrap gap-1.5">
                      {currentProfile.favorite_sports?.slice(0, 4).map((sport) => (
                        <Badge key={sport} variant="secondary" className="bg-white/20 text-white border-0 text-xs backdrop-blur-sm">
                          {sport}
                        </Badge>
                      ))}
                      {currentProfile.other_interests?.slice(0, 3).map((interest) => (
                        <Badge key={interest} variant="secondary" className="bg-white/20 text-white border-0 text-xs backdrop-blur-sm">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Action buttons */}
            <div className="flex justify-center gap-6 mt-6">
              <Button
                size="lg"
                variant="outline"
                className="w-16 h-16 rounded-full border-2 border-destructive/30 hover:bg-destructive/10 hover:border-destructive"
                onClick={() => handleSwipe("left")}
                disabled={swiping}
              >
                <X className="h-7 w-7 text-destructive" />
              </Button>
              <Button
                size="lg"
                className="w-16 h-16 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg"
                onClick={() => handleSwipe("right")}
                disabled={swiping}
              >
                <Heart className="h-7 w-7" />
              </Button>
            </div>

            <p className="text-center text-muted-foreground text-xs mt-4">
              {profiles.length - currentIndex - 1} more people to discover
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Connections;
