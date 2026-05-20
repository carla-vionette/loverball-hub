// Mock data for the Starting XI v1 prototype.
// Demo content only — replace with live AI-surfaced members once backend is wired.

export type Member = {
  id: string;
  name: string;          // "Chloe S."
  firstName: string;
  photo: string;
  match: number;         // 75-98
  team: string;          // primary team
  city: string;
  vibe: string;          // short Courier-style line
  tags: string[];        // short uppercase chips
  teams: string[];       // all teams she rides for
  joined: string;        // "Joined Mar 2026"
  reasons: string[];     // why-you'd-vibe bullets
  vibeLong: string;      // 2-3 sentence monospace bio
  youBoth: { icon: "beer" | "calendar" | "users"; label: string }[];
  rounds: { label: string; ago: string }[];
  opener: string;        // pre-written opener
  upcoming?: string;     // next shared game hint
};

// Stable unsplash portrait IDs (editorial portraits of women, varied)
const photo = (id: string) => `https://images.unsplash.com/${id}?w=600&q=80&auto=format&fit=crop`;

export const MOCK_MEMBERS: Member[] = [
  {
    id: "chloe-s",
    name: "Chloe S.",
    firstName: "Chloe",
    photo: photo("photo-1488426862026-3ee34a7d66df"),
    match: 94,
    team: "Arsenal FC",
    city: "LA",
    vibe: "Pub pints & tactical analysis",
    tags: ["SUNDAYS", "PUB", "WNBA"],
    teams: ["Arsenal FC", "Angel City FC", "USWNT", "LA Sparks"],
    joined: "Joined Mar 2026",
    reasons: [
      "Both lifelong Arsenal fans in LA",
      "Both into tactical breakdowns & pub culture",
      "Overlapping watch parties at The Cock & Bull",
    ],
    vibeLong:
      "Pub pints & tactical analysis. Will explain offside to anyone who asks. Mikel Arteta truther.",
    youBoth: [
      { icon: "beer", label: "Watch at The Cock & Bull, Santa Monica" },
      { icon: "calendar", label: "Sunday morning kickoffs" },
      { icon: "users", label: "2 mutual members: Maya T., Jess R." },
    ],
    rounds: [
      { label: "RSVP'd to Arsenal vs Chelsea watch party", ago: "2 days ago" },
      { label: "Posted in #angel-city-discussion", ago: "5 days ago" },
    ],
    opener: "Saw you ride for Arsenal. Watch party at The Cock & Bull Sunday?",
    upcoming: "Arsenal vs Chelsea, Sun 7am",
  },
  {
    id: "maya-t",
    name: "Maya T.",
    firstName: "Maya",
    photo: photo("photo-1544005313-94ddf0286df2"),
    match: 91,
    team: "NY Liberty",
    city: "LA",
    vibe: "Front row energy, box score brain",
    tags: ["WNBA", "STATS", "WEEKNIGHTS"],
    teams: ["NY Liberty", "LA Sparks", "USWNT"],
    joined: "Joined Feb 2026",
    reasons: [
      "Both follow the WNBA daily",
      "Both go to Sparks home games",
      "Shared love of advanced stats",
    ],
    vibeLong:
      "Front row when she can be, second screen when she can't. Sabrina Ionescu apologist. Reads box scores like horoscopes.",
    youBoth: [
      { icon: "calendar", label: "Sparks home schedule, all season" },
      { icon: "users", label: "1 mutual member: Jess R." },
    ],
    rounds: [
      { label: "RSVP'd to Sparks opener viewing", ago: "1 day ago" },
      { label: "Joined #wnba-szn", ago: "1 week ago" },
    ],
    opener: "Fellow Sparks season-ticket energy. Drinks before the next home game?",
    upcoming: "Sparks vs Aces, Fri 7pm",
  },
  {
    id: "jess-r",
    name: "Jess R.",
    firstName: "Jess",
    photo: photo("photo-1531123897727-8f129e1688ce"),
    match: 88,
    team: "Angel City FC",
    city: "LA",
    vibe: "Banner-painter, post-match tacos",
    tags: ["NWSL", "BMO", "ULTRAS"],
    teams: ["Angel City FC", "USWNT", "Arsenal FC"],
    joined: "Joined Jan 2026",
    reasons: [
      "Both Angel City season members",
      "Both in the Sol Seats supporters section",
      "Overlap on the USWNT camp obsessions",
    ],
    vibeLong:
      "Sol Seats regular. Has paint on her jeans from Tuesday's banner build. Will fight for Sydney Leroux's legacy.",
    youBoth: [
      { icon: "beer", label: "Post-match tacos at La Sirena" },
      { icon: "calendar", label: "Saturday night BMO matches" },
    ],
    rounds: [
      { label: "Posted in #angel-city-discussion", ago: "6 hours ago" },
      { label: "RSVP'd to ACFC vs Portland", ago: "3 days ago" },
    ],
    opener: "Both of us in the #angel-city chat — see you at the opener?",
    upcoming: "ACFC vs Portland, Sat 7:30pm",
  },
  {
    id: "noor-a",
    name: "Noor A.",
    firstName: "Noor",
    photo: photo("photo-1517841905240-472988babdf9"),
    match: 86,
    team: "Chelsea FC",
    city: "LA",
    vibe: "5am kickoffs, no notes",
    tags: ["WSL", "EARLY", "PUB"],
    teams: ["Chelsea FC", "USWNT", "LA Sparks"],
    joined: "Joined Apr 2026",
    reasons: [
      "Both up for 5am Premier League kickoffs",
      "Both ride for Chelsea Women",
      "Same Sunday pub circuit",
    ],
    vibeLong:
      "Sets her alarm for 4:45 every Saturday. Has opinions about Emma Hayes leaving. Cold brew before kickoff, pint after.",
    youBoth: [
      { icon: "calendar", label: "Saturday 5am WSL slots" },
      { icon: "beer", label: "Cock & Bull or The Greyhound" },
    ],
    rounds: [
      { label: "Posted match thread: Chelsea vs Arsenal Women", ago: "1 day ago" },
    ],
    opener: "Saw you do the 5am WSL slot too. Greyhound Saturday?",
    upcoming: "Chelsea v Man City W, Sat 5am",
  },
  {
    id: "iris-h",
    name: "Iris H.",
    firstName: "Iris",
    photo: photo("photo-1500917293891-ef795e70e1f6"),
    match: 84,
    team: "Brooklyn Nets",
    city: "LA",
    vibe: "League Pass at midnight, vibes only",
    tags: ["NBA", "NIGHTS", "MEMES"],
    teams: ["Brooklyn Nets", "NY Liberty", "USWNT"],
    joined: "Joined Mar 2026",
    reasons: [
      "Both lapsed New Yorkers in LA",
      "Both run on League Pass + memes",
      "Overlap on Liberty fandom",
    ],
    vibeLong:
      "Watches Nets games on east coast time on purpose. Sends 1am screenshots. Will defend Cam Thomas with her chest.",
    youBoth: [
      { icon: "users", label: "1 mutual: Maya T." },
      { icon: "calendar", label: "Late-night NBA windows" },
    ],
    rounds: [
      { label: "Sent a 1am highlight in #nba-club", ago: "8 hours ago" },
    ],
    opener: "Fellow Brooklyn-in-exile. League Pass watch night?",
  },
  {
    id: "renee-m",
    name: "Renée M.",
    firstName: "Renée",
    photo: photo("photo-1502323777036-f29e3972d82f"),
    match: 82,
    team: "LA Sparks",
    city: "LA",
    vibe: "Crypto.com Arena regular, calm bench coach",
    tags: ["WNBA", "ARENA", "BRUNCH"],
    teams: ["LA Sparks", "Angel City FC"],
    joined: "Joined Feb 2026",
    reasons: [
      "Both Sparks season-ticket holders",
      "Both believe in the long rebuild",
      "Overlap on brunch-before-tipoff",
    ],
    vibeLong:
      "Section 113. Brings a thermos. Talks like a head coach who reached enlightenment in 2019.",
    youBoth: [
      { icon: "calendar", label: "Sparks home tipoffs" },
      { icon: "beer", label: "Brunch at The Cleo before games" },
    ],
    rounds: [
      { label: "RSVP'd to Sparks home opener", ago: "4 days ago" },
    ],
    opener: "Section 113 to section 113 — brunch before tipoff?",
  },
  {
    id: "thea-l",
    name: "Thea L.",
    firstName: "Thea",
    photo: photo("photo-1495216875107-c6c043eb703f"),
    match: 79,
    team: "USWNT",
    city: "LA",
    vibe: "Camp watcher, friendlies enjoyer",
    tags: ["USWNT", "NWSL", "TRAVEL"],
    teams: ["USWNT", "Angel City FC", "Chelsea FC"],
    joined: "Joined Mar 2026",
    reasons: [
      "Both follow USWNT camp like it's a sport",
      "Both travel for at least one match a year",
      "Overlap on NWSL fandom",
    ],
    vibeLong:
      "Knows the friendlies schedule. Has been to Concacaf W qualifiers. Will book a flight if Smith starts.",
    youBoth: [
      { icon: "users", label: "1 mutual: Jess R." },
    ],
    rounds: [
      { label: "Joined #uswnt-roadtrips", ago: "2 days ago" },
    ],
    opener: "USWNT camp truther energy. Friendlies watch when they're back?",
  },
  {
    id: "priya-k",
    name: "Priya K.",
    firstName: "Priya",
    photo: photo("photo-1492288991661-058aa541ff43"),
    match: 76,
    team: "Arsenal FC",
    city: "LA",
    vibe: "Quiet kickoffs, loud opinions",
    tags: ["EPL", "HOME", "PODCASTS"],
    teams: ["Arsenal FC", "Brooklyn Nets"],
    joined: "Joined Apr 2026",
    reasons: [
      "Both lifelong Arsenal",
      "Both prefer home kickoffs to pub chaos",
      "Both listen to The Athletic's Tifo daily",
    ],
    vibeLong:
      "Pajamas, espresso, kickoff. Doesn't yell, just types essays in the group chat. Wenger out, Arteta in, never lost the faith.",
    youBoth: [
      { icon: "calendar", label: "Saturday 7am Arsenal" },
      { icon: "users", label: "1 mutual: Chloe S." },
    ],
    rounds: [
      { label: "Posted in #arsenal-only", ago: "3 days ago" },
    ],
    opener: "Both ride for Arsenal. Home-kickoff brunch this Sat?",
  },
];

export const getMember = (id: string): Member | undefined =>
  MOCK_MEMBERS.find((m) => m.id === id);

// Tiny client-side draft store (sessionStorage backed) — v1 only.
const KEY = "lb_xi_drafts_v1";

type DraftsState = {
  draftsLeft: number;
  drafted: string[]; // member ids
};

const defaults: DraftsState = { draftsLeft: 3, drafted: [] };

export function loadDrafts(): DraftsState {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function saveDrafts(s: DraftsState) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}
