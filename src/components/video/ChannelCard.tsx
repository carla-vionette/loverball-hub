import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Flame, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { DiscoverChannel } from "@/lib/discoverChannelData";
import loverbballLogo from "@/assets/loverball-script-logo.png";

const formatFollowers = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

interface ChannelCardProps {
  channel: DiscoverChannel;
  variant?: "team" | "creator" | "loverball" | "trending";
}

const FollowButton = ({ initial = false }: { initial?: boolean }) => {
  const [following, setFollowing] = useState(initial);
  const [hovering, setHovering] = useState(false);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setFollowing(!following);
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 ${
        following
          ? hovering
            ? "bg-red-500/20 text-red-400 border border-red-500/30"
            : "bg-secondary text-muted-foreground border border-border/30"
          : "bg-primary text-primary-foreground border border-primary"
      }`}
    >
      {following ? (hovering ? "Unfollow" : "✓ Following") : "+ Follow"}
    </button>
  );
};

const ChannelCard = ({ channel, variant = "team" }: ChannelCardProps) => {
  const navigate = useNavigate();
  const logoSrc = channel.category === "loverball" ? loverbballLogo : channel.logo;
  const isLoverball = variant === "loverball";
  const isTrending = variant === "trending";

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      onClick={() => navigate(`/watch/channel/${channel.id}`)}
      className={`group relative flex-shrink-0 cursor-pointer rounded-xl overflow-hidden transition-colors ${
        isLoverball
          ? "w-[200px] md:w-[220px] bg-card border-2 border-primary/30"
          : "w-[180px] md:w-[200px] bg-card border border-border/30 hover:border-primary/30"
      }`}
    >
      {/* Image / Logo area */}
      <div className={`relative ${variant === "creator" ? "pt-6 pb-2 flex justify-center" : "aspect-[4/3]"}`}>
        {variant === "creator" ? (
          <div className="relative">
            <img
              src={logoSrc}
              alt={channel.name}
              className="w-20 h-20 max-w-[80px] max-h-[80px] rounded-full object-cover border-2 border-border/30"
              onError={(e) => { (e.target as HTMLImageElement).src = loverbballLogo; }}
            />
            {channel.verified && (
              <CheckCircle className="absolute -bottom-0.5 -right-0.5 w-5 h-5 text-primary fill-background" />
            )}
          </div>
        ) : (
          <>
            {channel.latestThumb ? (
              <img src={channel.latestThumb} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                {!isLoverball && (
                  <img
                    src={logoSrc}
                    alt={channel.name}
                    className="w-20 h-20 max-w-[80px] max-h-[80px] object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).src = loverbballLogo; }}
                  />
                )}
              </div>
            )}
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
                <Play className="w-4 h-4 text-primary-foreground ml-0.5" fill="currentColor" />
              </div>
            </div>
            {/* Logo badge */}
            <div className="absolute bottom-2 left-2">
              <img
                src={logoSrc}
                alt=""
                className="w-9 h-9 max-w-[36px] max-h-[36px] rounded-full object-contain bg-background/80 p-0.5 border border-border/30"
                onError={(e) => { (e.target as HTMLImageElement).src = loverbballLogo; }}
              />
            </div>
            {/* Trending rank */}
            {isTrending && channel.trendingRank && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-secondary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                <Flame className="w-3 h-3" />
                #{channel.trendingRank}
              </div>
            )}
          </>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-bold text-foreground truncate">{channel.name}</h3>
          {channel.verified && variant !== "creator" && (
            <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
            {channel.sportBadge}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatFollowers(channel.followers)} followers
          </span>
        </div>

        {variant === "creator" && channel.tags && (
          <div className="flex gap-1 flex-wrap">
            {channel.tags.map((tag) => (
              <span key={tag} className="text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}

        <FollowButton />
      </div>

      {/* Loverball premium border glow */}
      {isLoverball && (
        <div className="absolute inset-0 rounded-xl border-2 border-primary/20 pointer-events-none" />
      )}
    </motion.div>
  );
};

export default ChannelCard;
export { FollowButton };
