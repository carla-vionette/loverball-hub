import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Edit, Sparkles, LogOut, Calendar, Clock, TrendingUp, TrendingDown, Trophy, Flame, Bookmark, BookOpen, Award, ChevronRight, ChevronDown, ArrowUpRight, Share2, AlertTriangle, Ticket, Play, Eye, Lightbulb, Settings, Heart, MessageCircle, Loader2, ExternalLink, Newspaper, Zap, RefreshCw, Users, Tv, Radio, CalendarHeart, Shield } from "lucide-react";
import MemberBadge from "@/components/MemberBadge";
import { useFollow } from "@/hooks/useFollow";
import BadgeShelf from "@/components/BadgeShelf";
import PointsStreakCard from "@/components/PointsStreakCard";
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
import Seo from "@/components/Seo";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  TEAM_PERFORMANCE,
} from "@/lib/mockStatsData";
import { getTeamWatchUrl, getTeamTicketsUrl } from "@/lib/teamLinksMap";
import MySportsFeed from "@/components/MySportsFeed";
import LiveScores from "@/components/LiveScores";
import ProfileScores from "@/components/ProfileScores";
import ProfileWhereToWatch from "@/components/ProfileWhereToWatch";


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
  membership_tier: string | null;
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


const ProfileFollowCounts = ({ userId, onClickFollowers, onClickFollowing }: { userId: string; onClickFollowers: () => void; onClickFollowing: () => void }) => {
  const { followerCount, followingCount } = useFollow(userId);
  return (
    <div className="flex items-center gap-4 text-sm">
      <button onClick={onClickFollowers} className="hover:text-primary transition-colors cursor-pointer"><strong>{followerCount}</strong> <span className="text-muted-foreground">followers</span></button>
      <button onClick={onClickFollowing} className="hover:text-primary transition-colors cursor-pointer"><strong>{followingCount}</strong> <span className="text-muted-foreground">following</span></button>
    </div>
  );
};

