import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

const SPORT_EMOJI: Record<string, string> = {
  basketball: "🏀", soccer: "⚽", football: "🏈", tennis: "🎾",
  volleyball: "🏐", hockey: "🏒", baseball: "⚾", wnba: "🏀",
  nwsl: "⚽", nfl: "🏈", nba: "🏀", default: "🏆",
};

interface NewsArticleCardProps {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  category: string;
  sportTags: string[];
  createdAt: string;
  onShare?: () => void;
}

const NewsArticleCard = ({
  title, summary, source, sourceUrl, imageUrl, category, sportTags, createdAt, onShare,
}: NewsArticleCardProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 50) + 5);
  const [saved, setSaved] = useState(false);

  const emoji = SPORT_EMOJI[sportTags[0]?.toLowerCase()] || SPORT_EMOJI[category?.toLowerCase()] || SPORT_EMOJI.default;
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  const toggleLike = () => {
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  return (
    <div className="bg-card rounded-xl border border-border/20 overflow-hidden shadow-sm">
      <div className="flex p-4 gap-3">
        {/* Thumbnail or emoji fallback */}
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-3xl">{emoji}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-body font-semibold">
              {emoji} {category || "Sports"}
            </span>
          </div>
          <h3 className="font-display text-sm font-bold uppercase leading-tight line-clamp-2 text-foreground">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground font-body line-clamp-2 mt-1">{summary}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[11px] text-muted-foreground font-body">{source}</span>
            <span className="text-[11px] text-muted-foreground">·</span>
            <span className="text-[11px] text-muted-foreground font-body">{timeAgo}</span>
          </div>
        </div>
      </div>

      {/* Engagement row */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border/10">
        <button onClick={toggleLike} className="flex items-center gap-1 text-muted-foreground hover:text-accent transition-colors">
          <Heart className={`w-4 h-4 ${liked ? "fill-accent text-accent" : ""}`} />
          <span className="text-xs font-body">{likeCount}</span>
        </button>
        <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs font-body">Comment</span>
        </button>
        <button onClick={onShare} className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
          <Share2 className="w-4 h-4" />
        </button>
        <button onClick={() => setSaved(!saved)} className="text-muted-foreground hover:text-primary transition-colors">
          <Bookmark className={`w-4 h-4 ${saved ? "fill-primary text-primary" : ""}`} />
        </button>
      </div>
    </div>
  );
};

export default NewsArticleCard;
