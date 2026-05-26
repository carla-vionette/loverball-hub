import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import {
  Users, MessageCircle, Sparkles, Search, MapPin, Trophy, Loader2,
  Hash, ArrowRight, Plus, Heart, Compass, Flame
} from "lucide-react";
import { C, fonts } from "@/lib/editorialTheme";
import { H1, Slug, Body } from "@/components/editorial/primitives";
import BottomNav from "@/components/BottomNav";
import MobileHeader from "@/components/MobileHeader";
import DesktopNav from "@/components/DesktopNav";
import AddFriendButton from "@/components/AddFriendButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { supabase } from "@/integrations/supabase/client";
import { fetchProfiles, fetchProfileById } from "@/lib/profileApi";
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

interface ChatPreview {
  id: string;          // chat id (or peer id for new conversations)
  peerId: string;
  peerName: string;
  peerPhoto: string | null;
  lastMessage: string | null;
  lastAt: string | null;
}

interface Circle {
  id: string;
  name: string;
  emoji: string;
  members: number;
  tag: string;
}

const STATIC_CIRCLES: Circle[] = [
  { id: "lakers", name: "LA Lakers Fans", emoji: "🏀", members: 312, tag: "Lakers" },
  { id: "wnba-la", name: "WNBA in LA", emoji: "🏀", members: 184, tag: "WNBA" },
  { id: "sparks", name: "Sparks Watch Party", emoji: "✨", members: 96, tag: "Sparks" },
  { id: "acfc", name: "Angel City FC Fans", emoji: "⚽", members: 241, tag: "Angel City FC" },
  { id: "founders", name: "Women's Sports Founders", emoji: "💼", members: 78, tag: "Founders" },
  { id: "newbies", name: "New to LA Sports", emoji: "👋", members: 132, tag: "New" },
];

const TABS = [
  { id: "discover", label: "Discover", icon: Compass },
  { id: "connections", label: "Connections", icon: Heart },
  { id: "chats", label: "Chats", icon: MessageCircle },
  { id: "circles", label: "Circles", icon: Hash },
] as const;
type TabId = typeof TABS[number]["id"];

const FILTER_CHIPS = [
  "Nearby", "Same Teams", "WNBA", "NBA", "Soccer", "NWSL", "Open to Connect", "Recently Active",
];

const SORTS = [
  { id: "relevant", label: "Most Relevant" },
  { id: "nearby", label: "Nearby" },
  { id: "shared", label: "Same Teams" },
  { id: "recent", label: "Recently Active" },
] as const;
type SortId = typeof SORTS[number]["id"];

