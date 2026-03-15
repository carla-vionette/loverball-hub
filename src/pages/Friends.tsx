import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Users, Clock, Check, Loader2, MessageCircle, Send, X, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import AttendeeProfileDrawer from "@/components/AttendeeProfileDrawer";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";

interface FriendProfile {
  id: string;
  name: string;
  profile_photo_url: string | null;
  bio: string | null;
  favorite_sports: string[] | null;
  primary_role: string | null;
  city: string | null;
}

interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  friend_profile: FriendProfile | null;
  lastMessage?: { message: string; created_at: string; sender_id: string } | null;
  unreadCount?: number;
}

const Friends = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [friends, setFriends] = useState<FriendshipRow[]>([]);
  const [pendingReceived, setPendingReceived] = useState<FriendshipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<FriendProfile | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  // Chat state
  const [chatOpen, setChatOpen] = useState<string | null>(null);
  const [chatFriend, setChatFriend] = useState<FriendProfile | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  const isMobile = useIsMobile();

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("friends-dm-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload) => {
          const msg = payload.new as any;
          if (chatOpen && (msg.sender_id === chatOpen || msg.receiver_id === chatOpen)) {
            setMessages((prev) => [...prev, msg]);
          }
          fetchAll();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, chatOpen]);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);

    const { data: accepted } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status, created_at")
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    const { data: pending } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status, created_at")
      .eq("status", "pending")
      .eq("addressee_id", user.id);

    const friendIds = new Set<string>();
    (accepted || []).forEach((f) => {
      friendIds.add(f.requester_id === user.id ? f.addressee_id : f.requester_id);
    });
    (pending || []).forEach((f) => friendIds.add(f.requester_id));

    const ids = Array.from(friendIds);
    let profileMap: Record<string, FriendProfile> = {};
    if (ids.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, profile_photo_url, bio, favorite_sports, primary_role, city")
        .in("id", ids);
      (profiles || []).forEach((p: any) => {
        profileMap[p.id] = p;
      });
    }

    const friendIdList = (accepted || []).map((f) =>
      f.requester_id === user.id ? f.addressee_id : f.requester_id
    );

    let lastMessageMap: Record<string, { message: string; created_at: string; sender_id: string }> = {};
    let unreadMap: Record<string, number> = {};

    if (friendIdList.length > 0) {
      const { data: allDms } = await supabase
        .from("direct_messages")
        .select("sender_id, receiver_id, message, created_at, read")
        .or(
          friendIdList
            .map(
              (fid) =>
                `and(sender_id.eq.${user.id},receiver_id.eq.${fid}),and(sender_id.eq.${fid},receiver_id.eq.${user.id})`
            )
            .join(",")
        )
        .order("created_at", { ascending: false });

      if (allDms) {
        for (const dm of allDms) {
          const friendId = dm.sender_id === user.id ? dm.receiver_id : dm.sender_id;
          if (!lastMessageMap[friendId]) {
            lastMessageMap[friendId] = { message: dm.message, created_at: dm.created_at, sender_id: dm.sender_id };
          }
          if (dm.receiver_id === user.id && !dm.read) {
            unreadMap[friendId] = (unreadMap[friendId] || 0) + 1;
          }
        }
      }
    }

    const friendRows = (accepted || []).map((f) => {
      const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
      return {
        ...f,
        friend_profile: profileMap[friendId] || null,
        lastMessage: lastMessageMap[friendId] || null,
        unreadCount: unreadMap[friendId] || 0,
      };
    });

    friendRows.sort((a, b) => {
      if (a.unreadCount !== b.unreadCount) return (b.unreadCount || 0) - (a.unreadCount || 0);
      if (a.lastMessage && b.lastMessage) return b.lastMessage.created_at.localeCompare(a.lastMessage.created_at);
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      return 0;
    });

    setFriends(friendRows);
    setPendingReceived(
      (pending || []).map((f) => ({
        ...f,
        friend_profile: profileMap[f.requester_id] || null,
      }))
    );
    setLoading(false);
  };

  const handleAccept = async (friendshipId: string, friendName: string) => {
    setActing(friendshipId);
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);
    if (!error) {
      toast({ title: "Accepted!", description: `You and ${friendName} are now friends.` });
      fetchAll();
    }
    setActing(null);
  };

  const openChat = async (friendProfile: FriendProfile) => {
    if (!user) return;
    setChatOpen(friendProfile.id);
    setChatFriend(friendProfile);
    setChatLoading(true);

    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${friendProfile.id}),and(sender_id.eq.${friendProfile.id},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    setMessages(data || []);
    setChatLoading(false);

    await supabase
      .from("direct_messages")
      .update({ read: true })
      .eq("sender_id", friendProfile.id)
      .eq("receiver_id", user.id)
      .eq("read", false);

    fetchAll();
  };

  const handleSend = async () => {
    if (!user || !chatOpen || !messageText.trim()) return;
    setSending(true);
    const { error } = await supabase.from("direct_messages").insert({
      sender_id: user.id,
      receiver_id: chatOpen,
      message: messageText.trim(),
    });
    if (error) {
      toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
    } else {
      setMessageText("");
    }
    setSending(false);
  };

  // ─── Inline JSX helpers (NOT components — avoids hook issues) ───

  const renderChatPanel = (className = "") => {
    if (!chatOpen || !chatFriend) {
      return (
        <div className={`flex flex-col items-center justify-center text-center text-muted-foreground ${className}`}>
          <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-medium">Select a friend to start chatting</p>
          <p className="text-sm">Your messages will appear here</p>
        </div>
      );
    }

    return (
      <div className={`flex flex-col ${className}`}>
        <div className="flex items-center gap-3 p-3 border-b border-border shrink-0">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => { setChatOpen(null); setChatFriend(null); setMessages([]); }}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <Avatar className="w-8 h-8">
            <AvatarImage src={chatFriend.profile_photo_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {chatFriend.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-base font-bold truncate">{chatFriend.name}</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {chatLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No messages yet. Say hi! 👋</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-foreground rounded-bl-md"
                    }`}
                  >
                    <p>{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {format(new Date(msg.created_at), "h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-border p-3 shrink-0">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type a message…"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              className="min-h-[44px] max-h-[120px] resize-none text-sm flex-1"
              maxLength={1000}
            />
            <Button
              size="icon"
              className="shrink-0 h-11 w-11"
              disabled={!messageText.trim() || sending}
              onClick={handleSend}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderFriendsListPanel = (className = "") => (
    <div className={className}>
      <Tabs defaultValue="friends">
        <TabsList className="w-full">
          <TabsTrigger value="friends" className="flex-1">
            <MessageCircle className="w-4 h-4 mr-1.5" />
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex-1 relative">
            <Clock className="w-4 h-4 mr-1.5" />
            Requests
            {pendingReceived.length > 0 && (
              <span className="ml-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {pendingReceived.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No friends yet</p>
              <p className="text-sm">Attend events and connect with people!</p>
            </div>
          ) : (
            friends.map((f) => {
              const isSelected = chatOpen === f.friend_profile?.id;
              return (
                <Card
                  key={f.id}
                  className={`cursor-pointer hover:bg-secondary/50 transition-colors ${f.unreadCount ? "border-primary/30" : ""} ${isSelected ? "bg-primary/5 border-primary/40" : ""}`}
                  onClick={() => f.friend_profile && openChat(f.friend_profile)}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={f.friend_profile?.profile_photo_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {f.friend_profile?.name?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      {(f.unreadCount || 0) > 0 && (
                        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {f.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">{f.friend_profile?.name}</p>
                        {!f.lastMessage && (
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            <Check className="w-3 h-3 mr-0.5" /> Friends
                          </Badge>
                        )}
                      </div>
                      {f.lastMessage ? (
                        <p className={`text-xs truncate ${f.unreadCount ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                          {f.lastMessage.sender_id === user?.id ? "You: " : ""}
                          {f.lastMessage.message}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Tap to message</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {f.lastMessage && (
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(f.lastMessage.created_at), "MMM d")}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : pendingReceived.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No pending requests</p>
            </div>
          ) : (
            pendingReceived.map((f) => (
              <Card key={f.id}>
                <CardContent className="flex items-center gap-3 p-3">
                  <Avatar
                    className="w-12 h-12 cursor-pointer"
                    onClick={() => {
                      if (f.friend_profile) {
                        setSelectedProfile(f.friend_profile);
                        setDrawerOpen(true);
                      }
                    }}
                  >
                    <AvatarImage src={f.friend_profile?.profile_photo_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {f.friend_profile?.name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{f.friend_profile?.name}</p>
                    <p className="text-xs text-muted-foreground">Wants to be friends</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAccept(f.id, f.friend_profile?.name || "User")}
                    disabled={acting === f.id}
                  >
                    {acting === f.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept"}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  // ─── Mobile: Chat fullscreen takeover ───
  if (isMobile && chatOpen && chatFriend) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col z-40">
        {renderChatPanel("flex-1 min-h-0")}
      </div>
    );
  }

  // ─── Desktop: Split panel layout ───
  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pb-24 md:pb-0">
        {/* Mobile layout */}
        <div className="md:hidden">
          <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border">
            <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-bold">Friends & Messages</h1>
            </div>
          </header>
          <div className="max-w-2xl mx-auto px-4 py-4">
            {renderFriendsListPanel()}
          </div>
        </div>

        {/* Desktop split layout */}
        <div className="hidden md:flex h-[calc(100vh)] border-t border-border/20">
          <div className="w-[360px] border-r border-border/20 overflow-y-auto p-4">
            <h1 className="text-xl font-bold mb-4">Friends & Messages</h1>
            {renderFriendsListPanel()}
          </div>
          {renderChatPanel("flex-1 h-full")}
        </div>
      </main>

      <AttendeeProfileDrawer
        profile={selectedProfile}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
};

export default Friends;
