import { Play, Eye, Heart, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  channelName: string;
  channelAvatar?: string;
  views: number;
  likes: number;
  duration: string;
  layout?: "grid" | "row" | "featured";
}

const formatViews = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const VideoCard = ({
  id,
  title,
  thumbnail,
  channelName,
  channelAvatar,
  views,
  likes,
  duration,
  layout = "grid",
}: VideoCardProps) => {
  if (layout === "featured") {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="relative rounded-xl overflow-hidden group cursor-pointer"
      >
        <Link to={`/watch/video/${id}`}>
          <div className="aspect-video relative">
            <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <span className="inline-block bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded mb-3">
                Featured
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2 line-clamp-2">{title}</h2>
              <div className="flex items-center gap-4 text-muted-foreground text-sm">
                <span>{channelName}</span>
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{formatViews(views)}</span>
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center">
                <Play className="w-7 h-7 text-primary-foreground ml-1" fill="currentColor" />
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  if (layout === "row") {
    return (
      <Link to={`/watch/video/${id}`}>
        <motion.div
          whileHover={{ backgroundColor: "hsl(var(--video-hover))" }}
          className="flex gap-3 p-2 rounded-lg transition-colors group cursor-pointer"
        >
          <div className="relative w-40 aspect-video rounded-lg overflow-hidden flex-shrink-0">
            <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
            <span className="absolute bottom-1 right-1 bg-background/80 text-foreground text-[10px] font-medium px-1.5 py-0.5 rounded">
              {duration}
            </span>
          </div>
          <div className="flex-1 min-w-0 py-1">
            <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1">{title}</h3>
            <p className="text-xs text-muted-foreground">{channelName}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatViews(views)}</span>
              <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{formatViews(likes)}</span>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  // Grid layout
  return (
    <Link to={`/watch/video/${id}`}>
      <motion.div
        whileHover={{ scale: 1.03 }}
        className="group cursor-pointer"
      >
        <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
          <img src={thumbnail} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors" />
          <span className="absolute bottom-2 right-2 bg-background/80 text-foreground text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />{duration}
          </span>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
              <Play className="w-5 h-5 text-primary-foreground ml-0.5" fill="currentColor" />
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {channelAvatar && (
            <img src={channelAvatar} alt={channelName} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1">{title}</h3>
            <p className="text-xs text-muted-foreground">{channelName}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span>{formatViews(views)} views</span>
              <span>{formatViews(likes)} likes</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default VideoCard;
