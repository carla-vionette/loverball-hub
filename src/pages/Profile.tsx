import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Edit, Sparkles, LogOut, Calendar, Clock, TrendingUp, TrendingDown, Trophy, Flame, Bookmark, BookOpen, Award, ChevronRight, ArrowUpRight, Share2, AlertTriangle, Ticket, Play, Eye, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import MobileHeader from "@/components/MobileHeader";
import DesktopNav from "@/components/DesktopNav";
import BottomNav from "@/components/BottomNav";

import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  TEAM_PERFORMANCE,
  generateStreakData, RECENT_ACTIVITY, RECOMMENDED_ARTICLES,
} from "@/lib/mockStatsData";

type ProfileData = {
  id: string;
  name: string;
  pronouns: string | null;
  city: string | null;
  age_range: string | null;
  favorite_sports: string[] | null;
  favorite_teams_players: string[] | null;
  sports_experience_types: string[] | null;
  other_interests: string[] | null;
  event_comfort_level: string | null;
  participation_preferences: string[] | null;
  bio: string | null;
  profile_photo_url: string | null;
  birthday: string | null;
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

type SuggestedEvent = {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  venue_name: string | null;
  city: string | null;
  image_url: string | null;
};

// --- Zodiac helpers ---
const ZODIAC_SIGNS = [
  { name: "Capricorn", symbol: "♑", element: "earth", dates: [{ m: 12, d: 22 }, { m: 1, d: 19 }] },
  { name: "Aquarius", symbol: "♒", element: "air", dates: [{ m: 1, d: 20 }, { m: 2, d: 18 }] },
  { name: "Pisces", symbol: "♓", element: "water", dates: [{ m: 2, d: 19 }, { m: 3, d: 20 }] },
  { name: "Aries", symbol: "♈", element: "fire", dates: [{ m: 3, d: 21 }, { m: 4, d: 19 }] },
  { name: "Taurus", symbol: "♉", element: "earth", dates: [{ m: 4, d: 20 }, { m: 5, d: 20 }] },
  { name: "Gemini", symbol: "♊", element: "air", dates: [{ m: 5, d: 21 }, { m: 6, d: 20 }] },
  { name: "Cancer", symbol: "♋", element: "water", dates: [{ m: 6, d: 21 }, { m: 7, d: 22 }] },
  { name: "Leo", symbol: "♌", element: "fire", dates: [{ m: 7, d: 23 }, { m: 8, d: 22 }] },
  { name: "Virgo", symbol: "♍", element: "earth", dates: [{ m: 8, d: 23 }, { m: 9, d: 22 }] },
  { name: "Libra", symbol: "♎", element: "air", dates: [{ m: 9, d: 23 }, { m: 10, d: 22 }] },
  { name: "Scorpio", symbol: "♏", element: "water", dates: [{ m: 10, d: 23 }, { m: 11, d: 21 }] },
  { name: "Sagittarius", symbol: "♐", element: "fire", dates: [{ m: 11, d: 22 }, { m: 12, d: 21 }] },
];

const ELEMENT_GRADIENTS: Record<string, string> = {
  fire: "from-red-500/20 via-orange-400/10 to-yellow-500/5",
  earth: "from-emerald-600/20 via-green-500/10 to-lime-400/5",
  air: "from-sky-500/20 via-blue-400/10 to-indigo-300/5",
  water: "from-blue-600/20 via-cyan-500/10 to-teal-400/5",
};

const HOROSCOPE_MESSAGES: Record<string, string> = {
  Aries: "Bold energy fuels your day. A surprise connection through sports could open a new door.",
  Taurus: "Steady wins the race today. Your loyalty to your favorite team mirrors your approach to life.",
  Gemini: "Your social butterfly energy is at a peak. Multiple conversations lead to one meaningful connection.",
  Cancer: "Home court advantage is yours today. Nurture your inner circle and watch your community grow.",
  Leo: "You're the MVP today. Your confidence attracts attention and your leadership shines.",
  Virgo: "Details matter today. Your analytical eye catches something others miss.",
  Libra: "Balance is your superpower. A partnership opportunity arises that aligns with your values.",
  Scorpio: "Intensity drives your focus. Go deep on something you're passionate about.",
  Sagittarius: "Adventure calls! Explore a new sport or attend an event outside your comfort zone.",
  Capricorn: "Discipline meets opportunity. Your hard work in building community connections starts to pay dividends.",
  Aquarius: "Innovation is your theme. A unique idea for bringing fans together sparks excitement.",
  Pisces: "Intuition guides your game today. Creative expression through sports brings unexpected fulfillment.",
};

function getZodiacSign(birthday: string | null) {
  if (!birthday) return null;
  const date = new Date(birthday);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  for (const sign of ZODIAC_SIGNS) {
    const [start, end] = sign.dates;
    if (sign.name === "Capricorn") {
      if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return sign;
    } else if ((month === start.m && day >= start.d) || (month === end.m && day <= end.d)) {
      return sign;
    }
  }
  return ZODIAC_SIGNS[0];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const HEATMAP_COLORS = ["bg-border", "bg-primary/20", "bg-primary/40", "bg-primary/70", "bg-primary"];
const DAYS_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const FullBio = ({ bio }: { bio: string }) => {
  return (
    <div className="flex items-start gap-2 p-4 bg-primary/5 rounded-xl border border-primary/10 w-full md:flex-1">
      <Sparkles className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm whitespace-pre-line leading-relaxed">{bio}</p>
      </div>
    </div>
  );
};

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-primary">{payload[0].value} articles</p>
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-foreground">{payload[0].name}</p>
      <p className="text-primary">{payload[0].value}%</p>
    </div>
  );
};

