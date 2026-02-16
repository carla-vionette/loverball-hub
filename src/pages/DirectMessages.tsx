import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DesktopNav from "@/components/DesktopNav";
import BottomNav from "@/components/BottomNav";
import MobileHeader from "@/components/MobileHeader";
import { Loader2, MessageCircle } from "lucide-react";

interface MatchWithProfile {
  matchId: string;
  chatId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unread: boolean;
}

const DirectMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<MatchWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      // Get all matches
      const { data: matches, error: matchErr } = await supabase
        .from("matches")
        .select("id, user_a_id, user_b_id, status")
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .eq("status", "active");

      if (matchErr) throw matchErr;
      if (!matches || matches.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get chats for those matches
      const matchIds = matches.map((m) => m.id);
      const { data: chats } = await supabase
        .from("chats")
        .select("id, match_id")
        .in("match_id", matchIds);

      // Get other user profiles
      const otherUserIds = matches.map((m) =>
        m.user_a_id === user.id ? m.user_b_id : m.user_a_id
      );
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, profile_photo_url")
        .in("id", otherUserIds);

      // Get latest messages for each chat
      const chatIds = chats?.map((c) => c.id) || [];
      let latestMessages: Record<string, { content: string; created_at: string; read_at: string | null }> = {};

      if (chatIds.length > 0) {
        const { data: msgs } = await supabase
          .from("messages")
          .select("chat_id, content, created_at, read_at, sender_id")
          .in("chat_id", chatIds)
          .order("created_at", { ascending: false });

        // Get the latest message per chat
        msgs?.forEach((msg) => {
          if (!latestMessages[msg.chat_id]) {
            latestMessages[msg.chat_id] = {
              content: msg.content,
              created_at: msg.created_at,
              read_at: msg.sender_id !== user.id ? msg.read_at : "read",
            };
          }
        });
      }

      const convos: MatchWithProfile[] = matches.map((match) => {
        const otherUserId = match.user_a_id === user.id ? match.user_b_id : match.user_a_id;
        const profile = profiles?.find((p) => p.id === otherUserId);
        const chat = chats?.find((c) => c.match_id === match.id);
        const lastMsg = chat ? latestMessages[chat.id] : null;

        return {
          matchId: match.id,
          chatId: chat?.id || "",
          otherUserId,
          otherUserName: profile?.name || "User",
          otherUserPhoto: profile?.profile_photo_url || null,
          lastMessage: lastMsg?.content || null,
          lastMessageAt: lastMsg?.created_at || null,
          unread: lastMsg?.read_at === null,
        };
      });

      // Sort by most recent message
      convos.sort((a, b) => {
        if (!a.lastMessageAt && !b.lastMessageAt) return 0;
        if (!a.lastMessageAt) return 1;
        if (!b.lastMessageAt) return -1;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });

      setConversations(convos);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return d.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 md:pl-64">
      <DesktopNav />
      <MobileHeader />

      <main className="container mx-auto px-4 py-6 max-w-lg">
        <h1 className="text-3xl font-sans font-semibold mb-6">Messages</h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mb-6">
              <MessageCircle className="h-10 w-10 text-accent-foreground" />
            </div>
            <h2 className="text-xl font-sans font-semibold mb-2">No messages yet</h2>
            <p className="text-muted-foreground max-w-xs">
              Head to <Link to="/connections" className="text-primary underline">Connections</Link> to find your people!
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((convo) => (
              <Link
                key={convo.matchId}
                to={`/messages/${convo.chatId}`}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-secondary/50 overflow-hidden flex-shrink-0">
                  {convo.otherUserPhoto ? (
                    <img src={convo.otherUserPhoto} alt={convo.otherUserName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg font-semibold">
                      {convo.otherUserName[0]}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium truncate ${convo.unread ? "font-semibold" : ""}`}>
                      {convo.otherUserName}
                    </span>
                    {convo.lastMessageAt && (
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {formatTime(convo.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate ${convo.unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {convo.lastMessage || "Say hello 👋"}
                  </p>
                </div>

                {convo.unread && (
                  <span className="w-2.5 h-2.5 bg-accent rounded-full flex-shrink-0" />
                )}
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default DirectMessages;
