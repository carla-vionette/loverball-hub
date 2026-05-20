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
import ProfileInbox from "@/components/profile/ProfileInbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

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
  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`);
  return (
    <div className="flex items-end gap-6">
      <button onClick={onClickFollowers} className="text-left group">
        <p
          className="leading-none"
          style={{
            fontFamily: "'Space Mono', monospace",
            fontWeight: 700,
            fontSize: 22,
            color: "#FAF5E9",
          }}
        >
          {fmt(followerCount)}
        </p>
        <p
          className="mt-1 text-[11px]"
          style={{
            fontFamily: "'Space Mono', monospace",
            color: "rgba(250,245,233,0.55)",
          }}
        >
          Followers
        </p>
      </button>
      <button onClick={onClickFollowing} className="text-left group">
        <p
          className="leading-none"
          style={{
            fontFamily: "'Space Mono', monospace",
            fontWeight: 700,
            fontSize: 22,
            color: "#FAF5E9",
          }}
        >
          {fmt(followingCount)}
        </p>
        <p
          className="mt-1 text-[11px]"
          style={{
            fontFamily: "'Space Mono', monospace",
            color: "rgba(250,245,233,0.55)",
          }}
        >
          Following
        </p>
      </button>
    </div>
  );
};

const Profile = () => {
  const [teamsOpen, setTeamsOpen] = useState(true);
  const [scoresOpen, setScoresOpen] = useState(true);
  const [watchOpen, setWatchOpen] = useState(false);
  const [recEventsOpen, setRecEventsOpen] = useState(false);
  const [feedFilter, setFeedFilter] = useState<string>("All");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [rsvpEvents, setRsvpEvents] = useState<RSVPEvent[]>([]);
  const [suggestedEvents, setSuggestedEvents] = useState<SuggestedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [liveHoroscope, setLiveHoroscope] = useState<string | null>(null);
  const [horoscopeLoading, setHoroscopeLoading] = useState(false);
  const [birthday, setBirthday] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  
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
        if (authLoading) return;
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
  }, [authLoading, user]);

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
        <main className="md:ml-16 xl:ml-64 pb-20 md:pb-8 pt-16 md:pt-2">
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

  const handle = `@${(profile.name?.split(" ")[0] || "member").toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const eventsAttended = rsvpEvents.filter(r => r.status === "going" || r.status === "attended").length;
  const FEED_FILTERS = ["All", "NBA", "WNBA", "NWSL", "NFL", "MLB", "Soccer"];

  // Homepage palette (matches src/pages/Index.tsx)
  const BG = "#0a0a0a";
  const TEXT = "#FAF5E9";
  const PINK = "#F04E23";        // Vermilion (homepage primary)
  const PANEL = "#161616";       // Homepage surface
  const PANEL_BORDER = "1px solid rgba(250, 245, 233, 0.08)";

  return (
    <div className="min-h-screen" style={{ background: BG, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Seo
        title="Your Profile | Loverball"
        description="Your Loverball member profile — favorite teams, personalized news, daily horoscope, and live scores."
        path="/profile"
      />
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main
        className="md:ml-16 xl:ml-64 pb-20 md:pb-10 pt-16 md:pt-4 transition-[margin] duration-200"
        style={{ background: BG, color: TEXT, fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-2">

          {/* ───── PAGE MASTHEAD ───── */}
          <motion.div
            variants={staggerItem}
            initial="hidden"
            animate="show"
            className="pb-6 flex items-end justify-between gap-4"
          >
            <h1
              className="leading-[0.85] tracking-tight"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 800,
                fontSize: "clamp(48px, 8vw, 88px)",
                color: "#FAF5E9",
              }}
            >
              Profile<span style={{ color: PINK }}>.</span>
            </h1>
            <p
              className="hidden md:block text-[10px] uppercase mb-3"
              style={{
                fontFamily: "'Space Mono', monospace",
                letterSpacing: "0.24em",
                color: "rgba(250,245,233,0.45)",
              }}
            >
              {formattedDate} · {formattedTime}
            </p>
          </motion.div>

          {/* ───── 2-COLUMN GRID (40 / 60 @ lg+) ───── */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 lg:gap-8 items-start"
          >

            {/* ═══════════ LEFT COLUMN — IDENTITY ═══════════ */}
            <motion.aside variants={staggerItem} className="lg:sticky lg:top-6">
              <div
                className="relative rounded-3xl overflow-hidden"
                style={{ background: PANEL, border: PANEL_BORDER }}
              >
                {/* Hero photo */}
                <div
                  className="relative w-full"
                  style={{ height: "min(480px, 60vh)", background: "#0F0F10" }}
                >
                  {profile.profile_photo_url ? (
                    <img
                      src={profile.profile_photo_url}
                      alt={profile.name}
                      className="w-full h-full object-contain"
                      style={{ filter: "saturate(0.95) contrast(1.04)", background: "#0F0F10" }}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: "linear-gradient(140deg, rgba(233,30,99,0.18), rgba(216,140,90,0.10))",
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 140,
                        fontWeight: 800,
                        color: "rgba(250,245,233,0.45)",
                      }}
                    >
                      {initials[0]}
                    </div>
                  )}

                  {/* Tier badge — top right */}
                  <div className="absolute top-4 right-4">
                    <MemberBadge tier={profile.membership_tier} size="md" />
                  </div>

                  {/* Glassmorphism overlay */}
                  <div
                    className="absolute left-4 right-4 bottom-4 rounded-2xl px-5 py-4"
                    style={{
                      background: "rgba(10,10,11,0.55)",
                      backdropFilter: "blur(18px) saturate(140%)",
                      WebkitBackdropFilter: "blur(18px) saturate(140%)",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }}
                  >
                    <h2
                      className="leading-[0.95] tracking-tight"
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontWeight: 700,
                        fontSize: "clamp(26px, 3vw, 34px)",
                        color: "#FFFFFF",
                      }}
                    >
                      {profile.name}
                    </h2>
                    <p
                      className="mt-1 flex items-center gap-2 flex-wrap text-[12px]"
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        color: "rgba(250,245,233,0.75)",
                      }}
                    >
                      <span style={{ color: PINK }}>{handle}</span>
                      <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {locationText}
                      </span>
                      {profile.pronouns && (
                        <>
                          <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
                          <span>{profile.pronouns}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Body — stats + actions */}
                <div className="px-5 pt-5 pb-5">
                  {/* Stats row 2×2 */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Events", value: eventsAttended },
                      { label: "Friends", value: null as number | null },
                      { label: "Posts", value: null as number | null },
                      { label: "Following", value: null as number | null },
                    ].map((s, i) => (
                      <div
                        key={s.label}
                        className="rounded-xl px-2 py-3 text-center"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <p
                          className="leading-none"
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            fontWeight: 700,
                            fontSize: 22,
                            color: s.value === null ? "rgba(250,245,233,0.35)" : "#FAF5E9",
                          }}
                        >
                          {s.value === null ? "—" : s.value}
                        </p>
                        <p
                          className="mt-1.5 text-[9.5px] uppercase"
                          style={{
                            fontFamily: "'Space Mono', monospace",
                            letterSpacing: "0.16em",
                            color: "rgba(250,245,233,0.5)",
                          }}
                        >
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p
                      className="mt-4 text-[13px] leading-relaxed"
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        color: "rgba(250,245,233,0.72)",
                      }}
                    >
                      <span style={{ color: "#FAF5E9", fontWeight: 700 }}>VIBE:</span>{" "}
                      {profile.bio}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="mt-5 flex items-center gap-2">
                    <Button
                      onClick={() => goTo("/profile/edit")}
                      className="flex-1 rounded-xl h-11 text-[11px] font-bold tracking-[0.16em] uppercase"
                      style={{
                        background: PINK,
                        color: "#0a0a0a",
                        fontFamily: "Inter, sans-serif",
                        boxShadow: "0 10px 28px -12px rgba(233,30,99,0.65)",
                      }}
                    >
                      Edit Profile
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => goTo("/dms")}
                      aria-label="Messages"
                      className="w-11 h-11 p-0 rounded-xl shrink-0"
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#FAF5E9",
                      }}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => goTo("/settings")}
                      aria-label="Settings"
                      className="w-11 h-11 p-0 rounded-xl shrink-0"
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#FAF5E9",
                      }}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Subtle logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full mt-3 h-9 rounded-xl text-[10px] uppercase inline-flex items-center justify-center gap-1.5 transition-colors hover:bg-white/[0.04]"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      letterSpacing: "0.18em",
                      color: "rgba(250,245,233,0.45)",
                    }}
                  >
                    <LogOut className="w-3 h-3" /> Log out
                  </button>
                </div>
              </div>
            </motion.aside>

            {/* ═══════════ RIGHT COLUMN — ACTIVITY ═══════════ */}
            <div className="space-y-6 min-w-0">

              {/* Top row: section header + horoscope right widget */}
              <motion.div
                variants={staggerItem}
                className="flex flex-col md:flex-row items-start gap-4 md:gap-6"
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[10px] uppercase"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      letterSpacing: "0.26em",
                      color: "#D88C5A",
                    }}
                  >
                    Your personal feed
                  </p>
                  <h2
                    className="leading-[0.95] mt-2"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontWeight: 700,
                      fontSize: "clamp(34px, 4.4vw, 52px)",
                      color: "#FAF5E9",
                    }}
                  >
                    Curated{" "}
                    <span style={{ fontStyle: "italic", color: PINK }}>for you</span>.
                  </h2>
                  <p className="mt-2 text-[13px]" style={{ color: "rgba(250,245,233,0.55)" }}>
                    {greeting},{" "}
                    <span style={{ color: "#FAF5E9", fontWeight: 500 }}>{userName}</span>. Here's what's on tonight.
                  </p>
                </div>

                {/* Horoscope right-rail widget — 300px */}
                {zodiac && (
                  <button
                    onClick={() => goTo("/horoscope")}
                    className="w-full md:w-[300px] shrink-0 text-left rounded-2xl p-4 transition-colors hover:bg-white/[0.02]"
                    style={{
                      background: "linear-gradient(135deg, rgba(233,30,99,0.10), rgba(216,140,90,0.05))",
                      border: "1px solid rgba(233,30,99,0.25)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          background: "rgba(10,10,11,0.6)",
                          border: "1px solid rgba(233,30,99,0.3)",
                          fontSize: 20,
                          color: PINK,
                        }}
                      >
                        {zodiac.symbol}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[9.5px] uppercase truncate"
                          style={{
                            fontFamily: "'Space Mono', monospace",
                            letterSpacing: "0.2em",
                            color: "#D88C5A",
                          }}
                        >
                          {zodiac.name} · Today
                        </p>
                        <p
                          className="text-[12px] leading-snug mt-1 line-clamp-2 italic"
                          style={{
                            fontFamily: "'Playfair Display', Georgia, serif",
                            color: "rgba(250,245,233,0.85)",
                          }}
                        >
                          {horoscopeLoading
                            ? "Reading the stars…"
                            : liveHoroscope || HOROSCOPE_MESSAGES[zodiac.name]}
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: PINK }} />
                    </div>
                  </button>
                )}
              </motion.div>

              {/* FAVORITE TEAMS (default expanded) */}
              <motion.div variants={staggerItem}>
                <Collapsible open={teamsOpen} onOpenChange={setTeamsOpen}>
                  <div className="rounded-2xl overflow-hidden" style={{ background: PANEL, border: PANEL_BORDER }}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full p-5 pb-3 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors">
                        <span className="text-[13px] uppercase flex items-center gap-2.5"
                          style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.2em", color: "#FAF5E9", fontWeight: 500 }}>
                          <Shield className="w-3.5 h-3.5" style={{ color: PINK }} strokeWidth={2.5} /> Favorite Teams
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${teamsOpen ? 'rotate-180' : ''}`} style={{ color: "rgba(250,245,233,0.5)" }} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                        {TEAM_PERFORMANCE.map(team => (
                          <div
                            key={team.name}
                            className="flex items-center gap-3 px-5 py-4 hover:bg-white/[0.03] transition-colors cursor-pointer group"
                            onClick={() => goTo(`/team/${team.slug}`)}
                          >
                            <img src={team.logo} alt={team.name} className="w-10 h-10 object-contain rounded-lg p-0.5" style={{ background: "rgba(255,255,255,0.04)" }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground group-hover:opacity-90 transition-colors" style={{ color: "#FAF5E9" }}>{team.name}</span>
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-full" style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(250,245,233,0.65)" }}>{team.league}</Badge>
                                {team.injuryNote && (
                                  <span title={team.injuryNote}>
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                  </span>
                                )}
                              </div>
                              <p className="text-xs mt-0.5" style={{ color: "rgba(250,245,233,0.5)" }}>{team.nextGame}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <p className="text-sm font-bold" style={{ color: team.winPct > 0.5 ? "#7DD3A4" : (team.winPct > 0 && team.winPct < 0.5 ? "#F87171" : "#FAF5E9") }}>{team.record}</p>
                              {team.last5.length > 0 && (
                                <div className="flex gap-0.5">
                                  {team.last5.map((win, i) => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: win ? "#7DD3A4" : "rgba(248,113,113,0.6)" }} />)}
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

              {/* LIVE & RECENT SCORES (default expanded) */}
              <motion.div variants={staggerItem}>
                <Collapsible open={scoresOpen} onOpenChange={setScoresOpen}>
                  <div className="rounded-2xl overflow-hidden" style={{ background: PANEL, border: PANEL_BORDER }}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full p-5 pb-3 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors">
                        <span className="text-[13px] uppercase flex items-center gap-2.5"
                          style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.2em", color: "#FAF5E9", fontWeight: 500 }}>
                          <Radio className="w-3.5 h-3.5" style={{ color: PINK }} /> Live &amp; Recent Scores
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${scoresOpen ? 'rotate-180' : ''}`} style={{ color: "rgba(250,245,233,0.5)" }} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-5 pb-5 pt-2">
                        <ProfileScores favoriteTeams={[...(profile.favorite_teams_players || []), ...((profile as any).favorite_la_teams || [])]} />
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </motion.div>

              {/* WHERE TO WATCH (collapsed) */}
              <motion.div variants={staggerItem}>
                <Collapsible open={watchOpen} onOpenChange={setWatchOpen}>
                  <div className="rounded-2xl overflow-hidden" style={{ background: PANEL, border: PANEL_BORDER }}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full p-5 pb-3 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors">
                        <span className="text-[13px] uppercase flex items-center gap-2.5"
                          style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.2em", color: "#FAF5E9", fontWeight: 500 }}>
                          <Tv className="w-3.5 h-3.5" style={{ color: PINK }} /> Where to Watch
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${watchOpen ? 'rotate-180' : ''}`} style={{ color: "rgba(250,245,233,0.5)" }} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-5 pb-5 pt-2">
                        <ProfileWhereToWatch />
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </motion.div>

              {/* RECOMMENDED EVENTS (collapsed) */}
              {suggestedEvents.length > 0 && (
                <motion.div variants={staggerItem}>
                  <Collapsible open={recEventsOpen} onOpenChange={setRecEventsOpen}>
                    <div className="rounded-2xl overflow-hidden" style={{ background: PANEL, border: PANEL_BORDER }}>
                      <CollapsibleTrigger asChild>
                        <button className="w-full p-5 pb-3 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors">
                          <span className="text-[13px] uppercase flex items-center gap-2.5"
                            style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.2em", color: "#FAF5E9", fontWeight: 500 }}>
                            <CalendarHeart className="w-3.5 h-3.5" style={{ color: PINK }} strokeWidth={2.5} /> Recommended Events
                          </span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${recEventsOpen ? 'rotate-180' : ''}`} style={{ color: "rgba(250,245,233,0.5)" }} />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-5 pb-5">
                          <div className="grid sm:grid-cols-2 gap-4">
                            {suggestedEvents.map(event => (
                              <div key={event.id} className="rounded-xl p-4 cursor-pointer transition-colors hover:bg-white/[0.04]"
                                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                                onClick={() => goTo(`/event/${event.id}`)}>
                                {event.image_url ? (
                                  <img src={event.image_url} alt={event.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                                ) : (
                                  <div className="w-full h-32 rounded-lg mb-3 flex items-center justify-center"
                                    style={{ background: "linear-gradient(135deg, rgba(233,30,99,0.18), rgba(216,140,90,0.10))" }}>
                                    <Calendar className="w-8 h-8" style={{ color: PINK }} />
                                  </div>
                                )}
                                <p className="font-medium" style={{ color: "#FAF5E9" }}>{event.title}</p>
                                <p className="text-sm" style={{ color: "rgba(250,245,233,0.55)" }}>{event.venue_name || event.city || "Location TBD"} • {format(new Date(event.event_date), "MMM d")}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                </motion.div>
              )}

              {/* FRIENDS ACTIVITY (new) */}
              <motion.div variants={staggerItem}>
                <div className="rounded-2xl p-5" style={{ background: PANEL, border: PANEL_BORDER }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[13px] uppercase flex items-center gap-2.5"
                      style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.2em", color: "#FAF5E9", fontWeight: 500 }}>
                      <Users className="w-3.5 h-3.5" style={{ color: PINK }} /> Friends Activity
                    </span>
                    <button onClick={() => goTo("/friends")}
                      className="text-[10px] uppercase tracking-[0.18em]"
                      style={{ color: PINK, fontFamily: "'Space Mono', monospace" }}>
                      View all
                    </button>
                  </div>
                  <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl text-center"
                    style={{ background: "linear-gradient(135deg, rgba(233,30,99,0.08), rgba(216,140,90,0.04))", border: "1px dashed rgba(233,30,99,0.22)" }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                      style={{ background: "rgba(233,30,99,0.15)" }}>
                      <Users className="w-5 h-5" style={{ color: PINK }} />
                    </div>
                    <p className="text-[14px] mb-1" style={{ color: "#FAF5E9", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
                      No friend activity yet.
                    </p>
                    <p className="text-[12px] mb-4" style={{ color: "rgba(250,245,233,0.55)" }}>
                      Add friends and you'll see their check-ins, RSVPs, and posts here.
                    </p>
                    <button onClick={() => goTo("/friends")}
                      className="text-[11px] uppercase font-bold tracking-[0.16em] px-4 py-2 rounded-full"
                      style={{ background: PINK, color: "#0a0a0a", fontFamily: "Inter, sans-serif" }}>
                      Find friends
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* COMMUNITIES (new) */}
              <motion.div variants={staggerItem}>
                <div className="rounded-2xl p-5" style={{ background: PANEL, border: PANEL_BORDER }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[13px] uppercase flex items-center gap-2.5"
                      style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.2em", color: "#FAF5E9", fontWeight: 500 }}>
                      <MessageCircle className="w-3.5 h-3.5" style={{ color: PINK }} /> Communities
                    </span>
                    <button onClick={() => goTo("/club")}
                      className="text-[10px] uppercase tracking-[0.18em]"
                      style={{ color: PINK, fontFamily: "'Space Mono', monospace" }}>
                      Explore
                    </button>
                  </div>
                  <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl text-center"
                    style={{ background: "linear-gradient(135deg, rgba(233,30,99,0.08), rgba(216,140,90,0.04))", border: "1px dashed rgba(233,30,99,0.22)" }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                      style={{ background: "rgba(233,30,99,0.15)" }}>
                      <Heart className="w-5 h-5" style={{ color: PINK }} />
                    </div>
                    <p className="text-[14px] mb-1" style={{ color: "#FAF5E9", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
                      Not in any communities yet.
                    </p>
                    <p className="text-[12px] mb-4" style={{ color: "rgba(250,245,233,0.55)" }}>
                      Join team chats, city crews, and fan circles in The Club.
                    </p>
                    <button onClick={() => goTo("/club")}
                      className="text-[11px] uppercase font-bold tracking-[0.16em] px-4 py-2 rounded-full"
                      style={{ background: PINK, color: "#0a0a0a", fontFamily: "Inter, sans-serif" }}>
                      Browse groups
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* MY SPORTS FEED with filter chips above */}
              <motion.div variants={staggerItem}>
                <div className="mb-3 -mx-1 px-1 overflow-x-auto scrollbar-none">
                  <div className="flex gap-2 min-w-max">
                    {FEED_FILTERS.map((f) => {
                      const active = feedFilter === f;
                      return (
                        <button
                          key={f}
                          onClick={() => setFeedFilter(f)}
                          className="text-[11px] uppercase font-bold tracking-[0.16em] h-9 px-4 rounded-full transition-colors whitespace-nowrap"
                          style={{
                            background: active ? PINK : "rgba(255,255,255,0.04)",
                            color: active ? "#0a0a0a" : "rgba(250,245,233,0.7)",
                            border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,0.08)",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          {f}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <MySportsFeed
                  userSports={profile.favorite_sports || []}
                  userTeams={[...(profile.favorite_teams_players || []), ...((profile as any).favorite_la_teams || [])]}
                  userCity={profile.city}
                />
              </motion.div>

            </div>
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
