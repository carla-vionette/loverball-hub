const logo = (team: string) =>
  `https://a.espncdn.com/combiner/i?img=/i/teamlogos/${team}&h=200&w=200`;
const ncaaLogo = (id: number) =>
  `https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/${id}.png&h=200&w=200`;
const thumbBase = "https://images.unsplash.com/photo-";
const avatar = (seed: string) =>
  thumbBase + seed + "?w=200&h=200&fit=crop&crop=faces";

export type ChannelCategory =
  | "pro"
  | "college"
  | "creator"
  | "loverball"
  | "trending";

export interface DiscoverChannel {
  id: string;
  name: string;
  logo: string;
  coverImage?: string;
  description: string;
  followers: number;
  sportBadge: string;
  category: ChannelCategory;
  verified?: boolean;
  tags?: string[];
  latestThumb?: string;
  trendingRank?: number;
  conference?: string;
}

// ─── FEATURED ───────────────────────────────────────────
export const FEATURED_CHANNELS: DiscoverChannel[] = [
  {
    id: "feat-1",
    name: "Los Angeles Lakers",
    logo: logo("nba/500/13.png"),
    coverImage: thumbBase + "1504450758-28f095a56e89?w=1200&h=600&fit=crop",
    description: "Official Lakers channel — highlights, behind-the-scenes, and exclusive content from Crypto.com Arena.",
    followers: 8_500_000,
    sportBadge: "NBA",
    category: "pro",
    verified: true,
  },
  {
    id: "feat-2",
    name: "Angel City FC",
    logo: logo("soccer/500/23807.png"),
    coverImage: thumbBase + "1574629810360-7efbbe195018?w=1200&h=600&fit=crop",
    description: "Los Angeles' NWSL club. Matchday content, player interviews, and community stories.",
    followers: 420_000,
    sportBadge: "NWSL",
    category: "pro",
    verified: true,
  },
  {
    id: "feat-3",
    name: "Loverball Originals",
    logo: "",
    coverImage: thumbBase + "1546519638-68e109498ffc?w=1200&h=600&fit=crop",
    description: "Original documentaries, long-form features, and exclusive sports storytelling from the Loverball team.",
    followers: 98_000,
    sportBadge: "Originals",
    category: "loverball",
    verified: true,
  },
];

// ─── PROFESSIONAL TEAMS ─────────────────────────────────
export const PRO_TEAMS: DiscoverChannel[] = [
  { id: "pro-lakers", name: "Los Angeles Lakers", logo: logo("nba/500/13.png"), description: "Showtime in LA", followers: 8_500_000, sportBadge: "NBA", category: "pro", verified: true, latestThumb: thumbBase + "1504450758-28f095a56e89?w=400&h=225&fit=crop" },
  { id: "pro-clippers", name: "LA Clippers", logo: logo("nba/500/12.png"), description: "The other side of LA", followers: 2_100_000, sportBadge: "NBA", category: "pro", verified: true, latestThumb: thumbBase + "1546519638-68e109498ffc?w=400&h=225&fit=crop" },
  { id: "pro-sparks", name: "Los Angeles Sparks", logo: logo("wnba/500/6.png"), description: "WNBA in LA", followers: 340_000, sportBadge: "WNBA", category: "pro", verified: true, latestThumb: thumbBase + "1431324155629-1a6deb1dec8d?w=400&h=225&fit=crop" },
  { id: "pro-dodgers", name: "Los Angeles Dodgers", logo: logo("mlb/500/19.png"), description: "Boys in Blue", followers: 5_200_000, sportBadge: "MLB", category: "pro", verified: true, latestThumb: thumbBase + "1579952363873-27f3bade9f55?w=400&h=225&fit=crop" },
  { id: "pro-angels", name: "Los Angeles Angels", logo: logo("mlb/500/3.png"), description: "Halo'd up", followers: 1_800_000, sportBadge: "MLB", category: "pro", verified: true, latestThumb: thumbBase + "1461896836934-bd45ea8b2c58?w=400&h=225&fit=crop" },
  { id: "pro-rams", name: "Los Angeles Rams", logo: logo("nfl/500/14.png"), description: "SoFi Stadium", followers: 3_600_000, sportBadge: "NFL", category: "pro", verified: true, latestThumb: thumbBase + "1517649763962-0c623066013b?w=400&h=225&fit=crop" },
  { id: "pro-chargers", name: "Los Angeles Chargers", logo: logo("nfl/500/24.png"), description: "Bolt up", followers: 2_400_000, sportBadge: "NFL", category: "pro", verified: true, latestThumb: thumbBase + "1574629810360-7efbbe195018?w=400&h=225&fit=crop" },
  { id: "pro-kings", name: "Los Angeles Kings", logo: logo("nhl/500/8.png"), description: "LA Hockey", followers: 1_200_000, sportBadge: "NHL", category: "pro", verified: true, latestThumb: thumbBase + "1571019613454-1cb2f99b2d8b?w=400&h=225&fit=crop" },
  { id: "pro-ducks", name: "Anaheim Ducks", logo: logo("nhl/500/25.png"), description: "Quack quack", followers: 890_000, sportBadge: "NHL", category: "pro", verified: true, latestThumb: thumbBase + "1504450758-28f095a56e89?w=400&h=225&fit=crop" },
  { id: "pro-galaxy", name: "LA Galaxy", logo: logo("soccer/500/56.png"), description: "MLS originals", followers: 1_500_000, sportBadge: "MLS", category: "pro", verified: true, latestThumb: thumbBase + "1579952363873-27f3bade9f55?w=400&h=225&fit=crop" },
  { id: "pro-lafc", name: "LAFC", logo: logo("soccer/500/21498.png"), description: "The Black & Gold", followers: 980_000, sportBadge: "MLS", category: "pro", verified: true, latestThumb: thumbBase + "1574629810360-7efbbe195018?w=400&h=225&fit=crop" },
  { id: "pro-acfc", name: "Angel City FC", logo: logo("soccer/500/23807.png"), description: "NWSL LA", followers: 420_000, sportBadge: "NWSL", category: "pro", verified: true, latestThumb: thumbBase + "1546519638-68e109498ffc?w=400&h=225&fit=crop" },
];

