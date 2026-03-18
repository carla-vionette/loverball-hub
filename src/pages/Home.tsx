import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Plus, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHomepageData } from "@/hooks/useHomepageData";
import BottomNav from "@/components/BottomNav";
import WelcomeBanner from "@/components/WelcomeBanner";
import lLogo from "@/assets/loverball-new-l-logo.png";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { LA_PRO_TEAMS } from "@/lib/laTeamsConfig";

/* ── Mock stories for demo ── */
const MOCK_STORIES = [
  { id: "1", name: "Jada", avatar: "" },
  { id: "2", name: "Maya", avatar: "" },
  { id: "3", name: "Toni", avatar: "" },
  { id: "4", name: "Ari", avatar: "" },
  { id: "5", name: "Lex", avatar: "" },
  { id: "6", name: "Bri", avatar: "" },
  { id: "7", name: "Sam", avatar: "" },
];

/* ── Shows / Content lane data ── */
const SHOW_CARDS = [
  { id: "1", title: "LOCKER ROOM\nSTORIES", gradient: "from-[hsl(14,100%,59%)] to-[hsl(18,100%,68%)]" },
  { id: "2", title: "MESSY\nFANS", gradient: "from-[hsl(174,72%,35%)] to-[hsl(174,50%,50%)]" },
  { id: "3", title: "GAME DAY\nDRAMA", gradient: "from-[hsl(25,90%,50%)] to-[hsl(40,95%,60%)]" },
  { id: "4", title: "COURTSIDE\nCONFESSIONS", gradient: "from-[hsl(350,80%,55%)] to-[hsl(14,100%,65%)]" },
  { id: "5", title: "THE\nPLAYBOOK", gradient: "from-[hsl(210,20%,18%)] to-[hsl(210,15%,35%)]" },
];

