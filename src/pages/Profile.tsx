import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Edit, Sparkles, LogOut, Calendar, Clock, TrendingUp, TrendingDown, Trophy, Flame, Bookmark, BookOpen, Award, ChevronRight, ChevronDown, ArrowUpRight, Share2, AlertTriangle, Ticket, Play, Eye, Lightbulb, Settings, Heart, MessageCircle, Loader2, ExternalLink, Newspaper, Zap, RefreshCw } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
} from "@/lib/mockStatsData";
import { getTeamWatchUrl, getTeamTicketsUrl } from "@/lib/teamLinksMap";



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
  fire: "from-primary/20 via-primary/10 to-transparent",
  earth: "from-accent/20 via-accent/10 to-transparent",
  air: "from-accent/15 via-primary/10 to-transparent",
  water: "from-accent/20 via-accent/10 to-transparent",
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

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};


const Profile = () => {
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const [recEventsOpen, setRecEventsOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [rsvpEvents, setRsvpEvents] = useState<RSVPEvent[]>([]);
  const [suggestedEvents, setSuggestedEvents] = useState<SuggestedEvent[]>([]);
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const goTo = (path: string) => { window.location.href = path; };
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out", description: "You have been logged out successfully." });
    goTo("/");
  };

  // Fetch feed items from real RSS via edge function
  const refreshFeed = async () => {
    setFeedLoading(true);
    try {
      // Call edge function to refresh RSS articles
      await supabase.functions.invoke('fetch-sports-news');
    } catch (err) {
      console.warn('Feed refresh failed:', err);
    }
    // Fetch from DB (no 36h filter - show all recent articles)
    const { data } = await supabase
      .from("feed_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setFeedItems(data);
    setFeedLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) { if (!cancelled) goTo("/auth"); return; }

        const [profileResult, rsvpResult, suggestedResult] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase.from("event_rsvps").select(`id, status, event:events (id, title, event_date, event_time, venue_name, city, image_url)`).eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("events").select("id, title, event_date, event_time, venue_name, city, image_url").gte("event_date", new Date().toISOString().split("T")[0]).eq("status", "published").order("event_date", { ascending: true }).limit(4),
        ]);

        if (cancelled) return;

        if (profileResult.error || !profileResult.data) { goTo("/onboarding"); return; }

        setProfile(profileResult.data);
        if (rsvpResult.data) {
          setRsvpEvents(rsvpResult.data.filter(r => r.event !== null) as RSVPEvent[]);
        }
        if (suggestedResult.data) setSuggestedEvents(suggestedResult.data);
      } catch (err) {
        console.error("Profile fetch error:", err);
        if (!cancelled) goTo("/onboarding");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProfile();
    refreshFeed();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Personalized feed: filter by user's sports/teams, then show all remaining
  const personalizedFeed = useMemo(() => {
    if (!profile || feedItems.length === 0) return feedItems;
    const userSports = (profile.favorite_sports || []).map(s => s.toLowerCase());
    const userTeams = (profile.favorite_teams_players || []).map(t => t.toLowerCase());
    const userLaTeams = ((profile as any).favorite_la_teams || []).map((t: string) => t.toLowerCase());
    const allUserTags = [...userSports, ...userTeams, ...userLaTeams];

    if (allUserTags.length === 0) return feedItems;

    // Score each item by relevance
    const scored = feedItems.map(item => {
      const itemTags = [...(item.sport_tags || []), ...(item.team_tags || [])].map((t: string) => t.toLowerCase());
      const matchCount = itemTags.filter((tag: string) => allUserTags.some(ut => tag.includes(ut) || ut.includes(tag))).length;
      return { ...item, _score: matchCount };
    });

    // Sort: matched items first, then rest
    return scored.sort((a, b) => b._score - a._score);
  }, [profile, feedItems]);

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
              <div className="w-24 h-24 rounded-full bg-muted" />
              <div className="flex-1 space-y-3">
                <div className="h-6 w-40 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            </div>
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

            {/* CINEMATIC HERO SECTION */}
            <motion.div variants={staggerItem} className="relative -mx-4 -mt-4 md:-mx-0 md:mt-0 md:rounded-2xl overflow-hidden">
              {/* Background gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-background/60 to-background z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 z-10" />
              
              {/* Hero content */}
              <div className="relative z-20 px-6 pt-12 pb-8 md:px-10 md:pt-16 md:pb-10">
                <div className="flex flex-col items-center text-center gap-5">
                  {/* Avatar with glow */}
                  <div className="relative">
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 blur-lg" />
                    <Avatar className="relative w-28 h-28 md:w-32 md:h-32 border-[3px] border-primary/50 glow-primary">
                      {profile.profile_photo_url ? (
                        <AvatarImage src={profile.profile_photo_url} alt={profile.name} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-sans">{initials}</AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Name & info */}
                  <div>
                    <h1 className="text-3xl md:text-4xl font-display text-foreground tracking-tight">{profile.name}</h1>
                    {profile.pronouns && <p className="text-sm text-muted-foreground mt-1">{profile.pronouns}</p>}
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{locationText}</span>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="flex items-center gap-3">
                    <Button onClick={() => goTo("/profile/edit")} className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                      <Edit className="w-4 h-4" /> Edit Profile
                    </Button>
                    <Button variant="outline" onClick={() => goTo("/dms")} className="rounded-full border-border/40 text-foreground/70 hover:text-foreground gap-2">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" onClick={() => goTo("/settings")} className="rounded-full border-border/40 text-foreground/70 hover:text-foreground gap-2">
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" onClick={handleLogout} className="rounded-full border-border/40 text-destructive hover:text-destructive gap-2">
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* BIO - Glassmorphism card */}
            {profile.bio && (
              <motion.div variants={staggerItem}>
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{profile.bio}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STATS OVERVIEW - Glassmorphism */}
            <motion.div variants={staggerItem} className="grid grid-cols-3 gap-3">
              <div className="glass-card rounded-2xl p-4 text-center">
                <Trophy className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-sans font-bold text-foreground">{(combinedWinPct * 100).toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Win Rate</p>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center">
                <Flame className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-sans font-bold text-foreground">{rsvpEvents.filter(r => r.status === 'confirmed').length}</p>
                <p className="text-xs text-muted-foreground">Confirmed</p>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center">
                <Heart className="w-5 h-5 text-accent mx-auto mb-2" />
                <p className="text-2xl font-sans font-bold text-foreground">{rsvpEvents.length}</p>
                <p className="text-xs text-muted-foreground">Events</p>
              </div>
            </motion.div>

            {/* GREETING + DATE */}
            <motion.div variants={staggerItem} className="glass-card rounded-2xl p-5">
              <p className="text-lg font-sans text-foreground">{greeting}, <span className="text-primary font-semibold">{userName}</span></p>
              <p className="text-sm text-muted-foreground mt-1">{formattedDate} · {formattedTime}</p>
            </motion.div>

            {/* HOROSCOPE PREVIEW */}
            {zodiac && (
              <motion.div variants={staggerItem}>
                <div className={`glass-card rounded-2xl overflow-hidden`}>
                  <div className={`bg-gradient-to-br ${ELEMENT_GRADIENTS[zodiac.element]} p-5`}>
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{zodiac.symbol}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-sans text-base text-foreground">{zodiac.name}</h3>
                          <Badge variant="outline" className="text-[10px] rounded-full capitalize border-border/30">{zodiac.element}</Badge>
                        </div>
                        <p className="text-sm text-foreground/70 leading-relaxed line-clamp-2">{HOROSCOPE_MESSAGES[zodiac.name]}</p>
                        <Button variant="link" className="px-0 mt-1 text-primary h-auto text-xs gap-1" onClick={() => goTo("/horoscope")}>
                          Read Full Horoscope <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* MY INTERESTS LINK */}
            <motion.div variants={staggerItem}>
              <div className="glass-card rounded-2xl cursor-pointer hover:border-primary/30 transition-colors p-4 flex items-center justify-between" onClick={() => goTo("/profile/interests")}>
                <div>
                  <p className="font-medium text-foreground">My Interests</p>
                  <p className="text-sm text-muted-foreground">Teams, sports, experiences & more</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </motion.div>


            {/* FAVORITE TEAMS PERFORMANCE - COLLAPSIBLE */}
            <motion.div variants={staggerItem}>
              <Collapsible open={teamsOpen} onOpenChange={setTeamsOpen}>
                <div className="glass-card rounded-2xl overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full p-5 pb-2 flex items-center justify-between cursor-pointer hover:bg-foreground/[0.03] transition-colors">
                      <span className="text-sm font-medium tracking-wider uppercase text-foreground/50">Favorite Teams</span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${teamsOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </CollapsibleTrigger>
                  {/* Preview: first 2 teams always visible */}
                  {!teamsOpen && (
                    <div className="divide-y divide-border/30">
                      {TEAM_PERFORMANCE.slice(0, 2).map(team => (
                        <div
                          key={team.name}
                          className="flex items-center gap-3 px-5 py-4 hover:bg-foreground/[0.03] transition-colors cursor-pointer group"
                          onClick={() => goTo(`/team/${team.slug}`)}
                        >
                          <img src={team.logo} alt={team.name} className="w-10 h-10 object-contain rounded-lg bg-foreground/5 p-0.5" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{team.name}</span>
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-full border-border/30">{team.league}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{team.nextGame}</p>
                          </div>
                          <p className={`text-sm font-sans font-bold ${team.winPct > 0.5 ? "text-accent" : team.winPct > 0 && team.winPct < 0.5 ? "text-destructive" : "text-foreground"}`}>{team.record}</p>
                        </div>
                      ))}
                      {TEAM_PERFORMANCE.length > 2 && (
                        <div className="px-5 py-2 text-center">
                          <span className="text-xs text-muted-foreground">+{TEAM_PERFORMANCE.length - 2} more teams</span>
                        </div>
                      )}
                    </div>
                  )}
                  <CollapsibleContent>
                    <div className="divide-y divide-border/30">
                      {TEAM_PERFORMANCE.map(team => (
                        <div
                          key={team.name}
                          className="flex items-center gap-3 px-5 py-4 hover:bg-foreground/[0.03] transition-colors cursor-pointer group"
                          onClick={() => goTo(`/team/${team.slug}`)}
                        >
                          <img src={team.logo} alt={team.name} className="w-10 h-10 object-contain rounded-lg bg-foreground/5 p-0.5" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{team.name}</span>
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-full border-border/30">{team.league}</Badge>
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
                            <p className={`text-sm font-sans font-bold ${team.winPct > 0.5 ? "text-accent" : team.winPct > 0 && team.winPct < 0.5 ? "text-destructive" : "text-foreground"}`}>{team.record}</p>
                            {team.last5.length > 0 && (
                              <div className="flex gap-0.5">
                                {team.last5.map((win, i) => <div key={i} className={`w-2 h-2 rounded-full ${win ? "bg-accent" : "bg-destructive/60"}`} />)}
                              </div>
                            )}
                            {team.nextGame !== "Offseason" && !team.nextGame.startsWith("Season") && (
                              <div className="flex gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-[10px] px-2 rounded-full gap-1 border-border/30"
                                  onClick={(e) => { e.stopPropagation(); window.open(team.ticketUrl || getTeamTicketsUrl(team.name), '_blank'); }}
                                >
                                  <Ticket className="w-3 h-3" /> Tickets
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-6 text-[10px] px-2 rounded-full gap-1"
                                  onClick={(e) => { e.stopPropagation(); window.open(team.watchUrl || getTeamWatchUrl(team.name), '_blank'); }}
                                >
                                  <Play className="w-3 h-3" /> Watch
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </motion.div>

            {/* FOR YOU — REAL RSS NEWS FEED */}
            <motion.div variants={staggerItem}>
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="p-5 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium tracking-wider uppercase text-foreground/50">For You</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!feedLoading && feedItems.length > 0 && (
                        <Badge variant="outline" className="text-[10px] rounded-full border-border/30 text-muted-foreground">
                          <Newspaper className="w-3 h-3 mr-1" /> {personalizedFeed.length} stories
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        disabled={feedLoading}
                        onClick={refreshFeed}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${feedLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Real articles from Just Women's Sports, BBC Sport & ESPN</p>
                </div>

                {feedLoading && feedItems.length === 0 ? (
                  <div className="px-5 py-12 flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading latest sports news…</p>
                  </div>
                ) : personalizedFeed.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <Newspaper className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No articles available right now. Check back soon!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/20">
                    {personalizedFeed.map((item, i) => {
                      const timeAgo = getTimeAgo(item.created_at);
                      const isRelevant = item._score > 0;
                      return (
                        <a
                          key={item.id || i}
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-5 py-4 hover:bg-foreground/[0.06] transition-colors cursor-pointer group no-underline"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-semibold text-primary/70 uppercase tracking-wider">{item.source}</span>
                            <span className="text-[10px] text-muted-foreground">•</span>
                            <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
                            {isRelevant && (
                              <>
                                <span className="text-[10px] text-muted-foreground">•</span>
                                <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" />For you</span>
                              </>
                            )}
                          </div>
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                            {item.title}
                            <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </p>
                          {item.summary && (
                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{item.summary}</p>
                          )}
                          {(item.sport_tags?.length > 0 || item.team_tags?.length > 0) && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {[...(item.sport_tags || []), ...(item.team_tags || [])].slice(0, 4).map((tag: string, ti: number) => (
                                <Badge key={ti} variant="secondary" className="text-[9px] px-1.5 py-0 rounded-full">{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>



            {/* MY RSVPED EVENTS */}
            {rsvpEvents.length > 0 && (
              <motion.div variants={staggerItem}>
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="p-5 pb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium tracking-wider uppercase text-foreground/50">My Events</span>
                    </div>
                  </div>
                  <div className="px-5 pb-5">
                    <div className="grid md:grid-cols-2 gap-4">
                      {rsvpEvents.map(rsvp => (
                        <div key={rsvp.id} className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => goTo("/events")}>
                          {rsvp.event.image_url ? <img src={rsvp.event.image_url} alt={rsvp.event.title} className="w-full h-32 object-cover rounded-lg mb-3" /> : <div className="w-full h-32 bg-muted rounded-lg mb-3 flex items-center justify-center"><Calendar className="w-8 h-8 text-muted-foreground" /></div>}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-foreground">{rsvp.event.title}</p>
                              <p className="text-sm text-muted-foreground">{rsvp.event.venue_name || rsvp.event.city || "Location TBD"}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" /><span>{format(new Date(rsvp.event.event_date), "MMM d, yyyy")}</span>
                                {rsvp.event.event_time && (<><Clock className="w-3 h-3 ml-1" /><span>{rsvp.event.event_time}</span></>)}
                              </div>
                            </div>
                            <Badge variant={rsvp.status === "confirmed" ? "default" : "secondary"} className="text-xs rounded-full">{rsvp.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* RECOMMENDED EVENTS */}
            {suggestedEvents.length > 0 && (
              <motion.div variants={staggerItem}>
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="p-5 pb-3">
                    <span className="text-sm font-medium tracking-wider uppercase text-foreground/50">Recommended Events</span>
                  </div>
                  <div className="px-5 pb-5">
                    <div className="grid md:grid-cols-2 gap-4">
                      {suggestedEvents.map(event => (
                        <div key={event.id} className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => goTo(`/event/${event.id}`)}>
                          {event.image_url ? <img src={event.image_url} alt={event.title} className="w-full h-32 object-cover rounded-lg mb-3" /> : <div className="w-full h-32 bg-muted rounded-lg mb-3 flex items-center justify-center"><Calendar className="w-8 h-8 text-muted-foreground" /></div>}
                          <p className="font-medium text-foreground">{event.title}</p>
                          <p className="text-sm text-muted-foreground">{event.venue_name || event.city || "Location TBD"} • {format(new Date(event.event_date), "MMM d")}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}


          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
