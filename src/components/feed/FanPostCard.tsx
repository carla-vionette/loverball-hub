import { useState } from "react";
import { Heart, MessageCircle, Repeat2, Share2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface FanPostCardProps {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
}

const FanPostCard = ({
  authorName, authorAvatar, content, mediaUrl, mediaType, createdAt, likesCount, commentsCount,
}: FanPostCardProps) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(likesCount);
  const [expanded, setExpanded] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  const truncated = content.length > 280 && !expanded;

  return (
    <div className="bg-card rounded-xl border border-border/20 p-4 shadow-sm">
      {/* Author header */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={authorAvatar} />
          <AvatarFallback className="bg-primary/10 text-primary font-display text-sm">
            {authorName?.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-body font-semibold text-sm text-foreground truncate">{authorName}</p>
          <p className="text-[11px] text-muted-foreground font-body">{timeAgo}</p>
        </div>
      </div>

      {/* Content */}
      <p className="font-body text-sm text-foreground leading-relaxed whitespace-pre-wrap">
        {truncated ? content.slice(0, 280) : content}
        {truncated && (
          <button onClick={() => setExpanded(true)} className="text-primary font-semibold ml-1">
            ...more
          </button>
        )}
      </p>

      {/* Media */}
      {mediaUrl && mediaType === "image" && (
        <img src={mediaUrl} alt="" className="w-full rounded-lg mt-3 max-h-72 object-cover" />
      )}

      {/* Engagement */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/10">
        <button
          onClick={() => { setLiked(!liked); setLikes((c) => liked ? c - 1 : c + 1); }}
          className="flex items-center gap-1 text-muted-foreground hover:text-accent transition-colors"
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-accent text-accent" : ""}`} />
          <span className="text-xs font-body">{likes}</span>
        </button>
        <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs font-body">{commentsCount}</span>
        </button>
        <button className="text-muted-foreground hover:text-primary transition-colors">
          <Repeat2 className="w-4 h-4" />
        </button>
        <button className="text-muted-foreground hover:text-primary transition-colors">
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FanPostCard;
