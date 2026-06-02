import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { C, fonts } from "@/lib/editorialTheme";
import Seo from "@/components/Seo";
import { Calendar, MapPin, Users, MessageCircle } from "lucide-react";
import { format } from "date-fns";

interface Person { id: string; name: string | null; city: string | null; profile_photo_url: string | null; }
interface Circle { key: string; label: string; sub: string; }
interface EventLite { id: string; title: string; event_date: string; city: string | null; image_url: string | null; }

const SectionHeader = ({ kicker, title }: { kicker: string; title: string }) => (
  <div className="mb-3 px-1">
    <div className="text-[10px] uppercase tracking-[0.28em]"
         style={{ fontFamily: fonts.mono, color: C.raspberry }}>{kicker}</div>
    <h3 className="mt-1" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 24, lineHeight: 1.15 }}>{title}</h3>
  </div>
);

const initialsBg = (name: string | null) => {
  const seed = (name || "?").charCodeAt(0);
  const hues = ["#E85D2F", "#1A1A1A", "#6B6B6B", "#D4CFC5"];
  return hues[seed % hues.length];
};

const WelcomeCircles = () => {
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");
  const [people, setPeople] = useState<Person[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [events, setEvents] = useState<EventLite[]>([]);
  // (state for current user's teams/city is read inline during the effect; no need to store)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/"); return; }
      const { data: me } = await supabase
        .from("profiles")
        .select("name, city, favorite_la_teams")
        .eq("id", user.id)
        .maybeSingle();
      const myName = me?.name?.split(" ")[0] || "friend";
      const myCity = me?.city || null;
      const myTeams: string[] = Array.isArray(me?.favorite_la_teams) ? me.favorite_la_teams : [];
      setName(myName);

      // People: same city, then overlap on teams
      const peopleQuery = supabase
        .from("profiles")
        .select("id, name, city, profile_photo_url, favorite_la_teams")
        .neq("id", user.id)
        .not("name", "is", null)
        .limit(20);
      if (myCity) peopleQuery.eq("city", myCity);
      const { data: peopleData } = await peopleQuery;
      const ranked = (peopleData || [])
        .map((p) => {
          const teamsP: string[] = Array.isArray(p.favorite_la_teams) ? p.favorite_la_teams : [];
          const overlap = teamsP.filter((t) => myTeams.includes(t)).length;
          return { ...p, _overlap: overlap };
        })
        .sort((a, b) => b._overlap - a._overlap)
        .slice(0, 6);
      setPeople(ranked);

      // Events nearby
      const evQuery = supabase
        .from("events")
        .select("id, title, event_date, city, image_url")
        .gte("event_date", new Date().toISOString().slice(0, 10))
        .order("event_date", { ascending: true })
        .limit(6);
      const { data: evData } = await evQuery;
      const evFiltered = myCity ? (evData || []).filter((e) => !e.city || e.city === myCity) : (evData || []);
      setEvents(evFiltered.slice(0, 3) as EventLite[]);

      // Circles based on teams + city
      const cs: Circle[] = [];
      if (myCity) cs.push({ key: `city-${myCity}`, label: `${myCity} fans`, sub: "City circle" });
      myTeams.slice(0, 4).forEach((t) => cs.push({ key: `team-${t}`, label: `${t} fans`, sub: "Team chat" }));
      if (cs.length === 0) cs.push({ key: "all", label: "Loverball Community", sub: "Everyone's here" });
      setCircles(cs);
    })();
  }, [navigate]);

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }}>
      <Seo title="Welcome to Loverball" description="Your circles, your people." path="/welcome/circles" />

      <main className="flex-1 max-w-md w-full mx-auto px-5 pt-10 pb-32">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="text-[10px] uppercase tracking-[0.3em] mb-2"
               style={{ fontFamily: fonts.mono, color: C.raspberry }}>
            Welcome
          </div>
          <h1 style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: "clamp(36px, 10vw, 48px)", lineHeight: 1.05 }}>
            Hi {name}.<br />Here's your scene.
          </h1>
          <p className="mt-3 mb-8" style={{ color: C.muted, fontSize: 15 }}>
            Built from what you told us. Tap in.
          </p>
        </motion.div>

        {people.length > 0 && (
          <section className="mb-10">
            <SectionHeader kicker="People you should meet" title="Same teams, same town." />
            <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2 snap-x">
              {people.map((p) => (
                <div key={p.id} className="snap-start shrink-0 w-28">
                  <div
                    className="w-28 h-28 rounded-2xl mb-2 flex items-center justify-center text-white text-2xl font-bold"
                    style={{
                      background: p.profile_photo_url
                        ? `url(${p.profile_photo_url}) center/cover`
                        : initialsBg(p.name),
                      fontFamily: fonts.serif,
                    }}
                  >
                    {!p.profile_photo_url && (p.name?.[0]?.toUpperCase() || "?")}
                  </div>
                  <div className="text-sm font-medium line-clamp-1">{p.name}</div>
                  {p.city && <div className="text-xs" style={{ color: C.muted }}>{p.city}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {circles.length > 0 && (
          <section className="mb-10">
            <SectionHeader kicker="Your circles" title="Join the conversation." />
            <div className="space-y-2">
              {circles.map((c) => (
                <div
                  key={c.key}
                  className="flex items-center gap-3 p-4 rounded-2xl border"
                  style={{ background: C.surface, borderColor: C.border }}
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(232,93,47,0.12)" }}
                  >
                    <Users className="w-5 h-5" style={{ color: C.raspberry }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium line-clamp-1">{c.label}</div>
                    <div className="text-xs" style={{ color: C.muted }}>{c.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {events.length > 0 && (
          <section className="mb-10">
            <SectionHeader kicker="Events nearby" title="Coming up around you." />
            <div className="space-y-3">
              {events.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => navigate(`/e/${ev.id}`)}
                  className="w-full text-left flex gap-3 p-3 rounded-2xl border"
                  style={{ background: C.surface, borderColor: C.border }}
                >
                  <div
                    className="w-20 h-20 rounded-xl shrink-0"
                    style={{
                      background: ev.image_url
                        ? `url(${ev.image_url}) center/cover`
                        : `linear-gradient(135deg, ${C.raspberry}, ${C.surfaceHi})`,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium line-clamp-2" style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 17 }}>
                      {ev.title}
                    </div>
                    <div className="flex gap-3 mt-2 text-xs" style={{ color: C.muted }}>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                        {format(new Date(ev.event_date + "T00:00:00"), "MMM d")}
                      </span>
                      {ev.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.city}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {people.length === 0 && events.length === 0 && (
          <section className="mb-10 text-center py-12 px-6 rounded-3xl border"
                   style={{ background: C.surface, borderColor: C.border }}>
            <MessageCircle className="w-7 h-7 mx-auto mb-3" style={{ color: C.raspberry }} />
            <p className="text-sm" style={{ color: C.muted }}>
              You're early. We'll start matching you with people and events as the community grows in your city.
            </p>
          </section>
        )}
      </main>

      {/* Sticky CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]"
        style={{ background: C.surface, borderColor: C.border }}
      >
        <div className="max-w-md mx-auto">
          <Button
            onClick={() => navigate("/welcome/first-move")}
            className="w-full h-14 rounded-full text-xs uppercase tracking-[0.22em] border-0"
            style={{ background: C.raspberry, color: "#fff", fontFamily: fonts.mono }}
          >
            Join your circles
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCircles;
