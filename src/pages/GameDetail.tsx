/**
 * GameDetail — social hub for one matchup.
 * RSVP (going_game / going_watch_party / maybe / cant_go), going-solo flag,
 * Who's Going grouped by RSVP type, and realtime game chat.
 */
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Calendar as CalendarIcon, MapPin, Send, Share2, Tv, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGameBackNavigation } from "@/hooks/useGameBackNavigation";
import { toast } from "@/hooks/use-toast";
import DesktopNav from "@/components/DesktopNav";
import Seo from "@/components/Seo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import WatchSpotsPanel from "@/components/game/WatchSpotsPanel";
import WhereToWatchUnified from "@/components/watch/WhereToWatchUnified";

const BG = "#0a0a0a";
const PINK = "#E85D2F";
const PANEL = "#161616";
const BORDER = "1px solid rgba(250,245,233,0.08)";

type RsvpType = "going_game" | "going_watch_party" | "maybe" | "cant_go";

interface Game {
  id: string;
  sport: string;
  league: string;
  home_team: string;
  away_team: string;
  game_start_at: string;
  venue_name: string | null;
  venue_city: string | null;
  venue_state: string | null;
}

interface RsvpRow {
  id: string;
  user_id: string;
  rsvp_type: RsvpType;
  going_solo: boolean;
}

interface ProfileLite {
  id: string;
  name: string | null;
  profile_photo_url: string | null;
}

interface ChatMsg {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
}

const RSVP_LABEL: Record<RsvpType, string> = {
  going_game: "At the game",
  going_watch_party: "Watch party",
  maybe: "Maybe",
  cant_go: "Can't go",
};

const RSVP_BUTTONS: { type: RsvpType; label: string }[] = [
  { type: "going_game", label: "I'm going" },
  { type: "going_watch_party", label: "Watch party" },
  { type: "maybe", label: "Maybe" },
  { type: "cant_go", label: "Can't go" },
];

