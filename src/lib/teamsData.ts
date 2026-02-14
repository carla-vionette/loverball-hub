// ─── Comprehensive Team & Channel Data ──────────────────
// All professional teams, college teams, and data generators

const espnLogo = (path: string) =>
  `https://a.espncdn.com/combiner/i?img=/i/teamlogos/${path}&h=200&w=200`;
const ncaaLogo = (id: number) =>
  espnLogo(`ncaa/500/${id}.png`);
const thumbBase = "https://images.unsplash.com/photo-";

// ─── TYPES ──────────────────────────────────────────────
export interface TeamData {
  id: string;
  name: string;
  city: string;
  abbreviation: string;
  logo: string;
  colors: [string, string];
  sport: Sport;
  league: League;
  conference?: string;
  division?: string;
  founded: number;
  arena?: string;
  website?: string;
}

export type Sport = "basketball" | "football" | "baseball" | "hockey" | "soccer" | "softball" | "volleyball";
export type League = "NFL" | "NBA" | "MLB" | "NHL" | "MLS" | "NWSL" | "WNBA" | "NCAA";
export type ChannelType = "professional_team" | "college_team" | "creator" | "loverball";

export interface ChannelSchema {
  channelId: string;
  type: ChannelType;
  sport: Sport | "multi-sport";
  league?: League | string;
  name: string;
  handle: string;
  avatar: string;
  banner: string;
  description: string;
  verified: boolean;
  followers: number;
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  location: string;
  founded: number;
  brandColors: { primary: string; accent: string };
  socialLinks: {
    website?: string;
    twitter?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    facebook?: string;
  };
  category: string;
  tags: string[];
  uploadSchedule: string;
  contactEmail: string;
  admins: string[];
  createdAt: string;
  featured: boolean;
}

// ─── NFL TEAMS (32) ─────────────────────────────────────
export const NFL_TEAMS: TeamData[] = [
  // AFC East
  { id: "nfl-buf", name: "Buffalo Bills", city: "Buffalo", abbreviation: "BUF", logo: espnLogo("nfl/500/2.png"), colors: ["#00338D", "#C60C30"], sport: "football", league: "NFL", conference: "AFC", division: "East", founded: 1960, arena: "Highmark Stadium" },
  { id: "nfl-mia", name: "Miami Dolphins", city: "Miami", abbreviation: "MIA", logo: espnLogo("nfl/500/15.png"), colors: ["#008E97", "#FC4C02"], sport: "football", league: "NFL", conference: "AFC", division: "East", founded: 1966, arena: "Hard Rock Stadium" },
  { id: "nfl-ne", name: "New England Patriots", city: "Foxborough", abbreviation: "NE", logo: espnLogo("nfl/500/17.png"), colors: ["#002244", "#C60C30"], sport: "football", league: "NFL", conference: "AFC", division: "East", founded: 1960, arena: "Gillette Stadium" },
  { id: "nfl-nyj", name: "New York Jets", city: "New York", abbreviation: "NYJ", logo: espnLogo("nfl/500/20.png"), colors: ["#125740", "#FFFFFF"], sport: "football", league: "NFL", conference: "AFC", division: "East", founded: 1960, arena: "MetLife Stadium" },
  // AFC North
  { id: "nfl-bal", name: "Baltimore Ravens", city: "Baltimore", abbreviation: "BAL", logo: espnLogo("nfl/500/33.png"), colors: ["#241773", "#9E7C0C"], sport: "football", league: "NFL", conference: "AFC", division: "North", founded: 1996, arena: "M&T Bank Stadium" },
  { id: "nfl-cin", name: "Cincinnati Bengals", city: "Cincinnati", abbreviation: "CIN", logo: espnLogo("nfl/500/4.png"), colors: ["#FB4F14", "#000000"], sport: "football", league: "NFL", conference: "AFC", division: "North", founded: 1968, arena: "Paycor Stadium" },
  { id: "nfl-cle", name: "Cleveland Browns", city: "Cleveland", abbreviation: "CLE", logo: espnLogo("nfl/500/5.png"), colors: ["#311D00", "#FF3C00"], sport: "football", league: "NFL", conference: "AFC", division: "North", founded: 1946, arena: "Cleveland Browns Stadium" },
  { id: "nfl-pit", name: "Pittsburgh Steelers", city: "Pittsburgh", abbreviation: "PIT", logo: espnLogo("nfl/500/23.png"), colors: ["#FFB612", "#101820"], sport: "football", league: "NFL", conference: "AFC", division: "North", founded: 1933, arena: "Acrisure Stadium" },
  // AFC South
  { id: "nfl-hou", name: "Houston Texans", city: "Houston", abbreviation: "HOU", logo: espnLogo("nfl/500/34.png"), colors: ["#03202F", "#A71930"], sport: "football", league: "NFL", conference: "AFC", division: "South", founded: 2002, arena: "NRG Stadium" },
  { id: "nfl-ind", name: "Indianapolis Colts", city: "Indianapolis", abbreviation: "IND", logo: espnLogo("nfl/500/11.png"), colors: ["#002C5F", "#A2AAAD"], sport: "football", league: "NFL", conference: "AFC", division: "South", founded: 1953, arena: "Lucas Oil Stadium" },
  { id: "nfl-jax", name: "Jacksonville Jaguars", city: "Jacksonville", abbreviation: "JAX", logo: espnLogo("nfl/500/30.png"), colors: ["#006778", "#D7A22A"], sport: "football", league: "NFL", conference: "AFC", division: "South", founded: 1995, arena: "EverBank Stadium" },
  { id: "nfl-ten", name: "Tennessee Titans", city: "Nashville", abbreviation: "TEN", logo: espnLogo("nfl/500/10.png"), colors: ["#0C2340", "#4B92DB"], sport: "football", league: "NFL", conference: "AFC", division: "South", founded: 1960, arena: "Nissan Stadium" },
  // AFC West
  { id: "nfl-den", name: "Denver Broncos", city: "Denver", abbreviation: "DEN", logo: espnLogo("nfl/500/7.png"), colors: ["#FB4F14", "#002244"], sport: "football", league: "NFL", conference: "AFC", division: "West", founded: 1960, arena: "Empower Field" },
  { id: "nfl-kc", name: "Kansas City Chiefs", city: "Kansas City", abbreviation: "KC", logo: espnLogo("nfl/500/12.png"), colors: ["#E31837", "#FFB81C"], sport: "football", league: "NFL", conference: "AFC", division: "West", founded: 1960, arena: "Arrowhead Stadium" },
  { id: "nfl-lv", name: "Las Vegas Raiders", city: "Las Vegas", abbreviation: "LV", logo: espnLogo("nfl/500/13.png"), colors: ["#000000", "#A5ACAF"], sport: "football", league: "NFL", conference: "AFC", division: "West", founded: 1960, arena: "Allegiant Stadium" },
  { id: "nfl-lac", name: "Los Angeles Chargers", city: "Los Angeles", abbreviation: "LAC", logo: espnLogo("nfl/500/24.png"), colors: ["#0080C6", "#FFC20E"], sport: "football", league: "NFL", conference: "AFC", division: "West", founded: 1960, arena: "SoFi Stadium" },
  // NFC East
  { id: "nfl-dal", name: "Dallas Cowboys", city: "Dallas", abbreviation: "DAL", logo: espnLogo("nfl/500/6.png"), colors: ["#003594", "#869397"], sport: "football", league: "NFL", conference: "NFC", division: "East", founded: 1960, arena: "AT&T Stadium" },
  { id: "nfl-nyg", name: "New York Giants", city: "New York", abbreviation: "NYG", logo: espnLogo("nfl/500/19.png"), colors: ["#0B2265", "#A71930"], sport: "football", league: "NFL", conference: "NFC", division: "East", founded: 1925, arena: "MetLife Stadium" },
  { id: "nfl-phi", name: "Philadelphia Eagles", city: "Philadelphia", abbreviation: "PHI", logo: espnLogo("nfl/500/21.png"), colors: ["#004C54", "#A5ACAF"], sport: "football", league: "NFL", conference: "NFC", division: "East", founded: 1933, arena: "Lincoln Financial Field" },
  { id: "nfl-was", name: "Washington Commanders", city: "Washington", abbreviation: "WAS", logo: espnLogo("nfl/500/28.png"), colors: ["#5A1414", "#FFB612"], sport: "football", league: "NFL", conference: "NFC", division: "East", founded: 1932, arena: "FedExField" },
  // NFC North
  { id: "nfl-chi", name: "Chicago Bears", city: "Chicago", abbreviation: "CHI", logo: espnLogo("nfl/500/3.png"), colors: ["#0B162A", "#C83803"], sport: "football", league: "NFL", conference: "NFC", division: "North", founded: 1920, arena: "Soldier Field" },
  { id: "nfl-det", name: "Detroit Lions", city: "Detroit", abbreviation: "DET", logo: espnLogo("nfl/500/8.png"), colors: ["#0076B6", "#B0B7BC"], sport: "football", league: "NFL", conference: "NFC", division: "North", founded: 1930, arena: "Ford Field" },
  { id: "nfl-gb", name: "Green Bay Packers", city: "Green Bay", abbreviation: "GB", logo: espnLogo("nfl/500/9.png"), colors: ["#203731", "#FFB612"], sport: "football", league: "NFL", conference: "NFC", division: "North", founded: 1919, arena: "Lambeau Field" },
  { id: "nfl-min", name: "Minnesota Vikings", city: "Minneapolis", abbreviation: "MIN", logo: espnLogo("nfl/500/16.png"), colors: ["#4F2683", "#FFC62F"], sport: "football", league: "NFL", conference: "NFC", division: "North", founded: 1961, arena: "U.S. Bank Stadium" },
  // NFC South
  { id: "nfl-atl", name: "Atlanta Falcons", city: "Atlanta", abbreviation: "ATL", logo: espnLogo("nfl/500/1.png"), colors: ["#A71930", "#000000"], sport: "football", league: "NFL", conference: "NFC", division: "South", founded: 1966, arena: "Mercedes-Benz Stadium" },
  { id: "nfl-car", name: "Carolina Panthers", city: "Charlotte", abbreviation: "CAR", logo: espnLogo("nfl/500/29.png"), colors: ["#0085CA", "#101820"], sport: "football", league: "NFL", conference: "NFC", division: "South", founded: 1995, arena: "Bank of America Stadium" },
  { id: "nfl-no", name: "New Orleans Saints", city: "New Orleans", abbreviation: "NO", logo: espnLogo("nfl/500/18.png"), colors: ["#D3BC8D", "#101820"], sport: "football", league: "NFL", conference: "NFC", division: "South", founded: 1967, arena: "Caesars Superdome" },
  { id: "nfl-tb", name: "Tampa Bay Buccaneers", city: "Tampa Bay", abbreviation: "TB", logo: espnLogo("nfl/500/27.png"), colors: ["#D50A0A", "#FF7900"], sport: "football", league: "NFL", conference: "NFC", division: "South", founded: 1976, arena: "Raymond James Stadium" },
  // NFC West
  { id: "nfl-ari", name: "Arizona Cardinals", city: "Glendale", abbreviation: "ARI", logo: espnLogo("nfl/500/22.png"), colors: ["#97233F", "#000000"], sport: "football", league: "NFL", conference: "NFC", division: "West", founded: 1898, arena: "State Farm Stadium" },
  { id: "nfl-lar", name: "Los Angeles Rams", city: "Los Angeles", abbreviation: "LAR", logo: espnLogo("nfl/500/14.png"), colors: ["#003594", "#FFA300"], sport: "football", league: "NFL", conference: "NFC", division: "West", founded: 1936, arena: "SoFi Stadium" },
  { id: "nfl-sf", name: "San Francisco 49ers", city: "San Francisco", abbreviation: "SF", logo: espnLogo("nfl/500/25.png"), colors: ["#AA0000", "#B3995D"], sport: "football", league: "NFL", conference: "NFC", division: "West", founded: 1946, arena: "Levi's Stadium" },
  { id: "nfl-sea", name: "Seattle Seahawks", city: "Seattle", abbreviation: "SEA", logo: espnLogo("nfl/500/26.png"), colors: ["#002244", "#69BE28"], sport: "football", league: "NFL", conference: "NFC", division: "West", founded: 1976, arena: "Lumen Field" },
];

