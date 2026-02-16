import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ThumbsUp, ThumbsDown, Share2, Bookmark, Eye, Calendar,
  ChevronDown, ChevronUp, Hash, CheckCircle,
} from "lucide-react";
import VideoPlayer, { VideoPlayerHandle } from "@/components/video/VideoPlayer";
import VideoCard from "@/components/video/VideoCard";
import { MOCK_VIDEOS } from "@/lib/mockVideoData";
import { FEED_VIDEOS, type FeedVideoItem } from "@/lib/feedVideoData";

const formatCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const formatDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const VideoWatch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef<VideoPlayerHandle>(null);

  // Find video in feed data or mock data
  const feedVideo = FEED_VIDEOS.find((v) => v.id === id);
  const mockVideo = MOCK_VIDEOS.find((v) => v.id === id);

  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [following, setFollowing] = useState(feedVideo?.isFollowing ?? false);
  const [likeCount, setLikeCount] = useState(feedVideo?.likes ?? mockVideo?.likes ?? 0);
  const [descExpanded, setDescExpanded] = useState(false);

  // Build unified data
  const video = feedVideo
    ? {
        id: feedVideo.id,
        title: feedVideo.title,
        description: feedVideo.description,
        videoUrl: feedVideo.videoUrl,
        thumbnail: feedVideo.thumbnail,
        channelName: feedVideo.channelName,
        channelAvatar: feedVideo.channelAvatar,
        views: feedVideo.views,
        likes: feedVideo.likes,
        uploadDate: feedVideo.uploadDate,
        tags: feedVideo.tags,
        duration: feedVideo.duration,
      }
    : mockVideo
    ? {
        id: mockVideo.id,
        title: mockVideo.title,
        description: `Watch ${mockVideo.title} from ${mockVideo.channelName}. The best sports content on Loverball.`,
        videoUrl: mockVideo.videoUrl,
        thumbnail: mockVideo.thumbnail,
        channelName: mockVideo.channelName,
        channelAvatar: mockVideo.channelAvatar,
        views: mockVideo.views,
        likes: mockVideo.likes,
        uploadDate: "2026-02-01",
        tags: [mockVideo.category.toLowerCase()],
        duration: 0,
      }
    : null;

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <p>Video not found</p>
      </div>
    );
  }

  const relatedVideos = MOCK_VIDEOS.filter((v) => v.id !== id).slice(0, 8);
  const channelVideos = MOCK_VIDEOS.filter((v) => v.channelName === video.channelName && v.id !== id).slice(0, 4);

  const handleLike = () => {
    if (liked) { setLiked(false); setLikeCount((c) => c - 1); }
    else { setLiked(true); setDisliked(false); setLikeCount((c) => c + 1); }
  };
  const handleDislike = () => {
    if (disliked) { setDisliked(false); }
    else { setDisliked(true); if (liked) { setLiked(false); setLikeCount((c) => c - 1); } }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: video.title, url: window.location.href }); } catch {}
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      {/* Player */}
      <div className="w-full aspect-[9/16] max-h-[70vh] bg-background sticky top-0 z-30 md:static md:max-w-md md:mx-auto md:mt-4 md:rounded-xl md:overflow-hidden">
        <VideoPlayer
          ref={playerRef}
          src={video.videoUrl}
          poster={video.thumbnail}
          title={video.title}
          autoPlay
          onBack={() => navigate(-1)}
          mode="standalone"
          className="w-full h-full"
        />
      </div>

      <div className="px-4 md:px-8 max-w-5xl mx-auto">
        {/* Video Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-4 space-y-3">
          <h1 className="text-lg md:text-xl font-bold text-foreground leading-tight">{video.title}</h1>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {formatCount(video.views)} views</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(video.uploadDate)}</span>
          </div>

          {/* Channel row */}
          <div className="flex items-center gap-3 py-3 border-y border-border/20">
            <img src={video.channelAvatar} alt={video.channelName} className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-foreground">{video.channelName}</span>
                <CheckCircle className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-[10px] text-muted-foreground">12.4K followers</span>
            </div>
            <button
              onClick={() => setFollowing(!following)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-colors ${
                following
                  ? "bg-secondary text-muted-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 py-1">
            <button onClick={handleLike} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-colors ${liked ? "bg-primary/15 text-primary" : "bg-secondary text-foreground"}`}>
              <ThumbsUp className="w-4 h-4" fill={liked ? "currentColor" : "none"} /> {formatCount(likeCount)}
            </button>
            <button onClick={handleDislike} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-colors ${disliked ? "bg-destructive/15 text-destructive" : "bg-secondary text-foreground"}`}>
              <ThumbsDown className="w-4 h-4" fill={disliked ? "currentColor" : "none"} />
            </button>
            <button onClick={handleShare} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button onClick={() => setBookmarked(!bookmarked)} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-colors ${bookmarked ? "bg-primary/15 text-primary" : "bg-secondary text-foreground"}`}>
              <Bookmark className="w-4 h-4" fill={bookmarked ? "currentColor" : "none"} /> Save
            </button>
          </div>

          {/* Description */}
          <div
            className="bg-secondary/50 rounded-xl p-4 cursor-pointer"
            onClick={() => setDescExpanded(!descExpanded)}
          >
            <p className={`text-xs text-foreground leading-relaxed ${descExpanded ? "" : "line-clamp-2"}`}>
              {video.description}
            </p>
            {video.tags.length > 0 && descExpanded && (
              <div className="flex flex-wrap gap-2 mt-3">
                {video.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-0.5 text-[11px] text-primary font-medium">
                    <Hash className="w-3 h-3" />{tag}
                  </span>
                ))}
              </div>
            )}
            <button className="flex items-center gap-1 text-[11px] text-muted-foreground font-bold mt-2">
              {descExpanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
            </button>
          </div>
        </motion.div>

        {/* More from channel */}
        {channelVideos.length > 0 && (
          <section className="py-4">
            <h3 className="text-sm font-bold text-foreground mb-3">More from {video.channelName}</h3>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
              {channelVideos.map((v) => (
                <div key={v.id} className="min-w-[240px] max-w-[260px]">
                  <VideoCard {...v} layout="grid" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Videos */}
        <section className="py-4 border-t border-border/20">
          <h3 className="text-sm font-bold text-foreground mb-4">Related Videos</h3>
          <div className="space-y-1">
            {relatedVideos.map((v) => (
              <VideoCard key={v.id} {...v} layout="row" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default VideoWatch;
