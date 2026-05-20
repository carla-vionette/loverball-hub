import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, MessageCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface Convo {
  chatId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unread: boolean;
}

const PANEL = "#161616";
const BORDER = "1px solid rgba(250, 245, 233, 0.08)";
const PINK = "#F04E23";

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

export default function ProfileInbox() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [convos, setConvos] = useState<Convo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;

    (async () => {
      try {
        const [{ data: notifs }, { data: matches }] = await Promise.all([
          supabase.from("notifications").select("id, type, title, body, link, is_read, created_at")
            .eq("user_id", user.id).order("created_at", { ascending: false }).limit(8),
          supabase.from("matches").select("id, user_a_id, user_b_id, status")
            .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`).eq("status", "active"),
        ]);

        if (!cancelled && notifs) setNotifications(notifs as NotificationRow[]);

        if (matches?.length) {
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

          const list: Convo[] = matches.map(match => {
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
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;

  const unreadNotifs = notifications.filter(n => !n.is_read).length;
  const unreadMsgs = convos.filter(c => c.unread).length;
  const previewNotifs = notifications.slice(0, 5);
  const previewMsgs = convos.slice(0, 5);

  return (
    <section
      className="rounded-3xl overflow-hidden"
      style={{ background: PANEL, border: BORDER, fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <Tabs defaultValue="notifications">
        <div className="flex items-center justify-between gap-4 px-5 pt-5">
          <p
            className="text-[10px] uppercase"
            style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.26em", color: "#D88C5A" }}
          >
            Inbox
          </p>
          <TabsList className="bg-transparent gap-1 p-0 h-auto">
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-xs rounded-full px-3 py-1.5 gap-2"
              style={{ color: "rgba(250,245,233,0.65)" }}
            >
              <Bell size={12} /> Notifications {unreadNotifs > 0 && (
                <span className="ml-1 px-1.5 rounded-full text-[9px]" style={{ background: PINK, color: "#fff" }}>{unreadNotifs}</span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-xs rounded-full px-3 py-1.5 gap-2"
              style={{ color: "rgba(250,245,233,0.65)" }}
            >
              <MessageCircle size={12} /> Messages {unreadMsgs > 0 && (
                <span className="ml-1 px-1.5 rounded-full text-[9px]" style={{ background: PINK, color: "#fff" }}>{unreadMsgs}</span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="notifications" className="mt-4">
          {loading ? (
            <div className="px-5 py-8 text-center text-[13px]" style={{ color: "rgba(250,245,233,0.55)" }}>Loading…</div>
          ) : previewNotifs.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Bell size={24} className="mx-auto mb-3" style={{ color: "rgba(250,245,233,0.35)" }} />
              <p className="text-[13px]" style={{ color: "rgba(250,245,233,0.55)" }}>You're all caught up.</p>
            </div>
          ) : (
            <ul>
              {previewNotifs.map((n, i) => (
                <li
                  key={n.id}
                  onClick={() => n.link && navigate(n.link)}
                  className="flex items-start gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-white/[0.03]"
                  style={{ borderTop: i === 0 ? "none" : BORDER }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(240,78,35,0.12)", color: PINK }}>
                    <Bell size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium truncate" style={{ color: "#FAF5E9" }}>{n.title}</p>
                      {!n.is_read && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: PINK }} />}
                    </div>
                    {n.body && <p className="text-[12px] truncate mt-0.5" style={{ color: "rgba(250,245,233,0.55)" }}>{n.body}</p>}
                  </div>
                  <span className="text-[10px] uppercase flex-shrink-0" style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.1em", color: "rgba(250,245,233,0.4)" }}>{timeAgo(n.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={() => navigate("/notifications")}
            className="w-full flex items-center justify-center gap-2 py-3 text-[11px] uppercase transition-colors hover:bg-white/[0.03]"
            style={{ borderTop: BORDER, fontFamily: "'Space Mono', monospace", letterSpacing: "0.18em", color: PINK }}
          >
            See all <ArrowRight size={12} />
          </button>
        </TabsContent>

        <TabsContent value="messages" className="mt-4">
          {loading ? (
            <div className="px-5 py-8 text-center text-[13px]" style={{ color: "rgba(250,245,233,0.55)" }}>Loading…</div>
          ) : previewMsgs.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <MessageCircle size={24} className="mx-auto mb-3" style={{ color: "rgba(250,245,233,0.35)" }} />
              <p className="text-[13px]" style={{ color: "rgba(250,245,233,0.55)" }}>No conversations yet.</p>
            </div>
          ) : (
            <ul>
              {previewMsgs.map((c, i) => (
                <li
                  key={c.chatId || c.otherUserId}
                  onClick={() => navigate("/dms")}
                  className="flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-white/[0.03]"
                  style={{ borderTop: i === 0 ? "none" : BORDER }}
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0" style={{ background: "#0F0F10", border: BORDER }}>
                    {c.otherUserPhoto ? (
                      <img src={c.otherUserPhoto} alt={c.otherUserName} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[12px]" style={{ color: "rgba(250,245,233,0.5)", fontFamily: "'Space Mono', monospace" }}>
                        {c.otherUserName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium truncate" style={{ color: "#FAF5E9" }}>{c.otherUserName}</p>
                      {c.unread && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: PINK }} />}
                    </div>
                    <p className="text-[12px] truncate mt-0.5" style={{ color: "rgba(250,245,233,0.55)" }}>{c.lastMessage || "Say hi —"}</p>
                  </div>
                  <span className="text-[10px] uppercase flex-shrink-0" style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.1em", color: "rgba(250,245,233,0.4)" }}>{timeAgo(c.lastMessageAt)}</span>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={() => navigate("/dms")}
            className="w-full flex items-center justify-center gap-2 py-3 text-[11px] uppercase transition-colors hover:bg-white/[0.03]"
            style={{ borderTop: BORDER, fontFamily: "'Space Mono', monospace", letterSpacing: "0.18em", color: PINK }}
          >
            Open inbox <ArrowRight size={12} />
          </button>
        </TabsContent>
      </Tabs>
    </section>
  );
}
