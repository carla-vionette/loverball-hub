import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GameScore {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: string;
  awayScore: string;
  status: "live" | "final" | "upcoming";
  statusDetail: string;
  sport: string;
  gameTime: string | null;
}

export interface TickerData {
  items: string[];
  updatedAt: string;
}

/**
 * Parse raw ticker item strings from la-sports-ticker into structured game data.
 * The ticker returns strings like:
 *   "🔴 LIVE: Team A @ Team B | 98-102 | Q3 5:22"
 *   "Team A 3-1 Team B | FINAL"
 *   "📅 Team A vs Team B | Sat, Mar 23, 7:00 PM PT"
 */
function parseTickerItems(items: string[]): GameScore[] {
  const games: GameScore[] = [];

  for (const item of items) {
    // Skip non-game items (news, reddit)
    if (item.startsWith("📰") || item.startsWith("r/")) continue;

    try {
      if (item.startsWith("🔴 LIVE:")) {
        // Live game: "🔴 LIVE: Away @ Home | 98-102 | Q3 5:22"
        const cleaned = item.replace("🔴 LIVE:", "").trim();
        const parts = cleaned.split("|").map((s) => s.trim());
        if (parts.length >= 2) {
          const teamParts = parts[0].split("@").map((s) => s.trim());
          const scoreParts = parts[1].split("-");
          games.push({
            id: `live-${games.length}`,
            awayTeam: teamParts[0] || "Away",
            homeTeam: teamParts[1] || "Home",
            awayScore: scoreParts[0] || "0",
            homeScore: scoreParts[1] || "0",
            status: "live",
            statusDetail: parts[2] || "In Progress",
            sport: "",
            gameTime: null,
          });
        }
      } else if (item.includes("| FINAL")) {
        // Final: "Away 3-1 Home | FINAL"
        const cleaned = item.replace("| FINAL", "").trim();
        const scoreMatch = cleaned.match(/^(.+?)\s+(\d+)-(\d+)\s+(.+)$/);
        if (scoreMatch) {
          games.push({
            id: `final-${games.length}`,
            awayTeam: scoreMatch[1].trim(),
            homeTeam: scoreMatch[4].trim(),
            awayScore: scoreMatch[2],
            homeScore: scoreMatch[3],
            status: "final",
            statusDetail: "Final",
            sport: "",
            gameTime: null,
          });
        }
      } else if (item.startsWith("📅")) {
        // Upcoming: "📅 Away vs Home | Sat, Mar 23, 7:00 PM PT"
        const cleaned = item.replace("📅", "").trim();
        const parts = cleaned.split("|").map((s) => s.trim());
        if (parts.length >= 2) {
          const teamParts = parts[0].split(" vs ").map((s) => s.trim());
          games.push({
            id: `upcoming-${games.length}`,
            awayTeam: teamParts[0] || "Away",
            homeTeam: teamParts[1] || "Home",
            awayScore: "-",
            homeScore: "-",
            status: "upcoming",
            statusDetail: parts[1] || "Scheduled",
            sport: "",
            gameTime: parts[1] || null,
          });
        }
      }
    } catch {
      // Skip unparseable items
    }
  }

  return games;
}

let _scoreCache: { data: GameScore[]; ts: number } | null = null;
const CACHE_TTL = 60 * 1000; // 1 minute for near-real-time
const POLL_INTERVAL = 30 * 1000; // refresh every 30s while mounted

function matchesFavorites(game: GameScore, favorites: string[]): boolean {
  if (!favorites.length) return true;
  const haystack = `${game.homeTeam} ${game.awayTeam}`.toLowerCase();
  return favorites.some((fav) => {
    const needle = fav.trim().toLowerCase();
    return needle.length > 1 && haystack.includes(needle);
  });
}

export function useProfileScores(favoriteTeams: string[] = []) {
  const [games, setGames] = useState<GameScore[]>(_scoreCache?.data ?? []);
  const [loading, setLoading] = useState(!_scoreCache);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = async () => {
    if (_scoreCache && Date.now() - _scoreCache.ts < CACHE_TTL) {
      setGames(_scoreCache.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fnError } = await supabase.functions.invoke(
        "la-sports-ticker",
        { body: { category: "both", gender: "both" } }
      );

      if (fnError) throw fnError;

      const tickerData = data as TickerData;
      const parsed = parseTickerItems(tickerData.items || []);
      _scoreCache = { data: parsed, ts: Date.now() };
      setGames(parsed);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch scores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
    const interval = setInterval(fetchScores, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  let filteredGames = games;
  if (favoriteTeams.length) {
    const matched = games.filter((g) => matchesFavorites(g, favoriteTeams));
    // Fall back to all games if no favorites match — better than an empty state
    filteredGames = matched.length > 0 ? matched : games;
  }

  return { games: filteredGames, loading, error, refetch: fetchScores, hasFavorites: favoriteTeams.length > 0 };
}

/**
 * Search the SportsDataIO-backed edge function for games across leagues.
 * Returns live, most-recent-final, and next-upcoming games for the query.
 */
export function useSportsSearch() {
  const [results, setResults] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string) => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); setError(null); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "sports-search",
        { body: { query: q } }
      );
      if (fnError) throw fnError;
      const games = (data?.games ?? []) as GameScore[];
      setResults(games);
    } catch (err: any) {
      setError(err?.message || "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => { setResults([]); setError(null); };

  return { results, loading, error, search, clear };
}

