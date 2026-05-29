// Mapping from team name → league. Mirrors the options users pick in
// Onboarding (TEAMS_BY_LEAGUE) so we can label favorites consistently.
const TEAM_TO_LEAGUE: Record<string, string> = {
  // WNBA
  "LA Sparks": "WNBA", Sparks: "WNBA", "NY Liberty": "WNBA", Liberty: "WNBA",
  "Las Vegas Aces": "WNBA", Aces: "WNBA", "Indiana Fever": "WNBA", Fever: "WNBA",
  "Seattle Storm": "WNBA", Storm: "WNBA", "Chicago Sky": "WNBA", Sky: "WNBA",
  Mercury: "WNBA", Mystics: "WNBA", Sun: "WNBA", Lynx: "WNBA", Dream: "WNBA", Wings: "WNBA",
  // NWSL
  "Angel City FC": "NWSL", "Gotham FC": "NWSL", "Portland Thorns": "NWSL",
  "San Diego Wave": "NWSL", "Bay FC": "NWSL",
  // NCAA
  UConn: "NCAA", LSU: "NCAA", "South Carolina": "NCAA", Iowa: "NCAA", Stanford: "NCAA", USC: "NCAA",
  // NFL
  "49ers": "NFL", Eagles: "NFL", Chiefs: "NFL", Cowboys: "NFL", Rams: "NFL",
  Chargers: "NFL", Packers: "NFL", Bills: "NFL", Ravens: "NFL", Dolphins: "NFL",
  Lions: "NFL", Seahawks: "NFL", Steelers: "NFL", Bears: "NFL", Raiders: "NFL",
  Broncos: "NFL", Vikings: "NFL", Giants: "NFL", Jets: "NFL", Saints: "NFL",
  Patriots: "NFL", Commanders: "NFL", Cardinals: "NFL", Bengals: "NFL",
  // FIFA
  USWNT: "FIFA", England: "FIFA", Spain: "FIFA", Brazil: "FIFA", Germany: "FIFA",
  // F1
  Ferrari: "F1", Mercedes: "F1", "Red Bull": "F1", McLaren: "F1",
  // Flag Football
  "Team USA": "Flag Football", "LA Wildcats": "Flag Football",
  // MLB
  Dodgers: "MLB", Yankees: "MLB", "Red Sox": "MLB",
  // NBA
  Lakers: "NBA", Celtics: "NBA", Warriors: "NBA", Clippers: "NBA",
  Knicks: "NBA", Nets: "NBA", "76ers": "NBA", Bucks: "NBA", Heat: "NBA",
  Bulls: "NBA", Suns: "NBA", Mavericks: "NBA", Nuggets: "NBA", Thunder: "NBA",
  Timberwolves: "NBA", Kings: "NBA", Grizzlies: "NBA", Pelicans: "NBA",
  Hawks: "NBA", Raptors: "NBA", Cavaliers: "NBA", Pacers: "NBA", Magic: "NBA",
  Pistons: "NBA", Hornets: "NBA", Wizards: "NBA", "Trail Blazers": "NBA",
  Jazz: "NBA", Spurs: "NBA", Rockets: "NBA",
  // MLS
  LAFC: "MLS", "LA Galaxy": "MLS", "Inter Miami": "MLS",
};

export function getTeamLeague(name: string): string | null {
  if (!name) return null;
  return TEAM_TO_LEAGUE[name] ?? TEAM_TO_LEAGUE[name.trim()] ?? null;
}

// Best-effort slugify for routing to /team/:slug
export function getTeamSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