// ─── NBA TEAMS (30) ─────────────────────────────────────
export const NBA_TEAMS: TeamData[] = [
  { id: "nba-atl", name: "Atlanta Hawks", city: "Atlanta", abbreviation: "ATL", logo: espnLogo("nba/500/1.png"), colors: ["#E03A3E", "#C1D32F"], sport: "basketball", league: "NBA", conference: "Eastern", division: "Southeast", founded: 1946, arena: "State Farm Arena" },
  { id: "nba-bos", name: "Boston Celtics", city: "Boston", abbreviation: "BOS", logo: espnLogo("nba/500/2.png"), colors: ["#007A33", "#BA9653"], sport: "basketball", league: "NBA", conference: "Eastern", division: "Atlantic", founded: 1946, arena: "TD Garden" },
  { id: "nba-bkn", name: "Brooklyn Nets", city: "Brooklyn", abbreviation: "BKN", logo: espnLogo("nba/500/17.png"), colors: ["#000000", "#FFFFFF"], sport: "basketball", league: "NBA", conference: "Eastern", division: "Atlantic", founded: 1967, arena: "Barclays Center" },
  { id: "nba-cha", name: "Charlotte Hornets", city: "Charlotte", abbreviation: "CHA", logo: espnLogo("nba/500/30.png"), colors: ["#1D1160", "#00788C"], sport: "basketball", league: "NBA", conference: "Eastern", division: "Southeast", founded: 1988, arena: "Spectrum Center" },
  { id: "nba-chi", name: "Chicago Bulls", city: "Chicago", abbreviation: "CHI", logo: espnLogo("nba/500/4.png"), colors: ["#CE1141", "#000000"], sport: "basketball", league: "NBA", conference: "Eastern", division: "Central", founded: 1966, arena: "United Center" },
  { id: "nba-cle", name: "Cleveland Cavaliers", city: "Cleveland", abbreviation: "CLE", logo: espnLogo("nba/500/5.png"), colors: ["#860038", "#FDBB30"], sport: "basketball", league: "NBA", conference: "Eastern", division: "Central", founded: 1970, arena: "Rocket Mortgage FieldHouse" },
  { id: "nba-dal", name: "Dallas Mavericks", city: "Dallas", abbreviation: "DAL", logo: espnLogo("nba/500/6.png"), colors: ["#00538C", "#002B5E"], sport: "basketball", league: "NBA", conference: "Western", division: "Southwest", founded: 1980, arena: "American Airlines Center" },
  { id: "nba-den", name: "Denver Nuggets", city: "Denver", abbreviation: "DEN", logo: espnLogo("nba/500/7.png"), colors: ["#0E2240", "#FEC524"], sport: "basketball", league: "NBA", conference: "Western", division: "Northwest", founded: 1967, arena: "Ball Arena" },
  { id: "nba-det", name: "Detroit Pistons", city: "Detroit", abbreviation: "DET", logo: espnLogo("nba/500/8.png"), colors: ["#C8102E", "#1D42BA"], sport: "basketball", league: "NBA", conference: "Eastern", division: "Central", founded: 1941, arena: "Little Caesars Arena" },
  { id: "nba-gsw", name: "Golden State Warriors", city: "San Francisco", abbreviation: "GSW", logo: espnLogo("nba/500/9.png"), colors: ["#1D428A", "#FFC72C"], sport: "basketball", league: "NBA", conference: "Western", division: "Pacific", founded: 1946, arena: "Chase Center" },
  { id: "nba-hou", name: "Houston Rockets", city: "Houston", abbreviation: "HOU", logo: espnLogo("nba/500/10.png"), colors: ["#CE1141", "#000000"], sport: "basketball", league: "NBA", conference: "Western", division: "Southwest", founded: 1967, arena: "Toyota Center" },
  { id: "nba-ind", name: "Indiana Pacers", city: "Indianapolis", abbreviation: "IND", logo: espnLogo("nba/500/11.png"), colors: ["#002D62", "#FDBB30"], sport: "basketball", league: "NBA", conference: "Eastern", division: "Central", founded: 1967, arena: "Gainbridge Fieldhouse" },
  { id: "nba-lac", name: "LA Clippers", city: "Los Angeles", abbreviation: "LAC", logo: espnLogo("nba/500/12.png"), colors: ["#C8102E", "#1D428A"], sport: "basketball", league: "NBA", conference: "Western", division: "Pacific", founded: 1970, arena: "Intuit Dome" },
  { id: "nba-lal", name: "Los Angeles Lakers", city: "Los Angeles", abbreviation: "LAL", logo: espnLogo("nba/500/13.png"), colors: ["#552583", "#FDB927"], sport: "basketball", league: "NBA", conference: "Western", division: "Pacific", founded: 1947, arena: "Crypto.com Arena" },
  { id: "nba-mem", name: "Memphis Grizzlies", city: "Memphis", abbreviation: "MEM", logo: espnLogo("nba/500/29.png"), colors: ["#5D76A9", "#12173F"], sport: "basketball", league: "NBA", conference: "Western", division: "Southwest", founded: 1995, arena: "FedExForum" },
  { id: "nba-mia", name: "Miami Heat", city: "Miami", abbreviation: "MIA", logo: espnLogo("nba/500/14.png"), colors: ["#98002E", "#F9A01B"], sport: "basketball", league: "NBA", conference: "Eastern", division: "Southeast", founded: 1988, arena: "Kaseya Center" },
  { id: "nba-mil", name: "Milwaukee Bucks", city: "Milwaukee", abbreviation: "MIL", logo: espnLogo("nba/500/15.png"), colors: ["#00471B", "#EEE1C6"], sport: "basketball", league: "NBA", conference: "Eastern", division: "Central", founded: 1968, arena: "Fiserv Forum" },
  { id: "nba-min", name: "Minnesota Timberwolves", city: "Minneapolis", abbreviation: "MIN", logo: espnLogo("nba/500/16.png"), colors: ["#0C2340", "#236192"], sport: "basketball", league: "NBA", conference: "Western", division: "Northwest", founded: 1989, arena: "Target Center" },
  { id: "nba-nop", name: "New Orleans Pelicans", city: "New Orleans", abbreviation: "NOP", logo: espnLogo("nba/500/3.png"), colors: ["#0C2340", "#C8102E"], sport: "basketball", league: "NBA", conference: "Western", division: "Southwest", founded: 2002, arena: "Smoothie King Center" },
  { id: "nba-nyk", name: "New York Knicks", city: "New York", abbreviation: "NYK", logo: espnLogo("nba/500/18.png"), colors: ["#006BB6", "#F58426"], sport: "basketball", league: "NBA", conference: "Eastern", division: "Atlantic", founded: 1946, arena: "Madison Square Garden" },
  { id: "nba-okc", name: "Oklahoma City Thunder", city: "Oklahoma City", abbreviation: "OKC", logo: espnLogo("nba/500/25.png"), colors: ["#007AC1", "#EF6100"], sport: "basketball", league: "NBA", conference: "Western", division: "Northwest", founded: 1967, arena: "Paycom Center" },
  { id: "nba-orl", name: "Orlando Magic", city: "Orlando", abbreviation: "ORL", logo: espnLogo("nba/500/19.png"), colors: ["#0077C0", "#C4CED4"], sport: "basketball", league: "NBA", conference: "Eastern", division: "Southeast", founded: 1989, arena: "Amway Center" },
  { id: "nba-phi", name: "Philadelphia 76ers", city: "Philadelphia", abbreviation: "PHI", logo: espnLogo("nba/500/20.png"), colors: ["#006BB6", "#ED174C"], sport: "basketball", league: "NBA", conference: "Eastern", division: "Atlantic", founded: 1946, arena: "Wells Fargo Center" },
  { id: "nba-phx", name: "Phoenix Suns", city: "Phoenix", abbreviation: "PHX", logo: espnLogo("nba/500/21.png"), colors: ["#1D1160", "#E56020"], sport: "basketball", league: "NBA", conference: "Western", division: "Pacific", founded: 1968, arena: "Footprint Center" },
  { id: "nba-por", name: "Portland Trail Blazers", city: "Portland", abbreviation: "POR", logo: espnLogo("nba/500/22.png"), colors: ["#E03A3E", "#000000"], sport: "basketball", league: "NBA", conference: "Western", division: "Northwest", founded: 1970, arena: "Moda Center" },
  { id: "nba-sac", name: "Sacramento Kings", city: "Sacramento", abbreviation: "SAC", logo: espnLogo("nba/500/23.png"), colors: ["#5A2D81", "#63727A"], sport: "basketball", league: "NBA", conference: "Western", division: "Pacific", founded: 1923, arena: "Golden 1 Center" },
  { id: "nba-sas", name: "San Antonio Spurs", city: "San Antonio", abbreviation: "SAS", logo: espnLogo("nba/500/24.png"), colors: ["#C4CED4", "#000000"], sport: "basketball", league: "NBA", conference: "Western", division: "Southwest", founded: 1967, arena: "Frost Bank Center" },
  { id: "nba-tor", name: "Toronto Raptors", city: "Toronto", abbreviation: "TOR", logo: espnLogo("nba/500/28.png"), colors: ["#CE1141", "#000000"], sport: "basketball", league: "NBA", conference: "Eastern", division: "Atlantic", founded: 1995, arena: "Scotiabank Arena" },
  { id: "nba-uta", name: "Utah Jazz", city: "Salt Lake City", abbreviation: "UTA", logo: espnLogo("nba/500/26.png"), colors: ["#002B5C", "#00471B"], sport: "basketball", league: "NBA", conference: "Western", division: "Northwest", founded: 1974, arena: "Delta Center" },
  { id: "nba-was", name: "Washington Wizards", city: "Washington", abbreviation: "WAS", logo: espnLogo("nba/500/27.png"), colors: ["#002B5C", "#E31837"], sport: "basketball", league: "NBA", conference: "Eastern", division: "Southeast", founded: 1961, arena: "Capital One Arena" },
];

