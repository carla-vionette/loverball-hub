import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import DesktopNav from '@/components/DesktopNav';
import MobileHeader from '@/components/MobileHeader';
import EventPreviewCard from '@/components/EventPreviewCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { fetchProfileById } from '@/lib/profileApi';
import { Loader2, Send, ArrowLeft, MessageCircle, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

// Regex to detect event links in messages
const EVENT_LINK_REGEX = /(?:https?:\/\/[^\s]*)?\/event\/([a-f0-9-]{36})/gi;

interface Match {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: string;
  other_user: {
    id: string;
    name: string;
    profile_photo_url?: string | null;
    primary_role?: string | null;
  };
  chat?: {
    id: string;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string | null;
}

const conversationStarters = [
  "What's been the highlight of your sports journey so far?",
  "If you could attend any sporting event in history, which would it be?",
  "What's your hot take that would get you booed at a sports bar?",
  "What's a skill outside of sports that you're secretly proud of?",
  "If you could have dinner with any athlete, past or present, who would it be?",
];

const MessagesPage = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isMember } = useAuth();
  const navigate = useNavigate();

  const fetchMatches = useCallback(async () => {
    if (!user) return;

    try {
      // Get matches
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          user_a_id,
          user_b_id,
          created_at
        `)
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .eq('status', 'active');

      if (matchesError) throw matchesError;

      // Get other user profiles and chats for each match
      const matchesWithDetails = await Promise.all(
        (matchesData || []).map(async (match) => {
          const otherUserId = match.user_a_id === user.id ? match.user_b_id : match.user_a_id;
          
          // Get other user's profile using rate-limited API
          const { data: profileData } = await fetchProfileById(
            otherUserId,
            'id, name, profile_photo_url, primary_role'
          );

          // Get chat for this match
          const { data: chatData } = await supabase
            .from('chats')
            .select('id')
            .eq('match_id', match.id)
            .maybeSingle();

          // Get last message if chat exists
          let lastMessage = null;
          if (chatData) {
            const { data: messageData } = await supabase
              .from('messages')
              .select('content, created_at')
              .eq('chat_id', chatData.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            lastMessage = messageData;
          }

          return {
            ...match,
            other_user: profileData || { id: otherUserId, name: 'Unknown' },
            chat: chatData,
            last_message: lastMessage,
          };
        })
      );

      // Sort by last message or match date
      matchesWithDetails.sort((a, b) => {
        const dateA = a.last_message?.created_at || a.created_at;
        const dateB = b.last_message?.created_at || b.created_at;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      setMatches(matchesWithDetails);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  useEffect(() => {
    if (!isMember) {
      navigate('/invite');
      return;
    }
    fetchMatches();
  }, [isMember, fetchMatches, navigate]);

  // Subscribe to new messages
  useEffect(() => {
    if (!selectedMatch?.chat?.id) return;

    const channel = supabase
      .channel(`messages-${selectedMatch.chat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${selectedMatch.chat.id}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMatch?.chat?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectMatch = async (match: Match) => {
    setSelectedMatch(match);
    if (match.chat?.id) {
      await fetchMessages(match.chat.id);
    } else {
      setMessages([]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedMatch?.chat?.id || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: selectedMatch.chat.id,
          sender_id: user.id,
          content: newMessage.trim(),
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const getRandomStarter = () => {
    const starter = conversationStarters[Math.floor(Math.random() * conversationStarters.length)];
    setNewMessage(starter);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />
      
      <main className="md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0 h-screen">
        <div className="h-full flex">
          {/* Matches List - Hidden on mobile when chat selected */}
          <div className={`w-full md:w-80 border-r border-border bg-card flex flex-col ${selectedMatch ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-border">
              <h1 className="text-xl font-bold">Messages</h1>
            </div>
            
            <ScrollArea className="flex-1">
              {matches.length > 0 ? (
                matches.map((match) => (
                  <button
                    key={match.id}
                    onClick={() => handleSelectMatch(match)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-muted transition border-b border-border ${
                      selectedMatch?.id === match.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {match.other_user.profile_photo_url ? (
                        <img 
                          src={match.other_user.profile_photo_url} 
                          alt={match.other_user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-primary/50">
                          {match.other_user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-semibold truncate">{match.other_user.name}</p>
                      {match.last_message ? (
                        <p className="text-sm text-muted-foreground truncate">
                          {match.last_message.content}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          New match! Say hello 👋
                        </p>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center">
                  <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    No matches yet. Keep swiping!
                  </p>
                  <Button 
                    className="mt-4" 
                    variant="outline"
                    onClick={() => navigate('/members')}
                  >
                    Find Connections
                  </Button>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat View */}
          <div className={`flex-1 flex flex-col ${!selectedMatch ? 'hidden md:flex' : 'flex'}`}>
            {selectedMatch ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedMatch(null)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div 
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => navigate(`/members/${selectedMatch.other_user.id}`)}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
                      {selectedMatch.other_user.profile_photo_url ? (
                        <img 
                          src={selectedMatch.other_user.profile_photo_url} 
                          alt={selectedMatch.other_user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-bold text-primary/50">
                          {selectedMatch.other_user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{selectedMatch.other_user.name}</p>
                      {selectedMatch.other_user.primary_role && (
                        <p className="text-sm text-muted-foreground">
                          {selectedMatch.other_user.primary_role}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        Start the conversation! Here's a conversation starter:
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={getRandomStarter}
                        className="gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Get Conversation Starter
                      </Button>
                    </div>
                  )}
                  
                  {messages.map((message) => {
                    // Check if message contains an event link
                    const eventMatches = [...message.content.matchAll(EVENT_LINK_REGEX)];
                    const eventIds = eventMatches.map(match => match[1]);
                    const hasEventLink = eventIds.length > 0;
                    
                    // Remove event links from display text
                    const displayContent = hasEventLink 
                      ? message.content.replace(EVENT_LINK_REGEX, '').trim()
                      : message.content;

                    return (
                      <div
                        key={message.id}
                        className={`mb-3 flex ${
                          message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div className="max-w-[75%] space-y-2">
                          {/* Text content */}
                          {displayContent && (
                            <div
                              className={`px-4 py-2 rounded-2xl ${
                                message.sender_id === user?.id
                                  ? 'bg-primary text-primary-foreground rounded-br-md'
                                  : 'bg-muted text-foreground rounded-bl-md'
                              }`}
                            >
                              <p>{displayContent}</p>
                            </div>
                          )}
                          
                          {/* Event preview cards */}
                          {eventIds.map((eventId, idx) => (
                            <EventPreviewCard key={`${message.id}-event-${idx}`} eventId={eventId} />
                          ))}
                          
                          {/* Timestamp */}
                          <p className={`text-xs ${
                            message.sender_id === user?.id 
                              ? 'text-right text-muted-foreground' 
                              : 'text-left text-muted-foreground'
                          }`}>
                            {format(new Date(message.created_at), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-border flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sendingMessage}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={sendingMessage || !newMessage.trim()}
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-xl font-semibold mb-2">Select a conversation</p>
                  <p className="text-muted-foreground">
                    Choose a match to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MessagesPage;
