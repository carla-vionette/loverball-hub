/**
 * Home Page — Content Feed
 * 
 * Pulls posts from the database with:
 * - Category filtering
 * - Like/Save functionality persisted to DB
 * - Real-time post data
 */

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Heart, Bookmark, Eye, MessageCircle, Share2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";

const CATEGORIES = ["For You", "Basketball", "Soccer", "Tennis", "WNBA", "Culture", "Highlights", "Training"];

interface Post {
  id: string;
  title: string | null;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  category: string | null;
  views: number | null;
  created_at: string;
  author_id: string;
}

const formatCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const formatTimeAgo = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
};

const Home = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("For You");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserInteractions();
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);

      // Fetch like counts
      if (data && data.length > 0) {
        const { data: likes } = await supabase
          .from("post_likes")
          .select("post_id");

        if (likes) {
          const counts: Record<string, number> = {};
          likes.forEach(l => { counts[l.post_id] = (counts[l.post_id] || 0) + 1; });
          setLikeCounts(counts);
        }
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInteractions = async () => {
    if (!user) return;
    try {
      const [likesRes, savesRes] = await Promise.all([
        supabase.from("post_likes").select("post_id").eq("user_id", user.id),
        supabase.from("post_saves").select("post_id").eq("user_id", user.id),
      ]);

      if (likesRes.data) setLikedPosts(new Set(likesRes.data.map(l => l.post_id)));
      if (savesRes.data) setSavedPosts(new Set(savesRes.data.map(s => s.post_id)));
    } catch (err) {
      console.error("Error fetching interactions:", err);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) { toast({ title: "Sign in to like posts", variant: "destructive" }); return; }

    const isLiked = likedPosts.has(postId);
    // Optimistic update
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (isLiked) next.delete(postId); else next.add(postId);
      return next;
    });
    setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + (isLiked ? -1 : 1) }));

    try {
      if (isLiked) {
        await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      } else {
        await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
      }
    } catch (err) {
      // Revert on error
      setLikedPosts(prev => {
        const next = new Set(prev);
        if (isLiked) next.add(postId); else next.delete(postId);
        return next;
      });
      setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + (isLiked ? 1 : -1) }));
    }
  };

  const toggleSave = async (postId: string) => {
    if (!user) { toast({ title: "Sign in to save posts", variant: "destructive" }); return; }

    const isSaved = savedPosts.has(postId);
    setSavedPosts(prev => {
      const next = new Set(prev);
      if (isSaved) next.delete(postId); else next.add(postId);
      return next;
    });

    try {
      if (isSaved) {
        await supabase.from("post_saves").delete().eq("post_id", postId).eq("user_id", user.id);
      } else {
        await supabase.from("post_saves").insert({ post_id: postId, user_id: user.id });
      }
      toast({ title: isSaved ? "Removed from saved" : "Saved!" });
    } catch {
      setSavedPosts(prev => {
        const next = new Set(prev);
        if (isSaved) next.add(postId); else next.delete(postId);
        return next;
      });
    }
  };

  const filteredPosts = activeCategory === "For You"
    ? posts
    : posts.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        {/* HEADER */}
        <div className="px-5 md:px-8 pt-6 pb-2">
          <h1 className="font-condensed text-3xl md:text-4xl font-bold uppercase tracking-tight">Feed</h1>
          <p className="text-muted-foreground text-sm font-sans mt-1">The latest in women's sports</p>
        </div>

        {/* CATEGORY PILLS */}
        <div className="px-5 md:px-8 py-3 border-b border-border/30">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all font-condensed ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* POSTS FEED */}
        <div className="max-w-2xl mx-auto px-5 md:px-8 py-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground font-sans">No posts in this category yet.</p>
            </div>
          ) : (
            filteredPosts.map((post, idx) => {
              const isLiked = likedPosts.has(post.id);
              const isSaved = savedPosts.has(post.id);
              const likeCount = likeCounts[post.id] || 0;

              return (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  className="glass-card rounded-2xl overflow-hidden"
                >
                  {/* Post Image */}
                  {post.media_url && (
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img
                        src={post.media_url}
                        alt={post.title || "Post image"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {post.category && (
                        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold tracking-wider rounded-sm">
                          {post.category}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Post Content */}
                  <div className="p-5">
                    {post.title && (
                      <h2 className="font-condensed text-xl md:text-2xl font-bold uppercase leading-tight mb-2">
                        {post.title}
                      </h2>
                    )}
                    {post.content && (
                      <p className="text-sm text-foreground/70 leading-relaxed font-sans line-clamp-3 mb-4">
                        {post.content}
                      </p>
                    )}

                    {/* Meta + Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-muted-foreground text-xs font-sans">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> {formatCount(post.views || 0)}
                        </span>
                        <span>{formatTimeAgo(post.created_at)}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-full"
                          onClick={() => toggleLike(post.id)}
                        >
                          <Heart
                            className={`w-4.5 h-4.5 transition-colors ${
                              isLiked ? "fill-primary text-primary" : "text-muted-foreground"
                            }`}
                          />
                        </Button>
                        <span className="text-xs text-muted-foreground font-sans min-w-[20px]">
                          {likeCount > 0 ? formatCount(likeCount) : ""}
                        </span>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-full"
                          onClick={() => toggleSave(post.id)}
                        >
                          <Bookmark
                            className={`w-4.5 h-4.5 transition-colors ${
                              isSaved ? "fill-accent text-accent" : "text-muted-foreground"
                            }`}
                          />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-full"
                          onClick={() => {
                            navigator.share?.({ title: post.title || "Loverball", text: post.content || "", url: window.location.href })
                              .catch(() => {});
                          }}
                        >
                          <Share2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