const Profile = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [rsvpEvents, setRsvpEvents] = useState<RSVPEvent[]>([]);
  const [suggestedEvents, setSuggestedEvents] = useState<SuggestedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out", description: "You have been logged out successfully." });
    navigate("/");
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/auth"); return; }

        const [profileResult, rsvpResult, suggestedResult] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase.from("event_rsvps").select(`id, status, event:events (id, title, event_date, event_time, venue_name, city, image_url)`).eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("events").select("id, title, event_date, event_time, venue_name, city, image_url").gte("event_date", new Date().toISOString().split("T")[0]).eq("status", "published").order("event_date", { ascending: true }).limit(4),
        ]);

        if (profileResult.error || !profileResult.data) { navigate("/onboarding"); return; }

        setProfile(profileResult.data);
        if (rsvpResult.data) {
          setRsvpEvents(rsvpResult.data.filter(r => r.event !== null) as RSVPEvent[]);
        }
        if (suggestedResult.data) setSuggestedEvents(suggestedResult.data);
      } catch { navigate("/onboarding"); } finally { setLoading(false); }
    };
    fetchProfile();
  }, [navigate, toast]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const streakData = useMemo(() => generateStreakData(), []);

  
  const activePerfTeams = TEAM_PERFORMANCE.filter(t => t.winPct > 0);
  const combinedWinPct = activePerfTeams.length > 0 ? activePerfTeams.reduce((s, t) => s + t.winPct, 0) / activePerfTeams.length : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader />
        <DesktopNav />
        <BottomNav />
        <main className="md:ml-64 pb-20 md:pb-8 pt-[92px] md:pt-[48px]">
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-muted" />
              <div className="flex-1 space-y-3">
                <div className="h-6 w-40 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-24 bg-muted rounded-xl" />
              <div className="h-24 bg-muted rounded-xl" />
            </div>
            <div className="h-32 bg-muted rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!profile) return null;

  const initials = profile.name.split(" ").map(n => n[0]).join("").toUpperCase();
  const locationText = profile.city || "Location not set";
  const zodiac = getZodiacSign(profile.birthday);
  const greeting = getGreeting();
  const userName = profile.name?.split(" ")[0] || "there";
  const formattedDate = currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const formattedTime = currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pb-20 md:pb-8 pt-[92px] md:pt-[48px]">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">

            {/* GREETING HEADER */}
            <motion.div variants={staggerItem} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-sans text-foreground">{greeting}, {userName}!</h1>
                <p className="text-sm text-muted-foreground">{formattedDate} · {formattedTime}</p>
              </div>
            </motion.div>

            {/* PROFILE HEADER CARD */}
            <motion.div variants={staggerItem}>
              <Card className="overflow-hidden">
                <CardContent className="pt-8 pb-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-5">
                    <div className="flex items-start gap-4 md:gap-5">
                      <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-accent/30 flex-shrink-0">
                        {profile.profile_photo_url ? (
                          <AvatarImage src={profile.profile_photo_url} alt={profile.name} className="object-cover" />
                        ) : null}
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl md:text-2xl font-sans">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2 md:mb-3">
                          <div>
                            <h2 className="text-xl md:text-2xl font-sans font-semibold">{profile.name}</h2>
                            {profile.pronouns && <p className="text-sm text-muted-foreground">{profile.pronouns}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 md:mb-4">
                          <MapPin className="w-4 h-4 text-primary/70 flex-shrink-0" />
                          <span className="truncate">{locationText}</span>
                          
                        </div>
                        <div className="flex items-center gap-2 md:hidden">
                          <Button variant="outline" size="sm" onClick={() => navigate("/profile/edit")} className="rounded-full"><Edit className="w-4 h-4 mr-1" />Edit</Button>
                          <Button variant="outline" size="sm" onClick={handleLogout} className="text-destructive hover:text-destructive rounded-full"><LogOut className="w-4 h-4" /></Button>
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate("/profile/edit")} className="rounded-full"><Edit className="w-4 h-4 mr-2" />Edit</Button>
                        <Button variant="outline" size="sm" onClick={handleLogout} className="text-destructive hover:text-destructive rounded-full"><LogOut className="w-4 h-4 mr-2" />Logout</Button>
                      </div>
                    </div>
                    {profile.bio && (
                      <FullBio bio={profile.bio} />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* STATS OVERVIEW CARDS */}
            <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3">
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <Trophy className="w-4 h-4 text-primary" />
                    {combinedWinPct >= 0.5 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : <TrendingDown className="w-3.5 h-3.5 text-destructive" />}
                  </div>
                  <p className="text-2xl font-sans font-bold text-foreground">{(combinedWinPct * 100).toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Team Win Rate</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <Flame className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-2xl font-sans font-bold text-foreground">{streakData.currentStreak}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* HOROSCOPE PREVIEW */}
            {zodiac && (
              <motion.div variants={staggerItem}>
                <Card className="overflow-hidden border-border/50">
                  <div className={`bg-gradient-to-br ${ELEMENT_GRADIENTS[zodiac.element]} p-5`}>
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{zodiac.symbol}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-sans text-base text-foreground">{zodiac.name}</h3>
                          <Badge variant="outline" className="text-[10px] rounded-none capitalize">{zodiac.element}</Badge>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2">{HOROSCOPE_MESSAGES[zodiac.name]}</p>
                        <Button variant="link" className="px-0 mt-1 text-primary h-auto text-xs gap-1" onClick={() => navigate("/horoscope")}>
                          Read Full Horoscope <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* MY INTERESTS LINK */}
            <motion.div variants={staggerItem}>
              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/profile/interests")}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">My Interests</p>
                    <p className="text-sm text-muted-foreground">Teams, sports, experiences & more</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </motion.div>




            {/* ENGAGEMENT STREAK */}
            <motion.div variants={staggerItem}>
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium tracking-wider uppercase text-foreground/60">Engagement Streak</CardTitle>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1 hover:bg-primary/10"><Flame className="w-3 h-3" /> {streakData.currentStreak} day streak</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Award className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs text-muted-foreground">Best: {streakData.bestStreak} days</span>
                  </div>
                  <div className="overflow-x-auto">
                    <div className="flex gap-1">
                      <div className="flex flex-col gap-1 mr-1">
                        {DAYS_LABELS.map((d, i) => (
                          <div key={i} className="h-3.5 w-3 flex items-center justify-center">
                            <span className="text-[8px] text-muted-foreground">{i % 2 === 1 ? d : ""}</span>
                          </div>
                        ))}
                      </div>
                      {streakData.weeks.map((week, wi) => (
                        <div key={wi} className="flex flex-col gap-1">
                          {week.map((day, di) => (
                            <div key={di} className={`h-3.5 w-3.5 rounded-sm transition-colors ${day.level < 0 ? "bg-transparent" : HEATMAP_COLORS[day.level]}`} title={day.level >= 0 ? `${day.date}: ${day.level} activities` : ""} />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-3 justify-end">
                    <span className="text-[9px] text-muted-foreground mr-1">Less</span>
                    {HEATMAP_COLORS.map((c, i) => <div key={i} className={`h-3 w-3 rounded-sm ${c}`} />)}
                    <span className="text-[9px] text-muted-foreground ml-1">More</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* FAVORITE TEAMS PERFORMANCE */}
            <motion.div variants={staggerItem}>
              <Card className="border-border/50">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium tracking-wider uppercase text-foreground/60">Favorite Teams Performance</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {TEAM_PERFORMANCE.map(team => (
                      <div
                        key={team.name}
                        className="flex items-center gap-3 px-4 sm:px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/team/${team.slug}`)}
                      >
                        <img src={team.logo} alt={team.name} className="w-10 h-10 object-contain rounded-sm bg-white p-0.5" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{team.name}</span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-sm">{team.league}</Badge>
                            {team.injuryNote && (
                              <span title={team.injuryNote}>
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{team.leadingScorer}</p>
                          <p className="text-xs text-muted-foreground">{team.nextGame}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className={`text-sm font-sans font-bold ${team.winPct > 0.5 ? "text-emerald-600" : team.winPct > 0 && team.winPct < 0.5 ? "text-destructive" : "text-foreground"}`}>{team.record}</p>
                          {team.last5.length > 0 && (
                            <div className="flex gap-0.5">
                              {team.last5.map((win, i) => <div key={i} className={`w-2 h-2 rounded-full ${win ? "bg-emerald-500" : "bg-destructive/60"}`} />)}
                            </div>
                          )}
                          {team.nextGame !== "Offseason" && !team.nextGame.startsWith("Season") && (
                            <div className="flex gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-2 rounded-full gap-1"
                                onClick={(e) => { e.stopPropagation(); window.open(team.ticketUrl, '_blank'); }}
                              >
                                <Ticket className="w-3 h-3" /> Tickets
                              </Button>
                              <Button
                                size="sm"
                                className="h-6 text-[10px] px-2 rounded-full gap-1"
                                onClick={(e) => { e.stopPropagation(); }}
                              >
                                <Play className="w-3 h-3" /> Watch
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* MY RSVPED EVENTS */}
            {rsvpEvents.length > 0 && (
              <motion.div variants={staggerItem}>
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />My Events</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {rsvpEvents.map(rsvp => (
                        <div key={rsvp.id} className="p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/events")}>
                          {rsvp.event.image_url ? <img src={rsvp.event.image_url} alt={rsvp.event.title} className="w-full h-32 object-cover rounded-md mb-3" /> : <div className="w-full h-32 bg-muted rounded-md mb-3 flex items-center justify-center"><Calendar className="w-8 h-8 text-muted-foreground" /></div>}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{rsvp.event.title}</p>
                              <p className="text-sm text-muted-foreground">{rsvp.event.venue_name || rsvp.event.city || "Location TBD"}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" /><span>{format(new Date(rsvp.event.event_date), "MMM d, yyyy")}</span>
                                {rsvp.event.event_time && (<><Clock className="w-3 h-3 ml-1" /><span>{rsvp.event.event_time}</span></>)}
                              </div>
                            </div>
                            <Badge variant={rsvp.status === "confirmed" ? "default" : "secondary"} className="text-xs">{rsvp.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* RECOMMENDED EVENTS */}
            {suggestedEvents.length > 0 && (
              <motion.div variants={staggerItem}>
                <Card>
                  <CardHeader><CardTitle>Recommended Events for You</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {suggestedEvents.map(event => (
                        <div key={event.id} className="p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(`/event/${event.id}`)}>
                          {event.image_url ? <img src={event.image_url} alt={event.title} className="w-full h-32 object-cover rounded-md mb-3" /> : <div className="w-full h-32 bg-muted rounded-md mb-3 flex items-center justify-center"><Calendar className="w-8 h-8 text-muted-foreground" /></div>}
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">{event.venue_name || event.city || "Location TBD"} • {format(new Date(event.event_date), "MMM d")}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* RECENT ACTIVITY FEED */}
            <motion.div variants={staggerItem}>
              <Card className="border-border/50">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium tracking-wider uppercase text-foreground/60">Recent Activity</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="all" className="w-full">
                    <div className="px-4 sm:px-6 pt-2 pb-1">
                      <TabsList className="h-8 w-full justify-start">
                        <TabsTrigger value="all" className="text-xs px-3 h-7">All</TabsTrigger>
                        <TabsTrigger value="read" className="text-xs px-3 h-7">Read</TabsTrigger>
                        <TabsTrigger value="bookmark" className="text-xs px-3 h-7">Bookmarked</TabsTrigger>
                        <TabsTrigger value="shared" className="text-xs px-3 h-7">Shared</TabsTrigger>
                      </TabsList>
                    </div>
                    {["all", "read", "bookmark", "shared"].map(tab => (
                      <TabsContent key={tab} value={tab} className="mt-0">
                        <div className="divide-y divide-border">
                          {RECENT_ACTIVITY.filter(a => tab === "all" || a.type === tab).map((activity, i) => (
                            <div key={i} className="flex items-start gap-3 px-4 sm:px-6 py-3 hover:bg-muted/30 transition-colors cursor-pointer group">
                              {activity.thumbnail ? (
                                <img src={activity.thumbnail} alt="" className="w-14 h-10 object-cover rounded-md mt-0.5 flex-shrink-0" />
                              ) : (
                                <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${activity.type === "read" ? "bg-primary/10" : activity.type === "shared" ? "bg-accent/20" : "bg-secondary"}`}>
                                  {activity.type === "read" ? <BookOpen className="w-3 h-3 text-primary" /> : activity.type === "shared" ? <Share2 className="w-3 h-3 text-accent-foreground" /> : <Bookmark className="w-3 h-3 text-foreground/60" />}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground leading-snug group-hover:text-primary transition-colors">
                                  <span className="text-muted-foreground capitalize">{activity.type}:</span>{" "}
                                  <span className="font-medium">{activity.title}</span>
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="w-3 h-3" />{activity.reads}</span>
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Bookmark className="w-3 h-3" />{activity.bookmarks}</span>
                                </div>
                              </div>
                              <ArrowUpRight className="w-3.5 h-3.5 text-foreground/20 mt-1 shrink-0 group-hover:text-primary transition-colors" />
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>

            {/* BECAUSE YOU READ... RECOMMENDATIONS */}
            <motion.div variants={staggerItem}>
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium tracking-wider uppercase text-foreground/60 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-primary" /> Recommended for You
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {RECOMMENDED_ARTICLES.map((rec, i) => (
                      <div key={i} className="px-4 sm:px-6 py-3 hover:bg-muted/30 transition-colors cursor-pointer group">
                        <p className="text-[10px] text-muted-foreground mb-0.5">Because you read "{rec.basedOn.length > 50 ? rec.basedOn.slice(0, 50) + '…' : rec.basedOn}"</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{rec.title}</p>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-2 shrink-0"><Eye className="w-3 h-3" />{rec.reads}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
