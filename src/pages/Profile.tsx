import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MemberProfile from "./MemberProfile";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Edit, LogOut, Calendar, Clock, TrendingUp, TrendingDown, Trophy, Flame, Bookmark, BookOpen, Award, ChevronRight, ChevronDown, ArrowUpRight, Share2, AlertTriangle, Ticket, Play, Eye, Lightbulb, Settings, Heart, MessageCircle, ExternalLink, Newspaper, Zap, RefreshCw, Users, Tv, Radio, Shield } from "lucide-react";
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
import DesktopNav from "@/components/DesktopNav";
import Seo from "@/components/Seo";
import ProfileInbox from "@/components/profile/ProfileInbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useProfileData, type ProfileData, type RSVPEvent, type SuggestedEvent } from "@/hooks/useProfileData";

import { format } from "date-fns";
import { motion } from "framer-motion";
import { getTeamWatchUrl, getTeamTicketsUrl } from "@/lib/teamLinksMap";
import { getTeamLeague, getTeamSlug } from "@/lib/teamLeagueMap";
import MySportsFeed from "@/components/MySportsFeed";
import LiveScores from "@/components/LiveScores";
import ProfileScores from "@/components/ProfileScores";
import ProfileWhereToWatch from "@/components/ProfileWhereToWatch";
import ForYouTonight from "@/components/profile/ForYouTonight";
import SmartEvents from "@/components/profile/SmartEvents";
import SuggestedFans from "@/components/profile/SuggestedFans";
import PersonalizationControls from "@/components/profile/PersonalizationControls";



// Types moved to @/hooks/useProfileData


