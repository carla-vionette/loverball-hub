import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Bell, Check, Search, X } from "lucide-react";
import loverballLogo from "@/assets/loverball-script-logo.png";
import { SPORTS_OPTIONS } from "@/lib/onboardingOptions";
import { LA_PRO_TEAMS, LA_D1_COLLEGES } from "@/lib/laTeamsConfig";

// ── Sports chips with emojis ──
const SPORT_CHIPS = [
  { label: "WNBA", emoji: "🏀" },
  { label: "NWSL", emoji: "⚽" },
  { label: "WTA", emoji: "🎾" },
  { label: "NFL", emoji: "🏈" },
  { label: "Soccer", emoji: "⚽" },
  { label: "NBA", emoji: "🏀" },
  { label: "Volleyball", emoji: "🏐" },
  { label: "Hockey", emoji: "🏒" },
  { label: "Rugby", emoji: "🏉" },
  { label: "Olympics", emoji: "🏅" },
  { label: "Tennis", emoji: "🎾" },
  { label: "MLB", emoji: "⚾" },
  { label: "MLS", emoji: "⚽" },
  { label: "Track & Field", emoji: "🏃‍♀️" },
  { label: "Swimming", emoji: "🏊‍♀️" },
  { label: "Gymnastics", emoji: "🤸‍♀️" },
  { label: "Boxing", emoji: "🥊" },
  { label: "Formula 1", emoji: "🏎️" },
  { label: "Surfing", emoji: "🏄‍♀️" },
  { label: "Golf", emoji: "⛳" },
];

// ── All teams from config ──
const ALL_TEAMS = [
  ...LA_PRO_TEAMS.map(t => ({ name: t.name, shortName: t.shortName, sport: t.sport, league: t.league })),
  ...LA_D1_COLLEGES.map(t => ({ name: t.name, shortName: t.shortName, sport: "College", league: t.conference })),
];

// ── Suggested accounts (mock for now) ──
const SUGGESTED_ACCOUNTS = [
  { id: "s1", name: "Loverball", bio: "Official account", avatar: null },
  { id: "s2", name: "SportsGirl LA", bio: "Women's sports content creator", avatar: null },
  { id: "s3", name: "Game Day Queen", bio: "Tailgating & watch parties", avatar: null },
  { id: "s4", name: "Court Side Chronicles", bio: "WNBA & NBA coverage", avatar: null },
  { id: "s5", name: "Goal Getter", bio: "NWSL & soccer fan", avatar: null },
  { id: "s6", name: "The Sports Bestie", bio: "Your sports-loving best friend", avatar: null },
  { id: "s7", name: "Pitch Perfect", bio: "Soccer culture & highlights", avatar: null },
  { id: "s8", name: "Stadium Foodie", bio: "Best eats at every venue", avatar: null },
];

