/**
 * Map a user's metro area (resolved from their ZIP) to the professional
 * teams whose games should appear in their unified feed. Includes both
 * men's and women's pro leagues: MLB, NBA, WNBA, NFL, NHL, MLS, NWSL.
 *
 * Only PROFESSIONAL teams — no NCAA / college teams.
 *
 * Falls back to Los Angeles when no area is set or the metro isn't mapped.
 */

export const LA_DEFAULT_TEAMS = [
  // MLB
  "Dodgers", "Angels",
  // NBA / WNBA
  "Lakers", "Clippers", "Sparks",
  // NFL
  "Rams", "Chargers",
  // NHL
  "Kings", "Ducks",
  // MLS / NWSL
  "Galaxy", "LAFC", "Angel City",
];

/**
 * Keyed by lowercased metro name. Each list contains pro team
 * "short names" that match ESPN/TheSportsDB displayName via substring.
 */
const METRO_TEAMS: Record<string, string[]> = {
  "los angeles": LA_DEFAULT_TEAMS,
  "new york": [
    "Yankees", "Mets",
    "Knicks", "Nets", "Liberty",
    "Giants", "Jets",
    "Rangers", "Islanders", "Devils",
    "NYCFC", "Red Bulls", "Gotham FC",
  ],
  "chicago": [
    "Cubs", "White Sox",
    "Bulls", "Sky",
    "Bears",
    "Blackhawks",
    "Fire", "Red Stars",
  ],
  "boston": [
    "Red Sox",
    "Celtics",
    "Patriots",
    "Bruins",
    "Revolution",
  ],
  "san francisco": [
    "Giants", "Athletics",
    "Warriors", "Valkyries",
    "49ers",
    "Sharks",
    "Earthquakes", "Bay FC",
  ],
  "dallas": [
    "Rangers", // MLB Texas Rangers
    "Cowboys",
    "Mavericks", "Wings",
    "Stars",
    "FC Dallas",
  ],
  "houston": [
    "Astros",
    "Rockets",
    "Texans",
    "Dynamo", "Dash",
  ],
  "seattle": [
    "Mariners",
    "Storm",
    "Seahawks",
    "Kraken",
    "Sounders", "Reign",
  ],
  "washington": [
    "Nationals",
    "Wizards", "Mystics",
    "Commanders",
    "Capitals",
    "D.C. United", "DC United", "Spirit",
  ],
  "atlanta": [
    "Braves",
    "Hawks", "Dream",
    "Falcons",
    "Atlanta United",
  ],
  "miami": [
    "Marlins",
    "Heat",
    "Dolphins",
    "Panthers",
    "Inter Miami",
  ],
  "phoenix": [
    "Diamondbacks",
    "Suns", "Mercury",
    "Cardinals",
    "Coyotes", "Mammoth",
  ],
  "denver": [
    "Rockies",
    "Nuggets",
    "Broncos",
    "Avalanche",
    "Rapids",
  ],
  "minneapolis": [
    "Twins",
    "Timberwolves", "Lynx",
    "Vikings",
    "Wild",
    "Minnesota United",
  ],
  "portland": [
    "Trail Blazers",
    "Timbers", "Thorns",
  ],
  "detroit": [
    "Tigers",
    "Pistons",
    "Lions",
    "Red Wings",
  ],
  "philadelphia": [
    "Phillies",
    "76ers",
    "Eagles",
    "Flyers",
    "Union",
  ],
  "las vegas": [
    "Aces",
    "Raiders",
    "Golden Knights",
  ],
  "indianapolis": [
    "Pacers", "Fever",
    "Colts",
  ],
  "kansas city": [
    "Royals",
    "Chiefs",
    "Sporting Kansas City", "Current",
  ],
  "orlando": [
    "Magic",
    "Orlando City", "Pride",
  ],
  "san diego": [
    "Padres",
    "Wave",
    "San Diego FC",
  ],
  "toronto": [
    "Blue Jays",
    "Raptors",
    "Maple Leafs",
    "Toronto FC",
  ],
  "cleveland": [
    "Guardians",
    "Cavaliers",
    "Browns",
  ],
  "cincinnati": [
    "Reds",
    "Bengals",
    "FC Cincinnati",
  ],
  "milwaukee": [
    "Brewers",
    "Bucks",
  ],
  "st. louis": [
    "Cardinals", "Blues", "St. Louis City",
  ],
  "nashville": [
    "Titans", "Predators", "Nashville SC",
  ],
  "charlotte": [
    "Hornets", "Panthers", "Charlotte FC",
  ],
  "tampa": [
    "Rays", "Buccaneers", "Lightning",
  ],
  "buffalo": [
    "Bills", "Sabres",
  ],
  "pittsburgh": [
    "Pirates", "Steelers", "Penguins",
  ],
  "baltimore": [
    "Orioles", "Ravens",
  ],
};

const CITY_ALIASES: Record<string, string> = {
  "la": "los angeles",
  "long beach": "los angeles",
  "santa monica": "los angeles",
  "pasadena": "los angeles",
  "anaheim": "los angeles",
  "inglewood": "los angeles",
  "burbank": "los angeles",
  "glendale": "los angeles",
  "culver city": "los angeles",
  "torrance": "los angeles",
  "hollywood": "los angeles",
  "nyc": "new york",
  "new york city": "new york",
  "brooklyn": "new york",
  "queens": "new york",
  "bronx": "new york",
  "manhattan": "new york",
  "newark": "new york",
  "jersey city": "new york",
  "sf": "san francisco",
  "oakland": "san francisco",
  "san jose": "san francisco",
  "berkeley": "san francisco",
  "cambridge": "boston",
  "dc": "washington",
  "washington dc": "washington",
  "washington d.c.": "washington",
  "arlington": "washington",
  "alexandria": "washington",
  "bethesda": "washington",
  "frisco": "dallas",
  "arlington tx": "dallas",
  "fort worth": "dallas",
  "irving": "dallas",
  "plano": "dallas",
  "bellevue": "seattle",
  "tacoma": "seattle",
  "tempe": "phoenix",
  "scottsdale": "phoenix",
  "mesa": "phoenix",
  "saint paul": "minneapolis",
  "st. paul": "minneapolis",
  "st paul": "minneapolis",
  "fort lauderdale": "miami",
  "miami beach": "miami",
  "queens ny": "new york",
  "henderson": "las vegas",
  "paradise": "las vegas",
  "overland park": "kansas city",
  "harrison": "cincinnati",
  "st louis": "st. louis",
  "saint louis": "st. louis",
  "saint petersburg": "tampa",
  "st petersburg": "tampa",
  "st. petersburg": "tampa",
};

export interface AreaInput {
  city?: string | null;
  state?: string | null;
}

/**
 * Resolve a user's area to a list of pro teams to follow in the feed.
 * Returns the LA default list when no area matches.
 */
export function teamsForArea(area: AreaInput | null | undefined): string[] {
  const raw = (area?.city || "").trim().toLowerCase();
  if (!raw) return LA_DEFAULT_TEAMS;
  const aliased = CITY_ALIASES[raw] || raw;
  return METRO_TEAMS[aliased] || LA_DEFAULT_TEAMS;
}

/** Best-effort metro display name for the resolved team list. */
export function metroLabelForArea(area: AreaInput | null | undefined): string {
  const raw = (area?.city || "").trim().toLowerCase();
  if (!raw) return "Los Angeles";
  const aliased = CITY_ALIASES[raw] || raw;
  if (METRO_TEAMS[aliased]) {
    return aliased.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return "Los Angeles";
}