// ─── COLLEGE TEAMS ──────────────────────────────────────
export const COLLEGE_TEAMS: DiscoverChannel[] = [
  { id: "col-ucla", name: "UCLA Bruins", logo: ncaaLogo(26), description: "Go Bruins", followers: 2_100_000, sportBadge: "Pac-12", category: "college", verified: true, conference: "Big Ten", latestThumb: thumbBase + "1461896836934-bd45ea8b2c58?w=400&h=225&fit=crop" },
  { id: "col-usc", name: "USC Trojans", logo: ncaaLogo(30), description: "Fight On", followers: 2_400_000, sportBadge: "Pac-12", category: "college", verified: true, conference: "Big Ten", latestThumb: thumbBase + "1517649763962-0c623066013b?w=400&h=225&fit=crop" },
  { id: "col-alabama", name: "Alabama Crimson Tide", logo: ncaaLogo(333), description: "Roll Tide", followers: 3_800_000, sportBadge: "SEC", category: "college", verified: true, conference: "SEC", latestThumb: thumbBase + "1504450758-28f095a56e89?w=400&h=225&fit=crop" },
  { id: "col-osu", name: "Ohio State Buckeyes", logo: ncaaLogo(194), description: "O-H!", followers: 3_200_000, sportBadge: "Big Ten", category: "college", verified: true, conference: "Big Ten", latestThumb: thumbBase + "1574629810360-7efbbe195018?w=400&h=225&fit=crop" },
  { id: "col-duke", name: "Duke Blue Devils", logo: ncaaLogo(150), description: "Cameron Crazies", followers: 1_900_000, sportBadge: "ACC", category: "college", verified: true, conference: "ACC", latestThumb: thumbBase + "1546519638-68e109498ffc?w=400&h=225&fit=crop" },
  { id: "col-michigan", name: "Michigan Wolverines", logo: ncaaLogo(130), description: "Go Blue", followers: 2_800_000, sportBadge: "Big Ten", category: "college", verified: true, conference: "Big Ten", latestThumb: thumbBase + "1579952363873-27f3bade9f55?w=400&h=225&fit=crop" },
  { id: "col-lsu", name: "LSU Tigers", logo: ncaaLogo(99), description: "Geaux Tigers", followers: 2_600_000, sportBadge: "SEC", category: "college", verified: true, conference: "SEC", latestThumb: thumbBase + "1431324155629-1a6deb1dec8d?w=400&h=225&fit=crop" },
  { id: "col-stanford", name: "Stanford Cardinal", logo: ncaaLogo(24), description: "The Farm", followers: 980_000, sportBadge: "ACC", category: "college", verified: true, conference: "ACC", latestThumb: thumbBase + "1571019613454-1cb2f99b2d8b?w=400&h=225&fit=crop" },
  { id: "col-unc", name: "UNC Tar Heels", logo: ncaaLogo(153), description: "Carolina Blue", followers: 2_200_000, sportBadge: "ACC", category: "college", verified: true, conference: "ACC", latestThumb: thumbBase + "1461896836934-bd45ea8b2c58?w=400&h=225&fit=crop" },
  { id: "col-texas", name: "Texas Longhorns", logo: ncaaLogo(251), description: "Hook 'em", followers: 3_500_000, sportBadge: "SEC", category: "college", verified: true, conference: "SEC", latestThumb: thumbBase + "1517649763962-0c623066013b?w=400&h=225&fit=crop" },
];

