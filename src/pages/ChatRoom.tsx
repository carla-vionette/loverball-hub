import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import ChatIcebreaker from "@/components/ChatIcebreaker";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

const ChatRoom = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otherUserName, setOtherUserName] = useState("Chat");
  const [otherUserPhoto, setOtherUserPhoto] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId || !user) return;
    fetchMessages();
    fetchOtherUser();

    // Realtime subscription
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          // Mark as read if from other user
          if (newMsg.sender_id !== user.id) {
            supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", newMsg.id).then();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    if (!chatId) return;
    const { data, error } = await supabase
      .from("messages")
      .select("id, content, sender_id, created_at")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
      // Mark unread messages as read
      const unread = data.filter((m) => m.sender_id !== user?.id);
      if (unread.length > 0) {
        const unreadIds = unread.map((m) => m.id);
        supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unreadIds).then();
      }
    }
    setLoading(false);
  };

  const fetchOtherUser = async () => {
    if (!chatId || !user) return;
    // Get chat -> match -> other user
    const { data: chat } = await supabase.from("chats").select("match_id").eq("id", chatId).maybeSingle();
    if (!chat) return;
    const { data: match } = await supabase.from("matches").select("user_a_id, user_b_id").eq("id", chat.match_id).maybeSingle();
    if (!match) return;
    const otherId = match.user_a_id === user.id ? match.user_b_id : match.user_a_id;
    const { data: profileData } = await supabase.rpc("get_safe_profile", { profile_id: otherId });
    if (profileData) {
      const profile = typeof profileData === 'string' ? JSON.parse(profileData) : profileData;
      setOtherUserName(profile.name);
      setOtherUserPhoto(profile.profile_photo_url);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !chatId || !user || sending) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      chat_id: chatId,
      sender_id: user.id,
      content: newMessage.trim(),
    });
    if (!error) setNewMessage("");
    setSending(false);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:pl-64">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border/20 px-4 py-3 flex items-center gap-3">
        <Link to="/dms" className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-8 h-8 rounded-full bg-secondary/50 overflow-hidden flex-shrink-0">
          {otherUserPhoto ? (
            <img src={otherUserPhoto} alt={otherUserName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
              {otherUserName[0]}
            </div>
          )}
        </div>
        <span className="font-semibold text-sm">{otherUserName}</span>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !loading && (
          <ChatIcebreaker onSelect={(prompt) => setNewMessage(prompt)} />
        )}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-10">Say hello to start the conversation 👋</p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card text-card-foreground border border-border/30 rounded-bl-md"
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t border-border/20 px-4 py-3 safe-bottom">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full bg-card border-border/30"
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full w-10 h-10 bg-accent text-accent-foreground"
            disabled={!newMessage.trim() || sending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
