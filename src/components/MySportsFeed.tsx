import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, ExternalLink, Newspaper, RefreshCw, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchPersonalizedNews,
  logNewsRead,
  getMatchReasons,
  getSportEmoji,
  getCategoryColor,
  getTimeAgo,
  type NewsArticle,
  type FeedFilter,
  type MatchReason,
} from "@/services/newsArticleService";

interface MySportsFeedProps {
  userSports: string[];
  userTeams: string[];
  userCity: string | null;
}

const FILTER_PILLS: { key: FeedFilter; label: string; emoji: string }[] = [
  { key: "all", label: "All", emoji: "✨" },
  { key: "teams", label: "My Teams", emoji: "🏟️" },
  { key: "sports", label: "My Sports", emoji: "🏅" },
  { key: "local", label: "Local", emoji: "📍" },
  { key: "trending", label: "Trending", emoji: "🔥" },
];

const MATCH_CHIP_COLORS: Record<MatchReason["type"], string> = {
  team: "bg-[#FF5D2E]/15 text-[#FF5D2E] border-[#FF5D2E]/30",
  sport: "bg-primary/15 text-primary border-primary/30",
  city: "bg-[#FFD700]/15 text-[#92400E] border-[#FFD700]/30",
  trending: "bg-destructive/15 text-destructive border-destructive/30",
};

const MySportsFeed: React.FC<MySportsFeedProps> = ({ userSports, userTeams, userCity }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FeedFilter>("all");

  const loadArticles = useCallback(async () => {
    setLoading(true);
    const data = await fetchPersonalizedNews(userSports, userTeams, userCity, filter);
    setArticles(data);
    setLoading(false);
  }, [userSports, userTeams, userCity, filter]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleArticleClick = (article: NewsArticle) => {
    logNewsRead(article.id);
    if (article.source_url) {
      window.open(article.source_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-[#FF5D2E]" />
            <span className="text-sm font-medium tracking-wider uppercase text-foreground/50">
              My Sports Feed
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={loading}
            onClick={loadArticles}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_PILLS.map((pill) => (
            <button
              key={pill.key}
              onClick={() => setFilter(pill.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap transition-all border ${
                filter === pill.key
                  ? "bg-[#FF5D2E] text-white border-[#FF5D2E]"
                  : "bg-secondary/60 text-foreground/60 border-border/30 hover:bg-secondary"
              }`}
            >
              <span>{pill.emoji}</span>
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="px-5 py-12 flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-[#FF5D2E] animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your feed…</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <Newspaper className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {filter === "all"
              ? "No articles yet. Check back soon!"
              : `No ${FILTER_PILLS.find(p => p.key === filter)?.label.toLowerCase()} stories right now.`}
          </p>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto scrollbar-hide divide-y divide-border/15">
          {articles.map((article, i) => {
            const reasons = getMatchReasons(article, userSports, userTeams, userCity);
            const primarySport = article.sport_tags?.[0] || "";
            const sportEmoji = getSportEmoji(primarySport);
            const catColor = getCategoryColor(article.category);

            return (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => handleArticleClick(article)}
                className="group cursor-pointer hover:bg-foreground/[0.04] transition-colors"
              >
                <div className="p-4 flex gap-3">
                  {/* Image */}
                  {article.image_url ? (
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 relative">
                      <img
                        src={article.image_url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Sport emoji badge */}
                      <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-background/90 flex items-center justify-center text-xs shadow-sm">
                        {sportEmoji}
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${catColor}15` }}>
                      {sportEmoji}
                    </div>
                  )}

                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    {/* Headline */}
                    <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-[#FF5D2E] transition-colors flex items-start gap-1">
                      {article.title}
                      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                    </h3>

                    {/* Summary with fade truncate */}
                    {article.summary && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-3 relative">
                        {article.summary}
                      </p>
                    )}

                    {/* Source + time */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: catColor }}>
                        {article.source_name || "News"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        • {getTimeAgo(article.published_at || article.created_at)}
                      </span>
                    </div>

                    {/* Match chips */}
                    {reasons.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {reasons.map((reason, ri) => (
                          <span
                            key={ri}
                            className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-2 py-0.5 rounded-full border ${MATCH_CHIP_COLORS[reason.type]}`}
                          >
                            {reason.emoji} {reason.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MySportsFeed;
