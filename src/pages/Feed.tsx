/**
 * Loverball Feed — Personalized daily home for members.
 * Sections: For You Right Now → Live Now → Tonight → News You'll Care About → Plans Nearby.
 */
import { useEffect, useState } from "react";
import { Calendar, ChevronRight, Radio, Ticket, Tv, Newspaper, MapPin, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import DesktopNav from "@/components/DesktopNav";
import Seo from "@/components/Seo";
import ProfileScores from "@/components/ProfileScores";
import ProfileWhereToWatch from "@/components/ProfileWhereToWatch";
import MySportsFeed from "@/components/MySportsFeed";
import ForYouTonight from "@/components/profile/ForYouTonight";
import SmartEvents from "@/components/profile/SmartEvents";
import PersonalizationControls, { useFanMode } from "@/components/profile/PersonalizationControls";
import { useAuth } from "@/hooks/useAuth";
import { useProfileData } from "@/hooks/useProfileData";
import { supabase } from "@/integrations/supabase/client";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const BG = "#0a0a0a";
const TEXT = "#FAF5E9";
const PINK = "#E85D2F";
const PANEL = "#161616";
const BORDER = "1px solid rgba(250, 245, 233, 0.08)";

const goTo = (path: string) => { window.location.href = path; };

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const SectionHeader = ({
  eyebrow, title, accent, because, action,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  because?: string;
  action?: { label: string; onClick: () => void };
}) => (
  <div className="mb-3 flex items-end justify-between gap-3">
    <div className="min-w-0">
      <p
        className="text-[10px] uppercase"
        style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.26em", color: PINK }}
      >
        {eyebrow}
      </p>
      <h2
        className="leading-[0.95] mt-1.5 uppercase"
        style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: "clamp(26px, 3vw, 34px)", color: TEXT }}
      >
        {title} {accent && <span style={{ color: PINK }}>{accent}</span>}
      </h2>
      {because && (
        <p
          className="mt-1.5 text-[11.5px] inline-flex items-center gap-1.5"
          style={{ color: "rgba(250,245,233,0.55)", fontFamily: "'Inter', sans-serif" }}
        >
          <Sparkles className="w-3 h-3" style={{ color: PINK }} /> {because}
        </p>
      )}
    </div>
    {action && (
      <button
        onClick={action.onClick}
        className="flex items-center gap-1 text-[11px] uppercase tracking-widest shrink-0"
        style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color: PINK }}
      >
        {action.label} <ChevronRight className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

const summarizeList = (items: string[], max = 2) => {
  if (!items || items.length === 0) return "";
  if (items.length <= max) return items.join(" + ");
  return `${items.slice(0, max).join(" + ")} +${items.length - max}`;
};

