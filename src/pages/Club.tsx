import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Search, Users, MessageCircle, Sparkles, Loader2 } from "lucide-react";
import { C, fonts } from "@/lib/editorialTheme";
import { H1, Slug, Body } from "@/components/editorial/primitives";
import BottomNav from "@/components/BottomNav";
import MobileHeader from "@/components/MobileHeader";
import DesktopNav from "@/components/DesktopNav";
import AddFriendButton from "@/components/AddFriendButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfiles } from "@/lib/profileApi";
import { useAuth } from "@/hooks/useAuth";

interface Member {
  id: string;
  name: string | null;
  city: string | null;
  bio: string | null;
  profile_photo_url: string | null;
  favorite_la_teams: string[] | null;
  favorite_sports: string[] | null;
}

const Club = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Load member directory via rate-limited edge function
        const { data, error: apiError } = await fetchProfiles<Member[]>({
          excludeIds: user ? [user.id] : [],
        });
        if (apiError) throw new Error(apiError);
        if (cancelled) return;
        setMembers((data || []).filter((m) => m?.name));

        // Load existing friendships to mark mutuals / hide add CTA
        if (user) {
          const { data: friendships } = await supabase
            .from("friendships")
            .select("requester_id, addressee_id, status")
            .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
          if (cancelled) return;
          const ids = new Set<string>();
          (friendships || []).forEach((f: any) => {
            const other = f.requester_id === user.id ? f.addressee_id : f.requester_id;
            if (f.status === "accepted") ids.add(other);
          });
          setFriendIds(ids);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Could not load members");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      (m.name || "").toLowerCase().includes(q) ||
      (m.city || "").toLowerCase().includes(q) ||
      (m.favorite_la_teams || []).some((t) => t.toLowerCase().includes(q)) ||
      (m.favorite_sports || []).some((s) => s.toLowerCase().includes(q))
    );
  }, [members, query]);

  const suggested = useMemo(
    () => members.filter((m) => !friendIds.has(m.id)).slice(0, 6),
    [members, friendIds]
  );

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }} className="min-h-screen pb-32 md:pb-12">
      <Seo title="Club — Members Directory | Loverball" description="Browse, search and connect with Loverball members." path="/club" />
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="max-w-5xl mx-auto px-4 md:px-8 pt-20 md:pt-10">
        <Slug>The Club</Slug>
        <H1 className="mt-3" style={{ fontSize: "clamp(40px, 8vw, 88px)" }}>Members Directory</H1>
        <Body muted size={15} className="mt-4 max-w-xl">
          Discover, search and connect with fellow Loverball members.
        </Body>


        {loading && (
          <div className="mt-16 flex items-center justify-center gap-2" style={{ color: C.muted }}>
            <Loader2 className="w-5 h-5 animate-spin" /> Loading members...
          </div>
        )}

        {error && !loading && (
          <div className="mt-12 rounded-[20px] p-8 text-center"
            style={{ background: C.surface, border: `1px dashed ${C.border}` }}>
            <Body muted>{error}</Body>
            <Button className="mt-4" variant="secondary" onClick={() => window.location.reload()}>Try again</Button>
          </div>
        )}

        {!loading && !error && !query && suggested.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} color={C.raspberry} />
              <Slug>Suggested for you</Slug>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
              {suggested.map((m) => (
                <MemberPill key={`s-${m.id}`} member={m} onView={() => navigate(`/profile/${m.id}`)} />
              ))}
            </div>
          </section>
        )}

        {!loading && !error && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-5">
              <Slug>{query ? `${filtered.length} result${filtered.length === 1 ? "" : "s"}` : "All members"}</Slug>
              <span style={{ fontFamily: fonts.mono, fontSize: 11, color: C.muted }}>
                {members.length} total
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-[20px] p-10 text-center"
                style={{ background: C.surface, border: `1px dashed ${C.border}` }}>
                <Users size={28} color={C.muted} className="mx-auto" />
                <Body muted size={15} className="mt-4">
                  {query ? "No members match your search." : "No members yet. Check back soon."}
                </Body>
              </div>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((m) => (
                  <MemberRow key={m.id} member={m} navigate={navigate} />
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

const MemberPill = ({ member, onView }: { member: Member; onView: () => void }) => (
  <button
    onClick={onView}
    className="flex-shrink-0 flex flex-col items-center gap-2 w-20"
    aria-label={`View ${member.name}`}
  >
    <Avatar className="w-16 h-16 border" style={{ borderColor: C.border }}>
      <AvatarImage src={member.profile_photo_url || undefined} alt={member.name || ""} />
      <AvatarFallback>{(member.name || "?").slice(0, 1)}</AvatarFallback>
    </Avatar>
    <span className="text-xs truncate w-full text-center" style={{ color: C.text }}>
      {(member.name || "").split(" ")[0]}
    </span>
  </button>
);

const MemberRow = ({ member, navigate }: { member: Member; navigate: ReturnType<typeof useNavigate> }) => (
  <li
    className="rounded-2xl p-4 flex items-center gap-4"
    style={{ background: C.surface, border: `1px solid ${C.border}` }}
  >
    <button onClick={() => navigate(`/profile/${member.id}`)} aria-label={`View ${member.name}`}>
      <Avatar className="w-14 h-14">
        <AvatarImage src={member.profile_photo_url || undefined} alt={member.name || ""} />
        <AvatarFallback>{(member.name || "?").slice(0, 1)}</AvatarFallback>
      </Avatar>
    </button>
    <div className="flex-1 min-w-0">
      <button
        onClick={() => navigate(`/profile/${member.id}`)}
        className="block text-left"
      >
        <div className="font-semibold truncate" style={{ color: C.text }}>{member.name || "Member"}</div>
        <div className="text-xs truncate" style={{ color: C.muted }}>
          {[member.city, (member.favorite_la_teams || [])[0]].filter(Boolean).join(" · ") || "Loverball member"}
        </div>
      </button>
      <div className="mt-2 flex items-center gap-2">
        <AddFriendButton targetUserId={member.id} size="sm" />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate(`/messages?to=${member.id}`)}
          aria-label={`Message ${member.name}`}
        >
          <MessageCircle className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </li>
);

export default Club;
