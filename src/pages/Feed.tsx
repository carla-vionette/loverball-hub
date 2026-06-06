/**
 * Loverball Feed — primary home screen.
 * Order: Live & Recent Scores (collapsible) → My Events → Where to Watch
 *        (your teams + channels + tickets) → Suggested Events → From Your Sports.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronRight, ChevronDown } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import Seo from "@/components/Seo";
import LiveScores from "@/components/LiveScores";
import MySportsFeed from "@/components/MySportsFeed";
import WhereToWatch from "@/components/WhereToWatch";
import ProfileWhereToWatch from "@/components/ProfileWhereToWatch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface RsvpEvent {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  venue_name: string | null;
  city: string | null;
  image_url: string | null;
}

const MyEventsRail = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<RsvpEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("event_rsvps")
        .select("event_id, events:event_id(id, title, event_date, event_time, venue_name, city, image_url)")
        .eq("user_id", user.id)
        .eq("status", "going")
        .order("created_at", { ascending: false })
        .limit(8);
      const rows = (data ?? [])
        .map((r) => (r as { events: RsvpEvent | null }).events)
        .filter((e): e is RsvpEvent => !!e && new Date(e.event_date) >= new Date(Date.now() - 24 * 60 * 60 * 1000));
      setEvents(rows);
      setLoading(false);
    })();
  }, [user?.id]);

  return (
    <section className="px-4 mt-6">
      <header className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl uppercase tracking-tight">My Events</h2>
        <Link to="/events" className="text-xs uppercase tracking-widest text-[#E85D2F] flex items-center gap-1">
          All <ChevronRight className="w-3 h-3" />
        </Link>
      </header>
      {loading ? (
        <div className="flex gap-3 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[220px] h-32 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <Link
          to="/events"
          className="block rounded-xl border border-dashed border-[#E8E3DC] p-5 text-center"
        >
          <CalendarDays className="w-5 h-5 mx-auto text-[#6B6B6B] mb-2" />
          <p className="text-sm text-[#1A1A1A] font-medium">No upcoming RSVPs</p>
          <p className="text-xs text-[#6B6B6B] mt-1">Browse events and lock in your first one.</p>
        </Link>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 snap-x snap-mandatory">
          {events.map((ev) => (
            <Link
              key={ev.id}
              to={`/event/${ev.id}`}
              className="min-w-[240px] max-w-[240px] snap-start rounded-xl overflow-hidden bg-white border border-[#E8E3DC]"
            >
              <div
                className="h-24 w-full bg-cover bg-center"
                style={{
                  backgroundImage: ev.image_url
                    ? `url(${ev.image_url})`
                    : "linear-gradient(135deg,#E85D2F,#FAF5E9)",
                }}
              />
              <div className="p-3">
                <p className="text-xs uppercase tracking-widest text-[#E85D2F]">
                  {new Date(ev.event_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  {ev.event_time ? ` · ${ev.event_time.slice(0, 5)}` : ""}
                </p>
                <p className="font-semibold text-sm mt-1 line-clamp-2">{ev.title}</p>
                {ev.venue_name && (
                  <p className="text-xs text-[#6B6B6B] mt-1 truncate">{ev.venue_name}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

const Feed = () => {
  const { user } = useAuth();
  const [userSports, setUserSports] = useState<string[]>([]);
  const [userTeams, setUserTeams] = useState<string[]>([]);
  const [userCity, setUserCity] = useState<string | null>(null);

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
    <div className="min-h-[100dvh] bg-[#FAF7F2] text-[#1A1A1A]">
      <Seo
        title="Loverball Feed"
        description="Live scores, your upcoming events, your sports news, and where to watch."
        path="/feed"
      />
      <DesktopNav />
      <main className="max-w-2xl mx-auto pb-32 md:pt-[88px]">
        {/* Editorial masthead */}
        <header className="px-4 pt-6 pb-2">
          <p
            className="text-[10px] tracking-[0.22em] uppercase text-[#E85D2F]"
            style={{ fontFamily: "'Space Mono', ui-monospace, monospace" }}
          >
            The Feed
          </p>
          <h1 className="font-display text-3xl mt-1">Your daily lineup</h1>
        </header>

        {/* 1. Live & recent scores (collapsible) */}
        <section className="px-4 mt-4">
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="group flex w-full items-center justify-between mb-3">
              <h2 className="font-display text-xl uppercase tracking-tight">Live & Recent Scores</h2>
              <ChevronDown className="w-5 h-5 text-[#6B6B6B] transition-transform group-data-[state=closed]:-rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <LiveScores />
            </CollapsibleContent>
          </Collapsible>
        </section>

        {/* 2. My events */}
        <MyEventsRail />

        {/* 3. Where to watch — your teams, the channels carrying their games, tickets */}
        <section className="px-4 mt-8">
          <h2 className="font-display text-xl uppercase tracking-tight mb-3">Where to Watch</h2>
          <ProfileWhereToWatch favoriteTeams={userTeams} />
        </section>

        {/* 4. Suggested events */}
        <section className="px-4 mt-8">
          <h2 className="font-display text-xl uppercase tracking-tight mb-3">Suggested Events</h2>
          <WhereToWatch />
        </section>

        {/* 5. From your sports (last) */}
        <section className="px-4 mt-8">
          <h2 className="font-display text-xl uppercase tracking-tight mb-3">From Your Sports</h2>
          <MySportsFeed userSports={userSports} userTeams={userTeams} userCity={userCity} />
        </section>
      </main>
      <BottomNav />
    </div>
  );
};

export default Feed;
