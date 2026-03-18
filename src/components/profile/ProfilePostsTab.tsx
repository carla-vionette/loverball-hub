import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Grid3X3, List, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Post {
  id: string;
  title: string | null;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  views: number | null;
}

interface ProfilePostsTabProps {
  userId: string;
  onPostsLoaded?: (count: number) => void;
}

const ProfilePostsTab = ({ userId, onPostsLoaded }: ProfilePostsTabProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("posts")
        .select("id, title, content, media_url, media_type, created_at, views")
        .eq("author_id", userId)
        .order("created_at", { ascending: false });
      const result = data || [];
      setPosts(result);
      onPostsLoaded?.(result.length);
      setLoading(false);
    };
    fetch();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-4 grid grid-cols-3 gap-1">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="aspect-square bg-muted animate-pulse rounded-sm" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground text-sm">No posts yet</p>
        <p className="text-muted-foreground text-xs mt-1">Share your first sports moment!</p>
      </div>
    );
  }

  return (
    <div>
      {/* View toggle */}
      <div className="flex justify-end px-4 py-2 gap-1">
        <Button
          variant={viewMode === "grid" ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setViewMode("grid")}
        >
          <Grid3X3 className="w-4 h-4" />
        </Button>
        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setViewMode("list")}
        >
          <List className="w-4 h-4" />
        </Button>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-3 gap-0.5">
          {posts.map((post) => (
            <div key={post.id} className="aspect-square relative bg-muted overflow-hidden group cursor-pointer">
              {post.media_url ? (
                post.media_type === "video" ? (
                  <video src={post.media_url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={post.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 p-2">
                  <p className="text-xs text-foreground/60 line-clamp-3 text-center">{post.content || post.title}</p>
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <span className="flex items-center gap-1 text-white text-sm font-semibold">
                  <Heart className="w-4 h-4" /> {post.views || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {posts.map((post) => (
            <div key={post.id} className="p-4 flex gap-3">
              {post.media_url && (
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  {post.media_type === "video" ? (
                    <video src={post.media_url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={post.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                {post.title && <p className="text-sm font-medium text-foreground line-clamp-1">{post.title}</p>}
                {post.content && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{post.content}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfilePostsTab;
