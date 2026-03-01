import { useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Heart, X, Star, MessageCircle, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";

const VIBE_COLORS: Record<string, string> = {
  "Sports Bestie": "bg-primary text-primary-foreground",
  "Tailgate Queen": "bg-hot-pink text-primary-foreground",
  "Stats Nerd": "bg-info text-info-foreground",
  "Casual Fan": "bg-secondary text-secondary-foreground",
};

const PROFILES = [
  { id: 1, name: "Jasmine T.", age: 27, location: "Silver Lake, LA", photo: "/images/women-panel-event.jpg", sports: ["Basketball", "WNBA", "Tennis"], vibe: "Sports Bestie", compat: 94, bio: "Die-hard Sparks fan. Always down for a watch party 🏀" },
  { id: 2, name: "Sophia R.", age: 31, location: "Santa Monica, LA", photo: "/images/la28-olympics-mixer.jpg", sports: ["Soccer", "NWSL", "Running"], vibe: "Tailgate Queen", compat: 87, bio: "Angel City FC season ticket holder ⚽" },
  { id: 3, name: "Kayla M.", age: 24, location: "Downtown LA", photo: "/images/all-stars-event.jpg", sports: ["Baseball", "Softball", "Volleyball"], vibe: "Stats Nerd", compat: 91, bio: "Sabermetrics enthusiast. Dodgers or nothing 💙" },
  { id: 4, name: "Maya P.", age: 29, location: "Pasadena, LA", photo: "/images/life-basketball-sanaa.jpg", sports: ["Tennis", "Golf", "Swimming"], vibe: "Casual Fan", compat: 78, bio: "Love watching sports with good company 🎾" },
  { id: 5, name: "Rachel K.", age: 26, location: "Venice, LA", photo: "/images/reggaeton-superbowl-party.jpg", sports: ["Football", "MMA", "Boxing"], vibe: "Tailgate Queen", compat: 85, bio: "Super Bowl Sunday is my holiday 🏈" },
];

const MATCHES = [
  { id: 101, name: "Emma J.", photo: "/images/angel-city-fc-opener.jpg", time: "2 days ago" },
  { id: 102, name: "Lisa C.", photo: "/images/world-cup-la-preview.jpg", time: "1 week ago" },
];

const Discover = () => {
  const [idx, setIdx] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null);
  const [matchesOpen, setMatchesOpen] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const profile = PROFILES[idx % PROFILES.length];
  const nextProfile = PROFILES[(idx + 1) % PROFILES.length];

  const swipe = useCallback((dir: "left" | "right" | "super") => {
    setSwipeDir(dir === "super" ? "right" : dir);
    setTimeout(() => {
      if (dir !== "left" && Math.random() > 0.5) {
        setShowMatch(true);
        setTimeout(() => setShowMatch(false), 2500);
      }
      setSwipeDir(null);
      setIdx((p) => p + 1);
    }, 300);
  }, []);

  const onDragEnd = useCallback((_: any, info: any) => {
    if (info.offset.x > 100) swipe("right");
    else if (info.offset.x < -100) swipe("left");
  }, [swipe]);

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
              <span className="text-sm font-semibold font-sans">{MATCHES.length} Matches</span>
            </Button>
          </div>

          <div className="flex gap-8">
            {/* SWIPE STACK */}
            <div className="flex-1 flex flex-col items-center">
              <div className="relative w-full max-w-sm h-[520px] mx-auto">
                {/* Background card */}
                <div className="absolute inset-0 scale-[0.95] opacity-50">
                  <Card className="w-full h-full overflow-hidden border-border/30">
                    <img src={nextProfile.photo} alt="" className="w-full h-full object-cover" />
                  </Card>
                </div>

                {/* Active card */}
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
                      scale: 1,
                      opacity: 1,
                      x: swipeDir === "right" ? 500 : swipeDir === "left" ? -500 : 0,
                    }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="w-full h-full overflow-hidden border-border/30 relative">
                      <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />

                      {/* LIKE stamp */}
                      <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-6 border-4 border-success text-success font-condensed text-4xl font-bold uppercase px-4 py-1 rounded-lg rotate-[-15deg]">
                        LIKE
                      </motion.div>

                      {/* NOPE stamp */}
                      <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 right-6 border-4 border-destructive text-destructive font-condensed text-4xl font-bold uppercase px-4 py-1 rounded-lg rotate-[15deg]">
                        NOPE
                      </motion.div>

                      {/* Info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent p-5 pt-20">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-[10px] font-bold ${VIBE_COLORS[profile.vibe]} rounded-full`}>
                            {profile.vibe}
                          </Badge>
                          <Badge className="bg-card/20 text-card text-[10px] font-bold rounded-full backdrop-blur-sm">
                            <Sparkles className="w-3 h-3 mr-1" />{profile.compat}% Match
                          </Badge>
                        </div>
                        <h3 className="text-card font-condensed text-2xl font-bold uppercase">
                          {profile.name}, {profile.age}
                        </h3>
                        <p className="text-card/70 text-sm flex items-center gap-1 mt-1 font-sans">
                          <MapPin className="w-3 h-3" /> {profile.location}
                        </p>
                        <p className="text-card/80 text-sm mt-2 font-sans">{profile.bio}</p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {profile.sports.map((s) => (
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

              {/* ACTION BUTTONS */}
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
                    <div className="space-y-3">
                      {MATCHES.map((m) => (
                        <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 cursor-pointer transition-colors">
                          <img src={m.photo} alt={m.name} className="w-12 h-12 rounded-full object-cover" />
                          <div>
                            <p className="font-semibold text-sm font-sans">{m.name}</p>
                            <p className="text-xs text-muted-foreground font-sans">{m.time}</p>
                          </div>
                          <MessageCircle className="w-4 h-4 text-muted-foreground ml-auto" />
                        </div>
                      ))}
                    </div>
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
                <p className="text-primary-foreground/80 text-lg font-sans">You and {profile.name} both swiped right!</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Discover;