const Club = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tab, setTab] = useState<TabId>("discover");
  const [members, setMembers] = useState<Member[]>([]);
  const [me, setMe] = useState<Member | null>(null);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortId>("relevant");

  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [allRes, mineRes] = await Promise.all([
          fetchProfiles({ excludeIds: user ? [user.id] : [] }),
          user ? fetchProfileById(user.id) : Promise.resolve({ data: null, error: null } as any),
        ]);
        if (cancelled) return;

        if (allRes.error) {
          setError(allRes.error);
          setMembers([]);
        } else {
          const list = Array.isArray(allRes.data) ? allRes.data : [];
          setMembers(
            list.map((p: any) => ({
              id: p.id,
              name: p.name ?? p.full_name ?? null,
              city: p.city ?? null,
              bio: p.bio ?? null,
              profile_photo_url: p.profile_photo_url ?? p.avatar_url ?? null,
              favorite_la_teams: p.favorite_la_teams ?? null,
              favorite_sports: p.favorite_sports ?? null,
            }))
          );
        }

        const mineData = Array.isArray(mineRes?.data) ? mineRes.data[0] : mineRes?.data;
        if (mineData) {
          setMe({
            id: mineData.id,
            name: mineData.name ?? null,
            city: mineData.city ?? null,
            bio: mineData.bio ?? null,
            profile_photo_url: mineData.profile_photo_url ?? null,
            favorite_la_teams: mineData.favorite_la_teams ?? null,
            favorite_sports: mineData.favorite_sports ?? null,
          });
        }

        if (user) {
          const { data: friends } = await supabase
            .from("friendships")
            .select("requester_id, addressee_id")
            .eq("status", "accepted")
            .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
          if (!cancelled && friends) {
            const ids = new Set<string>();
            friends.forEach((f: any) =>
              ids.add(f.requester_id === user.id ? f.addressee_id : f.requester_id)
            );
            setFriendIds(ids);
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Couldn't load the Club.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Lightweight chat preview via direct_messages
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setChatsLoading(true);
      const { data: msgs } = await supabase
        .from("direct_messages")
        .select("id, sender_id, receiver_id, message, created_at")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(30);
      if (cancelled || !msgs) { setChatsLoading(false); return; }

      const seen = new Set<string>();
      const previews: ChatPreview[] = [];
      for (const m of msgs as any[]) {
        const peerId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (seen.has(peerId)) continue;
        seen.add(peerId);
        previews.push({
          id: peerId, peerId,
          peerName: "Member", peerPhoto: null,
          lastMessage: m.message, lastAt: m.created_at,
        });
        if (previews.length >= 8) break;
      }

      // Hydrate names
      await Promise.all(
        previews.map(async (p) => {
          const res = await fetchProfileById(p.peerId);
          const pp = Array.isArray(res.data) ? res.data[0] : res.data;
          if (pp) {
            p.peerName = pp.name || "Member";
            p.peerPhoto = pp.profile_photo_url || null;
          }
        })
      );
      if (!cancelled) setChats(previews);
      setChatsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Compute scored / filtered members
  const enriched = useMemo(() => {
    const q = query.trim().toLowerCase();
    const mineTeams = new Set(me?.favorite_la_teams || []);
    const mineSports = new Set(me?.favorite_sports || []);

    return members
      .map((m) => {
        const sharedTeams = (m.favorite_la_teams || []).filter((t) => mineTeams.has(t));
        const sharedSports = (m.favorite_sports || []).filter((s) => mineSports.has(s));
        const sharedCity = !!(me?.city && m.city && me.city === m.city);
        const why: string[] = [];
        if (sharedCity) why.push(`Both in ${m.city}`);
        if (sharedTeams.length) why.push(`Both ${sharedTeams[0]} fans`);
        if (sharedSports.length) why.push(`Both into ${sharedSports[0]}`);
        const score =
          sharedTeams.length * 3 + sharedSports.length * 2 + (sharedCity ? 2 : 0);
        return { m, sharedTeams, sharedSports, sharedCity, why, score };
      })
      .filter(({ m, sharedTeams, sharedCity }) => {
        if (q) {
          const hay = [m.name, m.city, m.bio, ...(m.favorite_la_teams || []), ...(m.favorite_sports || [])]
            .filter(Boolean).join(" ").toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (activeFilters.size) {
          for (const f of activeFilters) {
            if (f === "Nearby") { if (!sharedCity) return false; continue; }
            if (f === "Same Teams") { if (!sharedTeams.length) return false; continue; }
            if (f === "Open to Connect" || f === "Recently Active") continue; // not modeled
            const hay = [...(m.favorite_la_teams || []), ...(m.favorite_sports || [])]
              .filter(Boolean).join(" ").toLowerCase();
            if (!hay.includes(f.toLowerCase())) return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sort === "nearby") return Number(b.sharedCity) - Number(a.sharedCity);
        if (sort === "shared") return b.sharedTeams.length - a.sharedTeams.length;
        return b.score - a.score;
      });
  }, [members, me, query, activeFilters, sort]);

  const suggested = useMemo(
    () => enriched.filter((e) => !friendIds.has(e.m.id)).slice(0, 8),
    [enriched, friendIds]
  );
  const connections = useMemo(
    () => enriched.filter((e) => friendIds.has(e.m.id)),
    [enriched, friendIds]
  );

  const toggleFilter = (f: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  };

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }} className="min-h-screen pb-32 md:pb-12">
      <Seo
        title="The Club — Find Your Sports People | Loverball"
        description="Discover fans like you, connect around teams and cities, and start the chat."
        path="/club"
      />
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 pt-20 md:pt-10">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl px-6 md:px-12 py-10 md:py-14"
          style={{ background: `radial-gradient(120% 100% at 0% 0%, ${C.raspberry}22 0%, transparent 60%), radial-gradient(120% 100% at 100% 100%, ${C.pink}1f 0%, transparent 55%), ${C.surface}`, border: `1px solid ${C.border}` }}>
          <Slug>The Club</Slug>
          <H1 className="mt-3" style={{ fontSize: "clamp(40px, 7vw, 84px)", lineHeight: 0.92 }}>
            Find Your <span style={{ color: C.raspberry }}>Sports People.</span>
          </H1>
          <Body muted size={16} className="mt-4 max-w-xl">
            Discover fans like you, connect around teams, cities and leagues, and start the chat.
          </Body>

          {/* Search */}
          <div className="mt-7 flex items-center gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, city, team, or interest…"
                className="h-12 pl-11 rounded-xl border-0"
                style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}` }}
              />
            </div>
          </div>

          {/* Filter chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            {FILTER_CHIPS.map((f) => {
              const active = activeFilters.has(f);
              return (
                <button
                  key={f}
                  onClick={() => toggleFilter(f)}
                  className="px-3 py-1.5 rounded-full text-xs uppercase tracking-wider transition-all"
                  style={{
                    fontFamily: fonts.mono,
                    background: active ? C.raspberry : "transparent",
                    color: active ? "#0a0a0a" : C.text,
                    border: `1px solid ${active ? C.raspberry : C.border}`,
                  }}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </section>

        {/* TABS */}
        <nav className="mt-8 flex items-center gap-1 overflow-x-auto border-b" style={{ borderColor: C.border }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="inline-flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap transition-colors"
                style={{
                  color: active ? C.text : C.muted,
                  borderBottom: `2px solid ${active ? C.raspberry : "transparent"}`,
                  fontFamily: fonts.mono,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontSize: 11,
                }}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </nav>

        {/* States */}
        {loading && (
          <div className="mt-16 flex items-center justify-center gap-2" style={{ color: C.muted }}>
            <Loader2 className="w-5 h-5 animate-spin" /> Loading the Club…
          </div>
        )}
        {error && !loading && (
          <div className="mt-12 rounded-2xl p-8 text-center" style={{ background: C.surface, border: `1px dashed ${C.border}` }}>
            <Body muted>{error}</Body>
            <Button className="mt-4" variant="secondary" onClick={() => window.location.reload()}>Try again</Button>
          </div>
        )}

        {/* MAIN GRID */}
        {!loading && !error && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
            {/* LEFT/MAIN COLUMN */}
            <div className="min-w-0 space-y-10">

              {tab === "discover" && (
                <>
                  {/* Suggested */}
                  <section>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} color={C.raspberry} />
                        <Slug>Fans You Should Meet</Slug>
                      </div>
                      <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as SortId)}
                        className="bg-transparent text-xs uppercase tracking-wider rounded-md px-3 py-1.5"
                        style={{ fontFamily: fonts.mono, color: C.muted, border: `1px solid ${C.border}` }}
                      >
                        {SORTS.map((s) => <option key={s.id} value={s.id} style={{ background: C.surface }}>{s.label}</option>)}
                      </select>
                    </div>

                    {suggested.length === 0 ? (
                      <EmptyState text="No matches yet — try clearing filters." />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {suggested.map(({ m, why }) => (
                          <FanCard key={m.id} member={m} why={why} navigate={navigate} />
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Directory */}
                  <section>
                    <div className="flex items-center justify-between mb-5">
                      <Slug>Your Community</Slug>
                      <span style={{ fontFamily: fonts.mono, fontSize: 11, color: C.muted }}>
                        {enriched.length} {enriched.length === 1 ? "fan" : "fans"}
                      </span>
                    </div>
                    {enriched.length === 0 ? (
                      <EmptyState text="No fans match your search." />
                    ) : (
                      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {enriched.map(({ m, why }) => (
                          <MemberCardCompact key={m.id} member={m} why={why} navigate={navigate} />
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              )}

              {tab === "connections" && (
                <section>
                  <Slug>Your Circle</Slug>
                  <p className="mt-2 text-sm" style={{ color: C.muted }}>
                    The fans you've connected with on Loverball.
                  </p>
                  {connections.length === 0 ? (
                    <div className="mt-6"><EmptyState text="No connections yet. Hit Connect on a fan card to start." /></div>
                  ) : (
                    <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {connections.map(({ m, why }) => (
                        <MemberCardCompact key={m.id} member={m} why={why} navigate={navigate} />
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {tab === "chats" && (
                <section>
                  <div className="flex items-center justify-between mb-5">
                    <Slug>Start the Chat</Slug>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/messages")}
                      style={{ color: C.raspberry, fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                      Open Inbox <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                  {chatsLoading ? (
                    <div className="flex items-center gap-2 text-sm" style={{ color: C.muted }}>
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading conversations…
                    </div>
                  ) : chats.length === 0 ? (
                    <EmptyState text="No conversations yet. Message a fan from any profile or card." />
                  ) : (
                    <ul className="space-y-2">
                      {chats.map((c) => (
                        <li key={c.peerId}>
                          <button
                            onClick={() => navigate(`/messages?to=${c.peerId}`)}
                            className="w-full flex items-center gap-3 rounded-2xl p-3 text-left hover:opacity-90 transition"
                            style={{ background: C.surface, border: `1px solid ${C.border}` }}
                          >
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={c.peerPhoto || undefined} />
                              <AvatarFallback>{c.peerName.slice(0, 1)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold truncate" style={{ color: C.text }}>{c.peerName}</p>
                                {c.lastAt && (
                                  <span className="text-[10px]" style={{ fontFamily: fonts.mono, color: C.muted }}>
                                    {new Date(c.lastAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                  </span>
                                )}
                              </div>
                              {c.lastMessage && (
                                <p className="text-xs truncate mt-0.5" style={{ color: C.muted }}>{c.lastMessage}</p>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {tab === "circles" && (
                <section>
                  <div className="flex items-center justify-between mb-5">
                    <Slug>Fan Circles</Slug>
                    <span style={{ fontFamily: fonts.mono, fontSize: 11, color: C.muted }}>By team · city · interest</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {STATIC_CIRCLES.map((c) => (
                      <CircleCard key={c.id} circle={c} />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* RIGHT RAIL (desktop) */}
            <aside className="hidden lg:block space-y-6">
              <div className="rounded-2xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <Slug>Active Chats</Slug>
                  <button onClick={() => navigate("/messages")}
                    style={{ color: C.raspberry, fontFamily: fonts.mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em" }}>
                    All
                  </button>
                </div>
                {chats.length === 0 ? (
                  <p className="text-xs" style={{ color: C.muted }}>No conversations yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {chats.slice(0, 5).map((c) => (
                      <li key={c.peerId}>
                        <button
                          onClick={() => navigate(`/messages?to=${c.peerId}`)}
                          className="w-full flex items-center gap-2.5 text-left rounded-lg p-2 hover:bg-white/[0.03]"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={c.peerPhoto || undefined} />
                            <AvatarFallback className="text-[10px]">{c.peerName.slice(0, 1)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate" style={{ color: C.text }}>{c.peerName}</p>
                            {c.lastMessage && (
                              <p className="text-[11px] truncate" style={{ color: C.muted }}>{c.lastMessage}</p>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4" style={{ color: C.raspberry }} />
                  <Slug>Trending Circles</Slug>
                </div>
                <ul className="space-y-2">
                  {STATIC_CIRCLES.slice(0, 4).map((c) => (
                    <li key={c.id}>
                      <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.03]">
                        <span className="flex items-center gap-2 text-sm" style={{ color: C.text }}>
                          <span>{c.emoji}</span>{c.name}
                        </span>
                        <span className="text-[10px]" style={{ fontFamily: fonts.mono, color: C.muted }}>
                          {c.members} fans
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl p-5"
                style={{ background: `linear-gradient(135deg, ${C.raspberry}1a, ${C.pink}14)`, border: `1px solid ${C.border}` }}>
                <Slug>Who's watching tonight?</Slug>
                <p className="mt-2 text-xs" style={{ color: C.muted }}>
                  Drop into a watch party or start your own.
                </p>
                <Button
                  className="mt-3 w-full rounded-xl"
                  style={{ background: C.raspberry, color: "#0a0a0a" }}
                  onClick={() => navigate("/events")}
                >
                  <Plus className="w-4 h-4 mr-2" /> Find a Watch Party
                </Button>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

/* ─────────── Sub-components ─────────── */

const FanCard = ({
  member, why, navigate,
}: { member: Member; why: string[]; navigate: ReturnType<typeof useNavigate> }) => {
  const handle = `@${(member.name?.split(" ")[0] || "member").toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4 transition-transform hover:-translate-y-0.5"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <button onClick={() => navigate(`/profile/${member.id}`)} className="flex items-center gap-3 text-left min-w-0">
        <Avatar className="w-14 h-14">
          <AvatarImage src={member.profile_photo_url || undefined} />
          <AvatarFallback>{(member.name || "?").slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold truncate" style={{ color: C.text }}>{member.name || "Member"}</p>
          <p className="text-[11px] truncate" style={{ fontFamily: fonts.mono, color: C.muted }}>
            <span style={{ color: C.raspberry }}>{handle}</span>
            {member.city ? <> · <MapPin className="inline w-3 h-3 -mt-0.5" /> {member.city}</> : null}
          </p>
        </div>
      </button>

      {member.bio && (
        <p className="text-sm line-clamp-2" style={{ color: C.muted }}>{member.bio}</p>
      )}

      {(member.favorite_la_teams?.length || member.favorite_sports?.length) ? (
        <div className="flex flex-wrap gap-1.5">
          {(member.favorite_la_teams || []).slice(0, 2).map((t) => (
            <Badge key={t} className="text-[10px]" style={{ background: C.surfaceHi, color: C.text, border: `1px solid ${C.border}` }}>
              <Trophy className="w-2.5 h-2.5 mr-1" />{t}
            </Badge>
          ))}
          {(member.favorite_sports || []).slice(0, 2).map((s) => (
            <Badge key={s} variant="outline" className="text-[10px]" style={{ borderColor: C.border, color: C.muted }}>{s}</Badge>
          ))}
        </div>
      ) : null}

      {why.length > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest"
          style={{ fontFamily: fonts.mono, color: C.pink }}>
          <Sparkles className="w-3 h-3" /> {why.slice(0, 2).join(" · ")}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" variant="outline"
          onClick={() => navigate(`/profile/${member.id}`)}
          className="flex-1 rounded-lg"
          style={{ borderColor: C.border, color: C.text, background: "transparent" }}>
          View Profile
        </Button>
        <AddFriendButton targetUserId={member.id} size="sm" />
        <Button size="sm" variant="ghost"
          onClick={() => navigate(`/messages?to=${member.id}`)}
          aria-label="Message"
          className="rounded-lg" style={{ color: C.text }}>
          <MessageCircle className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const MemberCardCompact = ({
  member, why, navigate,
}: { member: Member; why: string[]; navigate: ReturnType<typeof useNavigate> }) => (
  <li className="rounded-2xl p-4 flex items-center gap-4"
    style={{ background: C.surface, border: `1px solid ${C.border}` }}>
    <button onClick={() => navigate(`/profile/${member.id}`)} aria-label={`View ${member.name}`}>
      <Avatar className="w-14 h-14">
        <AvatarImage src={member.profile_photo_url || undefined} />
        <AvatarFallback>{(member.name || "?").slice(0, 1)}</AvatarFallback>
      </Avatar>
    </button>
    <div className="flex-1 min-w-0">
      <button onClick={() => navigate(`/profile/${member.id}`)} className="block text-left w-full">
        <div className="font-semibold truncate" style={{ color: C.text }}>{member.name || "Member"}</div>
        <div className="text-xs truncate" style={{ color: C.muted }}>
          {[member.city, (member.favorite_la_teams || [])[0]].filter(Boolean).join(" · ") || "Loverball fan"}
        </div>
        {why.length > 0 && (
          <div className="mt-1 text-[10px] truncate uppercase tracking-wider"
            style={{ fontFamily: fonts.mono, color: C.pink }}>
            ✦ {why[0]}
          </div>
        )}
      </button>
      <div className="mt-2 flex items-center gap-2">
        <AddFriendButton targetUserId={member.id} size="sm" />
        <Button size="sm" variant="ghost"
          onClick={() => navigate(`/messages?to=${member.id}`)}
          aria-label="Message" style={{ color: C.text }}>
          <MessageCircle className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </li>
);

const CircleCard = ({ circle }: { circle: Circle }) => (
  <div className="rounded-2xl p-5 flex flex-col gap-3 transition-transform hover:-translate-y-0.5"
    style={{ background: C.surface, border: `1px solid ${C.border}` }}>
    <div className="flex items-start justify-between">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
        style={{ background: `linear-gradient(135deg, ${C.raspberry}22, ${C.pink}1a)`, border: `1px solid ${C.border}` }}>
        {circle.emoji}
      </div>
      <Badge className="text-[10px]" style={{ background: C.surfaceHi, color: C.text, border: `1px solid ${C.border}` }}>
        <Users className="w-2.5 h-2.5 mr-1" />{circle.members}
      </Badge>
    </div>
    <div>
      <p className="font-semibold" style={{ color: C.text }}>{circle.name}</p>
      <p className="text-xs" style={{ color: C.muted }}>#{circle.tag.toLowerCase().replace(/\s+/g, "-")}</p>
    </div>
    <Button size="sm" className="rounded-lg mt-1" style={{ background: C.raspberry, color: "#0a0a0a" }}>
      Join Circle
    </Button>
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-2xl p-10 text-center"
    style={{ background: C.surface, border: `1px dashed ${C.border}` }}>
    <Users size={28} color={C.muted} className="mx-auto" />
    <Body muted size={15} className="mt-4">{text}</Body>
  </div>
);

export default Club;