// ─── MLB TEAMS (30) ─────────────────────────────────────
export const MLB_TEAMS: TeamData[] = [
  { id: "mlb-ari", name: "Arizona Diamondbacks", city: "Phoenix", abbreviation: "ARI", logo: espnLogo("mlb/500/29.png"), colors: ["#A71930", "#E3D4AD"], sport: "baseball", league: "MLB", conference: "NL", division: "West", founded: 1998 },
  { id: "mlb-atl", name: "Atlanta Braves", city: "Atlanta", abbreviation: "ATL", logo: espnLogo("mlb/500/15.png"), colors: ["#CE1141", "#13274F"], sport: "baseball", league: "MLB", conference: "NL", division: "East", founded: 1871 },
  { id: "mlb-bal", name: "Baltimore Orioles", city: "Baltimore", abbreviation: "BAL", logo: espnLogo("mlb/500/1.png"), colors: ["#DF4601", "#000000"], sport: "baseball", league: "MLB", conference: "AL", division: "East", founded: 1901 },
  { id: "mlb-bos", name: "Boston Red Sox", city: "Boston", abbreviation: "BOS", logo: espnLogo("mlb/500/2.png"), colors: ["#BD3039", "#0C2340"], sport: "baseball", league: "MLB", conference: "AL", division: "East", founded: 1901 },
  { id: "mlb-chc", name: "Chicago Cubs", city: "Chicago", abbreviation: "CHC", logo: espnLogo("mlb/500/16.png"), colors: ["#0E3386", "#CC3433"], sport: "baseball", league: "MLB", conference: "NL", division: "Central", founded: 1876 },
  { id: "mlb-cws", name: "Chicago White Sox", city: "Chicago", abbreviation: "CWS", logo: espnLogo("mlb/500/4.png"), colors: ["#27251F", "#C4CED4"], sport: "baseball", league: "MLB", conference: "AL", division: "Central", founded: 1901 },
  { id: "mlb-cin", name: "Cincinnati Reds", city: "Cincinnati", abbreviation: "CIN", logo: espnLogo("mlb/500/17.png"), colors: ["#C6011F", "#000000"], sport: "baseball", league: "MLB", conference: "NL", division: "Central", founded: 1881 },
  { id: "mlb-cle", name: "Cleveland Guardians", city: "Cleveland", abbreviation: "CLE", logo: espnLogo("mlb/500/5.png"), colors: ["#00385D", "#E50022"], sport: "baseball", league: "MLB", conference: "AL", division: "Central", founded: 1901 },
  { id: "mlb-col", name: "Colorado Rockies", city: "Denver", abbreviation: "COL", logo: espnLogo("mlb/500/27.png"), colors: ["#33006F", "#C4CED4"], sport: "baseball", league: "MLB", conference: "NL", division: "West", founded: 1993 },
  { id: "mlb-det", name: "Detroit Tigers", city: "Detroit", abbreviation: "DET", logo: espnLogo("mlb/500/6.png"), colors: ["#0C2340", "#FA4616"], sport: "baseball", league: "MLB", conference: "AL", division: "Central", founded: 1901 },
  { id: "mlb-hou", name: "Houston Astros", city: "Houston", abbreviation: "HOU", logo: espnLogo("mlb/500/18.png"), colors: ["#002D62", "#EB6E1F"], sport: "baseball", league: "MLB", conference: "AL", division: "West", founded: 1962 },
  { id: "mlb-kc", name: "Kansas City Royals", city: "Kansas City", abbreviation: "KC", logo: espnLogo("mlb/500/7.png"), colors: ["#004687", "#BD9B60"], sport: "baseball", league: "MLB", conference: "AL", division: "Central", founded: 1969 },
  { id: "mlb-laa", name: "Los Angeles Angels", city: "Anaheim", abbreviation: "LAA", logo: espnLogo("mlb/500/3.png"), colors: ["#BA0021", "#003263"], sport: "baseball", league: "MLB", conference: "AL", division: "West", founded: 1961 },
  { id: "mlb-lad", name: "Los Angeles Dodgers", city: "Los Angeles", abbreviation: "LAD", logo: espnLogo("mlb/500/19.png"), colors: ["#005A9C", "#EF3E42"], sport: "baseball", league: "MLB", conference: "NL", division: "West", founded: 1883 },
  { id: "mlb-mia", name: "Miami Marlins", city: "Miami", abbreviation: "MIA", logo: espnLogo("mlb/500/28.png"), colors: ["#00A3E0", "#EF3340"], sport: "baseball", league: "MLB", conference: "NL", division: "East", founded: 1993 },
  { id: "mlb-mil", name: "Milwaukee Brewers", city: "Milwaukee", abbreviation: "MIL", logo: espnLogo("mlb/500/8.png"), colors: ["#FFC52F", "#12284B"], sport: "baseball", league: "MLB", conference: "NL", division: "Central", founded: 1969 },
  { id: "mlb-min", name: "Minnesota Twins", city: "Minneapolis", abbreviation: "MIN", logo: espnLogo("mlb/500/9.png"), colors: ["#002B5C", "#D31145"], sport: "baseball", league: "MLB", conference: "AL", division: "Central", founded: 1901 },
  { id: "mlb-nym", name: "New York Mets", city: "New York", abbreviation: "NYM", logo: espnLogo("mlb/500/21.png"), colors: ["#002D72", "#FF5910"], sport: "baseball", league: "MLB", conference: "NL", division: "East", founded: 1962 },
  { id: "mlb-nyy", name: "New York Yankees", city: "New York", abbreviation: "NYY", logo: espnLogo("mlb/500/10.png"), colors: ["#003087", "#E4002C"], sport: "baseball", league: "MLB", conference: "AL", division: "East", founded: 1901 },
  { id: "mlb-oak", name: "Oakland Athletics", city: "Sacramento", abbreviation: "OAK", logo: espnLogo("mlb/500/11.png"), colors: ["#003831", "#EFB21E"], sport: "baseball", league: "MLB", conference: "AL", division: "West", founded: 1901 },
  { id: "mlb-phi", name: "Philadelphia Phillies", city: "Philadelphia", abbreviation: "PHI", logo: espnLogo("mlb/500/22.png"), colors: ["#E81828", "#002D72"], sport: "baseball", league: "MLB", conference: "NL", division: "East", founded: 1883 },
  { id: "mlb-pit", name: "Pittsburgh Pirates", city: "Pittsburgh", abbreviation: "PIT", logo: espnLogo("mlb/500/23.png"), colors: ["#27251F", "#FDB827"], sport: "baseball", league: "MLB", conference: "NL", division: "Central", founded: 1881 },
  { id: "mlb-sd", name: "San Diego Padres", city: "San Diego", abbreviation: "SD", logo: espnLogo("mlb/500/25.png"), colors: ["#2F241D", "#FFC425"], sport: "baseball", league: "MLB", conference: "NL", division: "West", founded: 1969 },
  { id: "mlb-sf", name: "San Francisco Giants", city: "San Francisco", abbreviation: "SF", logo: espnLogo("mlb/500/26.png"), colors: ["#FD5A1E", "#27251F"], sport: "baseball", league: "MLB", conference: "NL", division: "West", founded: 1883 },
  { id: "mlb-sea", name: "Seattle Mariners", city: "Seattle", abbreviation: "SEA", logo: espnLogo("mlb/500/12.png"), colors: ["#0C2C56", "#005C5C"], sport: "baseball", league: "MLB", conference: "AL", division: "West", founded: 1977 },
  { id: "mlb-stl", name: "St. Louis Cardinals", city: "St. Louis", abbreviation: "STL", logo: espnLogo("mlb/500/24.png"), colors: ["#C41E3A", "#0C2340"], sport: "baseball", league: "MLB", conference: "NL", division: "Central", founded: 1882 },
  { id: "mlb-tb", name: "Tampa Bay Rays", city: "St. Petersburg", abbreviation: "TB", logo: espnLogo("mlb/500/30.png"), colors: ["#092C5C", "#8FBCE6"], sport: "baseball", league: "MLB", conference: "AL", division: "East", founded: 1998 },
  { id: "mlb-tex", name: "Texas Rangers", city: "Arlington", abbreviation: "TEX", logo: espnLogo("mlb/500/13.png"), colors: ["#003278", "#C0111F"], sport: "baseball", league: "MLB", conference: "AL", division: "West", founded: 1961 },
  { id: "mlb-tor", name: "Toronto Blue Jays", city: "Toronto", abbreviation: "TOR", logo: espnLogo("mlb/500/14.png"), colors: ["#134A8E", "#1D2D5C"], sport: "baseball", league: "MLB", conference: "AL", division: "East", founded: 1977 },
  { id: "mlb-was", name: "Washington Nationals", city: "Washington", abbreviation: "WAS", logo: espnLogo("mlb/500/20.png"), colors: ["#AB0003", "#14225A"], sport: "baseball", league: "MLB", conference: "NL", division: "East", founded: 1969 },
];