const Home = () => {
  const { user } = useAuth();
  const { data: homepageData } = useHomepageData();
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState<any>(null);

  // Fetch unread notification count
  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setUnreadCount(count || 0);
    };
    fetchUnread();
  }, [user?.id]);

  // Fetch profile for avatar & teams
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, profile_photo_url, favorite_la_teams")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [user?.id]);

  const userTeams = (profile?.favorite_la_teams || []) as string[];
  const matchedTeams = LA_PRO_TEAMS.filter((t) =>
    userTeams.some((ut: string) => t.shortName === ut || t.name === ut)
  );

  const events = homepageData?.upcoming_events ?? [];

  return (
    <div className="min-h-screen bg-home-bg pb-24">
      <WelcomeBanner />

      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-home-bg/95 backdrop-blur-sm">
        <img src={lLogo} alt="Loverball" className="h-9 w-auto" />
        <Link to="/inbox" className="relative p-2 -mr-2">
          <Bell className="w-6 h-6 text-home-bg-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-home-coral" />
          )}
        </Link>
      </header>

      <main className="px-4 space-y-7">
        {/* ── Section 1: Hero "Game of the Day" ── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-home-coral to-home-coral-end p-6 min-h-[200px] flex flex-col justify-end">
          {/* subtle texture */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_30%,white_0%,transparent_60%)]" />
          <div className="relative z-10">
            <p className="font-display text-sm tracking-[0.2em] text-white/80 uppercase mb-1">Match of the Day</p>
            <h2 className="font-display text-4xl font-extrabold text-white uppercase leading-none tracking-tight">
              TONIGHT'S<br />GAME
            </h2>
            <p className="font-body text-sm text-white/80 mt-2">
              {events.length > 0 ? events[0].title : "Lakers vs Clippers • 7:30 PM PT"}
            </p>
            <Link
              to={events.length > 0 ? `/event/${events[0].id}` : "/events"}
              className="inline-flex items-center mt-4 px-5 py-2.5 rounded-full bg-white text-home-bg-foreground font-body font-semibold text-sm shadow-md hover:shadow-lg transition-shadow"
            >
              Watch Party
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </section>

        {/* ── Section 2: Stories Row ── */}
        <section>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
            {/* Your story */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="relative">
                <Avatar className="w-16 h-16 ring-2 ring-border">
                  <AvatarImage src={profile?.profile_photo_url || ""} />
                  <AvatarFallback className="bg-muted text-muted-foreground font-display text-lg">
                    {profile?.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-home-coral flex items-center justify-center ring-2 ring-home-bg">
                  <Plus className="w-3 h-3 text-white" />
                </span>
              </div>
              <span className="text-[11px] font-body text-muted-foreground">You</span>
            </div>
            {MOCK_STORIES.map((s, i) => (
              <div key={s.id} className="flex flex-col items-center gap-1.5 shrink-0">
                <Avatar className={`w-16 h-16 ring-2 ${i < 3 ? "ring-primary" : "ring-border"}`}>
                  <AvatarFallback className="bg-muted text-muted-foreground font-display text-lg">
                    {s.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[11px] font-body text-muted-foreground">{s.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 3: Shows & Content Lane ── */}
        <section>
          <h3 className="font-display text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3">Shows & Content</h3>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {SHOW_CARDS.map((card) => (
              <Link
                key={card.id}
                to="/watch"
                className={`shrink-0 w-36 h-48 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-end p-4 shadow-md hover:shadow-lg transition-shadow`}
              >
                <h4 className="font-display text-lg font-extrabold text-white uppercase leading-tight whitespace-pre-line">
                  {card.title}
                </h4>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Section 4: Events Cards ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-xs tracking-[0.2em] uppercase text-muted-foreground">Upcoming Events</h3>
            <Link to="/events" className="text-xs font-body font-semibold text-home-coral">See all</Link>
          </div>
          <div className="space-y-3">
            {(events.length > 0 ? events.slice(0, 3) : [
              { id: "demo1", title: "Sober Brunch & Basketball", event_date: "2026-04-05", city: "Los Angeles", sport_tags: ["messy sports girlies", "sober brunch"], slug: null },
              { id: "demo2", title: "WNBA Season Opener Watch Party", event_date: "2026-05-17", city: "Inglewood", sport_tags: ["watch party", "wnba"], slug: null },
            ]).map((ev: any) => (
              <Link
                key={ev.id}
                to={ev.slug ? `/event/${ev.slug}` : `/event/${ev.id}`}
                className="block rounded-2xl border border-home-coral/15 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <h4 className="font-display text-xl font-extrabold uppercase text-home-bg-foreground leading-tight">
                  {ev.title}
                </h4>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  {ev.city || "Los Angeles"} • {format(new Date(ev.event_date), "MMM d")}
                </p>
                {ev.sport_tags && ev.sport_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(ev.sport_tags as string[]).slice(0, 3).map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-full bg-home-bg text-[11px] font-body font-medium text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <span className="inline-block mt-3 px-4 py-1.5 rounded-full bg-home-coral text-white font-body font-semibold text-xs uppercase tracking-wide">
                  RSVP
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Section 5: Your Teams / Community ── */}
        {matchedTeams.length > 0 && (
          <section>
            <h3 className="font-display text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3">Your Teams</h3>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {matchedTeams.map((team) => (
                <Link
                  key={team.shortName}
                  to={`/community`}
                  className="shrink-0 w-28 rounded-2xl bg-white border border-border/30 p-4 flex flex-col items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                    <span className="font-display text-sm font-extrabold text-muted-foreground uppercase">
                      {team.shortName.slice(0, 3)}
                    </span>
                  </div>
                  <span className="font-body text-xs text-home-bg-foreground font-medium text-center leading-tight">
                    {team.shortName}
                  </span>
                  {team.gender === "women" && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-body font-semibold">
                      LIVE NOW
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Fallback teams section when user has none */}
        {matchedTeams.length === 0 && (
          <section>
            <h3 className="font-display text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3">Popular Teams</h3>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {LA_PRO_TEAMS.filter(t => t.gender === "women").slice(0, 4).map((team) => (
                <Link
                  key={team.shortName}
                  to="/community"
                  className="shrink-0 w-28 rounded-2xl bg-white border border-border/30 p-4 flex flex-col items-center gap-2 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                    <span className="font-display text-sm font-extrabold text-muted-foreground uppercase">
                      {team.shortName.slice(0, 3)}
                    </span>
                  </div>
                  <span className="font-body text-xs text-home-bg-foreground font-medium text-center">
                    {team.shortName}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Home;
