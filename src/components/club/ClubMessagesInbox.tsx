import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { C, fonts } from "@/lib/editorialTheme";
import { H2, H3, Body, Slug, Mono } from "@/components/editorial/primitives";

interface Conversation {
  chatId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unread: boolean;
}

const timeAgo = (iso: string | null) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
};

export default function ClubMessagesInbox() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [convos, setConvos] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;

    (async () => {
      try {
        const { data: matches } = await supabase
          .from("matches")
          .select("id, user_a_id, user_b_id, status")
          .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
          .eq("status", "active");

        if (!matches?.length) { if (!cancelled) { setConvos([]); setLoading(false); } return; }

        const matchIds = matches.map(m => m.id);
        const { data: chats } = await supabase.from("chats").select("id, match_id").in("match_id", matchIds);
        const otherIds = matches.map(m => m.user_a_id === user.id ? m.user_b_id : m.user_a_id);

        const profiles = (await Promise.all(otherIds.map(async (id) => {
          const { data } = await supabase.rpc("get_safe_profile", { profile_id: id });
          if (!data) return null;
          const p = typeof data === "string" ? JSON.parse(data) : data;
          return { id: p.id, name: p.name, profile_photo_url: p.profile_photo_url };
        }))).filter(Boolean) as Array<{ id: string; name: string; profile_photo_url: string | null }>;

        const chatIds = chats?.map(c => c.id) || [];
        const latest: Record<string, { content: string; created_at: string; read_at: string | null }> = {};
        if (chatIds.length) {
          const { data: msgs } = await supabase.from("messages")
            .select("chat_id, content, created_at, read_at, sender_id")
            .in("chat_id", chatIds).order("created_at", { ascending: false });
          msgs?.forEach(msg => {
            if (!latest[msg.chat_id]) {
              latest[msg.chat_id] = { content: msg.content, created_at: msg.created_at, read_at: msg.sender_id !== user.id ? msg.read_at : "read" };
            }
          });
        }

        const list: Conversation[] = matches.map(match => {
          const otherId = match.user_a_id === user.id ? match.user_b_id : match.user_a_id;
          const profile = profiles.find(p => p.id === otherId);
          const chat = chats?.find(c => c.match_id === match.id);
          const lastMsg = chat ? latest[chat.id] : null;
          return {
            chatId: chat?.id || "",
            otherUserId: otherId,
            otherUserName: profile?.name || "Member",
            otherUserPhoto: profile?.profile_photo_url || null,
            lastMessage: lastMsg?.content || null,
            lastMessageAt: lastMsg?.created_at || null,
            unread: lastMsg?.read_at === null,
          };
        }).sort((a, b) => {
          if (!a.lastMessageAt && !b.lastMessageAt) return 0;
          if (!a.lastMessageAt) return 1;
          if (!b.lastMessageAt) return -1;
          return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
        });

        if (!cancelled) setConvos(list);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  const preview = convos.slice(0, 5);

  return (
    <section className="max-w-7xl mx-auto px-5 md:px-10 pb-20">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <Slug>Inbox</Slug>
          <H2 className="mt-3">Messages</H2>
        </div>
        <button
          onClick={() => navigate("/dms")}
          className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
          style={{ color: C.raspberry, fontFamily: fonts.mono, letterSpacing: "0.08em", textTransform: "uppercase" }}
        >
          Open all <ArrowRight size={14} />
        </button>
      </div>

      {!user ? (
        <div className="rounded-[20px] p-10 text-center" style={{ background: C.surface, border: `1px dashed ${C.border}` }}>
          <Body muted size={15}>Sign in to see your direct messages.</Body>
        </div>
      ) : loading ? (
        <div className="rounded-[20px] p-10 text-center" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <Body muted size={14}>Loading conversations…</Body>
        </div>
      ) : preview.length === 0 ? (
        <div className="rounded-[20px] p-10 md:p-14 text-center" style={{ background: C.surface, border: `1px dashed ${C.border}` }}>
          <MessageCircle size={28} color={C.gold} strokeWidth={1.25} className="mx-auto" />
          <H3 className="mt-5">No messages yet</H3>
          <Body muted size={15} className="mt-3 max-w-md mx-auto">
            Match with members from your Starting XI to start a conversation.
          </Body>
        </div>
      ) : (
        <ul className="rounded-[20px] overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          {preview.map((c, idx) => (
            <li
              key={c.chatId || c.otherUserId}
              onClick={() => navigate("/dms")}
              className="flex items-center gap-4 p-4 md:p-5 cursor-pointer transition-colors hover:bg-white/5"
              style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.border}` }}
            >
              <div
                className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
                style={{ background: C.bg, border: `1px solid ${C.border}` }}
              >
                {c.otherUserPhoto ? (
                  <img src={c.otherUserPhoto} alt={c.otherUserName} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ color: C.muted, fontFamily: fonts.mono, fontSize: 14 }}>
                    {c.otherUserName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <H3 style={{ fontSize: 16, margin: 0 }} className="truncate">{c.otherUserName}</H3>
                  {c.unread && <span className="w-2 h-2 rounded-full" style={{ background: C.raspberry }} />}
                </div>
                <Body muted size={13} className="truncate mt-1">
                  {c.lastMessage || "Say hi —"}
                </Body>
              </div>
              <Mono size={10} color={C.muted}>{timeAgo(c.lastMessageAt)}</Mono>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