// ─── NHL TEAMS (32) ─────────────────────────────────────
export const NHL_TEAMS: TeamData[] = [
  { id: "nhl-ana", name: "Anaheim Ducks", city: "Anaheim", abbreviation: "ANA", logo: espnLogo("nhl/500/25.png"), colors: ["#F47A38", "#B9975B"], sport: "hockey", league: "NHL", founded: 1993 },
  { id: "nhl-ari", name: "Utah Hockey Club", city: "Salt Lake City", abbreviation: "UTA", logo: espnLogo("nhl/500/37.png"), colors: ["#010101", "#69B3E7"], sport: "hockey", league: "NHL", founded: 2024 },
  { id: "nhl-bos", name: "Boston Bruins", city: "Boston", abbreviation: "BOS", logo: espnLogo("nhl/500/1.png"), colors: ["#FFB81C", "#000000"], sport: "hockey", league: "NHL", founded: 1924 },
  { id: "nhl-buf", name: "Buffalo Sabres", city: "Buffalo", abbreviation: "BUF", logo: espnLogo("nhl/500/2.png"), colors: ["#002654", "#FCB514"], sport: "hockey", league: "NHL", founded: 1970 },
  { id: "nhl-cgy", name: "Calgary Flames", city: "Calgary", abbreviation: "CGY", logo: espnLogo("nhl/500/3.png"), colors: ["#D2001C", "#FAAF19"], sport: "hockey", league: "NHL", founded: 1972 },
  { id: "nhl-car", name: "Carolina Hurricanes", city: "Raleigh", abbreviation: "CAR", logo: espnLogo("nhl/500/7.png"), colors: ["#CC0000", "#000000"], sport: "hockey", league: "NHL", founded: 1972 },
  { id: "nhl-chi", name: "Chicago Blackhawks", city: "Chicago", abbreviation: "CHI", logo: espnLogo("nhl/500/4.png"), colors: ["#CF0A2C", "#000000"], sport: "hockey", league: "NHL", founded: 1926 },
  { id: "nhl-col", name: "Colorado Avalanche", city: "Denver", abbreviation: "COL", logo: espnLogo("nhl/500/8.png"), colors: ["#6F263D", "#236192"], sport: "hockey", league: "NHL", founded: 1972 },
  { id: "nhl-cbj", name: "Columbus Blue Jackets", city: "Columbus", abbreviation: "CBJ", logo: espnLogo("nhl/500/29.png"), colors: ["#002654", "#CE1126"], sport: "hockey", league: "NHL", founded: 2000 },
  { id: "nhl-dal", name: "Dallas Stars", city: "Dallas", abbreviation: "DAL", logo: espnLogo("nhl/500/9.png"), colors: ["#006847", "#8F8F8C"], sport: "hockey", league: "NHL", founded: 1967 },
  { id: "nhl-det", name: "Detroit Red Wings", city: "Detroit", abbreviation: "DET", logo: espnLogo("nhl/500/5.png"), colors: ["#CE1126", "#FFFFFF"], sport: "hockey", league: "NHL", founded: 1926 },
  { id: "nhl-edm", name: "Edmonton Oilers", city: "Edmonton", abbreviation: "EDM", logo: espnLogo("nhl/500/22.png"), colors: ["#041E42", "#FF4C00"], sport: "hockey", league: "NHL", founded: 1972 },
  { id: "nhl-fla", name: "Florida Panthers", city: "Sunrise", abbreviation: "FLA", logo: espnLogo("nhl/500/26.png"), colors: ["#041E42", "#C8102E"], sport: "hockey", league: "NHL", founded: 1993 },
  { id: "nhl-la", name: "Los Angeles Kings", city: "Los Angeles", abbreviation: "LAK", logo: espnLogo("nhl/500/8.png"), colors: ["#111111", "#A2AAAD"], sport: "hockey", league: "NHL", founded: 1967 },
  { id: "nhl-min", name: "Minnesota Wild", city: "St. Paul", abbreviation: "MIN", logo: espnLogo("nhl/500/30.png"), colors: ["#154734", "#A6192E"], sport: "hockey", league: "NHL", founded: 2000 },
  { id: "nhl-mtl", name: "Montréal Canadiens", city: "Montréal", abbreviation: "MTL", logo: espnLogo("nhl/500/8.png"), colors: ["#AF1E2D", "#192168"], sport: "hockey", league: "NHL", founded: 1909 },
  { id: "nhl-nsh", name: "Nashville Predators", city: "Nashville", abbreviation: "NSH", logo: espnLogo("nhl/500/18.png"), colors: ["#FFB81C", "#041E42"], sport: "hockey", league: "NHL", founded: 1998 },
  { id: "nhl-njd", name: "New Jersey Devils", city: "Newark", abbreviation: "NJD", logo: espnLogo("nhl/500/1.png"), colors: ["#CE1126", "#000000"], sport: "hockey", league: "NHL", founded: 1974 },
  { id: "nhl-nyi", name: "New York Islanders", city: "Elmont", abbreviation: "NYI", logo: espnLogo("nhl/500/2.png"), colors: ["#00539B", "#F47D30"], sport: "hockey", league: "NHL", founded: 1972 },
  { id: "nhl-nyr", name: "New York Rangers", city: "New York", abbreviation: "NYR", logo: espnLogo("nhl/500/3.png"), colors: ["#0038A8", "#CE1126"], sport: "hockey", league: "NHL", founded: 1926 },
  { id: "nhl-ott", name: "Ottawa Senators", city: "Ottawa", abbreviation: "OTT", logo: espnLogo("nhl/500/9.png"), colors: ["#C52032", "#C2912C"], sport: "hockey", league: "NHL", founded: 1992 },
  { id: "nhl-phi", name: "Philadelphia Flyers", city: "Philadelphia", abbreviation: "PHI", logo: espnLogo("nhl/500/4.png"), colors: ["#F74902", "#000000"], sport: "hockey", league: "NHL", founded: 1967 },
  { id: "nhl-pit", name: "Pittsburgh Penguins", city: "Pittsburgh", abbreviation: "PIT", logo: espnLogo("nhl/500/5.png"), colors: ["#000000", "#FCB514"], sport: "hockey", league: "NHL", founded: 1967 },
  { id: "nhl-sjs", name: "San Jose Sharks", city: "San Jose", abbreviation: "SJS", logo: espnLogo("nhl/500/18.png"), colors: ["#006D75", "#000000"], sport: "hockey", league: "NHL", founded: 1991 },
  { id: "nhl-sea", name: "Seattle Kraken", city: "Seattle", abbreviation: "SEA", logo: espnLogo("nhl/500/36.png"), colors: ["#001628", "#99D9D9"], sport: "hockey", league: "NHL", founded: 2021 },
  { id: "nhl-stl", name: "St. Louis Blues", city: "St. Louis", abbreviation: "STL", logo: espnLogo("nhl/500/19.png"), colors: ["#002F87", "#FCB514"], sport: "hockey", league: "NHL", founded: 1967 },
  { id: "nhl-tb", name: "Tampa Bay Lightning", city: "Tampa", abbreviation: "TBL", logo: espnLogo("nhl/500/14.png"), colors: ["#002868", "#FFFFFF"], sport: "hockey", league: "NHL", founded: 1992 },
  { id: "nhl-tor", name: "Toronto Maple Leafs", city: "Toronto", abbreviation: "TOR", logo: espnLogo("nhl/500/10.png"), colors: ["#00205B", "#FFFFFF"], sport: "hockey", league: "NHL", founded: 1917 },
  { id: "nhl-van", name: "Vancouver Canucks", city: "Vancouver", abbreviation: "VAN", logo: espnLogo("nhl/500/23.png"), colors: ["#001F5B", "#00843D"], sport: "hockey", league: "NHL", founded: 1970 },
  { id: "nhl-vgk", name: "Vegas Golden Knights", city: "Las Vegas", abbreviation: "VGK", logo: espnLogo("nhl/500/37.png"), colors: ["#B4975A", "#333F42"], sport: "hockey", league: "NHL", founded: 2017 },
  { id: "nhl-wpg", name: "Winnipeg Jets", city: "Winnipeg", abbreviation: "WPG", logo: espnLogo("nhl/500/22.png"), colors: ["#041E42", "#004C97"], sport: "hockey", league: "NHL", founded: 1999 },
  { id: "nhl-wsh", name: "Washington Capitals", city: "Washington", abbreviation: "WSH", logo: espnLogo("nhl/500/15.png"), colors: ["#C8102E", "#041E42"], sport: "hockey", league: "NHL", founded: 1974 },
];

