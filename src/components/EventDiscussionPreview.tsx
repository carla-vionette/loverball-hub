import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Reply, Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Reaction = "🔥" | "👏" | "💜" | "😂";

interface MockReply {
  id: string;
  author: string;
  initials: string;
  timestamp: string;
  text: string;
  likes: number;
}

interface MockPost {
  id: string;
  author: string;
  initials: string;
  badge?: string;
  timestamp: string;
  text: string;
  likes: number;
  reactions: Record<Reaction, number>;
  replies: MockReply[];
}

const MOCK_POSTS: MockPost[] = [
  {
    id: "p1",
    author: "Maya R.",
    initials: "MR",
    badge: "Host",
    timestamp: "2h ago",
    text: "Pulling up early to grab the corner booth — anyone wanna meet at the bar around 6:30 before tip-off?",
    likes: 12,
    reactions: { "🔥": 4, "👏": 2, "💜": 5, "😂": 0 },
    replies: [
      {
        id: "r1",
        author: "Jess T.",
        initials: "JT",
        timestamp: "1h ago",
        text: "Yes! I'll be there at 6:25. Wearing the vintage Sparks jersey 💜",
        likes: 3,
      },
      {
        id: "r2",
        author: "Priya S.",
        initials: "PS",
        timestamp: "45m ago",
        text: "Down. Saving a stool.",
        likes: 1,
      },
    ],
  },
  {
    id: "p2",
    author: "Alex C.",
    initials: "AC",
    timestamp: "4h ago",
    text: "First time coming solo — anyone else flying solo and want to sit together? 👋",
    likes: 18,
    reactions: { "🔥": 1, "👏": 6, "💜": 8, "😂": 0 },
    replies: [
      {
        id: "r3",
        author: "Sam K.",
        initials: "SK",
        timestamp: "3h ago",
        text: "Same boat — let's link! DMing you now.",
        likes: 4,
      },
    ],
  },
  {
    id: "p3",
    author: "Jordan M.",
    initials: "JM",
    timestamp: "6h ago",
    text: "Parking tip: the lot on Figueroa fills up fast. Metro Expo Line drops you a block away 🚇",
    likes: 24,
    reactions: { "🔥": 9, "👏": 7, "💜": 2, "😂": 0 },
    replies: [],
  },
  {
    id: "p4",
    author: "Tasha W.",
    initials: "TW",
    timestamp: "1d ago",
    text: "What's the dress code vibe — casual or do people get fits off for this one?",
    likes: 7,
    reactions: { "🔥": 0, "👏": 1, "💜": 3, "😂": 4 },
    replies: [
      {
        id: "r4",
        author: "Maya R.",
        initials: "MR",
        timestamp: "20h ago",
        text: "Fits off, always. This is LA 😎",
        likes: 6,
      },
    ],
  },
];

const REACTION_OPTIONS: Reaction[] = ["🔥", "👏", "💜", "😂"];

