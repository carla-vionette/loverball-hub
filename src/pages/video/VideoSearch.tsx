import { useState } from "react";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import VideoCard from "@/components/video/VideoCard";
import { MOCK_VIDEOS } from "@/lib/mockVideoData";

const TRENDING_SEARCHES = [
  "basketball highlights",
  "soccer skills",
  "women's sports",
  "workout routines",
  "game day vlogs",
  "LA derby",
];

const VideoSearch = () => {
  const [query, setQuery] = useState("");

  const results = query.length > 0
    ? MOCK_VIDEOS.filter(
        (v) =>
          v.title.toLowerCase().includes(query.toLowerCase()) ||
          v.channelName.toLowerCase().includes(query.toLowerCase()) ||
          v.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md px-4 py-3 md:px-8 md:py-4 border-b border-border/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            autoFocus
            placeholder="Search videos, channels, topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-secondary rounded-lg pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <div className="px-4 md:px-8 py-4">
        {query.length === 0 ? (
          <div>
            <h2 className="text-sm font-bold text-foreground mb-4">Trending Searches</h2>
            <div className="flex flex-wrap gap-2">
              {TRENDING_SEARCHES.map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-4 py-2 bg-secondary text-muted-foreground text-xs rounded-full hover:bg-secondary/80 hover:text-foreground transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        ) : results.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <p className="text-xs text-muted-foreground mb-3">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </p>
            {results.map((v) => (
              <VideoCard key={v.id} {...v} layout="row" />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No results for "{query}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoSearch;