// ─── MLS / NWSL TEAMS ───────────────────────────────────
export const MLS_TEAMS: TeamData[] = [
  { id: "mls-atl", name: "Atlanta United", city: "Atlanta", abbreviation: "ATL", logo: espnLogo("soccer/500/18296.png"), colors: ["#80000A", "#221F1F"], sport: "soccer", league: "MLS", founded: 2017 },
  { id: "mls-aus", name: "Austin FC", city: "Austin", abbreviation: "ATX", logo: espnLogo("soccer/500/23703.png"), colors: ["#00B140", "#000000"], sport: "soccer", league: "MLS", founded: 2021 },
  { id: "mls-cha", name: "Charlotte FC", city: "Charlotte", abbreviation: "CLT", logo: espnLogo("soccer/500/23998.png"), colors: ["#1A85C8", "#000000"], sport: "soccer", league: "MLS", founded: 2022 },
  { id: "mls-chi", name: "Chicago Fire", city: "Chicago", abbreviation: "CHI", logo: espnLogo("soccer/500/110.png"), colors: ["#FF0000", "#0A174A"], sport: "soccer", league: "MLS", founded: 1998 },
  { id: "mls-cin", name: "FC Cincinnati", city: "Cincinnati", abbreviation: "CIN", logo: espnLogo("soccer/500/19079.png"), colors: ["#F05323", "#263B80"], sport: "soccer", league: "MLS", founded: 2019 },
  { id: "mls-col", name: "Colorado Rapids", city: "Denver", abbreviation: "COL", logo: espnLogo("soccer/500/105.png"), colors: ["#960A2C", "#9CC2EA"], sport: "soccer", league: "MLS", founded: 1996 },
  { id: "mls-clb", name: "Columbus Crew", city: "Columbus", abbreviation: "CLB", logo: espnLogo("soccer/500/171.png"), colors: ["#000000", "#FEDD00"], sport: "soccer", league: "MLS", founded: 1996 },
  { id: "mls-dal", name: "FC Dallas", city: "Frisco", abbreviation: "DAL", logo: espnLogo("soccer/500/112.png"), colors: ["#BF0D3E", "#002B5C"], sport: "soccer", league: "MLS", founded: 1996 },
  { id: "mls-dc", name: "D.C. United", city: "Washington", abbreviation: "DC", logo: espnLogo("soccer/500/113.png"), colors: ["#000000", "#EF3E42"], sport: "soccer", league: "MLS", founded: 1996 },
  { id: "mls-hou", name: "Houston Dynamo", city: "Houston", abbreviation: "HOU", logo: espnLogo("soccer/500/111.png"), colors: ["#FF6B00", "#101820"], sport: "soccer", league: "MLS", founded: 2006 },
  { id: "mls-lag", name: "LA Galaxy", city: "Carson", abbreviation: "LAG", logo: espnLogo("soccer/500/56.png"), colors: ["#00245D", "#FFD200"], sport: "soccer", league: "MLS", founded: 1996 },
  { id: "mls-lafc", name: "LAFC", city: "Los Angeles", abbreviation: "LAFC", logo: espnLogo("soccer/500/21498.png"), colors: ["#C39E6D", "#000000"], sport: "soccer", league: "MLS", founded: 2018 },
  { id: "mls-mia", name: "Inter Miami", city: "Fort Lauderdale", abbreviation: "MIA", logo: espnLogo("soccer/500/21085.png"), colors: ["#F7B5CD", "#231F20"], sport: "soccer", league: "MLS", founded: 2020 },
  { id: "mls-min", name: "Minnesota United", city: "St. Paul", abbreviation: "MIN", logo: espnLogo("soccer/500/17362.png"), colors: ["#E4E5E6", "#231F20"], sport: "soccer", league: "MLS", founded: 2017 },
  { id: "mls-mtl", name: "CF Montréal", city: "Montréal", abbreviation: "MTL", logo: espnLogo("soccer/500/114.png"), colors: ["#000000", "#1F3D73"], sport: "soccer", league: "MLS", founded: 2012 },
  { id: "mls-nsh", name: "Nashville SC", city: "Nashville", abbreviation: "NSH", logo: espnLogo("soccer/500/21167.png"), colors: ["#ECE83A", "#1F1646"], sport: "soccer", league: "MLS", founded: 2020 },
  { id: "mls-ne", name: "New England Revolution", city: "Foxborough", abbreviation: "NE", logo: espnLogo("soccer/500/109.png"), colors: ["#0A2240", "#CE0F3D"], sport: "soccer", league: "MLS", founded: 1996 },
  { id: "mls-nyc", name: "New York City FC", city: "New York", abbreviation: "NYC", logo: espnLogo("soccer/500/16136.png"), colors: ["#6CACE4", "#041E42"], sport: "soccer", league: "MLS", founded: 2015 },
  { id: "mls-nyrb", name: "New York Red Bulls", city: "Harrison", abbreviation: "NYRB", logo: espnLogo("soccer/500/115.png"), colors: ["#ED1E36", "#FEDD00"], sport: "soccer", league: "MLS", founded: 1996 },
  { id: "mls-orl", name: "Orlando City", city: "Orlando", abbreviation: "ORL", logo: espnLogo("soccer/500/16159.png"), colors: ["#612B9B", "#FFFFFF"], sport: "soccer", league: "MLS", founded: 2015 },
  { id: "mls-phi", name: "Philadelphia Union", city: "Chester", abbreviation: "PHI", logo: espnLogo("soccer/500/3469.png"), colors: ["#071B2C", "#B18500"], sport: "soccer", league: "MLS", founded: 2010 },
  { id: "mls-por", name: "Portland Timbers", city: "Portland", abbreviation: "POR", logo: espnLogo("soccer/500/3500.png"), colors: ["#004812", "#D7A641"], sport: "soccer", league: "MLS", founded: 2011 },
  { id: "mls-rsl", name: "Real Salt Lake", city: "Sandy", abbreviation: "RSL", logo: espnLogo("soccer/500/106.png"), colors: ["#B30838", "#013A81"], sport: "soccer", league: "MLS", founded: 2005 },
  { id: "mls-sj", name: "San Jose Earthquakes", city: "San Jose", abbreviation: "SJ", logo: espnLogo("soccer/500/107.png"), colors: ["#0067B1", "#000000"], sport: "soccer", league: "MLS", founded: 1996 },
  { id: "mls-sea", name: "Seattle Sounders", city: "Seattle", abbreviation: "SEA", logo: espnLogo("soccer/500/3507.png"), colors: ["#005595", "#658D1B"], sport: "soccer", league: "MLS", founded: 2009 },
  { id: "mls-skc", name: "Sporting Kansas City", city: "Kansas City", abbreviation: "SKC", logo: espnLogo("soccer/500/108.png"), colors: ["#002F65", "#93B1D7"], sport: "soccer", league: "MLS", founded: 1996 },
  { id: "mls-stl", name: "St. Louis City SC", city: "St. Louis", abbreviation: "STL", logo: espnLogo("soccer/500/24111.png"), colors: ["#E4003B", "#002F5F"], sport: "soccer", league: "MLS", founded: 2023 },
  { id: "mls-tor", name: "Toronto FC", city: "Toronto", abbreviation: "TOR", logo: espnLogo("soccer/500/2687.png"), colors: ["#E31837", "#B6B6B6"], sport: "soccer", league: "MLS", founded: 2007 },
  { id: "mls-van", name: "Vancouver Whitecaps", city: "Vancouver", abbreviation: "VAN", logo: espnLogo("soccer/500/3504.png"), colors: ["#00245E", "#9DC2EA"], sport: "soccer", league: "MLS", founded: 2011 },
];

