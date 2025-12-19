// Greater Los Angeles Area Sports Teams Configuration

// NCAA Division 1 Schools in Greater Los Angeles
export const LA_D1_COLLEGES = [
  // UCLA
  { name: "UCLA Bruins", shortName: "UCLA", conference: "Big Ten", city: "Los Angeles" },
  // USC
  { name: "USC Trojans", shortName: "USC", conference: "Big Ten", city: "Los Angeles" },
  // Pepperdine
  { name: "Pepperdine Waves", shortName: "Pepperdine", conference: "West Coast", city: "Malibu" },
  // Loyola Marymount
  { name: "LMU Lions", shortName: "LMU", conference: "West Coast", city: "Los Angeles" },
  // Cal State Fullerton
  { name: "Cal State Fullerton Titans", shortName: "CSUF", conference: "Big West", city: "Fullerton" },
  // Cal State Northridge
  { name: "CSUN Matadors", shortName: "CSUN", conference: "Big West", city: "Northridge" },
  // Long Beach State
  { name: "Long Beach State Beach", shortName: "LBSU", conference: "Big West", city: "Long Beach" },
  // UC Irvine
  { name: "UC Irvine Anteaters", shortName: "UCI", conference: "Big West", city: "Irvine" },
  // Cal Poly Pomona - Note: D2, excluded
  // Cal State LA - Note: D2, excluded
] as const;

// Professional Teams in Greater Los Angeles
export const LA_PRO_TEAMS = [
  // NBA
  { name: "Los Angeles Lakers", shortName: "Lakers", league: "NBA", sport: "Basketball", gender: "men" },
  { name: "Los Angeles Clippers", shortName: "Clippers", league: "NBA", sport: "Basketball", gender: "men" },
  // WNBA
  { name: "Los Angeles Sparks", shortName: "Sparks", league: "WNBA", sport: "Basketball", gender: "women" },
  // NFL
  { name: "Los Angeles Rams", shortName: "Rams", league: "NFL", sport: "Football", gender: "men" },
  { name: "Los Angeles Chargers", shortName: "Chargers", league: "NFL", sport: "Football", gender: "men" },
  // MLB
  { name: "Los Angeles Dodgers", shortName: "Dodgers", league: "MLB", sport: "Baseball", gender: "men" },
  { name: "Los Angeles Angels", shortName: "Angels", league: "MLB", sport: "Baseball", gender: "men" },
  // NHL
  { name: "Los Angeles Kings", shortName: "Kings", league: "NHL", sport: "Hockey", gender: "men" },
  { name: "Anaheim Ducks", shortName: "Ducks", league: "NHL", sport: "Hockey", gender: "men" },
  // MLS
  { name: "LA Galaxy", shortName: "Galaxy", league: "MLS", sport: "Soccer", gender: "men" },
  { name: "LAFC", shortName: "LAFC", league: "MLS", sport: "Soccer", gender: "men" },
  // NWSL
  { name: "Angel City FC", shortName: "ACFC", league: "NWSL", sport: "Soccer", gender: "women" },
  { name: "San Diego Wave FC", shortName: "Wave", league: "NWSL", sport: "Soccer", gender: "women" },
] as const;

// All team names for filtering
export const ALL_LA_TEAM_NAMES = [
  ...LA_D1_COLLEGES.map(t => t.shortName),
  ...LA_PRO_TEAMS.map(t => t.shortName),
];

// Get formatted team list for API prompts
export function getTeamListForPrompt(): string {
  const colleges = LA_D1_COLLEGES.map(t => t.name).join(", ");
  const pros = LA_PRO_TEAMS.map(t => t.name).join(", ");
  return `NCAA D1 Colleges: ${colleges}. Professional Teams: ${pros}.`;
}

export type TeamCategory = "college" | "pro" | "both";
export type GenderFilter = "men" | "women" | "both";