// ─── CREATOR CHANNELS ───────────────────────────────────
export const CREATOR_CHANNELS: DiscoverChannel[] = [
  { id: "cr-1", name: "Court Vision", logo: avatar("1494790108377-be9c29b29330"), description: "Basketball strategy & game breakdowns", followers: 83_000, sportBadge: "Basketball", category: "creator", verified: true, tags: ["Analysis", "Basketball"] },
  { id: "cr-2", name: "Skill School", logo: avatar("1472099645785-5658abf4ff4e"), description: "Tutorials, drills, and skill breakdowns", followers: 152_000, sportBadge: "Multi-sport", category: "creator", verified: true, tags: ["Tutorials", "Training"] },
  { id: "cr-3", name: "Inside the Game", logo: avatar("1507003211169-0a1dd7228f2d"), description: "Behind-the-scenes with pro & amateur athletes", followers: 56_000, sportBadge: "Multi-sport", category: "creator", verified: false, tags: ["BTS", "Interviews"] },
  { id: "cr-4", name: "Fan Life", logo: avatar("1438761681033-6461ffad8d80"), description: "Vlogs from the stands, tailgates, and fan culture", followers: 31_000, sportBadge: "Fan Culture", category: "creator", verified: false, tags: ["Vlogs", "Culture"] },
  { id: "cr-5", name: "Sports Style", logo: avatar("1535930749574-1399327ce78f"), description: "Where sports meets streetwear and fashion", followers: 124_000, sportBadge: "Fashion", category: "creator", verified: true, tags: ["Fashion", "Sneakers"] },
  { id: "cr-6", name: "The Playbook", logo: avatar("1500648767791-00dcc994a43e"), description: "Fantasy sports tips, betting insights, and analytics", followers: 67_000, sportBadge: "Fantasy", category: "creator", verified: false, tags: ["Fantasy", "Analytics"] },
  { id: "cr-7", name: "Fit Check", logo: avatar("1534528741775-53994a69daeb"), description: "Athlete workout routines and fitness content", followers: 210_000, sportBadge: "Fitness", category: "creator", verified: true, tags: ["Fitness", "Health"] },
  { id: "cr-8", name: "Courtside Stories", logo: avatar("1517841905240-472988babdf9"), description: "Human stories from the world of sports", followers: 45_000, sportBadge: "Stories", category: "creator", verified: false, tags: ["Documentary", "Stories"] },
];

// ─── LOVERBALL NETWORK ──────────────────────────────────
export const LOVERBALL_CHANNELS: DiscoverChannel[] = [
  { id: "lb-1", name: "Loverball Highlights", logo: "", description: "Official highlights and top plays curated by the Loverball team", followers: 124_000, sportBadge: "Highlights", category: "loverball", verified: true, tags: ["Official"] },
  { id: "lb-2", name: "Loverball Originals", logo: "", description: "Original documentaries and long-form sports storytelling", followers: 98_000, sportBadge: "Originals", category: "loverball", verified: true, tags: ["Official"] },
  { id: "lb-3", name: "Loverball Events", logo: "", description: "Coverage from Loverball community events and gatherings", followers: 67_000, sportBadge: "Events", category: "loverball", verified: true, tags: ["Official"] },
  { id: "lb-4", name: "Loverball Culture", logo: "", description: "Sports culture, fashion, and lifestyle content", followers: 89_000, sportBadge: "Culture", category: "loverball", verified: true, tags: ["Official"] },
];

// ─── TRENDING ───────────────────────────────────────────
export const TRENDING_CHANNELS: DiscoverChannel[] = [
  { ...PRO_TEAMS[0], id: "trend-1", trendingRank: 1 },
  { ...CREATOR_CHANNELS[6], id: "trend-2", trendingRank: 2 },
  { ...COLLEGE_TEAMS[0], id: "trend-3", trendingRank: 3 },
  { ...CREATOR_CHANNELS[4], id: "trend-4", trendingRank: 4 },
  { ...PRO_TEAMS[9], id: "trend-5", trendingRank: 5 },
  { ...COLLEGE_TEAMS[3], id: "trend-6", trendingRank: 6 },
  { ...CREATOR_CHANNELS[1], id: "trend-7", trendingRank: 7 },
  { ...PRO_TEAMS[5], id: "trend-8", trendingRank: 8 },
];

// ─── RECOMMENDED ────────────────────────────────────────
export const RECOMMENDED_CHANNELS: DiscoverChannel[] = [
  { ...CREATOR_CHANNELS[0], id: "rec-1" },
  { ...PRO_TEAMS[2], id: "rec-2" },
  { ...COLLEGE_TEAMS[4], id: "rec-3" },
  { ...CREATOR_CHANNELS[7], id: "rec-4" },
  { ...PRO_TEAMS[11], id: "rec-5" },
  { ...COLLEGE_TEAMS[8], id: "rec-6" },
];

export const DISCOVER_FILTERS = [
  "All",
  "Sports Teams",
  "College Teams",
  "Creators",
  "Following",
] as const;

export type DiscoverFilter = (typeof DISCOVER_FILTERS)[number];
