/**
 * Loverball Feed — Live & Recent Scores, Where to Watch, From Your Sports.
 * Identity, Inbox, and My Events stay on /profile.
 */
import { useEffect, useState } from "react";
import { ChevronDown, Radio, Tv } from "lucide-react";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import Seo from "@/components/Seo";
import ProfileScores from "@/components/ProfileScores";
import ProfileWhereToWatch from "@/components/ProfileWhereToWatch";
import MySportsFeed from "@/components/MySportsFeed";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
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
  const [userSports, setUserSports] = useState<string[]>([]);
  const [userTeams, setUserTeams] = useState<string[]>([]);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [scoresOpen, setScoresOpen] = useState(true);
  const [watchOpen, setWatchOpen] = useState(true);

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
