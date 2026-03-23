import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Send, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Comment {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
  profile?: {
    name: string;
    profile_photo_url: string | null;
  } | null;
}

interface EventCommentsProps {
  eventId: string;
}

const EventComments = ({ eventId }: EventCommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchComments();
  }, [eventId]);

  const fetchComments = async () => {
    try {
      // Fetch comments
      const { data: commentsData, error } = await supabase
        .from("event_comments")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles for comment authors
      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map((c: any) => c.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, profile_photo_url")
          .in("id", userIds);

        const profileMap = new Map(
          (profiles || []).map((p: any) => [p.id, p])
        );

        setComments(
          commentsData.map((c: any) => ({
            ...c,
            profile: profileMap.get(c.user_id) || null,
          }))
        );
      } else {
        setComments([]);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!user) {
      toast.error("Sign in to post a comment");
      return;
    }
    if (!message.trim()) return;

    setPosting(true);
    try {
      const { error } = await supabase.from("event_comments").insert({
        event_id: eventId,
        user_id: user.id,
        message: message.trim(),
      });
      if (error) throw error;

      setMessage("");
      await fetchComments();
      // Scroll to bottom
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("event_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm text-foreground">
          Hype & Comments ({comments.length})
        </h3>
      </div>

      {/* Comments list */}
      <div ref={scrollRef} className="max-h-[320px] overflow-y-auto px-4 py-3 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-20 bg-muted rounded" />
                  <div className="h-4 w-3/4 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm">No comments yet</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Be the first to hype this event! 🔥</p>
          </div>
        ) : (
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3 group"
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={comment.profile?.profile_photo_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {comment.profile?.name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {comment.profile?.name || "Member"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                    {user?.id === comment.user_id && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                        aria-label="Delete comment"
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-foreground/80 mt-0.5">{comment.message}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border flex items-center gap-2">
        {user ? (
          <>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handlePost();
                }
              }}
              placeholder="Get hyped! 🔥"
              maxLength={500}
              className="flex-1 bg-muted/50 rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handlePost}
              disabled={!message.trim() || posting}
              className="rounded-full"
            >
              <Send className={`w-4 h-4 ${message.trim() ? "text-primary" : "text-muted-foreground"}`} />
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center w-full py-1">
            Sign in to join the conversation
          </p>
        )}
      </div>
    </div>
  );
};

export default EventComments;
