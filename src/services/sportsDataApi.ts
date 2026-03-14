const API_KEY = import.meta.env.VITE_SPORTSDATA_API_KEY || '';
const BASE_URL = 'https://api.sportsdata.io/v3';

const headers = () => ({
  'Ocp-Apim-Subscription-Key': API_KEY,
});

export const hasApiKey = () => !!API_KEY;

async function fetchApi<T>(path: string): Promise<T> {
  if (!API_KEY) throw new Error('SportsDataIO API key not configured');
  const res = await fetch(`${BASE_URL}${path}`, { headers: headers() });
  if (!res.ok) throw new Error(`SportsDataIO error: ${res.status}`);
  return res.json();
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
  Status: string; // 'Scheduled' | 'InProgress' | 'Final'
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
  fetchApi<WnbaTeam[]>('/wnba/scores/json/Teams');

export const fetchWnbaStandings = (season: number) =>
  fetchApi<WnbaStanding[]>(`/wnba/scores/json/Standings/${season}`);

export const fetchWnbaGamesByDate = (date: string) =>
  fetchApi<WnbaGame[]>(`/wnba/scores/json/GamesByDate/${date}`);

export const fetchWnbaPlayerStats = (season: number) =>
  fetchApi<WnbaPlayerStats[]>(`/wnba/stats/json/PlayerSeasonStats/${season}`);

export const fetchNwslStandings = () =>
  fetchApi<NwslStanding[]>('/soccer/scores/json/CompetitionDetails/NWSL');

// Helper to format date as YYYY-MMM-DD for SportsDataIO
export const formatSportsDate = (d: Date = new Date()) => {
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${d.getFullYear()}-${months[d.getMonth()]}-${String(d.getDate()).padStart(2, '0')}`;
};
