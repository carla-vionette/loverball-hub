import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, ExternalLink, RefreshCw, Loader2, Newspaper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  fetchTrendingNews,
  getSportEmoji,
  getSportColor,
  getCategoryColor,
  getCategoryEmoji,
  generateSummary,
  getTimeAgo,
  type NewsArticle,
} from "@/services/newsArticleService";

interface TrendingNewsProps {
  onAuthRequired: () => void;
}

const FALLBACK_GRADIENTS: Record<string, string> = {
  basketball: "from-orange-500 to-amber-600",
  soccer: "from-emerald-500 to-green-600",
  football: "from-amber-800 to-yellow-700",
  tennis: "from-lime-500 to-green-500",
  hockey: "from-blue-500 to-cyan-600",
  gymnastics: "from-purple-500 to-fuchsia-500",
  default: "from-accent to-primary",
};

const getFallbackGradient = (sport: string) =>
  FALLBACK_GRADIENTS[sport.toLowerCase()] || FALLBACK_GRADIENTS.default;

const TrendingNews: React.FC<TrendingNewsProps> = ({ onAuthRequired }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadNews = useCallback(async () => {
    const data = await fetchTrendingNews(8);
    setArticles(data);
    if (data.length > 0) {
      setLastUpdated(data[0].created_at);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Try with user session first, fall back to anon invocation
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const { data, error } = await supabase.functions.invoke('fetch-sports-news', {
        headers,
      });

      if (error) {
        console.error('Edge function error:', error);
        toast({
          title: "Refresh failed",
          description: error.message || "Could not fetch news. Try again later.",
          variant: "destructive",
        });
      } else {
        const count = data?.articlesProcessed ?? 0;
        toast({
          title: "News refreshed",
          description: `Fetched ${count} articles from RSS feeds.`,
        });
      }

      await new Promise(r => setTimeout(r, 1000));
      await loadNews();
    } catch (err: any) {
      console.error('Refresh failed:', err);
      toast({
        title: "Refresh error",
        description: err?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  /* ─── Header with refresh + last updated ─── */
  const Header = () => (
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        title="Refresh news"
      >
        {refreshing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <RefreshCw className="w-3.5 h-3.5" />
        )}
        <span>Refresh</span>
      </button>
      {lastUpdated && (
        <span className="text-[10px] text-muted-foreground">
          Updated {getTimeAgo(lastUpdated)}
        </span>
      )}
    </div>
  );

  /* ─── Loading skeletons ─── */
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
              <div className="h-3 w-full bg-muted rounded" />
              <div className="h-3 w-2/3 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ─── Empty state — no fake content ─── */
  if (articles.length === 0) {
    return (
      <div>
        <Header />
        <div className="text-center py-16 bg-card/50 rounded-2xl border border-border/20">
          <Newspaper className="w-10 h-10 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-sm font-semibold text-foreground mb-1">No recent news</p>
          <p className="text-xs text-muted-foreground mb-4">Tap refresh to fetch the latest sports articles.</p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Fetch Latest News
          </button>
        </div>
      </div>
    );
  }

  /* ─── Real article cards ─── */
  return (
    <div>
      <Header />
      <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
        {articles.map((article, i) => {
          const primarySport = article.sport_tags?.[0] || "";
          const sportEmoji = getSportEmoji(primarySport);
          const catEmoji = getCategoryEmoji(article.category, primarySport);
          const sportColor = getSportColor(primarySport);
          const catColor = getCategoryColor(article.category);
          const summary = article.summary || generateSummary(article.title, article.source_name);
          const gradient = getFallbackGradient(primarySport);

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
              <div className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full border border-border/20 flex flex-col">
                <div className="h-40 overflow-hidden relative">
                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-2 p-4`}>
                      <span className="text-5xl drop-shadow-lg">{sportEmoji}</span>
                      <span className="text-background/90 text-[10px] font-bold uppercase tracking-widest text-center line-clamp-1">
                        {primarySport || article.category || "Sports"}
                      </span>
                    </div>
                  )}
                  <div
                    className="absolute top-2.5 left-2.5 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md"
                    style={{ backgroundColor: sportColor + "E6" }}
                  >
                    {sportEmoji}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: catColor }} />
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: `${catColor}20`, color: catColor }}
                    >
                      {catEmoji} {primarySport || article.category || "Sports"}
                    </span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getTimeAgo(article.published_at || article.created_at)}
                    </span>
                  </div>

                  <h3 className="font-sans font-bold text-foreground text-base leading-snug group-hover:text-accent transition-colors line-clamp-2 mb-2">
                    {article.title}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3 flex-1">
                    {summary}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    {article.source_name && (
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        {article.source_name}
                      </p>
                    )}
                    <span className="text-[11px] font-semibold text-accent flex items-center gap-1 group-hover:gap-2 transition-all ml-auto">
                      Read More <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TrendingNews;