const Profile = () => {
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [scoresOpen, setScoresOpen] = useState(false);
  const [watchOpen, setWatchOpen] = useState(false);
  const [recEventsOpen, setRecEventsOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [rsvpEvents, setRsvpEvents] = useState<RSVPEvent[]>([]);
  const [suggestedEvents, setSuggestedEvents] = useState<SuggestedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [liveHoroscope, setLiveHoroscope] = useState<string | null>(null);
  const [horoscopeLoading, setHoroscopeLoading] = useState(false);
  const [birthday, setBirthday] = useState<string | null>(null);
  
  const goTo = (path: string) => { window.location.href = path; };
  const { toast } = useToast();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState<'followers' | 'following' | null>(null);

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out", description: "You have been logged out successfully." });
    goTo("/");
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
        // Fetch birthday from sensitive table
        const { data: sensitive } = await supabase.from("profiles_sensitive" as any).select("birthday").eq("id", user.id).maybeSingle();
        if (sensitive) setBirthday((sensitive as any).birthday);
        if (rsvpResult.data) {
          setRsvpEvents(rsvpResult.data.filter(r => r.event !== null) as RSVPEvent[]);
        }
        if (suggestedResult.data) setSuggestedEvents(suggestedResult.data);
      } catch (err) {
        if (!cancelled) goTo("/onboarding");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProfile();
    return () => { cancelled = true; };
  }, []);

  // Fetch live daily horoscope
  useEffect(() => {
    if (!birthday) return;
    const zodiacSign = getZodiacSign(birthday);
    if (!zodiacSign) return;
    setHoroscopeLoading(true);
    supabase.functions.invoke("horoscope", {
      body: { sign: zodiacSign.name.toLowerCase(), period: "daily" },
    }).then(({ data: resp }) => {
      const reading = resp?.data?.horoscope || resp?.horoscope || resp?.reading;
      if (reading) setLiveHoroscope(reading);
    }).catch(() => {}).finally(() => setHoroscopeLoading(false));
  }, [birthday]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);


  const activePerfTeams = TEAM_PERFORMANCE.filter(t => t.winPct > 0);
  const combinedWinPct = activePerfTeams.length > 0 ? activePerfTeams.reduce((s, t) => s + t.winPct, 0) / activePerfTeams.length : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader />
        <DesktopNav />
        <BottomNav />
        <main className="md:ml-64 pb-20 md:pb-8 pt-16 md:pt-2">
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
  const zodiac = getZodiacSign(birthday);
  const greeting = getGreeting();
  const userName = profile.name?.split(" ")[0] || "there";
  const formattedDate = currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const formattedTime = currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Your Profile | Loverball"
        description="Your Loverball member profile — favorite teams, personalized news, daily horoscope, and live scores."
        path="/profile"
      />
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main
        className="md:ml-64 pb-20 md:pb-8 pt-16 md:pt-2"
        style={{ background: "#0A0A0B", color: "#F8F8F8" }}
      >
        <div className="max-w-4xl mx-auto px-4 pt-2">
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5">

            {/* ───── 1. IDENTITY HERO ───── */}
            <motion.div variants={staggerItem} className="relative">
              {/* Masthead: Profile. + STATUS */}
              <div className="flex items-start justify-between gap-4 pb-5">
                <h1
                  className="leading-[0.85] tracking-tight"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontWeight: 800,
                    fontSize: "clamp(56px, 16vw, 84px)",
                    color: "#F8F8F8",
                  }}
                >
                  Profile<span style={{ color: "#E8276F" }}>.</span>
                </h1>
                <div className="text-right pt-3 shrink-0">
                  <p
                    className="text-[10px] uppercase"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      letterSpacing: "0.22em",
                      color: "#D88C5A",
                    }}
                  >
                    Status
                  </p>
                  <p
                    className="text-[12px] mt-0.5 uppercase inline-flex items-center gap-1.5"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      letterSpacing: "0.18em",
                      color: "#F8F8F8",
                    }}
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ background: "#E8276F", boxShadow: "0 0 8px #E8276F" }}
                    />
                    Active
                  </p>
                </div>
              </div>

              {/* Identity card */}
              <div
                className="rounded-3xl overflow-hidden relative"
                style={{
                  background: "#141415",
                  border: "1px solid rgba(248,248,248,0.06)",
                  boxShadow: "0 30px 60px -30px rgba(0,0,0,0.6)",
                }}
              >
                {/* Portrait */}
                <div
                  className="relative w-full"
                  style={{ aspectRatio: "1 / 1.18", background: "#0F0F10" }}
                >
                  {profile.profile_photo_url ? (
                    <img
                      src={profile.profile_photo_url}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                      style={{ filter: "saturate(0.95) contrast(1.05)" }}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background:
                          "linear-gradient(140deg, rgba(232,39,111,0.22), rgba(216,140,90,0.14))",
                        fontFamily: "'Anton', sans-serif",
                        fontSize: 140,
                        color: "rgba(248,248,248,0.5)",
                      }}
                    >
                      {initials[0]}
                    </div>
                  )}

                  {/* Bottom gradient */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-2/5 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(20,20,21,0.98) 0%, rgba(20,20,21,0.6) 50%, transparent 100%)",
                    }}
                  />

                  {/* Name + meta overlay (bottom-left) */}
                  <div className="absolute left-5 right-5 bottom-4">
                    <h2
                      className="flex items-center gap-2 leading-[0.9] tracking-tight"
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontWeight: 700,
                        fontSize: "clamp(34px, 9vw, 44px)",
                        color: "#F8F8F8",
                        textShadow: "0 2px 18px rgba(0,0,0,0.55)",
                      }}
                    >
                      {profile.name}
                      <MemberBadge tier={profile.membership_tier} size="lg" />
                    </h2>
                    <p
                      className="mt-2 text-[11px] uppercase flex items-center gap-2 flex-wrap"
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        letterSpacing: "0.18em",
                        color: "#E8276F",
                      }}
                    >
                      <span>{locationText}</span>
                      {profile.pronouns && (
                        <>
                          <span style={{ color: "rgba(248,248,248,0.3)" }}>·</span>
                          <span>{profile.pronouns}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Card body */}
                <div className="px-5 pt-5 pb-5">
                  <div
                    className="pb-4"
                    style={{ borderBottom: "1px solid rgba(248,248,248,0.08)" }}
                  />

                  <div className="flex items-start gap-4 pt-4">
                    <div className="flex-1 min-w-0">
                      {profile.bio ? (
                        <p
                          className="text-[13px] leading-relaxed"
                          style={{
                            fontFamily: "'Space Mono', monospace",
                            color: "rgba(248,248,248,0.78)",
                          }}
                        >
                          <span style={{ color: "#F8F8F8", fontWeight: 700 }}>VIBE:</span>{" "}
                          {profile.bio}
                        </p>
                      ) : (
                        <p
                          className="text-[13px] leading-relaxed italic"
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            color: "rgba(248,248,248,0.5)",
                          }}
                        >
                          Add a vibe in Edit Profile.
                        </p>
                      )}
                    </div>

                    {/* Floating + (DMs) */}
                    <button
                      onClick={() => goTo("/dms")}
                      aria-label="Messages"
                      className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-105"
                      style={{
                        background: "#D88C5A",
                        color: "#0A0A0B",
                        boxShadow: "0 8px 24px -8px rgba(216,140,90,0.55)",
                      }}
                    >
                      <MessageCircle className="w-5 h-5" strokeWidth={2.4} />
                    </button>
                  </div>

                  {/* Followers / Following + Edit CTA */}
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <ProfileFollowCounts
                      userId={profile.id}
                      onClickFollowers={() => setShowFollowersModal('followers')}
                      onClickFollowing={() => setShowFollowersModal('following')}
                    />

                    <Button
                      onClick={() => goTo("/profile/edit")}
                      className="rounded-xl h-[58px] px-5 text-[11px] font-bold tracking-[0.18em] uppercase leading-[1.15] text-left whitespace-normal"
                      style={{
                        background: "#E8276F",
                        color: "#0A0A0B",
                        fontFamily: "Inter, sans-serif",
                        boxShadow: "0 12px 30px -12px rgba(232,39,111,0.7)",
                        minWidth: 132,
                      }}
                    >
                      Edit<br />Profile
                    </Button>
                  </div>

                  {/* Settings + Logout — subtle utility row */}
                  <div
                    className="mt-4 pt-3 flex items-center justify-end gap-1"
                    style={{ borderTop: "1px solid rgba(248,248,248,0.06)" }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => goTo("/settings")}
                      className="h-8 px-3 text-[10px] uppercase rounded-full"
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        letterSpacing: "0.18em",
                        color: "rgba(248,248,248,0.5)",
                      }}
                    >
                      <Settings className="w-3.5 h-3.5 mr-1.5" /> Settings
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="h-8 px-3 text-[10px] uppercase rounded-full"
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        letterSpacing: "0.18em",
                        color: "rgba(232,39,111,0.75)",
                      }}
                    >
                      <LogOut className="w-3.5 h-3.5 mr-1.5" /> Log out
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ───── 2. GREETING ───── */}
            <motion.div
              variants={staggerItem}
              className="rounded-2xl p-5"
              style={{
                background: "#141415",
                border: "1px solid rgba(248,248,248,0.06)",
              }}
            >
              <p
                className="text-[10px] uppercase mb-1"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  letterSpacing: "0.22em",
                  color: "#D88C5A",
                }}
              >
                {formattedDate} · {formattedTime}
              </p>
              <p
                className="leading-[1.05]"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 26,
                  fontStyle: "italic",
                  color: "#F8F8F8",
                }}
              >
                {greeting},{" "}
                <span style={{ color: "#E8276F", fontStyle: "normal", fontFamily: "'Anton', sans-serif", letterSpacing: "0.01em" }}>
                  {userName.toUpperCase()}.
                </span>
              </p>
            </motion.div>

            {/* ───── 3. DAILY HOROSCOPE (compact, tap for full) ───── */}
            <motion.div variants={staggerItem}>
              <button
                onClick={() => goTo("/horoscope")}
                className="w-full text-left rounded-2xl px-4 py-3.5 transition-colors"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(232,39,111,0.08) 0%, rgba(216,140,90,0.05) 100%)",
                  border: "1px solid rgba(232,39,111,0.22)",
                }}
              >
                {zodiac ? (
                  <div className="flex items-center gap-3">
                    <div
                      className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
                      style={{
                        background: "rgba(10,10,11,0.6)",
                        border: "1px solid rgba(232,39,111,0.3)",
                        fontSize: 22,
                        color: "#E8276F",
                      }}
                    >
                      {zodiac.symbol}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className="text-[10px] uppercase truncate"
                          style={{
                            fontFamily: "'Space Mono', monospace",
                            letterSpacing: "0.2em",
                            color: "#D88C5A",
                          }}
                        >
                          {zodiac.name} · Today
                        </p>
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#E8276F" }} />
                      </div>
                      {horoscopeLoading ? (
                        <p
                          className="text-[12px] mt-1 animate-pulse"
                          style={{ color: "rgba(248,248,248,0.5)" }}
                        >
                          Loading…
                        </p>
                      ) : (
                        <p
                          className="text-[12.5px] leading-snug mt-1 line-clamp-2 italic"
                          style={{
                            fontFamily: "'Playfair Display', Georgia, serif",
                            color: "rgba(248,248,248,0.85)",
                          }}
                        >
                          {liveHoroscope || HOROSCOPE_MESSAGES[zodiac.name]}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-xl">✨</span>
                    <p className="text-[12px]" style={{ color: "rgba(248,248,248,0.72)" }}>
                      Add your birthday in{" "}
                      <span style={{ color: "#E8276F", textDecoration: "underline" }}>Edit Profile</span>{" "}
                      for your daily horoscope.
                    </p>
                  </div>
                )}
              </button>
            </motion.div>

            {/* ───── 4. PERSONAL FEED HEADER ───── */}
            <motion.div variants={staggerItem} className="pt-4 pb-2">
              <p
                className="text-[10px] uppercase"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  letterSpacing: "0.28em",
                  color: "#D88C5A",
                }}
              >
                Your Personal Feed
              </p>
              <h2
                className="leading-[0.9] mt-2"
                style={{
                  fontFamily: "'Anton', 'Bebas Neue', sans-serif",
                  fontSize: "clamp(34px, 9.5vw, 48px)",
                  textTransform: "uppercase",
                  color: "#F8F8F8",
                }}
              >
                Curated <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", textTransform: "none", color: "#E8276F" }}>for you</span>
              </h2>
              <div
                className="mt-3"
                style={{ borderBottom: "1px solid rgba(248,248,248,0.08)" }}
              />
            </motion.div>

            {/* ───── FAVORITE TEAMS ───── */}
            <motion.div variants={staggerItem}>
              <Collapsible open={teamsOpen} onOpenChange={setTeamsOpen}>
                <div className="glass-card rounded-2xl overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full p-5 pb-3 flex items-center justify-between cursor-pointer hover:bg-foreground/[0.03] transition-colors">
                      <span className="text-[15px] flex items-center gap-2.5 lb-section-label">
                        <Shield className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} /> Favorite Teams
                      </span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${teamsOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </CollapsibleTrigger>
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

            {/* ───── WHERE TO WATCH ───── */}
            <motion.div variants={staggerItem}>
              <Collapsible open={watchOpen} onOpenChange={setWatchOpen}>
                <Card className="rounded-2xl overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full pt-4 px-5 pb-3 flex items-center justify-between cursor-pointer hover:bg-foreground/[0.03] transition-colors">
                      <span className="text-[15px] flex items-center gap-2.5 lb-section-label">
                        <Tv className="w-3.5 h-3.5 text-primary" /> Where to Watch
                      </span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${watchOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="px-5 pb-5 pt-2">
                      <ProfileWhereToWatch />
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </motion.div>

            {/* ───── LIVE & RECENT SCORES ───── */}
            <motion.div variants={staggerItem}>
              <Collapsible open={scoresOpen} onOpenChange={setScoresOpen}>
                <Card className="rounded-2xl overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full pt-4 px-5 pb-3 flex items-center justify-between cursor-pointer hover:bg-foreground/[0.03] transition-colors">
                      <span className="text-[15px] flex items-center gap-2.5 lb-section-label">
                        <Radio className="w-3.5 h-3.5 text-[#FF5D2E]" /> Live &amp; Recent Scores
                      </span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${scoresOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="px-5 pb-5 pt-2">
                      <ProfileScores favoriteTeams={[...(profile.favorite_teams_players || []), ...((profile as any).favorite_la_teams || [])]} />
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </motion.div>

            {/* ───── RECOMMENDED EVENTS ───── */}
            {suggestedEvents.length > 0 && (
              <motion.div variants={staggerItem}>
                <Collapsible open={recEventsOpen} onOpenChange={setRecEventsOpen}>
                  <div className="glass-card rounded-2xl overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <button className="w-full p-5 pb-3 flex items-center justify-between cursor-pointer hover:bg-foreground/[0.03] transition-colors">
                        <span className="text-[15px] flex items-center gap-2.5 lb-section-label">
                          <CalendarHeart className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} /> Recommended Events
                        </span>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${recEventsOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
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
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </motion.div>
            )}

            {/* ───── CURATED SPORTS NEWS / MY SPORTS FEED ───── */}
            <motion.div variants={staggerItem}>
              <MySportsFeed
                userSports={profile.favorite_sports || []}
                userTeams={[...(profile.favorite_teams_players || []), ...((profile as any).favorite_la_teams || [])]}
                userCity={profile.city}
              />
            </motion.div>


          </motion.div>
        </div>
      </main>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to log out of your account?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Log Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Followers/Following Sheet */}
      <Sheet open={!!showFollowersModal} onOpenChange={() => setShowFollowersModal(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{showFollowersModal === 'followers' ? 'Followers' : 'Following'}</SheetTitle>
          </SheetHeader>
          <div className="py-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {showFollowersModal === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Connect with others at events to grow your network!
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Profile;
