import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, TrendingUp, Flame, Tv } from "lucide-react";
import VideoCard from "@/components/video/VideoCard";
import { MOCK_VIDEOS, VIDEO_CATEGORIES } from "@/lib/mockVideoData";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const VideoForYou = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered =
    activeCategory === "All"
      ? MOCK_VIDEOS
      : MOCK_VIDEOS.filter((v) => v.category === activeCategory);

  const featured = MOCK_VIDEOS[0];
  const trending = MOCK_VIDEOS.slice(1, 5);
  const recent = MOCK_VIDEOS.slice(3);

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-4 py-3 md:px-8 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-foreground" fill="currentColor" />
            <h1 className="text-lg font-bold tracking-tight">For You</h1>
          </div>
          <Link
            to="/watch/feed"
            className="flex items-center gap-1.5 bg-accent text-accent-foreground px-4 py-2 rounded-full text-xs font-bold hover:bg-accent/90 transition-colors"
          >
            <Tv className="w-3.5 h-3.5" />
            Feed
          </Link>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {VIDEO_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat
                  ? "bg-foreground text-background"
                  : "bg-card text-muted-foreground hover:bg-secondary border border-border/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="px-4 md:px-8 py-4 space-y-8"
      >
        {/* Featured */}
        {activeCategory === "All" && (
          <motion.section variants={item}>
            <VideoCard {...featured} layout="featured" />
          </motion.section>
        )}

        {/* Trending */}
        {activeCategory === "All" && (
          <motion.section variants={item}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 text-accent-foreground" />
              </div>
              <h2 className="text-base font-bold">Trending Now</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
              {trending.map((v) => (
                <div key={v.id} className="min-w-[260px] max-w-[280px]">
                  <VideoCard {...v} layout="grid" />
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Grid */}
        <motion.section variants={item}>
          {activeCategory === "All" && (
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-foreground" />
              </div>
              <h2 className="text-base font-bold">Recently Added</h2>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {(activeCategory === "All" ? recent : filtered).map((v) => (
              <motion.div key={v.id} variants={item}>
                <VideoCard {...v} layout="grid" />
              </motion.div>
            ))}
          </div>
          {filtered.length === 0 && activeCategory !== "All" && (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-sm">No videos in this category yet.</p>
            </div>
          )}
        </motion.section>
      </motion.div>
    </div>
  );
};

export default VideoForYou;
