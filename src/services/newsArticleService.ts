import { supabase } from "@/integrations/supabase/client";

export interface NewsArticle {
  id: string;
  title: string;
  summary: string | null;
  source_name: string | null;
  source_url: string | null;
  image_url: string | null;
  published_at: string | null;
  created_at: string;
  category: string | null;
  is_trending: boolean;
  sport_tags: string[];
  team_tags: string[];
  city_tags: string[];
}

export type FeedFilter = "all" | "teams" | "sports" | "local" | "trending";

const SPORT_EMOJI: Record<string, string> = {
  basketball: "🏀",
  soccer: "⚽",
  football: "🏈",
  baseball: "⚾",
  tennis: "🎾",
  gymnastics: "🤸",
  hockey: "🏒",
  volleyball: "🏐",
  softball: "🥎",
  running: "🏃‍♀️",
  golf: "⛳",
  swimming: "🏊‍♀️",
};

const SPORT_COLORS: Record<string, string> = {
  basketball: "#F97316",
  soccer: "#22C55E",
  football: "#92400E",
  baseball: "#EF4444",
  tennis: "#84CC16",
  gymnastics: "#A855F7",
  hockey: "#3B82F6",
};

const CATEGORY_COLORS: Record<string, string> = {
  womens_sports: "#FF5D2E",
  la_local: "#FFD700",
  national: "#3B82F6",
  culture: "#A855F7",
};

export function getSportEmoji(sport: string): string {
  return SPORT_EMOJI[sport.toLowerCase()] || "🏅";
}

export function getSportColor(sport: string): string {
  return SPORT_COLORS[sport.toLowerCase()] || "#6B7280";
}

export function getCategoryColor(category: string | null): string {
  return CATEGORY_COLORS[category || ""] || "#6B7280";
}

export interface MatchReason {
  type: "team" | "sport" | "city" | "trending";
  label: string;
  emoji: string;
}

export function getMatchReasons(
  article: NewsArticle,
  userSports: string[],
  userTeams: string[],
  userCity: string | null
): MatchReason[] {
  const reasons: MatchReason[] = [];
  const lowerSports = userSports.map(s => s.toLowerCase());
  const lowerTeams = userTeams.map(t => t.toLowerCase());

  for (const team of article.team_tags || []) {
    if (lowerTeams.some(ut => team.toLowerCase().includes(ut) || ut.includes(team.toLowerCase()))) {
      reasons.push({ type: "team", label: team, emoji: getSportEmoji(article.sport_tags?.[0] || "") });
      break;
    }
  }

  for (const sport of article.sport_tags || []) {
    if (lowerSports.some(us => sport.toLowerCase().includes(us) || us.includes(sport.toLowerCase()))) {
      reasons.push({ type: "sport", label: sport, emoji: getSportEmoji(sport) });
      break;
    }
  }

  if (userCity) {
    for (const city of article.city_tags || []) {
      if (city.toLowerCase().includes(userCity.toLowerCase()) || userCity.toLowerCase().includes(city.toLowerCase())) {
        reasons.push({ type: "city", label: city, emoji: "📍" });
        break;
      }
    }
  }

  if (article.is_trending) {
    reasons.push({ type: "trending", label: "Trending", emoji: "🔥" });
  }

  return reasons;
}

/**
 * Fetch personalized news for logged-in user
 */
export async function fetchPersonalizedNews(
  userSports: string[],
  userTeams: string[],
  userCity: string | null,
  filter: FeedFilter = "all",
  limit = 30
): Promise<NewsArticle[]> {
  try {
    // Query news_articles with joined tags
    let query = supabase
      .from("feed_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (filter === "trending") {
      query = query.eq("is_trending", true);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching news:", error);
      return [];
    }

    // Map the raw data and enrich with tag arrays
    const articles: NewsArticle[] = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      source_name: row.source_name,
      source_url: row.source_url,
      image_url: row.image_url,
      published_at: row.published_at,
      created_at: row.created_at,
      category: row.category,
      is_trending: row.is_trending ?? false,
      sport_tags: row.sport_tags || [],
      team_tags: row.team_tags || [],
      city_tags: row.city_tags || [],
    }));

    // Client-side filter for personalized feeds
    if (filter === "teams") {
      const lowerTeams = userTeams.map(t => t.toLowerCase());
      return articles.filter(a =>
        (a.team_tags || []).some(tag =>
          lowerTeams.some(ut => tag.toLowerCase().includes(ut) || ut.includes(tag.toLowerCase()))
        )
      );
    }

    if (filter === "sports") {
      const lowerSports = userSports.map(s => s.toLowerCase());
      return articles.filter(a =>
        (a.sport_tags || []).some(tag =>
          lowerSports.some(us => tag.toLowerCase().includes(us) || us.includes(tag.toLowerCase()))
        )
      );
    }

    if (filter === "local" && userCity) {
      return articles.filter(a =>
        (a.city_tags || []).some(tag =>
          tag.toLowerCase().includes(userCity.toLowerCase()) || userCity.toLowerCase().includes(tag.toLowerCase())
        )
      );
    }

    // For "all", sort with personalized items first
    if (filter === "all" && (userSports.length > 0 || userTeams.length > 0)) {
      const lowerSports = userSports.map(s => s.toLowerCase());
      const lowerTeams = userTeams.map(t => t.toLowerCase());
      const allUserTags = [...lowerSports, ...lowerTeams];

      return articles.sort((a, b) => {
        const aAllTags = [...(a.sport_tags || []), ...(a.team_tags || [])].map(t => t.toLowerCase());
        const bAllTags = [...(b.sport_tags || []), ...(b.team_tags || [])].map(t => t.toLowerCase());
        const aScore = aAllTags.filter(tag => allUserTags.some(ut => tag.includes(ut) || ut.includes(tag))).length + (a.is_trending ? 1 : 0);
        const bScore = bAllTags.filter(tag => allUserTags.some(ut => tag.includes(ut) || ut.includes(tag))).length + (b.is_trending ? 1 : 0);
        return bScore - aScore;
      });
    }

    return articles;
  } catch (err) {
    console.error("News fetch error:", err);
    return [];
  }
}

/**
 * Fetch trending articles for non-logged-in users
 */
export async function fetchTrendingNews(limit = 8): Promise<NewsArticle[]> {
  try {
    const { data, error } = await supabase
      .from("news_articles" as any)
      .select("*")
      .eq("is_trending", true)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching trending:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      source_name: row.source_name,
      source_url: row.source_url,
      image_url: row.image_url,
      published_at: row.published_at,
      created_at: row.created_at,
      category: row.category,
      is_trending: true,
      sport_tags: row.sport_tags || [],
      team_tags: row.team_tags || [],
      city_tags: row.city_tags || [],
    }));
  } catch (err) {
    console.error("Trending fetch error:", err);
    return [];
  }
}

/**
 * Log a read to news_read_log
 */
export async function logNewsRead(articleId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("news_read_log" as any)
      .insert({ article_id: articleId, user_id: user.id } as any);
  } catch {
    // non-critical
  }
}

export function getTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}
