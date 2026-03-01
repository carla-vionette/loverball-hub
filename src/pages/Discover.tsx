import { useState, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Heart, X, Star, MessageCircle, MapPin, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const VIBE_LABELS = ["Sports Bestie", "Tailgate Queen", "Stats Nerd", "Casual Fan"];
const VIBE_COLORS: Record<string, string> = {
  "Sports Bestie": "bg-primary text-primary-foreground",
  "Tailgate Queen": "bg-hot-pink text-primary-foreground",
  "Stats Nerd": "bg-info text-info-foreground",
  "Casual Fan": "bg-secondary text-secondary-foreground",
};

interface ProfileCard {
  id: string;
  name: string;
  bio: string | null;
  city: string | null;
  neighborhood: string | null;
  profile_photo_url: string | null;
  favorite_sports: string[] | null;
  favorite_la_teams: string[] | null;
  primary_role: string | null;
}

interface MatchInfo {
  matchId: string;
  name: string;
  photo: string | null;
  userId: string;
  createdAt: string;
}

const Discover = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedName, setMatchedName] = useState("");
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null);
  const [matchesOpen, setMatchesOpen] = useState(false);
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch already swiped user IDs
    const { data: existingSwipes } = await supabase
      .from("swipes").select("target_user_id").eq("swiper_id", user.id);
    const swiped = new Set((existingSwipes || []).map(s => s.target_user_id));
    setSwipedIds(swiped);

    // Fetch profiles excluding self and already swiped
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("id, name, bio, city, neighborhood, profile_photo_url, favorite_sports, favorite_la_teams, primary_role")
      .neq("id", user.id)
      .limit(100);

    const filtered = (allProfiles || []).filter(p => !swiped.has(p.id));
    setProfiles(filtered);

    // Fetch matches
    const { data: matchData } = await supabase
      .from("matches")
      .select("id, user_a_id, user_b_id, created_at")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (matchData && matchData.length > 0) {
      const otherIds = matchData.map(m => m.user_a_id === user.id ? m.user_b_id : m.user_a_id);
      const { data: matchProfiles } = await supabase
        .from("profiles").select("id, name, profile_photo_url").in("id", otherIds);

      const matchInfos: MatchInfo[] = matchData.map(m => {
        const otherId = m.user_a_id === user.id ? m.user_b_id : m.user_a_id;
        const prof = matchProfiles?.find(p => p.id === otherId);
        return {
          matchId: m.id, userId: otherId,
          name: prof?.name || "User", photo: prof?.profile_photo_url || null,
          createdAt: m.created_at,
        };
      });
      setMatches(matchInfos);
    }

    setLoading(false);
  };

  const profile = profiles[idx];
  const nextProfile = profiles[idx + 1];

  const getVibe = (p: ProfileCard) => {
    const hash = p.id.charCodeAt(0) + p.id.charCodeAt(1);
    return VIBE_LABELS[hash % VIBE_LABELS.length];
  };

  const getCompat = (p: ProfileCard) => {
    if (!user) return 75;
    const hash = (p.id.charCodeAt(0) * 7 + p.id.charCodeAt(5)) % 25;
    return 75 + hash;
  };

  const swipe = useCallback(async (dir: "left" | "right" | "super") => {
    if (!user || !profile) return;
    const direction = dir === "super" ? "right" : dir;
    setSwipeDir(direction);

    try {
      const { error } = await supabase.from("swipes").insert({
        swiper_id: user.id,
        target_user_id: profile.id,
        direction,
      });
      if (error) throw error;

      // Check if a match was created (trigger does this)
      if (direction === "right") {
        // Small delay for trigger to execute
        await new Promise(r => setTimeout(r, 300));
        const { data: newMatch } = await supabase
          .from("matches")
          .select("id")
          .or(`and(user_a_id.eq.${user.id},user_b_id.eq.${profile.id}),and(user_a_id.eq.${profile.id},user_b_id.eq.${user.id})`)
          .maybeSingle();

        if (newMatch) {
          setMatchedName(profile.name);
          setShowMatch(true);
          setMatches(prev => [{
            matchId: newMatch.id, userId: profile.id,
            name: profile.name, photo: profile.profile_photo_url,
            createdAt: new Date().toISOString(),
          }, ...prev]);
          setTimeout(() => setShowMatch(false), 2500);
        }
      }
    } catch (err) {
      console.error("Swipe error:", err);
      toast.error("Couldn't save swipe");
    }

    setTimeout(() => {
      setSwipeDir(null);
      setIdx(p => p + 1);
    }, 300);
  }, [user, profile]);

  const onDragEnd = useCallback((_: any, info: any) => {
    if (info.offset.x > 100) swipe("right");
    else if (info.offset.x < -100) swipe("left");
  }, [swipe]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000);
    if (diffH < 1) return "Just now";
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return `${Math.floor(diffD / 7)}w ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader /><DesktopNav /><BottomNav />
        <main className="md:ml-64 pt-16 md:pt-0 pb-24 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  const noMoreProfiles = !profile;

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-condensed text-3xl font-bold uppercase tracking-wide">Discover</h1>
            <Button variant="outline" className="rounded-full gap-2" onClick={() => setMatchesOpen(!matchesOpen)}>
              <Heart className="w-4 h-4 text-primary" fill="currentColor" />
              <span className="text-sm font-semibold font-sans">{matches.length} Matches</span>
            </Button>
          </div>

          <div className="flex gap-8">
            {/* SWIPE STACK */}
            <div className="flex-1 flex flex-col items-center">
              {noMoreProfiles ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
                    <Heart className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-condensed font-bold uppercase mb-2">All caught up!</h2>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    You've seen everyone for now. Check back later for new members!
                  </p>
                </div>
              ) : (
                <>
                  <div className="relative w-full max-w-sm h-[520px] mx-auto">
                    {nextProfile && (
                      <div className="absolute inset-0 scale-[0.95] opacity-50">
                        <Card className="w-full h-full overflow-hidden border-border/30">
                          {nextProfile.profile_photo_url ? (
                            <img src={nextProfile.profile_photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-secondary flex items-center justify-center text-4xl font-bold text-muted-foreground">
                              {nextProfile.name[0]}
                            </div>
                          )}
                        </Card>
                      </div>
                    )}

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={profile.id + idx}
                        className="absolute inset-0 cursor-grab active:cursor-grabbing"
                        style={{ x, rotate }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={onDragEnd}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{
                          scale: 1, opacity: 1,
                          x: swipeDir === "right" ? 500 : swipeDir === "left" ? -500 : 0,
                        }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="w-full h-full overflow-hidden border-border/30 relative">
                          {profile.profile_photo_url ? (
                            <img src={profile.profile_photo_url} alt={profile.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-secondary flex items-center justify-center text-6xl font-bold text-muted-foreground">
                              {profile.name[0]}
                            </div>
                          )}

                          <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-6 border-4 border-success text-success font-condensed text-4xl font-bold uppercase px-4 py-1 rounded-lg rotate-[-15deg]">
                            LIKE
                          </motion.div>
                          <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 right-6 border-4 border-destructive text-destructive font-condensed text-4xl font-bold uppercase px-4 py-1 rounded-lg rotate-[15deg]">
                            NOPE
                          </motion.div>

                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent p-5 pt-20">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={`text-[10px] font-bold ${VIBE_COLORS[getVibe(profile)]} rounded-full`}>
                                {getVibe(profile)}
                              </Badge>
                              <Badge className="bg-card/20 text-card text-[10px] font-bold rounded-full backdrop-blur-sm">
                                <Sparkles className="w-3 h-3 mr-1" />{getCompat(profile)}% Match
                              </Badge>
                            </div>
                            <h3 className="text-card font-condensed text-2xl font-bold uppercase">
                              {profile.name}
                            </h3>
                            <p className="text-card/70 text-sm flex items-center gap-1 mt-1 font-sans">
                              <MapPin className="w-3 h-3" /> {profile.neighborhood || profile.city || "Los Angeles"}
                            </p>
                            {profile.bio && <p className="text-card/80 text-sm mt-2 font-sans line-clamp-2">{profile.bio}</p>}
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {(profile.favorite_sports || []).slice(0, 4).map((s) => (
                                <Badge key={s} variant="outline" className="text-[10px] text-card/80 border-card/30 rounded-full">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center gap-4 mt-6">
                    <Button size="icon" variant="outline" className="w-14 h-14 rounded-full border-2 border-destructive/30 hover:bg-destructive/10" onClick={() => swipe("left")}>
                      <X className="w-6 h-6 text-destructive" />
                    </Button>
                    <Button size="icon" className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 shadow-lg" onClick={() => swipe("super")}>
                      <Star className="w-7 h-7 text-primary-foreground" />
                    </Button>
                    <Button size="icon" variant="outline" className="w-14 h-14 rounded-full border-2 border-success/30 hover:bg-success/10" onClick={() => swipe("right")}>
                      <Heart className="w-6 h-6 text-success" />
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* MATCHES PANEL */}
            <AnimatePresence>
              {matchesOpen && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="hidden md:block w-72 shrink-0"
                >
                  <Card className="p-5 border-border/30">
                    <h3 className="font-condensed text-lg font-bold uppercase mb-4">Your Matches</h3>
                    {matches.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No matches yet. Keep swiping!</p>
                    ) : (
                      <div className="space-y-3">
                        {matches.map((m) => (
                          <button
                            key={m.matchId}
                            onClick={() => navigate("/dms")}
                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 cursor-pointer transition-colors"
                          >
                            <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                              {m.photo ? (
                                <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg font-bold text-muted-foreground">{m.name[0]}</div>
                              )}
                            </div>
                            <div className="text-left">
                              <p className="font-semibold text-sm font-sans">{m.name}</p>
                              <p className="text-xs text-muted-foreground font-sans">{formatTime(m.createdAt)}</p>
                            </div>
                            <MessageCircle className="w-4 h-4 text-muted-foreground ml-auto" />
                          </button>
                        ))}
                      </div>
                    )}
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* MATCH CELEBRATION */}
        <AnimatePresence>
          {showMatch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-primary/90 flex items-center justify-center"
            >
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }} className="text-center text-primary-foreground">
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: 2, duration: 0.3 }}>
                  <Heart className="w-20 h-20 mx-auto mb-4" fill="currentColor" />
                </motion.div>
                <h2 className="font-condensed text-5xl font-bold uppercase mb-2">It's a Match!</h2>
                <p className="text-primary-foreground/80 text-lg font-sans">You and {matchedName} both swiped right!</p>
                <Button
                  variant="secondary"
                  className="mt-6 rounded-full"
                  onClick={() => { setShowMatch(false); navigate("/dms"); }}
                >
                  Send a Message
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Discover;