// --- Zodiac helpers ---
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
  const [scheduleTeam, setScheduleTeam] = useState<string | null>(null);
  const [eventsOpen, setEventsOpen] = useState(true);
  const [recEventsOpen, setRecEventsOpen] = useState(false);
  const [feedFilter, setFeedFilter] = useState<string>("All");
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user, loading: authLoading } = useAuth();
  const { id: routeId } = useParams<{ id?: string }>();
  const viewingOther = !!routeId && (!user || routeId !== user.id);

  const goTo = (path: string) => { window.location.href = path; };
  const { toast } = useToast();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState<'followers' | 'following' | null>(null);

  const { data, isLoading: dataLoading } = useProfileData();
  const profile = data?.profile ?? null;
  const rsvpEvents = data?.rsvpEvents ?? [];
  const suggestedEvents = data?.suggestedEvents ?? [];
  const loading = authLoading || dataLoading;

  useEffect(() => {
    if (!authLoading && !user) goTo("/auth");
  }, [authLoading, user]);

  useEffect(() => {
    if (!loading && user && data?.missingProfile) goTo("/onboarding");
  }, [loading, user, data?.missingProfile]);

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };


  const confirmLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out", description: "You have been logged out successfully." });
    goTo("/");
  };


  // Profile data now loaded via useProfileData() hook (cached + consolidated)


  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // When viewing another member's profile (after all hooks), render the public view.
  if (viewingOther && routeId) {
    return <MemberProfile memberId={routeId} />;
  }


  // Build the user's live favorite-teams list from saved profile fields.
  const favoriteTeams = Array.from(new Set([
    ...((profile as any)?.favorite_la_teams || []),
    ...(profile?.favorite_teams_players || []),
  ].filter((t): t is string => typeof t === "string" && t.trim().length > 0)));

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pb-20 md:pb-8 pt-16 md:pt-2">
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
  const greeting = getGreeting();
  const userName = profile.name?.split(" ")[0] || "there";
  const formattedDate = currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const formattedTime = currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const handle = `@${(profile.name?.split(" ")[0] || "member").toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  // Only count RSVPs the user is actually attached to — drop declined/cancelled so the
  // badge always matches the visible list below.
  const visibleRsvps = rsvpEvents.filter(r => {
    const s = (r.status || "").toLowerCase();
    return s !== "declined" && s !== "cancelled" && s !== "canceled";
  });
  const eventsAttended = visibleRsvps.filter(r => r.status === "going" || r.status === "attended").length;
  const FEED_FILTERS = ["All", "NBA", "WNBA", "NWSL", "NFL", "MLB", "Soccer"];

  // Homepage palette (matches src/pages/Index.tsx)
  const BG = "#0a0a0a";
  const TEXT = "#FAF5E9";
  const PINK = "#E85D2F";        // Vermilion (homepage primary)
  const PANEL = "#161616";       // Homepage surface
  const PANEL_BORDER = "1px solid rgba(250, 245, 233, 0.08)";

  return (
    <div className="min-h-screen" style={{ background: BG, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Seo
        title="Your Profile | Loverball"
        description="Your Loverball member profile — favorite teams, personalized news, and live scores."
        path="/profile"
      />
      <DesktopNav />

      <main
        className="pb-20 md:pb-10 transition-[margin] duration-200"
        style={{ background: BG, color: TEXT, fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-2">


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
                  style={{ height: "min(320px, 40vh)", background: "#0a0a0a" }}
                >
                  {profile.profile_photo_url ? (
                    <img
                      src={profile.profile_photo_url}
                      alt={profile.name}
                      className="w-full h-full object-contain"
                      style={{ filter: "saturate(0.95) contrast(1.04)", background: "#0a0a0a" }} loading="lazy" decoding="async" />
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
                        fontFamily: "'Anton', Impact, sans-serif",
                        fontWeight: 400,
                        fontSize: "clamp(26px, 3vw, 34px)",
                        color: "#FFFFFF",
                        textTransform: "uppercase",
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
                  {/* Stats grid removed per request */}

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

            {/* ═══════════ RIGHT COLUMN — PERSONALIZED HOME ═══════════ */}
            <div className="space-y-8 min-w-0">

              {/* ── 1. For You Tonight ── */}
              <motion.div variants={staggerItem}>
                <ForYouTonight
                  favoriteTeams={favoriteTeams}
                  favoriteSports={profile.favorite_sports || []}
                  featuredEvent={(() => {
                    const today = new Date(); today.setHours(0, 0, 0, 0);
                    const fromRsvp = visibleRsvps
                      .map(r => r.event)
                      .filter(e => !isNaN(new Date(e.event_date).getTime()) && new Date(e.event_date) >= today)
                      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())[0];
                    return (fromRsvp as any) || suggestedEvents[0] || null;
                  })()}
                  userName={userName}
                  onOpenEvent={(id) => goTo(`/event/${id}`)}
                  onOpenWatch={() => setWatchOpen(true)}
                  onOpenStories={() => goTo("/explore")}
                />
              </motion.div>

              {/* ── 2. Vibe Identity + Personalization ── */}
              <motion.div variants={staggerItem}>
                <div className="mb-3">
                  <p
                    className="text-[10px] uppercase"
                    style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.26em", color: PINK }}
                  >
                    Your vibe
                  </p>
                  <h2
                    className="leading-[0.95] mt-1.5 uppercase"
                    style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: "clamp(28px, 3.4vw, 38px)", color: TEXT }}
                  >
                    The fandom <span style={{ color: PINK }}>you</span>.
                  </h2>
                  <p className="mt-1.5 text-[12.5px]" style={{ color: "rgba(250,245,233,0.55)" }}>
                    We tune your feed, events, and matches to this.
                  </p>
                </div>

                <div
                  className="rounded-3xl p-5"
                  style={{
                    background: "linear-gradient(140deg, rgba(232,93,47,0.12), rgba(22,22,22,0.6))",
                    border: "1px solid rgba(232,93,47,0.25)",
                  }}
                >
                  {profile.bio ? (
                    <p
                      className="text-[14px] leading-relaxed"
                      style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "#FAF5E9" }}
                    >
                      &ldquo;{profile.bio}&rdquo;
                    </p>
                  ) : (
                    <p className="text-[13px]" style={{ color: "rgba(250,245,233,0.7)" }}>
                      Tell us your fandom in a sentence — it powers your recs.{" "}
                      <button onClick={() => goTo("/profile/edit")} className="underline" style={{ color: PINK }}>
                        Add a vibe
                      </button>
                    </p>
                  )}

                  {/* Identity tag rail */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {(profile.favorite_sports || []).slice(0, 6).map((s) => (
                      <span key={`s-${s}`} className="px-2.5 py-1 rounded-full text-[10.5px] uppercase tracking-widest"
                        style={{ background: "rgba(250,245,233,0.06)", color: "#FAF5E9", border: "1px solid rgba(250,245,233,0.12)", fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                        {s}
                      </span>
                    ))}
                    {favoriteTeams.slice(0, 5).map((t) => (
                      <span key={`t-${t}`} className="px-2.5 py-1 rounded-full text-[10.5px] uppercase tracking-widest"
                        style={{ background: "rgba(232,93,47,0.14)", color: PINK, border: "1px solid rgba(232,93,47,0.35)", fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                        {t}
                      </span>
                    ))}
                    {profile.event_comfort_level && (
                      <span className="px-2.5 py-1 rounded-full text-[10.5px] uppercase tracking-widest"
                        style={{ background: "rgba(45,212,191,0.12)", color: "#2DD4BF", border: "1px solid rgba(45,212,191,0.35)", fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                        {profile.event_comfort_level}
                      </span>
                    )}
                    <button
                      onClick={() => goTo("/profile/edit")}
                      className="px-2.5 py-1 rounded-full text-[10.5px] uppercase tracking-widest inline-flex items-center gap-1"
                      style={{ background: "transparent", color: "rgba(250,245,233,0.55)", border: "1px dashed rgba(250,245,233,0.25)", fontFamily: "'Inter', sans-serif", fontWeight: 700 }}
                    >
                      <Edit className="w-2.5 h-2.5" /> Quick edit
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <PersonalizationControls />
                </div>
              </motion.div>

              {/* ── 3. Smart Events (RSVPs or curated suggestions) ── */}
              <motion.div variants={staggerItem}>
                <SmartEvents
                  upcomingRsvps={visibleRsvps
                    .filter(r => {
                      const today = new Date(); today.setHours(0, 0, 0, 0);
                      const d = new Date(r.event.event_date);
                      return !isNaN(d.getTime()) && d >= today;
                    })
                    .sort((a, b) => new Date(a.event.event_date).getTime() - new Date(b.event.event_date).getTime())}
                  suggestions={suggestedEvents}
                  userCity={profile.city}
                  onOpenEvent={(id) => goTo(`/event/${id}`)}
                  onBrowseAll={() => goTo("/events")}
                />
              </motion.div>

              {/* ── 4. People With Your Vibe ── */}
              <motion.div variants={staggerItem}>
                <SuggestedFans
                  myCity={profile.city}
                  mySports={profile.favorite_sports || []}
                  myTeams={favoriteTeams}
                  onBrowseAll={() => goTo("/friends")}
                />
              </motion.div>

              {/* ── 5. Grouped activity / inbox ── */}
              <motion.div variants={staggerItem}>
                <div className="mb-3">
                  <p
                    className="text-[10px] uppercase"
                    style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.26em", color: PINK }}
                  >
                    Your activity
                  </p>
                  <h2
                    className="leading-[0.95] mt-1.5 uppercase"
                    style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: "clamp(28px, 3.4vw, 38px)", color: TEXT }}
                  >
                    What's <span style={{ color: PINK }}>new</span>.
                  </h2>
                  <p className="mt-1.5 text-[12.5px]" style={{ color: "rgba(250,245,233,0.55)" }}>
                    {greeting}, <span style={{ color: TEXT, fontWeight: 500 }}>{userName}</span>. Social, events and alerts in one place.
                  </p>
                </div>
                <ProfileInbox />
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

      {/* Full Team Schedule Sheet */}
      <Sheet open={!!scheduleTeam} onOpenChange={(o) => !o && setScheduleTeam(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto bg-background">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: PINK }} />
              <span className="truncate">{scheduleTeam} · Full Schedule</span>
            </SheetTitle>
          </SheetHeader>
          {scheduleTeam && <ProfileWhereToWatch favoriteTeams={[scheduleTeam]} />}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Profile;