export const NWSL_TEAMS: TeamData[] = [
  { id: "nwsl-acfc", name: "Angel City FC", city: "Los Angeles", abbreviation: "ACFC", logo: espnLogo("soccer/500/23807.png"), colors: ["#E35205", "#090909"], sport: "soccer", league: "NWSL", founded: 2022 },
  { id: "nwsl-cur", name: "Chicago Red Stars", city: "Chicago", abbreviation: "CHI", logo: espnLogo("soccer/500/9917.png"), colors: ["#CF0032", "#41B6E6"], sport: "soccer", league: "NWSL", founded: 2013 },
  { id: "nwsl-hou", name: "Houston Dash", city: "Houston", abbreviation: "HOU", logo: espnLogo("soccer/500/9918.png"), colors: ["#F36F21", "#101820"], sport: "soccer", league: "NWSL", founded: 2014 },
  { id: "nwsl-kc", name: "KC Current", city: "Kansas City", abbreviation: "KC", logo: espnLogo("soccer/500/21897.png"), colors: ["#7CCDE4", "#F0567A"], sport: "soccer", league: "NWSL", founded: 2021 },
  { id: "nwsl-nc", name: "North Carolina Courage", city: "Cary", abbreviation: "NC", logo: espnLogo("soccer/500/18290.png"), colors: ["#003DA5", "#CE0F69"], sport: "soccer", league: "NWSL", founded: 2017 },
  { id: "nwsl-orl", name: "Orlando Pride", city: "Orlando", abbreviation: "ORL", logo: espnLogo("soccer/500/16817.png"), colors: ["#623295", "#FFFFFF"], sport: "soccer", league: "NWSL", founded: 2016 },
  { id: "nwsl-por", name: "Portland Thorns", city: "Portland", abbreviation: "POR", logo: espnLogo("soccer/500/7494.png"), colors: ["#004812", "#D4143C"], sport: "soccer", league: "NWSL", founded: 2013 },
  { id: "nwsl-sd", name: "San Diego Wave", city: "San Diego", abbreviation: "SD", logo: espnLogo("soccer/500/23843.png"), colors: ["#003DA5", "#2CCCD3"], sport: "soccer", league: "NWSL", founded: 2022 },
  { id: "nwsl-sea", name: "Seattle Reign", city: "Seattle", abbreviation: "SEA", logo: espnLogo("soccer/500/7527.png"), colors: ["#002B5C", "#F1B434"], sport: "soccer", league: "NWSL", founded: 2013 },
  { id: "nwsl-was", name: "Washington Spirit", city: "Washington", abbreviation: "WAS", logo: espnLogo("soccer/500/7538.png"), colors: ["#C8102E", "#002B5C"], sport: "soccer", league: "NWSL", founded: 2013 },
];

// ─── TOP COLLEGE TEAMS (50) ─────────────────────────────
export interface CollegeTeamData extends TeamData {
  conference: string;
  primarySport: string;
  mascot: string;
}