const Feed = () => {
  const { user } = useAuth();
  const { data: profileBundle } = useProfileData();
  const [userSports, setUserSports] = useState<string[]>([]);
  const [userTeams, setUserTeams] = useState<string[]>([]);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [mode] = useFanMode();

  const rsvpEvents = profileBundle?.rsvpEvents ?? [];
  const suggestedEvents = profileBundle?.suggestedEvents ?? [];
  const visibleRsvps = rsvpEvents.filter(r => {
    const s = (r.status || "").toLowerCase();
    return s !== "declined" && s !== "cancelled" && s !== "canceled";
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, favorite_sports, favorite_teams, favorite_teams_players, favorite_la_teams, pro_leagues, city")
        .eq("id", user.id)
        .maybeSingle();
      const sports = Array.from(new Set([
        ...((data?.favorite_sports as string[] | null) ?? []),
        ...((data?.pro_leagues as string[] | null) ?? []),
      ]));
      const teams = Array.from(new Set([
        ...((data?.favorite_la_teams as string[] | null) ?? []),
        ...((data?.favorite_teams as string[] | null) ?? []),
        ...((data?.favorite_teams_players as string[] | null) ?? []),
      ]));
      // Optionally reorder for women's-first
      const womenLeagues = ["WNBA", "NWSL", "PWHL", "LPGA", "WTA", "NCAA Women's"];
      const orderedSports = mode.womenFirst
        ? [...sports.filter(s => womenLeagues.some(w => s.toLowerCase().includes(w.toLowerCase()))),
           ...sports.filter(s => !womenLeagues.some(w => s.toLowerCase().includes(w.toLowerCase())))]
        : sports;
      setUserSports(orderedSports);
      setUserTeams(teams);
      setUserCity((data?.city as string | null) ?? null);
      setUserName(((data?.name as string | null) ?? "").split(" ")[0] || "there");
    })();
  }, [user?.id, mode.womenFirst]);

  // Pick the "For You Right Now" featured event: nearest RSVP'd, else first suggested.
  const featuredEvent = (() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const fromRsvp = visibleRsvps
      .map(r => r.event)
      .filter(e => e && !isNaN(new Date(e.event_date).getTime()) && new Date(e.event_date) >= today)
      .sort((a, b) => new Date(a!.event_date).getTime() - new Date(b!.event_date).getTime())[0];
    return (fromRsvp as any) || suggestedEvents[0] || null;
  })();

  const upcomingRsvps = visibleRsvps
    .filter(r => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const d = new Date(r.event.event_date);
      return !isNaN(d.getTime()) && d >= today;
    })
    .sort((a, b) => new Date(a.event.event_date).getTime() - new Date(b.event.event_date).getTime());

  const teamsBlurb = userTeams.length > 0
    ? `Because you follow ${summarizeList(userTeams)}`
    : "Add favorite teams to personalize this.";
  const sportsBlurb = userSports.length > 0
    ? `Because you follow ${summarizeList(userSports)}${userCity ? ` in ${userCity.split(",")[0]}` : ""}`
    : "Pick a few sports and we'll fill this in.";
  const cityBlurb = userCity
    ? `Trending with fans in ${userCity.split(",")[0]}`
    : "Add a city to see what's nearby.";

  return (
    <div className="min-h-[100dvh]" style={{ background: BG, color: TEXT }}>
      <Seo
        title="Loverball Feed"
        description="Your personalized daily sports home — live games, watch parties, news, and plans nearby."
        path="/feed"
      />
      <DesktopNav />
      <main className="max-w-2xl mx-auto px-4 pt-6 pb-32 md:pt-[88px]">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="space-y-8 min-w-0"
        >

          {/* GREETING + PERSONALIZATION */}
          <motion.div variants={staggerItem}>
            <p
              className="text-[10px] uppercase"
              style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.26em", color: PINK }}
            >
              {format(new Date(), "EEEE, MMM d")}
            </p>
            <h1
              className="leading-[0.95] mt-1.5 uppercase"
              style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: "clamp(34px, 5vw, 48px)", color: TEXT }}
            >
              {getGreeting()}, <span style={{ color: PINK }}>{userName || "there"}</span>.
            </h1>
            <p className="mt-2 text-[13px]" style={{ color: "rgba(250,245,233,0.6)" }}>
              Here's what matters in your sports world — scan in two minutes.
            </p>
            <div className="mt-4">
              <PersonalizationControls />
            </div>
          </motion.div>

          {/* 1. FOR YOU RIGHT NOW */}
          <motion.div variants={staggerItem}>
            <ForYouTonight
              favoriteTeams={userTeams}
              favoriteSports={userSports}
              featuredEvent={featuredEvent}
              userName={userName || "you"}
              onOpenEvent={(id) => goTo(`/event/${id}`)}
              onOpenWatch={() => goTo("/events")}
              onOpenStories={() => goTo("/explore")}
            />
          </motion.div>

          {/* 2. LIVE NOW */}
          <motion.div variants={staggerItem}>
            <SectionHeader
              eyebrow="Live now"
              title="On the"
              accent="court."
              because={teamsBlurb}
              action={{ label: "All scores", onClick: () => goTo("/explore") }}
            />
            <div className="rounded-3xl p-4" style={{ background: PANEL, border: BORDER }}>
              <ProfileScores favoriteTeams={userTeams} />
            </div>
          </motion.div>

          {/* 3. TONIGHT — Watch + My RSVPs */}
          <motion.div variants={staggerItem}>
            <SectionHeader
              eyebrow="Tonight"
              title="Where to"
              accent="tune in."
              because={mode.vibesMode ? "Based on your vibe and saved teams." : teamsBlurb}
              action={{ label: "Browse events", onClick: () => goTo("/events") }}
            />
            <div className="rounded-3xl p-4" style={{ background: PANEL, border: BORDER }}>
              <ProfileWhereToWatch favoriteTeams={userTeams} />
            </div>

            {/* My RSVPs strip */}
            {visibleRsvps.length > 0 && (
              <div className="mt-4">
                <p
                  className="mb-2 text-[10px] uppercase inline-flex items-center gap-1.5"
                  style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.22em", color: "rgba(250,245,233,0.6)" }}
                >
                  <Ticket className="w-3 h-3" style={{ color: PINK }} /> On your calendar
                </p>
                <ul className="space-y-2">
                  {upcomingRsvps.slice(0, 3).map(r => r.event && (
                    <li key={r.id}>
                      <button
                        onClick={() => goTo(`/event/${r.event!.id}`)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-colors hover:bg-white/[0.05]"
                        style={{ background: PANEL, border: BORDER }}
                      >
                        <div className="shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center"
                          style={{ background: "rgba(232,93,47,0.12)", border: "1px solid rgba(232,93,47,0.25)" }}>
                          <span className="text-[8px] uppercase leading-none" style={{ fontFamily: "'Space Mono', monospace", color: PINK, letterSpacing: "0.1em" }}>
                            {format(new Date(r.event.event_date), "MMM")}
                          </span>
                          <span className="text-[14px] font-bold leading-none mt-0.5" style={{ color: TEXT, fontFamily: "'Anton', Impact, sans-serif" }}>
                            {format(new Date(r.event.event_date), "d")}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate" style={{ color: TEXT }}>{r.event.title}</p>
                          <p className="text-[11px] truncate inline-flex items-center gap-1" style={{ color: "rgba(250,245,233,0.55)" }}>
                            <MapPin className="w-3 h-3" /> {r.event.venue_name || r.event.city || "Location TBD"}
                          </p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(250,245,233,0.35)" }} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>

          {/* 4. NEWS YOU'LL CARE ABOUT */}
          <motion.div variants={staggerItem}>
            <SectionHeader
              eyebrow="News you'll care about"
              title="The"
              accent="read."
              because={sportsBlurb}
              action={{ label: "Full feed", onClick: () => goTo("/explore") }}
            />
            <div className="rounded-3xl overflow-hidden" style={{ background: PANEL, border: BORDER }}>
              <div className="p-4 max-h-[520px] overflow-hidden relative">
                <MySportsFeed
                  userSports={userSports}
                  userTeams={userTeams}
                  userCity={userCity}
                />
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24"
                  style={{ background: "linear-gradient(to bottom, transparent, rgba(22,22,22,0.95))" }} />
              </div>
              <div className="px-4 pb-4">
                <button
                  onClick={() => goTo("/explore")}
                  className="w-full h-11 rounded-xl text-[11px] uppercase font-bold tracking-[0.16em] inline-flex items-center justify-center gap-2"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: TEXT, fontFamily: "Inter, sans-serif" }}
                >
                  <Newspaper className="w-3.5 h-3.5" style={{ color: PINK }} /> Open the full sports feed
                </button>
              </div>
            </div>
          </motion.div>

          {/* 5. PLANS NEARBY */}
          <motion.div variants={staggerItem}>
            <SmartEvents
              upcomingRsvps={[]}
              suggestions={suggestedEvents}
              userCity={userCity}
              onOpenEvent={(id) => goTo(`/event/${id}`)}
              onBrowseAll={() => goTo("/events")}
            />
            <p
              className="mt-2 text-[11.5px] inline-flex items-center gap-1.5"
              style={{ color: "rgba(250,245,233,0.5)", fontFamily: "'Inter', sans-serif" }}
            >
              <Sparkles className="w-3 h-3" style={{ color: PINK }} /> {cityBlurb}
            </p>
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
};

export default Feed;
