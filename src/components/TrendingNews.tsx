import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Zap } from "lucide-react";
import {
  fetchTrendingNews,
  getSportEmoji,
  getSportColor,
  getCategoryColor,
  getTimeAgo,
  type NewsArticle,
} from "@/services/newsArticleService";

interface TrendingNewsProps {
  onAuthRequired: () => void;
  fallbackStories?: { tag: string; title: string; time: string; image: string }[];
}

const TrendingNews: React.FC<TrendingNewsProps> = ({ onAuthRequired, fallbackStories }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingNews(8).then((data) => {
      setArticles(data);
      setLoading(false);
    });
  }, []);

  // If no articles from DB, show fallback
  const showFallback = !loading && articles.length === 0 && fallbackStories;

  if (showFallback && fallbackStories) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {fallbackStories.map((story, i) => (
          <motion.div
            key={story.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            viewport={{ once: true }}
            onClick={onAuthRequired}
            className="cursor-pointer group"
          >
            <div className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full border border-border/20">
              <div className="h-36 overflow-hidden">
                <img
                  src={story.image}
                  alt={story.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-accent-foreground bg-accent px-2.5 py-1 rounded-full">
                      {story.tag}
                    </span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {story.time}
                    </span>
                  </div>
                  <h3 className="font-sans font-bold text-foreground text-base leading-snug group-hover:text-accent transition-colors">
                    {story.title}
                  </h3>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border/20 animate-pulse">
            <div className="h-36 bg-muted" />
            <div className="p-5 space-y-3">
              <div className="h-4 w-20 bg-muted rounded-full" />
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-3/4 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
      {articles.map((article, i) => {
        const primarySport = article.sport_tags?.[0] || "";
        const sportEmoji = getSportEmoji(primarySport);
        const sportColor = getSportColor(primarySport);
        const catColor = getCategoryColor(article.category);

        return (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            viewport={{ once: true }}
            onClick={() => {
              if (article.source_url) {
                window.open(article.source_url, "_blank", "noopener,noreferrer");
              }
            }}
            className="cursor-pointer group snap-start min-w-[280px] lg:min-w-0"
          >
            <div className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full border border-border/20">
              {/* Image with sport badge */}
              <div className="h-40 overflow-hidden relative">
                {article.image_url ? (
                  <img
                    src={article.image_url}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-4xl"
                    style={{ backgroundColor: `${catColor}20` }}
                  >
                    {sportEmoji}
                  </div>
                )}
                {/* Sport emoji overlay */}
                <div className="absolute top-2.5 left-2.5 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md"
                  style={{ backgroundColor: sportColor + "E6" }}>
                  {sportEmoji}
                </div>
                {/* Category accent strip */}
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: catColor }} />
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${catColor}20`, color: catColor }}
                  >
                    {primarySport || article.category || "Sports"}
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {getTimeAgo(article.published_at || article.created_at)}
                  </span>
                </div>
                <h3 className="font-sans font-bold text-foreground text-base leading-snug group-hover:text-[#FF5D2E] transition-colors line-clamp-2">
                  {article.title}
                </h3>
                {article.source_name && (
                  <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider font-semibold">
                    {article.source_name}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default TrendingNews;
