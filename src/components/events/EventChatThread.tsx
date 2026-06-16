import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { formatDistanceToNowStrict, subMinutes } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MOCK_EVENT_CHAT, type MockChatMessage } from "@/data/mockEvents";

export const SYSTEM_PREFIX = "[[SYS]]";

interface ChatRow {
  id: string;
  event_id: string;
  user_id: string;
  message: string;
  created_at: string;
}

interface ProfileLite {
  id: string;
  name: string | null;
  profile_photo_url: string | null;
}

interface Props {
  eventId: string;
  /** How many messages to show initially. Older messages load via "Load earlier". */
  pageSize?: number;
}

const PAGE = 50;

export default function EventChatThread({ eventId, pageSize = PAGE }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  // System "is going / is watching" notifications are surfaced visually in the
  // "Who's going" section — keep the chat thread for real conversation only.
  const mockChat = useMemo<MockChatMessage[]>(
    () => (MOCK_EVENT_CHAT[eventId] || []).filter((m) => !m.is_system),
    [eventId],
  );


  const hydrateProfiles = useCallback(async (rows: ChatRow[]) => {
    const ids = Array.from(new Set(rows.map(r => r.user_id))).filter(id => !profiles[id]);
    if (ids.length === 0) return;
    const { data } = await supabase
      .from("profiles")
      .select("id,name,profile_photo_url")
      .in("id", ids);
    if (data) {
      setProfiles(p => {
        const next = { ...p };
        data.forEach(d => { next[d.id] = d as ProfileLite; });
        return next;
      });
    }
  }, [profiles]);

  // Initial load (last N messages, newest at bottom)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("event_chat_messages")
        .select("id,event_id,user_id,message,created_at")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })
        .limit(pageSize + 1);
      if (cancelled) return;
      if (error) {
        setLoading(false);
        return;
      }
      const rows = (data || []).slice(0, pageSize).reverse();
      setMessages(rows);
      setHasMore((data?.length || 0) > pageSize);
      setLoading(false);
      hydrateProfiles(rows);
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      });
    })();
    return () => { cancelled = true; };
  }, [eventId, pageSize, hydrateProfiles]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`event-chat-${eventId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "event_chat_messages", filter: `event_id=eq.${eventId}` },
        (payload) => {
          const row = payload.new as ChatRow;
          setMessages(prev => {
            if (prev.some(m => m.id === row.id)) return prev;
            return [...prev, row];
          });
          hydrateProfiles([row]);
          requestAnimationFrame(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, hydrateProfiles]);

  const loadEarlier = async () => {
    if (messages.length === 0) return;
    setLoadingMore(true);
    const oldest = messages[0].created_at;
    const { data } = await supabase
      .from("event_chat_messages")
      .select("id,event_id,user_id,message,created_at")
      .eq("event_id", eventId)
      .lt("created_at", oldest)
      .order("created_at", { ascending: false })
      .limit(pageSize + 1);
    setLoadingMore(false);
    if (!data) return;
    const older = data.slice(0, pageSize).reverse();
    setMessages(prev => [...older, ...prev]);
    setHasMore(data.length > pageSize);
    hydrateProfiles(older);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user) { toast({ title: "Sign in to chat", variant: "destructive" }); return; }
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    const { error } = await supabase.from("event_chat_messages").insert({
      event_id: eventId,
      user_id: user.id,
      message: text.slice(0, 1000),
    });
    setSending(false);
    if (error) { toast({ title: "Could not send", variant: "destructive" }); return; }
    setDraft("");
  };

  return (
    <div className="flex flex-col rounded-xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-2"
        style={{ maxHeight: 320, minHeight: 120 }}
      >
        {hasMore && !loading && (
          <div className="text-center pb-1">
            <button
              onClick={loadEarlier}
              disabled={loadingMore}
              className="text-[10px] uppercase tracking-widest"
              style={{ color: "#E85D2F", fontFamily: "'Inter', sans-serif", fontWeight: 700 }}
            >
              {loadingMore ? "Loading…" : "Load earlier"}
            </button>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: "rgba(248,248,248,0.4)" }} />
          </div>
        ) : messages.length === 0 ? (
          mockChat.length > 0 ? (
            <>
              <div className="text-center pb-1">
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(248,248,248,0.35)" }}>
                  Sample chatter
                </span>
              </div>
              {mockChat.map(m => {
                const ts = subMinutes(new Date(), m.minutes_ago).toISOString();
                if (m.is_system) {
                  return (
                    <div key={m.id} className="text-center py-1">
                      <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 11, color: "#E85D2F", letterSpacing: "0.02em" }}>
                        {m.message}
                      </span>
                    </div>
                  );
                }
                return (
                  <div key={m.id} className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(232,93,47,0.2)", color: "#E85D2F", fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 11 }}>
                      {m.user_initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 12, color: "#FAF5E9" }}>
                          {m.user_name}
                        </span>
                        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(248,248,248,0.4)" }}>
                          {formatDistanceToNowStrict(new Date(ts), { addSuffix: true })}
                        </span>
                      </div>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "rgba(250,245,233,0.85)", margin: 0, wordBreak: "break-word" }}>
                        {m.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="text-center py-6"
              style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 12, color: "rgba(248,248,248,0.45)" }}>
              No chatter yet — say hi 👋
            </div>
          )

        ) : (
          messages.map(m => {
            const isSystem = m.message.startsWith(SYSTEM_PREFIX);
            if (isSystem) {
              return (
                <div key={m.id} className="text-center py-1">
                  <span
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontStyle: "italic",
                      fontSize: 11,
                      color: "#E85D2F",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {m.message.slice(SYSTEM_PREFIX.length).trim()}
                  </span>
                </div>
              );
            }
            const prof = profiles[m.user_id];
            const initial = (prof?.name || "?").slice(0, 1).toUpperCase();
            return (
              <div key={m.id} className="flex items-start gap-2">
                {prof?.profile_photo_url ? (
                  <img src={prof.profile_photo_url} alt={prof.name || ""}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    style={{ border: "1px solid rgba(255,255,255,0.1)" }} />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(232,93,47,0.2)", color: "#E85D2F",
                      fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 11 }}>
                    {initial}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 12, color: "#FAF5E9" }}>
                      {prof?.name || "Member"}
                    </span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(248,248,248,0.4)" }}>
                      {formatDistanceToNowStrict(new Date(m.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "rgba(250,245,233,0.85)", margin: 0, wordBreak: "break-word" }}>
                    {m.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      {user ? (
        <form onSubmit={handleSend} className="flex items-center gap-2 px-2 py-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Say something…"
            disabled={sending}
            maxLength={1000}
            className="flex-1 bg-transparent outline-none px-2 py-1.5"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#FAF5E9" }}
          />
          <Button
            type="submit"
            size="sm"
            disabled={sending || !draft.trim()}
            className="rounded-full h-8 w-8 p-0"
            style={{ background: "#E85D2F", color: "#fff" }}
            aria-label="Send"
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </Button>
        </form>
      ) : (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 px-2 py-2 cursor-not-allowed"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
                <input
                  type="text"
                  placeholder="Sign in to chat"
                  disabled
                  readOnly
                  className="flex-1 bg-transparent outline-none px-2 py-1.5 cursor-not-allowed"
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "rgba(250,245,233,0.4)" }}
                />
                <Button
                  type="button"
                  size="sm"
                  disabled
                  className="rounded-full h-8 w-8 p-0 opacity-60"
                  style={{ background: "#E85D2F", color: "#fff" }}
                  aria-label="Send disabled"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" style={{ background: "#161616", color: "#FAF5E9", border: "1px solid rgba(255,255,255,0.12)", fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
              Join Loverball to connect with fans at this game
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

