import { supabase } from "@/integrations/supabase/client";

// All SportsDataIO requests are proxied through the sports-data-proxy edge function
// so the third-party API key is never exposed in the client bundle.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

// Best-effort flag — the actual key lives server-side. We assume the proxy is available
// whenever the Supabase URL is configured. Components that previously gated UI on
// hasApiKey() will simply attempt the request and handle empty results gracefully.
export const hasApiKey = () => !!SUPABASE_URL;

async function fetchApi<T>(path: string): Promise<T> {
  const { data, error } = await supabase.functions.invoke("sports-data-proxy", {
    method: "GET",
    // Pass path as query param via headers fallback: supabase-js doesn't support query on invoke,
    // so we call the raw URL instead.
  });
  // If invoke worked above we'd return; otherwise fall through to fetch with query string.
  if (!error && data) return data as T;

  const url = `${SUPABASE_URL}/functions/v1/sports-data-proxy?path=${encodeURIComponent(path)}`;
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
  };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`SportsData proxy error: ${res.status}`);
  return res.json() as Promise<T>;
}

// ── Types ──
export interface WnbaTeam {
  TeamID: number;
  Key: string;
  City: string;
  Name: string;
  Conference: string;
  Division: string;
  WikipediaLogoUrl: string;
}

export interface WnbaStanding {
  TeamID: number;
  Key: string;
  City: string;
  Name: string;
  Conference: string;
  Wins: number;
  Losses: number;
  Percentage: number;
  ConferenceWins: number;
  ConferenceLosses: number;
  WikipediaLogoUrl?: string;
}

export interface WnbaGame {
  GameID: number;
  Season: number;
  Status: string;
  DateTime: string | null;
  HomeTeam: string;
  AwayTeam: string;
  HomeTeamScore: number | null;
  AwayTeamScore: number | null;
  HomeTeamID: number;
  AwayTeamID: number;
  Channel: string | null;
  Quarter: string | null;
  TimeRemainingMinutes: number | null;
  TimeRemainingSeconds: number | null;
}

export interface WnbaPlayerStats {
  PlayerID: number;
  Name: string;
  Team: string;
  Position: string;
  Points: number;
  Rebounds: number;
  Assists: number;
  Games: number;
}

export interface NwslStanding {
  TeamId: number;
  Name: string;
  ShortName: string;
  Wins: number;
  Losses: number;
  Draws: number;
  Points: number;
  GoalsScored: number;
  GoalsAgainst: number;
  GoalDifferential: number;
  WikipediaLogoUrl?: string;
}

// ── Fetchers ──

export const fetchWnbaTeams = () =>
  fetchApi<WnbaTeam[]>("/wnba/scores/json/Teams");

export const fetchWnbaStandings = (season: number) =>
  fetchApi<WnbaStanding[]>(`/wnba/scores/json/Standings/${season}`);

export const fetchWnbaGamesByDate = (date: string) =>
  fetchApi<WnbaGame[]>(`/wnba/scores/json/GamesByDate/${date}`);

export const fetchWnbaPlayerStats = (season: number) =>
  fetchApi<WnbaPlayerStats[]>(`/wnba/stats/json/PlayerSeasonStats/${season}`);

export const fetchNwslStandings = () =>
  fetchApi<NwslStanding[]>("/soccer/scores/json/CompetitionDetails/NWSL");

export const formatSportsDate = (d: Date = new Date()) => {
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${d.getFullYear()}-${months[d.getMonth()]}-${String(d.getDate()).padStart(2, "0")}`;
};