const EventDiscussionPreview = () => {
  const [posts, setPosts] = useState<MockPost[]>(MOCK_POSTS);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set(["p1"]));
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});

  const toggleLike = (id: string, isReply = false, parentId?: string) => {
    const key = isReply ? `${parentId}:${id}` : id;
    const wasLiked = liked.has(key);
    const next = new Set(liked);
    wasLiked ? next.delete(key) : next.add(key);
    setLiked(next);

    setPosts((prev) =>
      prev.map((p) => {
        if (isReply && p.id === parentId) {
          return {
            ...p,
            replies: p.replies.map((r) =>
              r.id === id ? { ...r, likes: r.likes + (wasLiked ? -1 : 1) } : r
            ),
          };
        }
        if (!isReply && p.id === id) {
          return { ...p, likes: p.likes + (wasLiked ? -1 : 1) };
        }
        return p;
      })
    );
  };

  const toggleReplies = (postId: string) => {
    const next = new Set(expandedReplies);
    next.has(postId) ? next.delete(postId) : next.add(postId);
    setExpandedReplies(next);
  };

  const addReaction = (postId: string, emoji: Reaction) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, reactions: { ...p.reactions, [emoji]: p.reactions[emoji] + 1 } }
          : p
      )
    );
  };

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card">
      {/* Header with preview label */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Discussion</h3>
          <span className="text-xs text-muted-foreground">· {posts.length} threads</span>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider gap-1 border-primary/40 text-primary">
          <Sparkles className="w-3 h-3" />
          Preview
        </Badge>
      </div>

      {/* Posts */}
      <div className="divide-y divide-border/60">
        {posts.map((post) => {
          const isLiked = liked.has(post.id);
          const isExpanded = expandedReplies.has(post.id);
          const activeReactions = REACTION_OPTIONS.filter((r) => post.reactions[r] > 0);

          return (
            <div key={post.id} className="px-4 py-4">
              {/* Top-level post */}
              <div className="flex gap-3">
                <Avatar className="w-9 h-9 flex-shrink-0">
                  <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                    {post.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{post.author}</span>
                    {post.badge && (
                      <Badge className="text-[9px] px-1.5 py-0 h-4 bg-primary/15 text-primary hover:bg-primary/15 border-0">
                        {post.badge}
                      </Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground">{post.timestamp}</span>
                  </div>
                  <p className="text-sm text-foreground/85 mt-1 leading-relaxed">{post.text}</p>

                  {/* Reactions row */}
                  {activeReactions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {activeReactions.map((r) => (
                        <button
                          key={r}
                          onClick={() => addReaction(post.id, r)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/60 hover:bg-muted text-xs transition-colors"
                        >
                          <span>{r}</span>
                          <span className="text-muted-foreground font-medium">{post.reactions[r]}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Action bar */}
                  <div className="flex items-center gap-1 mt-2 -ml-2">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                        isLiked ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
                      <span>{post.likes}</span>
                    </button>
                    <button
                      onClick={() => toggleReplies(post.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>{post.replies.length}</span>
                    </button>
                    {/* Reaction picker */}
                    <div className="flex items-center gap-0.5 ml-1">
                      {REACTION_OPTIONS.map((r) => (
                        <button
                          key={r}
                          onClick={() => addReaction(post.id, r)}
                          className="text-xs opacity-40 hover:opacity-100 hover:scale-125 transition-all px-1"
                          aria-label={`React with ${r}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Replies thread */}
                  <AnimatePresence>
                    {isExpanded && post.replies.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pl-4 border-l-2 border-border/60 space-y-3 overflow-hidden"
                      >
                        {post.replies.map((reply) => {
                          const replyLiked = liked.has(`${post.id}:${reply.id}`);
                          return (
                            <div key={reply.id} className="flex gap-2.5">
                              <Avatar className="w-7 h-7 flex-shrink-0">
                                <AvatarFallback className="bg-muted text-foreground text-[10px] font-semibold">
                                  {reply.initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-foreground">
                                    {reply.author}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {reply.timestamp}
                                  </span>
                                </div>
                                <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">
                                  {reply.text}
                                </p>
                                <button
                                  onClick={() => toggleLike(reply.id, true, post.id)}
                                  className={`flex items-center gap-1 mt-1 text-[11px] transition-colors ${
                                    replyLiked
                                      ? "text-primary"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <Heart className={`w-3 h-3 ${replyLiked ? "fill-current" : ""}`} />
                                  <span>{reply.likes}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Reply input */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={replyDraft[post.id] || ""}
                            onChange={(e) =>
                              setReplyDraft({ ...replyDraft, [post.id]: e.target.value })
                            }
                            placeholder="Write a reply…"
                            className="flex-1 bg-muted/40 rounded-full px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="rounded-full h-7 w-7"
                            disabled={!replyDraft[post.id]?.trim()}
                          >
                            <Send className="w-3.5 h-3.5 text-primary" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New post composer */}
      <div className="px-4 py-3 border-t border-border bg-background/40">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
              YOU
            </AvatarFallback>
          </Avatar>
          <input
            type="text"
            placeholder="Start a new thread…"
            className="flex-1 bg-muted/50 rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button size="icon" variant="ghost" className="rounded-full">
            <Send className="w-4 h-4 text-primary" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/70 text-center mt-2">
          Preview only · Real posts will load from the database once live
        </p>
      </div>
    </div>
  );
};

export default EventDiscussionPreview;
