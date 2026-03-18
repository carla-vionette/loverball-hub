import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bookmark } from "lucide-react";

interface SavedPost {
  id: string;
  post: {
    id: string;
    title: string | null;
    content: string | null;
    media_url: string | null;
    media_type: string | null;
  };
}

interface ProfileSavedTabProps {
  userId: string;
}

const ProfileSavedTab = ({ userId }: ProfileSavedTabProps) => {
  const [saved, setSaved] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("post_saves")
        .select("id, post:posts (id, title, content, media_url, media_type)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setSaved((data || []).filter(s => s.post !== null) as SavedPost[]);
      setLoading(false);
    };
    fetch();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-4 grid grid-cols-3 gap-1">
        {[1, 2, 3].map(i => <div key={i} className="aspect-square bg-muted animate-pulse rounded-sm" />)}
      </div>
    );
  }

  if (saved.length === 0) {
    return (
      <div className="py-16 text-center">
        <Bookmark className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">No saved posts</p>
        <p className="text-muted-foreground text-xs mt-1">Bookmark posts to find them here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {saved.map((item) => (
        <div key={item.id} className="aspect-square bg-muted overflow-hidden cursor-pointer">
          {item.post.media_url ? (
            item.post.media_type === "video" ? (
              <video src={item.post.media_url} className="w-full h-full object-cover" muted />
            ) : (
              <img src={item.post.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10 p-2">
              <p className="text-xs text-foreground/60 line-clamp-3 text-center">
                {item.post.content || item.post.title}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProfileSavedTab;