const VALUE_PROPS = [
  "Connect with fans like you",
  "Never miss a game",
  "Exclusive content & events",
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

const Onboarding = () => {
  const [screen, setScreen] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Value prop carousel
  const [vpIndex, setVpIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setVpIndex(i => (i + 1) % VALUE_PROPS.length), 3000);
    return () => clearInterval(t);
  }, []);

  // Screen 2 - Sign Up
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showConfirmEmail, setShowConfirmEmail] = useState(false);

  // Screen 3 - Sports
  const [selectedSports, setSelectedSports] = useState<string[]>([]);

  // Screen 4 - Teams
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [teamSearch, setTeamSearch] = useState("");

  // Screen 5 - Follows
  const [followedAccounts, setFollowedAccounts] = useState<string[]>([]);

  // Check auth on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setScreen(3); // Skip splash + signup if already authenticated
      }
    });
  }, []);

  const goNext = () => { setDirection(1); setScreen(s => s + 1); };
  const goBack = () => { setDirection(-1); setScreen(s => s - 1); };

  const toggleSport = (sport: string) => {
    setSelectedSports(prev => prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]);
  };

  const toggleTeam = (team: string) => {
    setSelectedTeams(prev => prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]);
  };

  const toggleFollow = (id: string) => {
    setFollowedAccounts(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const followAll = () => {
    setFollowedAccounts(SUGGESTED_ACCOUNTS.map(a => a.id));
  };

  // Filter teams based on selected sports + search
  const filteredTeams = ALL_TEAMS.filter(t => {
    const matchesSearch = !teamSearch || t.name.toLowerCase().includes(teamSearch.toLowerCase()) || t.shortName.toLowerCase().includes(teamSearch.toLowerCase());
    return matchesSearch;
  });

  // Save sports to profile
  const saveSports = async () => {
    if (!userId) return;
    await supabase.from("profiles").update({ favorite_sports: selectedSports }).eq("id", userId);
  };

  // Save teams to profile
  const saveTeams = async () => {
    if (!userId) return;
    await supabase.from("profiles").update({ favorite_teams_players: selectedTeams }).eq("id", userId);
  };

  // Complete onboarding
  const completeOnboarding = async () => {
    if (!userId) return;
    await supabase.from("profiles").update({ has_completed_onboarding: true } as any).eq("id", userId);
  };

  // Handle email signup
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/onboarding` },
      });
      if (error) throw error;
      if (data.user && !data.session) {
        setShowConfirmEmail(true);
      } else if (data.user) {
        setUserId(data.user.id);
        // Create profile stub
        await supabase.from("profiles").upsert({ id: data.user.id, name: email.split("@")[0] } as any, { onConflict: "id" });
        goNext();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/onboarding`,
    });
    if (error) toast({ title: "Error", description: String(error), variant: "destructive" });
  };

  const handleAppleAuth = async () => {
    const { error } = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: `${window.location.origin}/onboarding`,
    });
    if (error) toast({ title: "Error", description: String(error), variant: "destructive" });
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={screen}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="min-h-screen"
        >

          {/* ── Screen 1: Splash / Value Prop ── */}
          {screen === 1 && (
            <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-6 text-center">
              <motion.img
                src={loverballLogo}
                alt="Loverball"
                className="w-56 md:w-72 h-auto mb-8 brightness-0 invert"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              />

              <motion.h1
                className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Her Game. Her Community.
              </motion.h1>

              <motion.div
                className="h-8 mb-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <AnimatePresence mode="wait">
                  <motion.p
                    key={vpIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="text-primary-foreground/80 text-sm"
                  >
                    {VALUE_PROPS[vpIndex]}
                  </motion.p>
                </AnimatePresence>
              </motion.div>

              <motion.div className="w-full max-w-xs space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                <Button
                  onClick={goNext}
                  className="w-full h-12 rounded-full bg-white text-primary font-bold text-sm tracking-wider hover:bg-white/90"
                >
                  Sign Up
                </Button>
                <button
                  onClick={() => navigate("/auth")}
                  className="text-primary-foreground/70 text-sm hover:text-primary-foreground transition-colors"
                >
                  Log In
                </button>
              </motion.div>
            </div>
          )}

          {/* ── Screen 2: Sign Up ── */}
          {screen === 2 && (
            <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
              <div className="w-full max-w-sm">
                <img src={loverballLogo} alt="Loverball" className="h-16 w-auto mx-auto mb-8" />

                {showConfirmEmail ? (
                  <div className="text-center space-y-4">
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Check Your Email</h2>
                    <p className="text-sm text-muted-foreground">We sent a confirmation link to <span className="font-semibold text-foreground">{email}</span>.</p>
                    <button onClick={() => setShowConfirmEmail(false)} className="text-primary text-sm hover:underline">Try again</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Apple */}
                    <Button
                      onClick={handleAppleAuth}
                      className="w-full h-12 rounded-xl bg-black text-white font-semibold text-sm hover:bg-black/90"
                    >
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.52-3.23 0-1.44.62-2.2.44-3.06-.4C3.79 16.17 4.36 9.94 8.73 9.71c1.27.07 2.15.72 2.91.76.91-.18 1.79-.88 3.13-.75 1.58.15 2.73.9 3.44 2.27-3.17 1.9-2.42 6.07.66 7.23-.57 1.43-1.3 2.84-1.82 3.06zM12.05 9.65C11.85 7.58 13.49 5.87 15.45 5.7c.3 2.34-2.09 4.1-3.4 3.95z"/></svg>
                      Continue with Apple
                    </Button>

                    {/* Google */}
                    <Button
                      onClick={handleGoogleAuth}
                      variant="outline"
                      className="w-full h-12 rounded-xl border-border font-semibold text-sm"
                    >
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Continue with Google
                    </Button>

                    <div className="relative my-6">
                      <Separator />
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">or</span>
                    </div>

                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
                        <Input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="h-11 rounded-xl" placeholder="you@email.com" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Password</Label>
                        <Input value={password} onChange={e => setPassword(e.target.value)} type="password" required minLength={6} className="h-11 rounded-xl" placeholder="Min 6 characters" />
                      </div>
                      <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-semibold text-sm">
                        {loading ? "Creating account..." : "Sign Up"}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground pt-2">
                      Already have an account?{" "}
                      <button onClick={() => navigate("/auth")} className="text-primary font-medium hover:underline">Log In</button>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Screen 3: Pick Your Sports ── */}
          {screen === 3 && (
            <div className="min-h-screen flex flex-col px-6 py-12">
              <div className="max-w-lg mx-auto w-full flex-1">
                <ProgressDots current={1} total={5} />
                <h1 className="text-2xl font-bold text-foreground mt-6 mb-1">What sports do you love?</h1>
                <p className="text-sm text-muted-foreground mb-6">Select all that apply.</p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {SPORT_CHIPS.map(chip => {
                    const selected = selectedSports.includes(chip.label);
                    return (
                      <button
                        key={chip.label}
                        onClick={() => toggleSport(chip.label)}
                        className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all border ${
                          selected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {chip.emoji} {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="max-w-lg mx-auto w-full space-y-2 pb-6">
                <Button
                  onClick={async () => { await saveSports(); goNext(); }}
                  disabled={selectedSports.length === 0}
                  className="w-full h-12 rounded-xl font-semibold"
                >
                  Continue
                </Button>
                <button onClick={goNext} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">Skip</button>
              </div>
            </div>
          )}

          {/* ── Screen 4: Pick Your Teams ── */}
          {screen === 4 && (
            <div className="min-h-screen flex flex-col px-6 py-12">
              <div className="max-w-lg mx-auto w-full flex-1">
                <ProgressDots current={2} total={5} />
                <h1 className="text-2xl font-bold text-foreground mt-6 mb-1">Follow your favorite teams</h1>
                <p className="text-sm text-muted-foreground mb-4">Tap to select.</p>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={teamSearch}
                    onChange={e => setTeamSearch(e.target.value)}
                    placeholder="Search teams..."
                    className="pl-9 h-10 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pb-4">
                  {filteredTeams.map(team => {
                    const selected = selectedTeams.includes(team.shortName);
                    return (
                      <button
                        key={team.shortName}
                        onClick={() => toggleTeam(team.shortName)}
                        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                          selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                        }`}
                      >
                        {selected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {team.shortName.slice(0, 2)}
                        </div>
                        <span className="text-[11px] font-medium text-foreground text-center leading-tight line-clamp-2">
                          {team.shortName}
                        </span>
                        <span className="text-[9px] text-muted-foreground">{team.league}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="max-w-lg mx-auto w-full space-y-2 pb-6">
                <Button onClick={async () => { await saveTeams(); goNext(); }} className="w-full h-12 rounded-xl font-semibold">
                  Continue
                </Button>
                <button onClick={goNext} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">Skip</button>
              </div>
            </div>
          )}

          {/* ── Screen 5: Suggested Follows ── */}
          {screen === 5 && (
            <div className="min-h-screen flex flex-col px-6 py-12">
              <div className="max-w-lg mx-auto w-full flex-1">
                <ProgressDots current={3} total={5} />
                <div className="flex items-center justify-between mt-6 mb-4">
                  <h1 className="text-2xl font-bold text-foreground">Creators & fans to follow</h1>
                  <button onClick={followAll} className="text-primary text-sm font-medium hover:underline">Follow All</button>
                </div>

                <div className="space-y-1">
                  {SUGGESTED_ACCOUNTS.map(account => {
                    const isFollowed = followedAccounts.includes(account.id);
                    return (
                      <div key={account.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/[0.03] transition-colors">
                        <Avatar className="w-11 h-11">
                          <AvatarFallback className="bg-primary/15 text-primary font-bold text-sm">
                            {account.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{account.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{account.bio}</p>
                        </div>
                        <Button
                          variant={isFollowed ? "secondary" : "default"}
                          size="sm"
                          className="rounded-full text-xs h-8 px-4"
                          onClick={() => toggleFollow(account.id)}
                        >
                          {isFollowed ? "Following" : "Follow"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="max-w-lg mx-auto w-full space-y-2 pb-6">
                <Button onClick={goNext} className="w-full h-12 rounded-xl font-semibold">Continue</Button>
                <button onClick={goNext} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">Skip</button>
              </div>
            </div>
          )}

          {/* ── Screen 6: Notifications ── */}
          {screen === 6 && (
            <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
              <div className="max-w-sm text-center">
                <ProgressDots current={4} total={5} />
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mt-8 mb-6">
                  <Bell className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-3">Stay in the game</h1>
                <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                  Get notified about game scores, events near you, and posts from people you follow.
                </p>

                <div className="space-y-3">
                  <Button
                    onClick={async () => {
                      // Request notification permission
                      if ("Notification" in window) {
                        await Notification.requestPermission();
                      }
                      goNext();
                    }}
                    className="w-full h-12 rounded-xl font-semibold"
                  >
                    Allow Notifications
                  </Button>
                  <button onClick={goNext} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
                    Not Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Screen 7: Welcome → Home ── */}
          {screen === 7 && (
            <WelcomeRedirect completeOnboarding={completeOnboarding} navigate={navigate} />
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ── Progress dots component ──
const ProgressDots = ({ current, total }: { current: number; total: number }) => (
  <div className="flex gap-1.5 justify-center">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`h-1.5 rounded-full transition-all duration-300 ${
          i + 1 <= current ? "bg-primary w-6" : "bg-border w-1.5"
        }`}
      />
    ))}
  </div>
);

// ── Screen 7: Complete and redirect ──
const WelcomeRedirect = ({ completeOnboarding, navigate }: { completeOnboarding: () => Promise<void>; navigate: (path: string) => void }) => {
  useEffect(() => {
    completeOnboarding().then(() => {
      // Store welcome banner flag
      sessionStorage.setItem("loverball_show_welcome", "true");
      navigate("/home");
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome to Loverball!</h1>
          <p className="text-sm text-muted-foreground mt-2">Setting up your feed...</p>
        </motion.div>
      </div>
    </div>
  );
};

export default Onboarding;
