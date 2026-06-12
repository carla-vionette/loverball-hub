import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Sparkles, MapPin, Trophy } from "lucide-react";
import AddFriendButton from "@/components/AddFriendButton";

const PINK = "#E85D2F";
const PANEL = "#161616";
const BORDER = "1px solid rgba(250, 245, 233, 0.08)";

interface FanRow {
  id: string;
  name: string;
  profile_photo_url: string | null;
  city: string | null;
  favorite_sports: string[] | null;
  favorite_la_teams: string[] | null;
  favorite_teams_players: string[] | null;
}

interface SuggestedFansProps {
  myCity: string | null;
  mySports: string[];
  myTeams: string[];
  onBrowseAll: () => void;
}

const overlap = (a: string[] | null | undefined, b: string[]) => {
  if (!a || a.length === 0) return [] as string[];
  const lower = b.map((x) => x.toLowerCase());
  return a.filter((x) => lower.includes(x.toLowerCase()));
};

const reasonFor = (fan: FanRow, mySports: string[], myTeams: string[], myCity: string | null) => {
  const teamMatch = overlap(
    [...(fan.favorite_la_teams || []), ...(fan.favorite_teams_players || [])],
    myTeams
  );
  if (teamMatch.length >= 2) return { text: `Also follows ${teamMatch[0]} + ${teamMatch[1]}`, icon: Trophy };
  if (teamMatch.length === 1) return { text: `Also follows ${teamMatch[0]}`, icon: Trophy };
  const sportMatch = overlap(fan.favorite_sports, mySports);
  if (sportMatch.length >= 2) return { text: `Into ${sportMatch[0]} + ${sportMatch[1]}`, icon: Sparkles };
  if (sportMatch.length === 1) return { text: `Into ${sportMatch[0]}`, icon: Sparkles };
  if (myCity && fan.city && fan.city.toLowerCase().includes(myCity.toLowerCase().split(",")[0])) {
    return { text: `Lives in ${fan.city}`, icon: MapPin };
  }
  return { text: "New on Loverball", icon: Sparkles };
};

const SuggestedFans = ({ myCity, mySports, myTeams, onBrowseAll }: SuggestedFansProps) => {
  const { user } = useAuth();
  const [fans, setFans] = useState<FanRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      setLoading(true);
      // Pull a modest pool of recent profiles, then score client-side.
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, profile_photo_url, city, favorite_sports, favorite_la_teams, favorite_teams_players")
        .neq("id", user.id)
        .not("name", "is", null)
        .order("created_at", { ascending: false })
        .limit(40);
      if (cancelled) return;
      if (error || !data) {
        setFans([]);
        setLoading(false);
        return;
      }
      const scored = (data as FanRow[])
        .map((f) => {
          const t = overlap([...(f.favorite_la_teams || []), ...(f.favorite_teams_players || [])], myTeams).length;
          const s = overlap(f.favorite_sports, mySports).length;
          const c = myCity && f.city && f.city.toLowerCase().includes(myCity.toLowerCase().split(",")[0]) ? 1 : 0;
          return { f, score: t * 3 + s * 2 + c };
        })
        .filter((x) => x.score > 0 || (x.f.name && x.f.profile_photo_url))
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map((x) => x.f);
      setFans(scored);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id, myCity, mySports.join("|"), myTeams.join("|")]);

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p
            className="text-[10px] uppercase"
            style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.26em", color: PINK }}
          >
            Your circle
          </p>
          <h2
            className="leading-[0.95] mt-1.5 uppercase"
            style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: "clamp(28px, 3.4vw, 38px)", color: "#FAF5E9" }}
          >
            People with your <span style={{ color: PINK }}>vibe</span>.
          </h2>
        </div>
        <button
          onClick={onBrowseAll}
          className="text-[11px] uppercase tracking-widest"
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color: PINK }}
        >
          Find friends
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl p-3 flex items-center gap-3" style={{ background: PANEL, border: BORDER }}>
              <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-32 bg-white/5 rounded animate-pulse" />
                <div className="h-2.5 w-44 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : fans.length === 0 ? (
        <div className="rounded-3xl p-8 text-center" style={{ background: PANEL, border: BORDER }}>
          <Users className="w-9 h-9 mx-auto mb-3" style={{ color: "rgba(232,93,47,0.7)" }} />
          <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 16, color: "rgba(250,245,233,0.75)", margin: 0 }}>
            Your people are out there.
          </p>
          <p className="mt-2 text-[12px]" style={{ color: "rgba(250,245,233,0.5)" }}>
            Add favorite teams and sports and we'll match you with fans on the same wavelength.
          </p>
          <button
            onClick={onBrowseAll}
            className="mt-4 px-5 py-2 rounded-full text-[11px] uppercase tracking-widest"
            style={{ background: PINK, color: "#fff", fontFamily: "'Inter', sans-serif", fontWeight: 700 }}
          >
            Browse fans
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {fans.map((fan) => {
            const reason = reasonFor(fan, mySports, myTeams, myCity);
            const Icon = reason.icon;
            const initials = (fan.name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            return (
              <div
                key={fan.id}
                className="rounded-2xl p-3 flex items-center gap-3"
                style={{ background: PANEL, border: BORDER }}
              >
                <button onClick={() => (window.location.href = `/profile/${fan.id}`)} className="shrink-0">
                  <Avatar className="w-12 h-12 border" style={{ borderColor: "rgba(232,93,47,0.35)" }}>
                    <AvatarImage src={fan.profile_photo_url || undefined} alt={fan.name} />
                    <AvatarFallback style={{ background: "rgba(232,93,47,0.15)", color: PINK, fontWeight: 700 }}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => (window.location.href = `/profile/${fan.id}`)}
                    className="block text-left truncate"
                    style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 16, color: "#FAF5E9", textTransform: "uppercase" }}
                  >
                    {fan.name}
                  </button>
                  <p
                    className="mt-0.5 truncate inline-flex items-center gap-1 text-[10.5px]"
                    style={{ fontFamily: "'Space Mono', monospace", color: "rgba(250,245,233,0.6)" }}
                  >
                    <Icon className="w-3 h-3" style={{ color: PINK }} /> {reason.text}
                  </p>
                </div>
                <AddFriendButton targetUserId={fan.id} size="sm" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SuggestedFans;