const GameDetail = () => {
  const { id: gameId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { goBack } = useGameBackNavigation();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<"going" | "watch" | "chat">("going");

  // Load game
  useEffect(() => {
    if (!gameId) return;
    (async () => {
      const { data, error } = await supabase
        .from("games")
        .select("id, sport, league, home_team, away_team, game_start_at, venue_name, venue_city, venue_state")
        .eq("id", gameId)
        .maybeSingle();
      if (error) toast({ title: "Couldn't load game", variant: "destructive" });
      setGame(data as Game | null);
      setLoading(false);
    })();
  }, [gameId]);

  // Load RSVPs + realtime
  useEffect(() => {
    if (!gameId) return;
    const load = async () => {
      const { data } = await supabase
        .from("game_rsvps")
        .select("id, user_id, rsvp_type, going_solo")
        .eq("game_id", gameId);
      setRsvps((data as RsvpRow[]) ?? []);
    };
    load();
    const ch = supabase
      .channel(`game-rsvps-${gameId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "game_rsvps", filter: `game_id=eq.${gameId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [gameId]);

  // Load chat + realtime
  useEffect(() => {
    if (!gameId) return;
    (async () => {
      const { data } = await supabase
        .from("game_chats")
        .select("id, user_id, message, created_at")
        .eq("game_id", gameId)
        .order("created_at", { ascending: true })
        .limit(200);
      setMessages((data as ChatMsg[]) ?? []);
    })();
    const ch = supabase
      .channel(`game-chats-${gameId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "game_chats", filter: `game_id=eq.${gameId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMsg]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [gameId]);

  // Load profiles for everyone we've seen
  useEffect(() => {
    const ids = Array.from(new Set([
      ...rsvps.map(r => r.user_id),
      ...messages.map(m => m.user_id),
    ])).filter(id => !profiles[id]);
    if (ids.length === 0) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, profile_photo_url")
        .in("id", ids);
      const next: Record<string, ProfileLite> = { ...profiles };
      (data ?? []).forEach((p: any) => { next[p.id] = p; });
      setProfiles(next);
    })();
  }, [rsvps, messages]);

  const myRsvp = useMemo(() => rsvps.find(r => r.user_id === user?.id) ?? null, [rsvps, user?.id]);

  const setRsvp = async (type: RsvpType) => {
    if (!user) { toast({ title: "Sign in to RSVP" }); return; }
    if (!gameId) return;
    const { error } = await supabase
      .from("game_rsvps")
      .upsert(
        { game_id: gameId, user_id: user.id, rsvp_type: type, going_solo: myRsvp?.going_solo ?? false },
        { onConflict: "game_id,user_id" }
      );
    if (error) toast({ title: "RSVP failed", description: error.message, variant: "destructive" });
  };

  const toggleSolo = async (val: boolean) => {
    if (!user || !myRsvp) return;
    const { error } = await supabase
      .from("game_rsvps")
      .update({ going_solo: val })
      .eq("id", myRsvp.id);
    if (error) toast({ title: "Couldn't update", variant: "destructive" });
  };

  const sendMessage = async () => {
    if (!user) { toast({ title: "Sign in to chat" }); return; }
    const text = draft.trim();
    if (!text || !gameId) return;
    setSending(true);
    const { error } = await supabase.from("game_chats").insert({
      game_id: gameId, user_id: user.id, message: text,
    });
    setSending(false);
    if (error) { toast({ title: "Send failed", variant: "destructive" }); return; }
    setDraft("");
  };

  const grouped = useMemo(() => {
    const g: Record<RsvpType, RsvpRow[]> = { going_game: [], going_watch_party: [], maybe: [], cant_go: [] };
    rsvps.forEach(r => g[r.rsvp_type]?.push(r));
    return g;
  }, [rsvps]);

  if (loading) {
    return <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: BG, color: "#FAF5E9" }}>Loading…</div>;
  }
  if (!game) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4" style={{ background: BG, color: "#FAF5E9" }}>
        <p>Game not found.</p>
        <Link to="/feed" className="underline text-sm" style={{ color: PINK }}>Back to Feed</Link>
      </div>
    );
  }

  const matchupTitle = `${game.away_team} @ ${game.home_team}`;
  const startDate = new Date(game.game_start_at);

  return (
    <div className="min-h-[100dvh]" style={{ background: BG, color: "#FAF5E9" }}>
      <Seo title={`${matchupTitle} · Loverball`} description={`${game.league} · ${format(startDate, "EEE MMM d, h:mm a")}`} path={`/game/${game.id}`} />
      <DesktopNav />
      <main className="max-w-2xl mx-auto px-4 pt-6 pb-40 md:pt-[88px]">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-2 text-[12px] uppercase mb-4 cursor-pointer"
          style={{ color: "rgba(250,245,233,0.6)", letterSpacing: "0.16em", fontFamily: "'Space Mono', monospace" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        {/* Header */}
        <div className="rounded-2xl p-5 mb-5" style={{ background: PANEL, border: BORDER }}>
          <div className="text-[11px] uppercase mb-3" style={{ color: PINK, letterSpacing: "0.2em", fontFamily: "'Space Mono', monospace" }}>
            {game.league} · {game.sport}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            {matchupTitle}
          </h1>
          <p className="text-[14px]" style={{ color: "rgba(250,245,233,0.75)" }}>
            {format(startDate, "EEEE, MMM d · h:mm a")}
          </p>
          {game.venue_name && (
            <p className="text-[13px] mt-1 flex items-center gap-1.5" style={{ color: "rgba(250,245,233,0.55)" }}>
              <MapPin className="w-3.5 h-3.5" /> {game.venue_name}{game.venue_city ? `, ${game.venue_city}` : ""}{game.venue_state ? `, ${game.venue_state}` : ""}
            </p>
          )}
          {/* Hero quick actions */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={async () => {
                const url = typeof window !== "undefined" ? window.location.href : "";
                const text = `${matchupTitle} · ${format(startDate, "EEE MMM d, h:mm a")}`;
                if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
                  try { await navigator.share({ title: matchupTitle, text, url }); return; } catch {/* cancelled */}
                }
                try { await navigator.clipboard.writeText(`${text}\n${url}`); toast({ title: "Link copied" }); } catch {/* ignore */}
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest"
              style={{ background: "rgba(255,255,255,0.06)", border: BORDER, color: "#FAF5E9", fontFamily: "'Inter', sans-serif", fontWeight: 700 }}
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            <a
              href={(() => {
                const dt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
                const end = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
                const loc = [game.venue_name, game.venue_city, game.venue_state].filter(Boolean).join(", ");
                const text = encodeURIComponent(`${matchupTitle} (${game.league})`);
                return `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dt(startDate)}/${dt(end)}&location=${encodeURIComponent(loc)}`;
              })()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest"
              style={{ background: "rgba(255,255,255,0.06)", border: BORDER, color: "#FAF5E9", fontFamily: "'Inter', sans-serif", fontWeight: 700 }}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Add to calendar
            </a>
          </div>
        </div>

        {/* Segmented tabs */}
        <div className="flex p-1 rounded-full mb-5" style={{ background: PANEL, border: BORDER }}>
          {([
            { k: "going" as const, label: "Going",        icon: Users },
            { k: "watch" as const, label: "Where to watch", icon: Tv },
            { k: "chat"  as const, label: "Chat",         icon: Send },
          ]).map(t => {
            const active = tab === t.k;
            const Icon = t.icon;
            return (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full transition-all"
                style={{
                  background: active ? PINK : "transparent",
                  color: active ? "#0a0a0a" : "rgba(250,245,233,0.65)",
                  fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase",
                }}
                aria-pressed={active}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === "going" && (
        <>

        {/* RSVP bar */}
        <div className="rounded-2xl p-5 mb-5" style={{ background: PANEL, border: BORDER }}>
          <div className="text-[12px] uppercase mb-3" style={{ letterSpacing: "0.18em", fontFamily: "'Space Mono', monospace", color: "rgba(250,245,233,0.7)" }}>
            Your RSVP
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {RSVP_BUTTONS.map(b => {
              const active = myRsvp?.rsvp_type === b.type;
              return (
                <button
                  key={b.type}
                  onClick={() => setRsvp(b.type)}
                  className="h-11 rounded-xl text-[12px] uppercase font-bold tracking-[0.12em] transition-colors"
                  style={{
                    background: active ? PINK : "rgba(255,255,255,0.04)",
                    color: active ? "#0a0a0a" : "#FAF5E9",
                    border: active ? "none" : "1px solid rgba(255,255,255,0.08)",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
          {myRsvp && (myRsvp.rsvp_type === "going_game" || myRsvp.rsvp_type === "going_watch_party") && (
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(232,93,47,0.08)", border: "1px solid rgba(232,93,47,0.18)" }}>
              <div>
                <div className="text-[13px] font-medium">👋 Going solo</div>
                <div className="text-[11px]" style={{ color: "rgba(250,245,233,0.55)" }}>Let others know you're open to saying hi</div>
              </div>
              <Switch checked={myRsvp.going_solo} onCheckedChange={toggleSolo} />
            </div>
          )}
        </div>

        {/* Who's going */}
        <div className="rounded-2xl p-5 mb-5" style={{ background: PANEL, border: BORDER }}>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4" style={{ color: PINK }} />
            <span className="text-[12px] uppercase" style={{ letterSpacing: "0.18em", fontFamily: "'Space Mono', monospace", color: "rgba(250,245,233,0.7)" }}>
              Who's Going
            </span>
          </div>
          {(["going_game", "going_watch_party", "maybe"] as RsvpType[]).map(type => (
            <div key={type} className="mb-4 last:mb-0">
              <div className="text-[11px] uppercase mb-2 flex items-center gap-2" style={{ color: "rgba(250,245,233,0.5)", letterSpacing: "0.14em", fontFamily: "'Space Mono', monospace" }}>
                {RSVP_LABEL[type]}
                <span className="px-1.5 py-0.5 rounded-full text-[10px]" style={{ background: "rgba(232,93,47,0.15)", color: PINK }}>
                  {grouped[type].length}
                </span>
              </div>
              {grouped[type].length === 0 ? (
                <div className="text-[12px]" style={{ color: "rgba(250,245,233,0.35)" }}>No one yet — be the first.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {grouped[type].map(r => {
                    const p = profiles[r.user_id];
                    return (
                      <Link key={r.id} to={`/profile/${r.user_id}`} className="flex items-center gap-2 px-2 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={p?.profile_photo_url ?? undefined} />
                          <AvatarFallback className="text-[10px]">{(p?.name ?? "?")[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-[12px]">{p?.name ?? "Member"}</span>
                        {r.going_solo && <span className="text-[10px]" title="Going solo">👋</span>}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
        </>
        )}

        {tab === "watch" && (
          <div className="space-y-4">
            <WhereToWatchUnified
              context={{
                kind: "game",
                externalGameId: game.id,
                league: game.league,
                homeTeam: game.home_team,
                awayTeam: game.away_team,
                city: game.venue_city,
                startTime: game.game_start_at,
                title: `${game.away_team} vs ${game.home_team}`,
              }}
              chatHref={`/game/${game.id}?tab=chat`}
              shareUrl={typeof window !== "undefined" ? `${window.location.origin}/game/${game.id}` : undefined}
            />
            {/* Community pin/upvote panel retained for power users to add new spots */}
            <WatchSpotsPanel
              externalGameId={game.id}
              venueCity={game.venue_city}
              league={game.league}
            />
          </div>
        )}

        {tab === "chat" && (
        <div className="rounded-2xl p-5" style={{ background: PANEL, border: BORDER }}>
          <div className="text-[12px] uppercase mb-3" style={{ letterSpacing: "0.18em", fontFamily: "'Space Mono', monospace", color: "rgba(250,245,233,0.7)" }}>
            Game Chat
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto mb-3 pr-1">
            {messages.length === 0 && (
              <div className="py-4 space-y-3">
                <p className="text-[13px] text-center" style={{ color: "rgba(250,245,233,0.55)", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
                  Kick it off — pick a prompt or write your own.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "Who's going in person?",
                    "Where is everyone watching?",
                    "Best pregame meetup?",
                    "Anyone coming solo?",
                  ].map(p => (
                    <button
                      key={p}
                      onClick={() => setDraft(p)}
                      className="px-3 py-1.5 rounded-full text-[11px]"
                      style={{ background: "rgba(232,93,47,0.10)", border: "1px solid rgba(232,93,47,0.35)", color: PINK, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map(m => {
              const p = profiles[m.user_id];
              const mine = m.user_id === user?.id;
              return (
                <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                  <Avatar className="w-7 h-7 shrink-0">
                    <AvatarImage src={p?.profile_photo_url ?? undefined} />
                    <AvatarFallback className="text-[10px]">{(p?.name ?? "?")[0]}</AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                    <div className="text-[10px] mb-0.5" style={{ color: "rgba(250,245,233,0.5)" }}>
                      {p?.name ?? "Member"} · {format(new Date(m.created_at), "h:mm a")}
                    </div>
                    <div className="px-3 py-2 rounded-2xl text-[13px]" style={{
                      background: mine ? PINK : "rgba(255,255,255,0.06)",
                      color: mine ? "#0a0a0a" : "#FAF5E9",
                    }}>
                      {m.message}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="flex gap-2 sticky bottom-20 md:bottom-0"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={user ? "Say something…" : "Sign in to chat"}
              disabled={!user || sending}
              maxLength={2000}
              className="flex-1 h-11 px-4 rounded-xl text-[14px] outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#FAF5E9" }}
            />
            <Button type="submit" disabled={!user || sending || !draft.trim()} className="h-11 px-4" style={{ background: PINK, color: "#0a0a0a" }}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
        )}
      </main>
    </div>
  );
};

export default GameDetail;
