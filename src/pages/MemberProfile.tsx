import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, MessageCircle, Users, Trophy, Calendar, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fetchProfileById } from "@/lib/profileApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AddFriendButton from "@/components/AddFriendButton";
import DesktopNav from "@/components/DesktopNav";
import Seo from "@/components/Seo";
import { C, fonts } from "@/lib/editorialTheme";

interface PublicProfile {
  id: string;
  name: string | null;
  city: string | null;
  bio: string | null;
  pronouns: string | null;
  profile_photo_url: string | null;
  favorite_la_teams: string[] | null;
  favorite_sports: string[] | null;
  other_interests: string[] | null;
  primary_role: string | null;
}

interface EventLite {
  id: string;
  title: string;
  event_date: string;
  city: string | null;
  image_url: string | null;
}

interface Props {
  memberId: string;
}

const MemberProfile = ({ memberId }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [myProfile, setMyProfile] = useState<PublicProfile | null>(null);
  const [events, setEvents] = useState<EventLite[]>([]);
  const [mutualCount, setMutualCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetchProfileById(memberId);
        if (cancelled) return;
        const p = Array.isArray(res.data) ? res.data[0] : res.data;
        if (!p) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setProfile(p as PublicProfile);

        if (user?.id) {
          const mine = await fetchProfileById(user.id);
          if (!cancelled) {
            const mp = Array.isArray(mine.data) ? mine.data[0] : mine.data;
            setMyProfile(mp as PublicProfile);
          }
        }

        // Events RSVP'd by member (best-effort; public events only via RLS)
        const { data: rsvps } = await supabase
          .from("event_rsvps")
          .select("event:events(id, title, event_date, city, image_url)")
          .eq("user_id", memberId)
          .limit(6);
        if (!cancelled && rsvps) {
          setEvents(
            (rsvps as any[])
              .map((r) => r.event)
              .filter(Boolean)
              .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
          );
        }

        // Mutual friends count (best-effort)
        if (user?.id) {
          const { data: friends } = await supabase
            .from("friendships")
            .select("requester_id, addressee_id")
            .eq("status", "accepted")
            .or(`requester_id.eq.${memberId},addressee_id.eq.${memberId}`);
          if (!cancelled && friends) {
            const memberFriendIds = new Set(
              friends.map((f: any) =>
                f.requester_id === memberId ? f.addressee_id : f.requester_id
              )
            );
            const { data: mine } = await supabase
              .from("friendships")
              .select("requester_id, addressee_id")
              .eq("status", "accepted")
              .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
            const myFriendIds = new Set(
              (mine || []).map((f: any) =>
                f.requester_id === user.id ? f.addressee_id : f.requester_id
              )
            );
            let count = 0;
            myFriendIds.forEach((id) => {
              if (memberFriendIds.has(id)) count++;
            });
            setMutualCount(count);
          }
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [memberId, user?.id]);

  const sharedTeams = useMemo(() => {
    if (!profile?.favorite_la_teams || !myProfile?.favorite_la_teams) return [];
    return profile.favorite_la_teams.filter((t) => myProfile.favorite_la_teams!.includes(t));
  }, [profile, myProfile]);

  const sharedSports = useMemo(() => {
    if (!profile?.favorite_sports || !myProfile?.favorite_sports) return [];
    return profile.favorite_sports.filter((s) => myProfile.favorite_sports!.includes(s));
  }, [profile, myProfile]);

  const sharedCity = !!(profile?.city && myProfile?.city && profile.city === myProfile.city);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg, color: C.muted }}>
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: C.bg, color: C.text }}>
        <p style={{ fontFamily: fonts.mono, color: C.muted }}>Member not found.</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/club")}>Back to Club</Button>
      </div>
    );
  }

  const handle = `@${(profile.name?.split(" ")[0] || "member").toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const initials = (profile.name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const whyMatch: string[] = [];
  if (sharedCity) whyMatch.push(`Both in ${profile.city}`);
  if (sharedTeams.length) whyMatch.push(`Both ${sharedTeams[0]} fans`);
  if (sharedSports.length) whyMatch.push(`Both into ${sharedSports[0]}`);
  if (mutualCount > 0) whyMatch.push(`${mutualCount} mutual${mutualCount > 1 ? "s" : ""}`);

  return (
    <div className="min-h-screen pb-32 md:pb-12" style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }}>
      <Seo title={`${profile.name || "Member"} | Loverball`} description={profile.bio || `Connect with ${profile.name} on Loverball.`} path={`/profile/${memberId}`} />
      <DesktopNav />

      <main className="max-w-4xl mx-auto px-4 md:px-8 pt-20 md:pt-10">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest mb-6 hover:opacity-80"
          style={{ fontFamily: fonts.mono, color: C.muted }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Hero */}
        <div className="rounded-3xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="relative h-40 md:h-56" style={{ background: `linear-gradient(135deg, ${C.raspberry}33, ${C.pink}22)` }} />
          <div className="px-5 md:px-8 pb-6 -mt-12 md:-mt-16">
            <Avatar className="w-24 h-24 md:w-32 md:h-32 ring-4" style={{ /* ring color */ boxShadow: `0 0 0 4px ${C.surface}` }}>
              <AvatarImage src={profile.profile_photo_url || undefined} alt={profile.name || ""} />
              <AvatarFallback className="text-2xl" style={{ background: C.surfaceHi, color: C.text }}>{initials}</AvatarFallback>
            </Avatar>

            <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl md:text-5xl leading-none uppercase tracking-tight"
                    style={{ fontFamily: "'Anton', Impact, sans-serif", color: C.text }}>
                  {profile.name || "Member"}
                </h1>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-xs" style={{ fontFamily: fonts.mono, color: C.muted }}>
                  <span style={{ color: C.raspberry }}>{handle}</span>
                  {profile.city && (<><span>·</span><span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {profile.city}</span></>)}
                  {profile.pronouns && (<><span>·</span><span>{profile.pronouns}</span></>)}
                </p>
              </div>

              {/* Owner-only actions are intentionally absent. Public actions only: */}
              {user && user.id !== profile.id && (
                <div className="flex items-center gap-2">
                  <AddFriendButton targetUserId={profile.id} size="default" />
                  <Button
                    onClick={() => navigate(`/friends?dm=${profile.id}`)}
                    className="rounded-xl"
                    style={{ background: C.raspberry, color: "#0a0a0a" }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" /> Message
                  </Button>
                </div>
              )}
            </div>

            {/* Why match */}
            {whyMatch.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest" style={{ fontFamily: fonts.mono, color: C.pink }}>
                  <Sparkles className="w-3 h-3" /> Why you might click
                </span>
                {whyMatch.map((w) => (
                  <Badge key={w} variant="outline" className="text-xs" style={{ borderColor: C.borderStrong, color: C.text, background: "transparent" }}>{w}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <section className="mt-6 rounded-2xl p-5 md:p-6" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ fontFamily: fonts.mono, color: C.muted }}>The Vibe</p>
            <p className="text-base leading-relaxed" style={{ color: C.text }}>{profile.bio}</p>
          </section>
        )}

        {/* Teams + Sports */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="rounded-2xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <p className="text-xs uppercase tracking-widest mb-3 inline-flex items-center gap-2" style={{ fontFamily: fonts.mono, color: C.muted }}>
              <Trophy className="w-3.5 h-3.5" /> Favorite Teams
            </p>
            {profile.favorite_la_teams?.length ? (
              <div className="flex flex-wrap gap-2">
                {profile.favorite_la_teams.map((t) => (
                  <Badge
                    key={t}
                    className="text-xs"
                    style={{
                      background: sharedTeams.includes(t) ? `${C.raspberry}22` : C.surfaceHi,
                      color: sharedTeams.includes(t) ? C.raspberry : C.text,
                      border: sharedTeams.includes(t) ? `1px solid ${C.raspberry}66` : `1px solid ${C.border}`,
                    }}
                  >
                    {t}{sharedTeams.includes(t) ? " · shared" : ""}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: C.muted }}>No teams added yet.</p>
            )}
          </section>

          <section className="rounded-2xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <p className="text-xs uppercase tracking-widest mb-3 inline-flex items-center gap-2" style={{ fontFamily: fonts.mono, color: C.muted }}>
              <Users className="w-3.5 h-3.5" /> Sports & Interests
            </p>
            {(profile.favorite_sports?.length || profile.other_interests?.length) ? (
              <div className="flex flex-wrap gap-2">
                {(profile.favorite_sports || []).map((s) => (
                  <Badge key={s} className="text-xs" style={{
                    background: sharedSports.includes(s) ? `${C.pink}22` : C.surfaceHi,
                    color: sharedSports.includes(s) ? C.pink : C.text,
                    border: `1px solid ${sharedSports.includes(s) ? C.pink + "66" : C.border}`,
                  }}>{s}</Badge>
                ))}
                {(profile.other_interests || []).map((s) => (
                  <Badge key={s} variant="outline" className="text-xs" style={{ borderColor: C.border, color: C.muted }}>{s}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: C.muted }}>No interests yet.</p>
            )}
          </section>
        </div>

        {/* Events */}
        <section className="mt-6 rounded-2xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <p className="text-xs uppercase tracking-widest mb-4 inline-flex items-center gap-2" style={{ fontFamily: fonts.mono, color: C.muted }}>
            <Calendar className="w-3.5 h-3.5" /> Events
          </p>
          {events.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {events.slice(0, 6).map((e) => (
                <button
                  key={e.id}
                  onClick={() => navigate(`/event/${e.id}`)}
                  className="text-left rounded-xl overflow-hidden group"
                  style={{ background: C.surfaceHi, border: `1px solid ${C.border}` }}
                >
                  <div className="aspect-video" style={{ background: e.image_url ? `url(${e.image_url}) center/cover` : `linear-gradient(135deg, ${C.raspberry}33, ${C.pink}22)` }} />
                  <div className="p-3">
                    <p className="text-sm font-semibold truncate" style={{ color: C.text }}>{e.title}</p>
                    <p className="text-[11px] mt-1" style={{ fontFamily: fonts.mono, color: C.muted }}>
                      {new Date(e.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{e.city ? ` · ${e.city}` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: C.muted }}>No public events yet.</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default MemberProfile;
