import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import DesktopNav from "@/components/DesktopNav";
import BottomNav from "@/components/BottomNav";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Send, Loader2, Users, Pin, Shield, Info, Trash2 } from "lucide-react";

interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

interface GroupInfo {
  id: string;
  name: string;
  description: string | null;
  icon_emoji: string | null;
  is_official: boolean;
  rules: string | null;
  member_count: number;
  group_type: string;
}

interface GroupMember {
  user_id: string;
  role: string;
  profile_name?: string;
  profile_photo?: string;
}

const GroupChat = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [myRole, setMyRole] = useState<string>("member");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const profileCache = useRef<Record<string, { name: string; photo: string | null }>>({});

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!groupId || !user) return;
    fetchGroupData();
  }, [groupId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Realtime subscription
  useEffect(() => {
    if (!groupId || !isMember) return;

    const channel = supabase
      .channel(`group-messages-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const msg = payload.new as GroupMessage;
          // Enrich with sender info
          const profile = await getProfile(msg.sender_id);
          msg.sender_name = profile.name;
          msg.sender_avatar = profile.photo || undefined;
          setMessages(prev => [...prev, msg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, isMember]);

  const getProfile = async (userId: string) => {
    if (profileCache.current[userId]) return profileCache.current[userId];
    
    const { data } = await supabase
      .from('profiles')
      .select('name, profile_photo_url')
      .eq('id', userId)
      .single();
    
    const result = { name: data?.name || 'Member', photo: data?.profile_photo_url || null };
    profileCache.current[userId] = result;
    return result;
  };

  const fetchGroupData = async () => {
    if (!groupId || !user) return;

    try {
      // Fetch group info
      const { data: groupData, error: groupError } = await supabase
        .from('community_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // Check membership
      const { data: membership } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle();

      const memberStatus = !!membership;
      setIsMember(memberStatus);
      setMyRole(membership?.role || 'member');

      if (memberStatus) {
        // Fetch messages
        const { data: messagesData } = await supabase
          .from('group_messages')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: true })
          .limit(100);

        // Enrich messages with profiles
        const enriched = await Promise.all(
          (messagesData || []).map(async (msg) => {
            const profile = await getProfile(msg.sender_id);
            return { ...msg, sender_name: profile.name, sender_avatar: profile.photo || undefined };
          })
        );
        setMessages(enriched);

        // Fetch members
        const { data: membersData } = await supabase
          .from('group_members')
          .select('user_id, role')
          .eq('group_id', groupId);

        const enrichedMembers = await Promise.all(
          (membersData || []).map(async (m) => {
            const profile = await getProfile(m.user_id);
            return { ...m, profile_name: profile.name, profile_photo: profile.photo || undefined };
          })
        );
        setMembers(enrichedMembers);
      }
    } catch (err) {
      console.error('Error fetching group:', err);
      toast.error("Failed to load group");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !groupId || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          sender_id: user.id,
          content,
        });

      if (error) throw error;
    } catch {
      toast.error("Failed to send message");
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handlePinMessage = async (messageId: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('group_messages')
        .update({ is_pinned: !currentPinned })
        .eq('id', messageId);

      if (error) throw error;
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_pinned: !currentPinned } : m));
      toast.success(currentPinned ? "Message unpinned" : "Message pinned");
    } catch {
      toast.error("Failed to update pin");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('group_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const handleJoin = async () => {
    if (!user || !groupId) return;
    try {
      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: user.id });
      if (error) throw error;
      setIsMember(true);
      toast.success("Joined group!");
      fetchGroupData();
    } catch {
      toast.error("Failed to join");
    }
  };

  const pinnedMessages = messages.filter(m => m.is_pinned);
  const canModerate = myRole === 'admin' || myRole === 'moderator';

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background md:pl-64">
        <DesktopNav />
        <MobileHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background md:pl-64">
        <DesktopNav />
        <MobileHeader />
        <div className="container mx-auto px-4 pt-24 text-center">
          <p className="text-muted-foreground mb-4">Group not found</p>
          <Link to="/community"><Button variant="outline" className="rounded-full">Back to Community</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background md:pl-64 flex flex-col">
      <DesktopNav />
      
      {/* Chat Header */}
      <div className="fixed top-0 left-0 md:left-64 right-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Link to="/community">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl">
              {group.icon_emoji || '💬'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-base">{group.name}</h1>
                {group.is_official && <Shield className="h-3.5 w-3.5 text-medium-blue" />}
              </div>
              <p className="text-xs text-muted-foreground">{group.member_count} members</p>
            </div>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Info className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="text-2xl">{group.icon_emoji}</span> {group.name}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {group.description && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">About</h3>
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                  </div>
                )}

                {group.rules && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Group Rules</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{group.rules}</p>
                  </div>
                )}

                {pinnedMessages.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Pin className="h-3.5 w-3.5" /> Pinned Messages ({pinnedMessages.length})
                    </h3>
                    <div className="space-y-2">
                      {pinnedMessages.map(pm => (
                        <div key={pm.id} className="text-sm bg-muted/50 rounded-lg p-3">
                          <p className="font-medium text-xs mb-1">{pm.sender_name}</p>
                          <p className="text-muted-foreground">{pm.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium mb-2">Members ({members.length})</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {members.map(m => (
                      <div key={m.user_id} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={m.profile_photo || ''} />
                          <AvatarFallback className="text-xs bg-muted">{m.profile_name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm flex-1">{m.profile_name}</span>
                        {m.role !== 'member' && (
                          <Badge variant="secondary" className="text-[10px]">{m.role}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pt-[72px] pb-20 md:pb-[72px] px-4">
        <div className="max-w-4xl mx-auto space-y-1 py-4">
          {!isMember ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">{group.icon_emoji}</div>
              <h2 className="text-xl font-semibold mb-2">{group.name}</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">{group.description}</p>
              <Button className="rounded-full" onClick={handleJoin}>Join Group to Chat</Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.sender_id === user?.id;
              const showAvatar = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id;
              
              return (
                <div key={msg.id} className={`flex gap-2 group ${isMe ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-4' : 'mt-0.5'}`}>
                  {!isMe && showAvatar && (
                    <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                      <AvatarImage src={msg.sender_avatar || ''} />
                      <AvatarFallback className="text-xs bg-muted">{msg.sender_name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                  )}
                  {!isMe && !showAvatar && <div className="w-8 flex-shrink-0" />}
                  
                  <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {showAvatar && !isMe && (
                      <p className="text-xs font-medium text-muted-foreground ml-1 mb-0.5">{msg.sender_name}</p>
                    )}
                    <div className="flex items-end gap-1">
                      {isMe && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                          {canModerate && (
                            <button onClick={() => handlePinMessage(msg.id, msg.is_pinned)} className="p-1 rounded hover:bg-muted">
                              <Pin className={`h-3 w-3 ${msg.is_pinned ? 'text-primary' : 'text-muted-foreground'}`} />
                            </button>
                          )}
                          <button onClick={() => handleDeleteMessage(msg.id)} className="p-1 rounded hover:bg-muted">
                            <Trash2 className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      )}
                      <div className={`rounded-2xl px-4 py-2 text-sm relative ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-card border border-border/50 rounded-bl-md'
                      } ${msg.is_pinned ? 'ring-2 ring-accent' : ''}`}>
                        {msg.is_pinned && (
                          <Pin className="absolute -top-2 -right-2 h-3.5 w-3.5 text-accent bg-background rounded-full p-0.5" />
                        )}
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                      {!isMe && canModerate && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                          <button onClick={() => handlePinMessage(msg.id, msg.is_pinned)} className="p-1 rounded hover:bg-muted">
                            <Pin className={`h-3 w-3 ${msg.is_pinned ? 'text-primary' : 'text-muted-foreground'}`} />
                          </button>
                          <button onClick={() => handleDeleteMessage(msg.id)} className="p-1 rounded hover:bg-muted">
                            <Trash2 className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      {isMember && (
        <div className="fixed bottom-16 md:bottom-0 left-0 md:left-64 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 z-30">
          <div className="max-w-4xl mx-auto flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              className="rounded-full"
              maxLength={2000}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              size="icon"
              className="rounded-full flex-shrink-0"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
      
      <BottomNav />
    </div>
  );
};

export default GroupChat;