export const COLLEGE_TEAMS_FULL: CollegeTeamData[] = [
  { id: "ncaa-alabama", name: "Alabama Crimson Tide", city: "Tuscaloosa", abbreviation: "ALA", logo: ncaaLogo(333), colors: ["#9E1B32", "#FFFFFF"], sport: "football", league: "NCAA", conference: "SEC", founded: 1831, primarySport: "Football", mascot: "Big Al" },
  { id: "ncaa-ohio-st", name: "Ohio State Buckeyes", city: "Columbus", abbreviation: "OSU", logo: ncaaLogo(194), colors: ["#BB0000", "#666666"], sport: "football", league: "NCAA", conference: "Big Ten", founded: 1870, primarySport: "Football", mascot: "Brutus Buckeye" },
  { id: "ncaa-georgia", name: "Georgia Bulldogs", city: "Athens", abbreviation: "UGA", logo: ncaaLogo(61), colors: ["#BA0C2F", "#000000"], sport: "football", league: "NCAA", conference: "SEC", founded: 1785, primarySport: "Football", mascot: "Uga" },
  { id: "ncaa-michigan", name: "Michigan Wolverines", city: "Ann Arbor", abbreviation: "MICH", logo: ncaaLogo(130), colors: ["#00274C", "#FFCB05"], sport: "football", league: "NCAA", conference: "Big Ten", founded: 1817, primarySport: "Football", mascot: "Wolverine" },
  { id: "ncaa-texas", name: "Texas Longhorns", city: "Austin", abbreviation: "TEX", logo: ncaaLogo(251), colors: ["#BF5700", "#FFFFFF"], sport: "football", league: "NCAA", conference: "SEC", founded: 1883, primarySport: "Football", mascot: "Bevo" },
  { id: "ncaa-usc", name: "USC Trojans", city: "Los Angeles", abbreviation: "USC", logo: ncaaLogo(30), colors: ["#990000", "#FFC72C"], sport: "football", league: "NCAA", conference: "Big Ten", founded: 1880, primarySport: "Football", mascot: "Traveler" },
  { id: "ncaa-notre-dame", name: "Notre Dame Fighting Irish", city: "South Bend", abbreviation: "ND", logo: ncaaLogo(87), colors: ["#0C2340", "#C99700"], sport: "football", league: "NCAA", conference: "Independent", founded: 1842, primarySport: "Football", mascot: "Leprechaun" },
  { id: "ncaa-clemson", name: "Clemson Tigers", city: "Clemson", abbreviation: "CLEM", logo: ncaaLogo(228), colors: ["#F56600", "#522D80"], sport: "football", league: "NCAA", conference: "ACC", founded: 1889, primarySport: "Football", mascot: "The Tiger" },
  { id: "ncaa-penn-st", name: "Penn State Nittany Lions", city: "State College", abbreviation: "PSU", logo: ncaaLogo(213), colors: ["#041E42", "#FFFFFF"], sport: "football", league: "NCAA", conference: "Big Ten", founded: 1855, primarySport: "Football", mascot: "Nittany Lion" },
  { id: "ncaa-florida", name: "Florida Gators", city: "Gainesville", abbreviation: "UF", logo: ncaaLogo(57), colors: ["#0021A5", "#FA4616"], sport: "football", league: "NCAA", conference: "SEC", founded: 1853, primarySport: "Football", mascot: "Albert & Alberta" },
  { id: "ncaa-duke", name: "Duke Blue Devils", city: "Durham", abbreviation: "DUKE", logo: ncaaLogo(150), colors: ["#001A57", "#FFFFFF"], sport: "basketball", league: "NCAA", conference: "ACC", founded: 1838, primarySport: "Basketball", mascot: "Blue Devil" },
  { id: "ncaa-unc", name: "North Carolina Tar Heels", city: "Chapel Hill", abbreviation: "UNC", logo: ncaaLogo(153), colors: ["#7BAFD4", "#FFFFFF"], sport: "basketball", league: "NCAA", conference: "ACC", founded: 1789, primarySport: "Basketball", mascot: "Rameses" },
  { id: "ncaa-kansas", name: "Kansas Jayhawks", city: "Lawrence", abbreviation: "KU", logo: ncaaLogo(2305), colors: ["#0051BA", "#E8000D"], sport: "basketball", league: "NCAA", conference: "Big 12", founded: 1865, primarySport: "Basketball", mascot: "Jay Hawk" },
  { id: "ncaa-kentucky", name: "Kentucky Wildcats", city: "Lexington", abbreviation: "UK", logo: ncaaLogo(96), colors: ["#0033A0", "#FFFFFF"], sport: "basketball", league: "NCAA", conference: "SEC", founded: 1865, primarySport: "Basketball", mascot: "Wildcat" },
  { id: "ncaa-ucla", name: "UCLA Bruins", city: "Los Angeles", abbreviation: "UCLA", logo: ncaaLogo(26), colors: ["#2D68C4", "#F2A900"], sport: "basketball", league: "NCAA", conference: "Big Ten", founded: 1919, primarySport: "Basketball", mascot: "Joe Bruin" },
  { id: "ncaa-villanova", name: "Villanova Wildcats", city: "Villanova", abbreviation: "NOVA", logo: ncaaLogo(222), colors: ["#003366", "#FFFFFF"], sport: "basketball", league: "NCAA", conference: "Big East", founded: 1842, primarySport: "Basketball", mascot: "Will D. Cat" },
  { id: "ncaa-gonzaga", name: "Gonzaga Bulldogs", city: "Spokane", abbreviation: "GONZ", logo: ncaaLogo(2250), colors: ["#002967", "#C8102E"], sport: "basketball", league: "NCAA", conference: "WCC", founded: 1887, primarySport: "Basketball", mascot: "Spike" },
  { id: "ncaa-lsu", name: "LSU Tigers", city: "Baton Rouge", abbreviation: "LSU", logo: ncaaLogo(99), colors: ["#461D7C", "#FDD023"], sport: "football", league: "NCAA", conference: "SEC", founded: 1860, primarySport: "Multi-sport", mascot: "Mike the Tiger" },
  { id: "ncaa-oregon", name: "Oregon Ducks", city: "Eugene", abbreviation: "ORE", logo: ncaaLogo(2483), colors: ["#154733", "#FEE123"], sport: "football", league: "NCAA", conference: "Big Ten", founded: 1876, primarySport: "Football", mascot: "The Duck" },
  { id: "ncaa-oklahoma", name: "Oklahoma Sooners", city: "Norman", abbreviation: "OU", logo: ncaaLogo(201), colors: ["#841617", "#FDF9D8"], sport: "football", league: "NCAA", conference: "SEC", founded: 1890, primarySport: "Football", mascot: "Boomer & Sooner" },
  { id: "ncaa-stanford", name: "Stanford Cardinal", city: "Stanford", abbreviation: "STAN", logo: ncaaLogo(24), colors: ["#8C1515", "#FFFFFF"], sport: "football", league: "NCAA", conference: "ACC", founded: 1885, primarySport: "Multi-sport", mascot: "Cardinal" },
  { id: "ncaa-auburn", name: "Auburn Tigers", city: "Auburn", abbreviation: "AUB", logo: ncaaLogo(2), colors: ["#0C2340", "#E87722"], sport: "football", league: "NCAA", conference: "SEC", founded: 1856, primarySport: "Football", mascot: "Aubie" },
  { id: "ncaa-tennessee", name: "Tennessee Volunteers", city: "Knoxville", abbreviation: "TENN", logo: ncaaLogo(2633), colors: ["#FF8200", "#FFFFFF"], sport: "football", league: "NCAA", conference: "SEC", founded: 1794, primarySport: "Football", mascot: "Smokey" },
  { id: "ncaa-iowa", name: "Iowa Hawkeyes", city: "Iowa City", abbreviation: "IOWA", logo: ncaaLogo(2294), colors: ["#FFCD00", "#000000"], sport: "football", league: "NCAA", conference: "Big Ten", founded: 1847, primarySport: "Football", mascot: "Herky" },
  { id: "ncaa-wisconsin", name: "Wisconsin Badgers", city: "Madison", abbreviation: "WIS", logo: ncaaLogo(275), colors: ["#C5050C", "#FFFFFF"], sport: "football", league: "NCAA", conference: "Big Ten", founded: 1848, primarySport: "Football", mascot: "Bucky Badger" },
  { id: "ncaa-mich-st", name: "Michigan State Spartans", city: "East Lansing", abbreviation: "MSU", logo: ncaaLogo(127), colors: ["#18453B", "#FFFFFF"], sport: "basketball", league: "NCAA", conference: "Big Ten", founded: 1855, primarySport: "Basketball", mascot: "Sparty" },
  { id: "ncaa-uconn", name: "UConn Huskies", city: "Storrs", abbreviation: "UCONN", logo: ncaaLogo(41), colors: ["#000E2F", "#FFFFFF"], sport: "basketball", league: "NCAA", conference: "Big East", founded: 1881, primarySport: "Basketball", mascot: "Jonathan" },
  { id: "ncaa-baylor", name: "Baylor Bears", city: "Waco", abbreviation: "BAY", logo: ncaaLogo(239), colors: ["#003015", "#FECB00"], sport: "basketball", league: "NCAA", conference: "Big 12", founded: 1845, primarySport: "Basketball", mascot: "Bruiser & Marigold" },
  { id: "ncaa-arkansas", name: "Arkansas Razorbacks", city: "Fayetteville", abbreviation: "ARK", logo: ncaaLogo(8), colors: ["#9D2235", "#FFFFFF"], sport: "football", league: "NCAA", conference: "SEC", founded: 1871, primarySport: "Football", mascot: "Tusk" },
  { id: "ncaa-florida-st", name: "Florida State Seminoles", city: "Tallahassee", abbreviation: "FSU", logo: ncaaLogo(52), colors: ["#782F40", "#CEB888"], sport: "football", league: "NCAA", conference: "ACC", founded: 1851, primarySport: "Football", mascot: "Osceola & Renegade" },
  { id: "ncaa-miami", name: "Miami Hurricanes", city: "Coral Gables", abbreviation: "MIA", logo: ncaaLogo(2390), colors: ["#F47321", "#005030"], sport: "football", league: "NCAA", conference: "ACC", founded: 1925, primarySport: "Football", mascot: "Sebastian" },
  { id: "ncaa-nebraska", name: "Nebraska Cornhuskers", city: "Lincoln", abbreviation: "NEB", logo: ncaaLogo(158), colors: ["#E41C38", "#FFFFFF"], sport: "football", league: "NCAA", conference: "Big Ten", founded: 1869, primarySport: "Football", mascot: "Herbie Husker" },
  { id: "ncaa-colorado", name: "Colorado Buffaloes", city: "Boulder", abbreviation: "CU", logo: ncaaLogo(38), colors: ["#CFB87C", "#000000"], sport: "football", league: "NCAA", conference: "Big 12", founded: 1876, primarySport: "Football", mascot: "Ralphie" },
  { id: "ncaa-texas-am", name: "Texas A&M Aggies", city: "College Station", abbreviation: "TAMU", logo: ncaaLogo(245), colors: ["#500000", "#FFFFFF"], sport: "football", league: "NCAA", conference: "SEC", founded: 1876, primarySport: "Football", mascot: "Reveille" },
  { id: "ncaa-vanderbilt", name: "Vanderbilt Commodores", city: "Nashville", abbreviation: "VAN", logo: ncaaLogo(238), colors: ["#866D4B", "#000000"], sport: "baseball", league: "NCAA", conference: "SEC", founded: 1873, primarySport: "Baseball", mascot: "Mr. Commodore" },
  { id: "ncaa-arizona", name: "Arizona Wildcats", city: "Tucson", abbreviation: "ARIZ", logo: ncaaLogo(12), colors: ["#003366", "#CC0033"], sport: "basketball", league: "NCAA", conference: "Big 12", founded: 1885, primarySport: "Basketball", mascot: "Wilbur & Wilma" },
  { id: "ncaa-creighton", name: "Creighton Bluejays", city: "Omaha", abbreviation: "CREI", logo: ncaaLogo(156), colors: ["#005CA9", "#FFFFFF"], sport: "basketball", league: "NCAA", conference: "Big East", founded: 1878, primarySport: "Basketball", mascot: "Billy Bluejay" },
  { id: "ncaa-purdue", name: "Purdue Boilermakers", city: "West Lafayette", abbreviation: "PUR", logo: ncaaLogo(2509), colors: ["#CEB888", "#000000"], sport: "basketball", league: "NCAA", conference: "Big Ten", founded: 1869, primarySport: "Basketball", mascot: "Purdue Pete" },
  { id: "ncaa-houston", name: "Houston Cougars", city: "Houston", abbreviation: "UH", logo: ncaaLogo(248), colors: ["#C8102E", "#FFFFFF"], sport: "basketball", league: "NCAA", conference: "Big 12", founded: 1927, primarySport: "Basketball", mascot: "Shasta" },
  { id: "ncaa-ole-miss", name: "Ole Miss Rebels", city: "Oxford", abbreviation: "MISS", logo: ncaaLogo(145), colors: ["#CE1126", "#14213D"], sport: "football", league: "NCAA", conference: "SEC", founded: 1848, primarySport: "Football", mascot: "Tony the Landshark" },
  { id: "ncaa-washington", name: "Washington Huskies", city: "Seattle", abbreviation: "UW", logo: ncaaLogo(264), colors: ["#4B2E83", "#B7A57A"], sport: "football", league: "NCAA", conference: "Big Ten", founded: 1861, primarySport: "Football", mascot: "Harry the Husky" },
  { id: "ncaa-iowa-st", name: "Iowa State Cyclones", city: "Ames", abbreviation: "ISU", logo: ncaaLogo(66), colors: ["#C8102E", "#F1BE48"], sport: "basketball", league: "NCAA", conference: "Big 12", founded: 1858, primarySport: "Basketball", mascot: "Cy the Cardinal" },
  { id: "ncaa-marquette", name: "Marquette Golden Eagles", city: "Milwaukee", abbreviation: "MARQ", logo: ncaaLogo(269), colors: ["#003366", "#FFCC00"], sport: "basketball", league: "NCAA", conference: "Big East", founded: 1881, primarySport: "Basketball", mascot: "Iggy" },
  { id: "ncaa-virginia", name: "Virginia Cavaliers", city: "Charlottesville", abbreviation: "UVA", logo: ncaaLogo(258), colors: ["#232D4B", "#F84C1E"], sport: "basketball", league: "NCAA", conference: "ACC", founded: 1819, primarySport: "Basketball", mascot: "Cavalier" },
  { id: "ncaa-sc", name: "South Carolina Gamecocks", city: "Columbia", abbreviation: "SC", logo: ncaaLogo(2579), colors: ["#73000A", "#000000"], sport: "basketball", league: "NCAA", conference: "SEC", founded: 1801, primarySport: "Basketball", mascot: "Cocky" },
  { id: "ncaa-miss-st", name: "Mississippi State Bulldogs", city: "Starkville", abbreviation: "MSST", logo: ncaaLogo(344), colors: ["#660000", "#FFFFFF"], sport: "football", league: "NCAA", conference: "SEC", founded: 1878, primarySport: "Football", mascot: "Bully" },
  { id: "ncaa-missouri", name: "Missouri Tigers", city: "Columbia", abbreviation: "MIZ", logo: ncaaLogo(142), colors: ["#F1B82D", "#000000"], sport: "football", league: "NCAA", conference: "SEC", founded: 1839, primarySport: "Football", mascot: "Truman the Tiger" },
  { id: "ncaa-wvu", name: "West Virginia Mountaineers", city: "Morgantown", abbreviation: "WVU", logo: ncaaLogo(277), colors: ["#002855", "#EAAA00"], sport: "football", league: "NCAA", conference: "Big 12", founded: 1867, primarySport: "Football", mascot: "The Mountaineer" },
  { id: "ncaa-arizona-st", name: "Arizona State Sun Devils", city: "Tempe", abbreviation: "ASU", logo: ncaaLogo(9), colors: ["#8C1D40", "#FFC627"], sport: "football", league: "NCAA", conference: "Big 12", founded: 1885, primarySport: "Football", mascot: "Sparky" },
  { id: "ncaa-wake-forest", name: "Wake Forest Demon Deacons", city: "Winston-Salem", abbreviation: "WF", logo: ncaaLogo(154), colors: ["#9E7E38", "#000000"], sport: "football", league: "NCAA", conference: "ACC", founded: 1834, primarySport: "Multi-sport", mascot: "Demon Deacon" },
];

