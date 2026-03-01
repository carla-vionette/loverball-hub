/**
 * Home Page — Video Discovery Feed
 * 
 * The primary logged-in landing page featuring:
 * - Featured/hero video with autoplay
 * - Trending reels grid (tap to play full-screen)
 * - Category filters (For You, Basketball, Soccer, etc.)
 * - Channel highlights row
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Heart, Eye, Volume2, VolumeX, X, ChevronRight, TrendingUp, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { FEED_VIDEOS, type FeedVideoItem } from "@/lib/feedVideoData";

import loverballLogo from "@/assets/loverball-script-logo.png";

const CATEGORIES = ["For You", "Basketball", "Soccer", "Tennis", "WNBA", "Culture", "Highlights", "Training"];

const formatCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const Home = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeCategory, setActiveCategory] = useState("For You");
  const [featuredMuted, setFeaturedMuted] = useState(true);
  const [fullscreenVideo, setFullscreenVideo] = useState<FeedVideoItem | null>(null);
  const [fullscreenMuted, setFullscreenMuted] = useState(false);
  const featuredRef = useRef<HTMLVideoElement>(null);
  const fullscreenRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  if (loading) return null;

  const featured = FEED_VIDEOS[0];
  const trendingVideos = FEED_VIDEOS.slice(1);

  const openFullscreen = (video: FeedVideoItem) => {
    setFullscreenVideo(video);
    setFullscreenMuted(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        {/* ── FEATURED VIDEO HERO ── */}
        <section className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-black overflow-hidden group cursor-pointer" onClick={() => openFullscreen(featured)}>
          <video
            ref={featuredRef}
            src={featured.videoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted={featuredMuted}
            playsInline
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8 z-10">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-primary text-primary-foreground text-[10px] font-bold tracking-wider rounded-sm px-2 py-0.5">
                <Flame className="w-3 h-3 mr-1" /> FEATURED
              </Badge>
              <Badge variant="outline" className="text-white/80 border-white/30 text-[10px] tracking-wider rounded-sm">
                {featured.tags[0]?.toUpperCase()}
              </Badge>
            </div>
            <h2 className="font-condensed text-3xl md:text-5xl font-bold text-white uppercase leading-none mb-2">
              {featured.title}
            </h2>
            <p className="text-white/70 text-sm md:text-base max-w-lg font-sans mb-3">
              {featured.description}
            </p>
            <div className="flex items-center gap-4 text-white/60 text-xs font-sans">
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {formatCount(featured.views)}</span>
              <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {formatCount(featured.likes)}</span>
              <span className="flex items-center gap-1">
                <img src={featured.channelAvatar} alt="" className="w-4 h-4 rounded-full object-contain" />
                {featured.channelName}
              </span>
            </div>
          </div>

          {/* Play icon center */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-7 h-7 text-white fill-white" />
            </div>
          </div>

          {/* Mute toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); setFeaturedMuted(!featuredMuted); }}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            {featuredMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </section>

        {/* ── CATEGORY PILLS ── */}
        <div className="px-5 md:px-8 py-4 border-b border-border/30">
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

        {/* ── TRENDING REELS SECTION ── */}
        <section className="px-5 md:px-8 py-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-condensed text-2xl font-bold uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Trending Now
            </h2>
            <button
              onClick={() => navigate("/watch")}
              className="text-sm text-primary font-semibold hover:underline flex items-center gap-1 font-sans"
            >
              Watch All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {trendingVideos.map((video, idx) => (
              <VideoCard key={video.id} video={video} index={idx} onPlay={openFullscreen} />
            ))}
          </div>
        </section>

        {/* ── CHANNELS ROW ── */}
        <section className="px-5 md:px-8 py-6 max-w-7xl mx-auto border-t border-border/30">
          <h2 className="font-condensed text-xl font-bold uppercase tracking-wide mb-4">Channels</h2>
          <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-2">
            {Array.from(new Set(FEED_VIDEOS.map(v => v.channelName))).map((name) => {
              const ch = FEED_VIDEOS.find(v => v.channelName === name)!;
              return (
                <button key={name} onClick={() => navigate("/watch")} className="flex flex-col items-center gap-2 shrink-0 group">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-hot-pink p-[2px]">
                    <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                      <img src={ch.channelAvatar} alt={name} className="w-10 h-10 object-contain" />
                    </div>
                  </div>
                  <span className="text-[11px] font-sans font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center max-w-[72px] truncate">
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* ── FULLSCREEN VIDEO OVERLAY ── */}
      <AnimatePresence>
        {fullscreenVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          >
            <video
              ref={fullscreenRef}
              src={fullscreenVideo.videoUrl}
              className="w-full h-full object-contain"
              autoPlay
              loop
              muted={fullscreenMuted}
              playsInline
              controls
            />
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex items-center gap-3">
                <img src={fullscreenVideo.channelAvatar} alt="" className="w-8 h-8 rounded-full object-contain" />
                <div>
                  <p className="text-white text-sm font-bold font-sans">{fullscreenVideo.channelName}</p>
                  <p className="text-white/50 text-xs font-sans">{fullscreenVideo.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFullscreenMuted(!fullscreenMuted)}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white"
                >
                  {fullscreenMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setFullscreenVideo(null)}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/70 to-transparent z-10">
              <p className="text-white/80 text-sm font-sans mb-2">{fullscreenVideo.description}</p>
              <div className="flex items-center gap-4 text-white/50 text-xs font-sans">
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {formatCount(fullscreenVideo.views)}</span>
                <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {formatCount(fullscreenVideo.likes)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Video Thumbnail Card ── */
const VideoCard = ({ video, index, onPlay }: { video: FeedVideoItem; index: number; onPlay: (v: FeedVideoItem) => void }) => {
  const [hovering, setHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (hovering && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [hovering]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="relative group cursor-pointer rounded-xl overflow-hidden bg-muted/30 aspect-[9/16]"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={() => onPlay(video)}
    >
      <video
        ref={videoRef}
        src={video.videoUrl}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        loop
        playsInline
        preload="metadata"
      />
      
      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      {/* Play icon on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-12 h-12 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center">
          <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
        <h3 className="text-white text-xs font-bold font-sans line-clamp-2 mb-1">{video.title}</h3>
        <div className="flex items-center gap-2 text-white/60 text-[10px] font-sans">
          <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {formatCount(video.views)}</span>
          <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" /> {formatCount(video.likes)}</span>
        </div>
      </div>

      {/* Channel avatar */}
      <div className="absolute top-2 left-2 z-10">
        <img src={video.channelAvatar} alt="" className="w-6 h-6 rounded-full object-contain bg-black/30 backdrop-blur-sm" />
      </div>
    </motion.div>
  );
};

export default Home;
