import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Heart, X, MessageCircle, Filter, Grid3X3, Layers, Users, ChevronDown, MapPin, Trophy, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fetchAllProfiles, fetchProfilesByIds } from "@/lib/profileApi";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface Profile {
  id: string;
  name: string;
  profile_photo_url: string | null;
  bio: string | null;
  city: string | null;
  favorite_sports: string[] | null;
  favorite_la_teams: string[] | null;
  looking_for_tags: string[] | null;
  primary_role: string | null;
}

interface Match {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: string;
  otherUser?: Profile;
}

const Network = () => {
  const navigate = useNavigate();
  const { user, isMember } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"swipe" | "grid">("swipe");
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [myConnections, setMyConnections] = useState<Match[]>([]);
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  useEffect(() => {
    if (!isMember) {
      toast.error("Members only feature");
      navigate("/profile");
      return;
    }
    fetchMyConnections();
    fetchSwipedProfiles();
  }, [isMember, navigate]);
  
  // Fetch profiles after we know who we're connected to
  useEffect(() => {
    if (user && connectedIds.size >= 0) {
      fetchProfiles();
    }
  }, [user, connectedIds]);

  const fetchProfiles = async () => {
    if (!user) return;
    
    const { data, error, rateLimited } = await fetchAllProfiles(
      [],
      "id, name, profile_photo_url, bio, city, favorite_sports, favorite_la_teams, looking_for_tags, primary_role"
    );
    
    if (error) {
      console.error("Error fetching profiles:", error);
      if (rateLimited) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else {
        toast.error("Failed to load profiles");
      }
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const fetchSwipedProfiles = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("swipes")
      .select("target_user_id")
      .eq("swiper_id", user.id);
    
    if (data) {
      setSwipedIds(new Set(data.map(s => s.target_user_id)));
    }
  };

  const fetchMyConnections = async () => {
    if (!user) return;
    
    const { data: matches, error } = await supabase
      .from("matches")
      .select("*")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "active");
    
    if (error) {
      console.error("Error fetching connections:", error);
      return;
    }

    if (matches && matches.length > 0) {
      const otherUserIds = matches.map(m => 
        m.user_a_id === user.id ? m.user_b_id : m.user_a_id
      );
      
      // Store connected user IDs to filter them out from swiping
      setConnectedIds(new Set(otherUserIds));
      
      const { data: otherProfiles } = await fetchProfilesByIds(
        otherUserIds,
        "id, name, profile_photo_url, bio, city, favorite_sports, favorite_la_teams, looking_for_tags, primary_role"
      );
      
      const matchesWithProfiles = matches.map(match => ({
        ...match,
        otherUser: otherProfiles?.find(p => 
          p.id === (match.user_a_id === user.id ? match.user_b_id : match.user_a_id)
        )
      }));
      
      setMyConnections(matchesWithProfiles);
    } else {
      setConnectedIds(new Set());
      setMyConnections([]);
    }
  };

  const handleSwipe = async (direction: "left" | "right") => {
    if (!user || currentIndex >= availableProfiles.length) return;
    
    const targetProfile = availableProfiles[currentIndex];
    
    const { error } = await supabase
      .from("swipes")
      .insert({
        swiper_id: user.id,
        target_user_id: targetProfile.id,
        direction
      });
    
    if (error) {
      console.error("Error recording swipe:", error);
      toast.error("Failed to record swipe");
      return;
    }

    setSwipedIds(prev => new Set([...prev, targetProfile.id]));

    if (direction === "right") {
      // Check if it's a match
      const { data: mutualSwipe } = await supabase
        .from("swipes")
        .select("*")
        .eq("swiper_id", targetProfile.id)
        .eq("target_user_id", user.id)
        .eq("direction", "right")
        .single();
      
      if (mutualSwipe) {
        setMatchedProfile(targetProfile);
        setShowMatchDialog(true);
        // Add to connected IDs immediately to remove from swipe queue
        setConnectedIds(prev => new Set([...prev, targetProfile.id]));
        fetchMyConnections();
      } else {
        toast.success("Connection request sent! 💕");
      }
    }

    setCurrentIndex(prev => prev + 1);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      handleSwipe("right");
    } else if (info.offset.x < -threshold) {
      handleSwipe("left");
    }
  };

  const getFilteredProfiles = () => {
    return profiles.filter(profile => {
      // Exclude already swiped profiles
      if (swipedIds.has(profile.id)) return false;
      
      // Exclude already connected (matched) profiles
      if (connectedIds.has(profile.id)) return false;
      
      if (sportFilter !== "all") {
        if (!profile.favorite_sports?.includes(sportFilter)) return false;
      }
      
      if (locationFilter !== "all") {
        if (profile.city !== locationFilter) return false;
      }
      
      return true;
    });
  };

  const availableProfiles = getFilteredProfiles();
  const currentProfile = availableProfiles[currentIndex];

  const uniqueSports = [...new Set(profiles.flatMap(p => p.favorite_sports || []))];
  const uniqueLocations = [...new Set(profiles.map(p => p.city).filter(Boolean))];

  const getTagStyle = (tag: string) => {
    const tagLower = tag.toLowerCase();
    if (tagLower.includes("hooper") || tagLower.includes("basketball")) {
      return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    }
    if (tagLower.includes("fan")) {
      return "bg-pink-500/20 text-pink-300 border-pink-500/30";
    }
    if (tagLower.includes("creator") || tagLower.includes("content")) {
      return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    }
    return "bg-primary/20 text-primary border-primary/30";
  };

  if (!isMember) return null;

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />
      
      <main className="md:ml-64 pb-24 md:pb-8">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="max-w-2xl mx-auto px-4 py-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium tracking-wide mb-2">
                  Members Only
                </span>
                <h1 className="text-2xl font-serif font-semibold text-foreground">Network</h1>
                <p className="text-sm text-muted-foreground">Swipe & Connect</p>
              </div>
              <div className="flex items-center gap-2">
                {/* View Toggle */}
                <div className="flex bg-muted rounded-lg p-1">
                  <Button
                    variant={viewMode === "swipe" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("swipe")}
                    className="h-8 px-3"
                  >
                    <Layers className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-8 px-3"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Filters */}
                <Sheet open={showFilters} onOpenChange={setShowFilters}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filter Members</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-6 mt-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Sport</label>
                        <Select value={sportFilter} onValueChange={setSportFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All sports" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All sports</SelectItem>
                            {uniqueSports.map(sport => (
                              <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Location</label>
                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All locations" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All locations</SelectItem>
                            {uniqueLocations.map(loc => (
                              <SelectItem key={loc} value={loc!}>{loc}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button 
                        onClick={() => {
                          setSportFilter("all");
                          setLocationFilter("all");
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* My Connections */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 relative">
                      <Users className="w-4 h-4 mr-2" />
                      Connections
                      {myConnections.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {myConnections.length}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>My Connections</SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                      {myConnections.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No connections yet</p>
                          <p className="text-sm">Start swiping to connect!</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {myConnections.map(match => (
                            <div
                              key={match.id}
                              className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                            >
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={match.otherUser?.profile_photo_url || ""} />
                                <AvatarFallback className="bg-primary/20 text-primary">
                                  {match.otherUser?.name?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{match.otherUser?.name}</p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {match.otherUser?.favorite_sports?.[0] || "Sports fan"}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => navigate("/messages")}
                                className="shrink-0"
                              >
                                <MessageCircle className="w-4 h-4 mr-1" />
                                Chat
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : viewMode === "swipe" ? (
            /* Swipe Mode */
            <div className="relative h-[70vh] max-h-[600px]">
              <AnimatePresence>
                {currentProfile ? (
                  <motion.div
                    key={currentProfile.id}
                    className="absolute inset-0 cursor-grab active:cursor-grabbing"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={handleDragEnd}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ 
                      x: 300, 
                      opacity: 0,
                      transition: { duration: 0.3 }
                    }}
                    whileDrag={{ scale: 1.02 }}
                  >
                    <div className="h-full rounded-3xl overflow-hidden bg-gradient-to-b from-muted to-background border border-border shadow-2xl">
                      {/* Profile Image */}
                      <div className="relative h-3/5 bg-muted/50 flex items-center justify-center">
                        <img
                          src={currentProfile.profile_photo_url || ""}
                          alt={currentProfile.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className={`w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center absolute inset-0 ${currentProfile.profile_photo_url ? 'hidden' : ''}`}>
                          <span className="text-8xl font-bold text-primary/50">
                            {currentProfile.name.charAt(0)}
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
                      </div>

                      {/* Profile Info */}
                      <div className="p-6 -mt-12 relative">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h2 className="text-2xl font-bold text-foreground">{currentProfile.name}</h2>
                            {currentProfile.city && (
                              <p className="text-muted-foreground flex items-center gap-1 text-sm">
                                <MapPin className="w-3 h-3" />
                                {currentProfile.city}
                              </p>
                            )}
                          </div>
                          {currentProfile.primary_role && (
                            <Badge variant="secondary" className="text-xs">
                              {currentProfile.primary_role}
                            </Badge>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {currentProfile.looking_for_tags?.slice(0, 3).map(tag => (
                            <Badge 
                              key={tag} 
                              variant="outline" 
                              className={`text-xs ${getTagStyle(tag)}`}
                            >
                              {tag}
                            </Badge>
                          ))}
                          {currentProfile.favorite_sports?.slice(0, 2).map(sport => (
                            <Badge 
                              key={sport} 
                              variant="outline" 
                              className="text-xs bg-secondary/50 border-secondary"
                            >
                              <Trophy className="w-3 h-3 mr-1" />
                              {sport}
                            </Badge>
                          ))}
                        </div>

                        {/* Bio Preview */}
                        {currentProfile.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {currentProfile.bio.slice(0, 100)}
                            {currentProfile.bio.length > 100 && "..."}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Sparkles className="w-16 h-16 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">You've seen everyone!</h3>
                    <p className="text-muted-foreground mb-4">Check back later for new members</p>
                    <Button onClick={() => {
                      setCurrentIndex(0);
                      setSportFilter("all");
                      setLocationFilter("all");
                      fetchSwipedProfiles();
                    }}>
                      Refresh
                    </Button>
                  </div>
                )}
              </AnimatePresence>

              {/* Swipe Buttons */}
              {currentProfile && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSwipe("left")}
                    className="w-16 h-16 rounded-full bg-muted border-2 border-border flex items-center justify-center shadow-lg hover:border-destructive transition-colors"
                  >
                    <X className="w-8 h-8 text-muted-foreground" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSwipe("right")}
                    className="w-16 h-16 rounded-full bg-primary border-2 border-primary flex items-center justify-center shadow-lg shadow-primary/30"
                  >
                    <Heart className="w-8 h-8 text-primary-foreground" />
                  </motion.button>
                </div>
              )}
            </div>
          ) : (
            /* Grid Mode */
            <div className="grid grid-cols-2 gap-4">
              {availableProfiles.map(profile => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl overflow-hidden bg-muted/50 border border-border hover:border-primary/50 transition-all group"
                >
                  <div className="aspect-square relative">
                    <img
                      src={profile.profile_photo_url || ""}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className={`w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center absolute inset-0 ${profile.profile_photo_url ? 'hidden' : ''}`}>
                      <span className="text-4xl font-bold text-primary/50">
                        {profile.name.charAt(0)}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="font-semibold text-white truncate">{profile.name}</p>
                      {profile.city && (
                        <p className="text-xs text-white/70 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {profile.city}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {profile.looking_for_tags?.slice(0, 2).map(tag => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className={`text-[10px] ${getTagStyle(tag)}`}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs"
                        onClick={() => handleSwipe("left")}
                      >
                        Skip
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => {
                          // Set this profile as current and handle swipe
                          const idx = availableProfiles.findIndex(p => p.id === profile.id);
                          if (idx !== -1) {
                            setCurrentIndex(idx);
                            handleSwipe("right");
                          }
                        }}
                      >
                        <Heart className="w-3 h-3 mr-1" />
                        Connect
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Match Dialog */}
      <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
        <DialogContent className="sm:max-w-md text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15 }}
          >
            <div className="mb-6">
              <div className="relative inline-block">
                <Avatar className="w-24 h-24 border-4 border-primary">
                  <AvatarImage src={matchedProfile?.profile_photo_url || ""} />
                  <AvatarFallback className="text-3xl bg-primary/20 text-primary">
                    {matchedProfile?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center"
                >
                  <Heart className="w-5 h-5 text-primary-foreground" fill="currentColor" />
                </motion.div>
              </div>
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl">It's a Match! 🎉</DialogTitle>
              <DialogDescription className="text-base">
                You matched with <span className="font-semibold text-primary">{matchedProfile?.name}</span>!
                <br />Send a message?
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowMatchDialog(false)}
              >
                Later
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setShowMatchDialog(false);
                  navigate("/messages");
                }}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Network;