// ─── GENERATORS ─────────────────────────────────────────

/** Convert a TeamData to a ChannelSchema */
export const teamToChannel = (team: TeamData, type: ChannelType = "professional_team"): ChannelSchema => ({
  channelId: team.id,
  type,
  sport: team.sport,
  league: team.league,
  name: team.name,
  handle: `@${team.abbreviation.toLowerCase()}`,
  avatar: team.logo,
  banner: `${thumbBase}1504450758-28f095a56e89?w=1200&h=600&fit=crop`,
  description: `Official ${team.name} content — highlights, behind-the-scenes, and exclusive access.`,
  verified: true,
  followers: Math.floor(Math.random() * 5_000_000) + 100_000,
  totalVideos: Math.floor(Math.random() * 1500) + 50,
  totalViews: Math.floor(Math.random() * 500_000_000) + 1_000_000,
  totalLikes: Math.floor(Math.random() * 50_000_000) + 100_000,
  location: `${team.city}, ${team.league === "NHL" || team.league === "MLS" ? "" : "USA"}`.trim(),
  founded: team.founded,
  brandColors: { primary: team.colors[0], accent: team.colors[1] },
  socialLinks: {
    website: team.website || `https://${team.name.toLowerCase().replace(/\s+/g, "")}.com`,
    twitter: `@${team.abbreviation}`,
    instagram: `@${team.abbreviation.toLowerCase()}`,
  },
  category: type === "college_team" ? "sports_team" : "sports_team",
  tags: [team.sport, team.league.toLowerCase(), team.city.toLowerCase(), team.name.split(" ").pop()!.toLowerCase()],
  uploadSchedule: "Daily during season",
  contactEmail: `media@${team.abbreviation.toLowerCase()}.com`,
  admins: [`admin_${team.id}`],
  createdAt: "2026-01-15",
  featured: false,
});

/** All teams combined */
export const ALL_PRO_TEAMS = [...NFL_TEAMS, ...NBA_TEAMS, ...MLB_TEAMS, ...NHL_TEAMS, ...MLS_TEAMS, ...NWSL_TEAMS];

/** Get teams by league */
export const getTeamsByLeague = (league: League): TeamData[] => {
  switch (league) {
    case "NFL": return NFL_TEAMS;
    case "NBA": return NBA_TEAMS;
    case "MLB": return MLB_TEAMS;
    case "NHL": return NHL_TEAMS;
    case "MLS": return MLS_TEAMS;
    case "NWSL": return NWSL_TEAMS;
    case "NCAA": return COLLEGE_TEAMS_FULL;
    default: return [];
  }
};

/** Search across all teams */
export const searchTeams = (query: string): TeamData[] => {
  const q = query.toLowerCase();
  return ALL_PRO_TEAMS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.city.toLowerCase().includes(q) ||
      t.abbreviation.toLowerCase().includes(q) ||
      t.sport.includes(q) ||
      t.league.toLowerCase().includes(q)
  );
};
