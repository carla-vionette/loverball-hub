/**
 * Loverball Feed — Inbox, My Events, Live & Recent Scores, Where to Watch, From Your Sports.
 * Identity + What's New stay on /profile.
 */
import { useEffect, useState } from "react";
import { Calendar, ChevronDown, ChevronRight, Radio, Ticket, Tv } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import Seo from "@/components/Seo";
import ProfileInbox from "@/components/profile/ProfileInbox";
import ProfileScores from "@/components/ProfileScores";
import ProfileWhereToWatch from "@/components/ProfileWhereToWatch";
import MySportsFeed from "@/components/MySportsFeed";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { useProfileData } from "@/hooks/useProfileData";
import { supabase } from "@/integrations/supabase/client";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const BG = "#0a0a0a";
const PINK = "#E85D2F";
const PANEL = "#161616";
const PANEL_BORDER = "1px solid rgba(250, 245, 233, 0.08)";

const goTo = (path: string) => { window.location.href = path; };

const Feed = () => {
  const { user } = useAuth();
  const { data: profileBundle } = useProfileData();
  const [userSports, setUserSports] = useState<string[]>([]);
  const [userTeams, setUserTeams] = useState<string[]>([]);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [eventsOpen, setEventsOpen] = useState(true);
  const [scoresOpen, setScoresOpen] = useState(true);
  const [watchOpen, setWatchOpen] = useState(true);

  const rsvpEvents = profileBundle?.rsvpEvents ?? [];
  const visibleRsvps = rsvpEvents.filter(r => {
    const s = (r.status || "").toLowerCase();
    return s !== "declined" && s !== "cancelled" && s !== "canceled";
  });


  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("favorite_sports, favorite_teams, favorite_teams_players, pro_leagues, city")
        .eq("id", user.id)
        .maybeSingle();
      const sports = [
        ...((data?.favorite_sports as string[] | null) ?? []),
        ...((data?.pro_leagues as string[] | null) ?? []),
      ];
      const teams = [
        ...((data?.favorite_teams as string[] | null) ?? []),
        ...((data?.favorite_teams_players as string[] | null) ?? []),
      ];
      setUserSports(sports);
      setUserTeams(teams);
      setUserCity((data?.city as string | null) ?? null);
    })();
  }, [user?.id]);

  return (
    <div className="min-h-[100dvh]" style={{ background: BG, color: "#FAF5E9" }}>
      <Seo
        title="Loverball Feed"
        description="Live & recent scores, where to watch your teams, and the latest from your sports."
        path="/feed"
      />
      <DesktopNav />
      <main className="max-w-2xl mx-auto px-4 pt-6 pb-32 md:pt-[88px]">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="space-y-6 min-w-0"
        >

          {/* MY EVENTS */}
          <motion.div variants={staggerItem}>
            <div className="rounded-2xl overflow-hidden" style={{ background: PANEL, border: PANEL_BORDER }}>
              <button
                type="button"
                onClick={() => setEventsOpen(o => !o)}
                aria-expanded={eventsOpen}
                className="w-full p-5 pb-3 flex items-center justify-between"
              >
                <span className="text-[13px] uppercase flex items-center gap-2.5"
                  style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.2em", color: "#FAF5E9", fontWeight: 500 }}>
                  <Ticket className="w-3.5 h-3.5" style={{ color: PINK }} strokeWidth={2.5} /> My Events
                  {visibleRsvps.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(233,30,99,0.15)", color: PINK, letterSpacing: "0.08em" }}>
                      {visibleRsvps.length}
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-3">
                  <span
                    onClick={(e) => { e.stopPropagation(); goTo("/events"); }}
                    role="link"
                    className="text-[11px] uppercase cursor-pointer"
                    style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.18em", color: PINK }}
                  >
                    Browse all →
                  </span>
                  <ChevronDown
                    className="w-4 h-4 transition-transform"
                    style={{ color: PINK, transform: eventsOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
                  />
                </div>
              </button>
              {eventsOpen && (
                <div className="px-5 pb-5">
                  {visibleRsvps.length === 0 ? (
                    <div className="py-10 px-4 text-center rounded-xl"
                      style={{ background: "linear-gradient(135deg, rgba(233,30,99,0.08), rgba(216,140,90,0.04))", border: "1px dashed rgba(233,30,99,0.22)" }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                        style={{ background: "rgba(233,30,99,0.15)" }}>
                        <Calendar className="w-5 h-5" style={{ color: PINK }} />
                      </div>
                      <p className="text-[14px] mb-1" style={{ color: "#FAF5E9", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
                        No events on your calendar yet.
                      </p>
                      <p className="text-[12px] mb-4" style={{ color: "rgba(250,245,233,0.55)" }}>
                        Watch parties, tailgates, and meetups happen weekly. Find one near you.
                      </p>
                      <button onClick={() => goTo("/events")}
                        className="text-[11px] uppercase font-bold tracking-[0.16em] px-4 py-2 rounded-full"
                        style={{ background: PINK, color: "#0a0a0a", fontFamily: "Inter, sans-serif" }}>
                        Explore events
                      </button>
                    </div>
                  ) : (
                    <ul className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      {visibleRsvps.slice(0, 5).map(r => r.event && (
                        <li key={r.id}>
                          <button
                            onClick={() => goTo(`/event/${r.event!.id}`)}
                            className="w-full flex items-center gap-3 py-2.5 text-left transition-colors hover:bg-white/[0.03] rounded-lg px-2 -mx-2"
                          >
                            <div className="shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center"
                              style={{ background: "rgba(233,30,99,0.10)", border: "1px solid rgba(233,30,99,0.20)" }}>
                              <span className="text-[8px] uppercase leading-none" style={{ fontFamily: "'Space Mono', monospace", color: PINK, letterSpacing: "0.1em" }}>
                                {format(new Date(r.event.event_date), "MMM")}
                              </span>
                              <span className="text-[14px] font-bold leading-none mt-0.5" style={{ color: "#FAF5E9", fontFamily: "'Playfair Display', serif" }}>
                                {format(new Date(r.event.event_date), "d")}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium truncate" style={{ color: "#FAF5E9" }}>{r.event.title}</p>
                              <p className="text-[11px] truncate" style={{ color: "rgba(250,245,233,0.55)" }}>
                                {r.event.venue_name || r.event.city || "Location TBD"}
                              </p>
                            </div>
                            <span className="text-[9px] uppercase px-2 py-0.5 rounded-full shrink-0"
                              style={{ background: r.status === "going" || r.status === "attended" ? "rgba(232,93,47,0.18)" : "rgba(255,255,255,0.06)", color: r.status === "going" || r.status === "attended" ? PINK : "rgba(250,245,233,0.6)", fontFamily: "'Space Mono', monospace", letterSpacing: "0.12em" }}>
                              {r.status}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(250,245,233,0.35)" }} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* LIVE & RECENT SCORES */}

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
                    <ProfileScores favoriteTeams={userTeams} />
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </motion.div>

          {/* WHERE TO WATCH */}
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
                    <ProfileWhereToWatch favoriteTeams={userTeams} />
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </motion.div>

          {/* FROM YOUR SPORTS */}
          <motion.div variants={staggerItem}>
            <div className="rounded-2xl overflow-hidden" style={{ background: PANEL, border: PANEL_BORDER }}>
              <div className="p-5 pb-3 flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-[13px] uppercase flex items-center gap-2.5"
                    style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.2em", color: "#FAF5E9", fontWeight: 500 }}>
                    <Radio className="w-3.5 h-3.5" style={{ color: PINK }} /> From your sports
                  </span>
                  <p className="text-[11px] mt-1.5" style={{ color: "rgba(250,245,233,0.5)" }}>
                    A quick read. Full feed lives on Explore.
                  </p>
                </div>
                <button
                  onClick={() => goTo("/explore")}
                  className="text-[11px] uppercase shrink-0"
                  style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.18em", color: PINK }}
                >
                  Full feed →
                </button>
              </div>
              <div className="px-5 pb-5 pt-2 max-h-[520px] overflow-hidden relative">
                <MySportsFeed
                  userSports={userSports}
                  userTeams={userTeams}
                  userCity={userCity}
                />
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24"
                  style={{ background: "linear-gradient(to bottom, transparent, rgba(10,10,11,0.95))" }} />
              </div>
              <div className="px-5 pb-5 -mt-2 relative">
                <button
                  onClick={() => goTo("/explore")}
                  className="w-full h-10 rounded-xl text-[11px] uppercase font-bold tracking-[0.16em]"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#FAF5E9", fontFamily: "Inter, sans-serif" }}
                >
                  View the full sports feed
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Feed;
