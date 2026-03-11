import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DesktopNav from "@/components/DesktopNav";
import BottomNav from "@/components/BottomNav";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageCircle, Send, ArrowLeft } from "lucide-react";
import PageSkeleton from "@/components/PageSkeleton";
import { cn } from "@/lib/utils";

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

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
}

const DirectMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<MatchWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<MatchWithProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (activeChat?.chatId) {
      fetchMessages(activeChat.chatId);

      const channel = supabase
        .channel(`chat-${activeChat.chatId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${activeChat.chatId}` }, (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [activeChat?.chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const { data: matches, error: matchErr } = await supabase
        .from("matches").select("id, user_a_id, user_b_id, status")
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .eq("status", "active");

      if (matchErr) throw matchErr;
      if (!matches || matches.length === 0) { setConversations([]); setLoading(false); return; }

      const matchIds = matches.map((m) => m.id);
      const { data: chats } = await supabase.from("chats").select("id, match_id").in("match_id", matchIds);

      const otherUserIds = matches.map((m) => m.user_a_id === user.id ? m.user_b_id : m.user_a_id);
      const { data: profiles } = await supabase.from("profiles").select("id, name, profile_photo_url").in("id", otherUserIds);

      const chatIds = chats?.map((c) => c.id) || [];
      let latestMessages: Record<string, { content: string; created_at: string; read_at: string | null }> = {};

      if (chatIds.length > 0) {
        const { data: msgs } = await supabase.from("messages").select("chat_id, content, created_at, read_at, sender_id")
          .in("chat_id", chatIds).order("created_at", { ascending: false });

        msgs?.forEach((msg) => {
          if (!latestMessages[msg.chat_id]) {
            latestMessages[msg.chat_id] = { content: msg.content, created_at: msg.created_at, read_at: msg.sender_id !== user.id ? msg.read_at : "read" };
          }
        });
      }

      const convos: MatchWithProfile[] = matches.map((match) => {
        const otherUserId = match.user_a_id === user.id ? match.user_b_id : match.user_a_id;
        const profile = profiles?.find((p) => p.id === otherUserId);
        const chat = chats?.find((c) => c.match_id === match.id);
        const lastMsg = chat ? latestMessages[chat.id] : null;
        return {
          matchId: match.id, chatId: chat?.id || "", otherUserId,
          otherUserName: profile?.name || "User", otherUserPhoto: profile?.profile_photo_url || null,
          lastMessage: lastMsg?.content || null, lastMessageAt: lastMsg?.created_at || null, unread: lastMsg?.read_at === null,
        };
      });

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

  const fetchMessages = async (chatId: string) => {
    setMessagesLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages").select("*").eq("chat_id", chatId).order("created_at", { ascending: true });
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() || !activeChat?.chatId || !user || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        chat_id: activeChat.chatId, sender_id: user.id, content: messageText.trim(),
      });
      if (error) throw error;
      setMessageText("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
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

  const formatMessageTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  // Conversation list component
  const ConversationList = ({ className }: { className?: string }) => (
    <div className={cn("flex flex-col h-full", className)}>
      <h1 className="text-2xl font-sans font-semibold p-4 pb-3 flex-shrink-0">Messages</h1>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-accent-foreground" />
            </div>
            <h2 className="text-lg font-sans font-semibold mb-1">No messages yet</h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              Match with members through events and your profile to start chatting!
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 px-2">
            {conversations.map((convo) => (
              <button
                key={convo.matchId}
                onClick={() => setActiveChat(convo)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left",
                  activeChat?.chatId === convo.chatId ? "bg-primary/10 border border-primary/20" : "hover:bg-secondary/50"
                )}
              >
                <div className="w-11 h-11 rounded-full bg-secondary/50 overflow-hidden flex-shrink-0">
                  {convo.otherUserPhoto ? (
                    <img src={convo.otherUserPhoto} alt={convo.otherUserName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-semibold">
                      {convo.otherUserName[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm truncate", convo.unread ? "font-semibold" : "font-medium")}>{convo.otherUserName}</span>
                    {convo.lastMessageAt && <span className="text-[11px] text-muted-foreground flex-shrink-0 ml-2">{formatTime(convo.lastMessageAt)}</span>}
                  </div>
                  <p className={cn("text-xs truncate", convo.unread ? "text-foreground font-medium" : "text-muted-foreground")}>
                    {convo.lastMessage || "Say hello 👋"}
                  </p>
                </div>
                {convo.unread && <span className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Chat view component
  const ChatView = () => {
    if (!activeChat) {
      return (
        <div className="hidden md:flex flex-col items-center justify-center h-full text-center text-muted-foreground">
          <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">Select a conversation to start chatting</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* Chat header */}
        <div className="flex items-center gap-3 p-4 border-b border-border flex-shrink-0">
          <Button variant="ghost" size="icon" className="md:hidden rounded-full" onClick={() => setActiveChat(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-9 h-9 rounded-full bg-secondary/50 overflow-hidden flex-shrink-0">
            {activeChat.otherUserPhoto ? (
              <img src={activeChat.otherUserPhoto} alt={activeChat.otherUserName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-semibold">
                {activeChat.otherUserName[0]}
              </div>
            )}
          </div>
          <span className="font-semibold text-sm">{activeChat.otherUserName}</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messagesLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-10">No messages yet. Say hello! 👋</p>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5", isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                    <p className="text-sm">{msg.content}</p>
                    <p className={cn("text-[10px] mt-1", isOwn ? "text-primary-foreground/60" : "text-muted-foreground")}>{formatMessageTime(msg.created_at)}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              className="rounded-full"
            />
            <Button size="icon" onClick={handleSend} disabled={!messageText.trim() || sending} className="rounded-full flex-shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 md:pl-64">
      <DesktopNav />
      <MobileHeader />

      <main className="container mx-auto px-0 md:px-4 py-0 md:py-6 max-w-5xl">
        {loading ? (
          <PageSkeleton variant="list" count={8} />
        ) : (
          <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] border border-border/30 rounded-none md:rounded-2xl overflow-hidden bg-card">
            {/* Left panel - conversation list */}
            <div className={cn(
              "w-full md:w-[35%] border-r border-border/30",
              activeChat ? "hidden md:flex" : "flex"
            )}>
              <ConversationList className="w-full" />
            </div>

            {/* Right panel - active chat */}
            <div className={cn(
              "w-full md:w-[65%]",
              !activeChat ? "hidden md:flex" : "flex"
            )}>
              <ChatView />
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default DirectMessages;
