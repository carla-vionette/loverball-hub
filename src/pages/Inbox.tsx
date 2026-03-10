import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Loader2, MessageCircle, Inbox as InboxIcon } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { format } from "date-fns";

interface ThreadProfile {
  id: string;
  name: string;
  profile_photo_url: string | null;
}

interface Thread {
  partner: ThreadProfile;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
}

interface DM {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  read: boolean;
}

const Inbox = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<ThreadProfile | null>(null);
  const [messages, setMessages] = useState<DM[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) fetchThreads();
  }, [user?.id]);

  const fetchThreads = async () => {
    if (!user) return;
    setLoading(true);

    const { data: allMessages } = await supabase
      .from("direct_messages" as any)
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!allMessages || allMessages.length === 0) {
      setThreads([]);
      setLoading(false);
      return;
    }

    // Group by conversation partner
    const partnerMap = new Map<string, { messages: any[] }>();
    for (const msg of allMessages as any[]) {
      const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, { messages: [] });
      }
      partnerMap.get(partnerId)!.messages.push(msg);
    }

    // Fetch partner profiles
    const partnerIds = Array.from(partnerMap.keys());
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, profile_photo_url")
      .in("id", partnerIds);

    const profileMap = new Map<string, ThreadProfile>();
    (profiles || []).forEach((p: any) => profileMap.set(p.id, p));

    const threadList: Thread[] = partnerIds
      .map((pid) => {
        const partner = profileMap.get(pid);
        if (!partner) return null;
        const msgs = partnerMap.get(pid)!.messages;
        const last = msgs[0];
        const unread = msgs.filter((m: any) => m.receiver_id === user.id && !m.read).length;
        return {
          partner,
          lastMessage: last.message,
          lastAt: last.created_at,
          unreadCount: unread,
        };
      })
      .filter(Boolean) as Thread[];

    threadList.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
    setThreads(threadList);
    setLoading(false);
  };

  const openThread = async (partner: ThreadProfile) => {
    if (!user) return;
    setActiveThread(partner);
    setLoadingMessages(true);

    const { data } = await supabase
      .from("direct_messages" as any)
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${partner.id}),and(sender_id.eq.${partner.id},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    setMessages((data as any[] || []) as DM[]);
    setLoadingMessages(false);

    // Mark unread as read
    await supabase
      .from("direct_messages" as any)
      .update({ read: true } as any)
      .eq("sender_id", partner.id)
      .eq("receiver_id", user.id)
      .eq("read", false);
  };

  const handleSend = async () => {
    if (!user || !activeThread || !newMessage.trim()) return;
    setSending(true);
    const { data, error } = await supabase.from("direct_messages" as any).insert({
      sender_id: user.id,
      receiver_id: activeThread.id,
      message: newMessage.trim(),
    } as any).select().single();

    if (!error && data) {
      setMessages((prev) => [...prev, data as any]);
      setNewMessage("");
    }
    setSending(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <p className="text-muted-foreground">Please sign in to view messages.</p>
      </div>
    );
  }

  // Thread conversation view
  if (activeThread) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setActiveThread(null); fetchThreads(); }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="w-8 h-8">
            <AvatarImage src={activeThread.profile_photo_url || undefined} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {activeThread.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-foreground">{activeThread.name}</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
          {loadingMessages ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-12">No messages yet. Say hello!</p>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      isMine
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    <p>{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {format(new Date(msg.created_at), "h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Compose */}
        <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border p-3 md:bottom-0">
          <div className="flex gap-2 items-end max-w-2xl mx-auto">
            <Textarea
              placeholder="Type a message…"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="min-h-[40px] max-h-[120px] resize-none text-sm flex-1"
              maxLength={1000}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button size="icon" disabled={!newMessage.trim() || sending} onClick={handleSend}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  // Thread list view
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          Messages
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-3">
          <InboxIcon className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">No messages yet</p>
          <p className="text-xs text-muted-foreground/60">Send a message from someone's profile on an event page.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {threads.map((thread) => (
            <button
              key={thread.partner.id}
              onClick={() => openThread(thread.partner)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
            >
              <Avatar className="w-11 h-11 shrink-0">
                <AvatarImage src={thread.partner.profile_photo_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {thread.partner.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground truncate">{thread.partner.name}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                    {format(new Date(thread.lastAt), "MMM d")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{thread.lastMessage}</p>
              </div>
              {thread.unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 shrink-0">
                  {thread.unreadCount}
                </Badge>
              )}
            </button>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Inbox;
