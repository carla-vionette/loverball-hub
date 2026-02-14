// Mock data for the stats dashboard

// Generate mock reading activity for last 30 days
export function generateReadingActivity(days: number = 30) {
  const data: { date: string; articles: number; label: string }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const articles = Math.floor(Math.random() * 8) + (i % 7 === 0 ? 0 : 1);
    data.push({
      date: d.toISOString().split("T")[0],
      articles,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  }
  return data;
}

// Content breakdown by category
export const CONTENT_BREAKDOWN = [
  { name: "Technology", value: 24, fill: "hsl(4, 74%, 49%)" },
  { name: "Business", value: 18, fill: "hsl(224, 64%, 45%)" },
  { name: "Entertainment", value: 15, fill: "hsl(75, 13%, 52%)" },
  { name: "Health", value: 12, fill: "hsl(160, 60%, 45%)" },
  { name: "Science", value: 10, fill: "hsl(280, 50%, 50%)" },
  { name: "Lifestyle", value: 8, fill: "hsl(40, 80%, 50%)" },
  { name: "Finance", value: 7, fill: "hsl(200, 60%, 50%)" },
  { name: "Other", value: 6, fill: "hsl(0, 0%, 60%)" },
];

// Team performance data
export const TEAM_PERFORMANCE = [
  {
    name: "Lakers",
    logo: "https://a.espncdn.com/i/teamlogos/nba/500/lal.png",
    record: "38-22",
    winPct: 0.633,
    last5: [true, true, false, true, true],
    nextGame: "vs Celtics · Feb 16",
    league: "NBA",
  },
  {
    name: "Dodgers",
    logo: "https://a.espncdn.com/i/teamlogos/mlb/500/lad.png",
    record: "0-0",
    winPct: 0,
    last5: [],
    nextGame: "Season starts Mar 27",
    league: "MLB",
  },
  {
    name: "LAFC",
    logo: "https://a.espncdn.com/i/teamlogos/soccer/500/5765.png",
    record: "2-1-0",
    winPct: 0.667,
    last5: [true, true, false],
    nextGame: "vs Galaxy · Feb 22",
    league: "MLS",
  },
  {
    name: "Rams",
    logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lar.png",
    record: "10-7",
    winPct: 0.588,
    last5: [true, false, true, true, false],
    nextGame: "Offseason",
    league: "NFL",
  },
  {
    name: "Angel City FC",
    logo: "https://a.espncdn.com/i/teamlogos/soccer/500/6926.png",
    record: "1-1-1",
    winPct: 0.5,
    last5: [true, false, false],
    nextGame: "vs Wave · Feb 20",
    league: "NWSL",
  },
];

// Generate streak heatmap data (last 12 weeks)
export function generateStreakData() {
  const weeks: { date: string; level: number }[][] = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 83); // ~12 weeks

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  for (let w = 0; w < 12; w++) {
    const week: { date: string; level: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + w * 7 + d);
      const isFuture = date > today;
      const level = isFuture ? 0 : Math.floor(Math.random() * 4) + (Math.random() > 0.2 ? 1 : 0);
      week.push({
        date: date.toISOString().split("T")[0],
        level: isFuture ? -1 : Math.min(level, 4),
      });

      if (!isFuture && level > 0) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else if (!isFuture) {
        tempStreak = 0;
      }
    }
    weeks.push(week);
  }

  // Calculate current streak from today backwards
  const allDays = weeks.flat().filter((d) => d.level >= 0);
  for (let i = allDays.length - 1; i >= 0; i--) {
    if (allDays[i].level > 0) currentStreak++;
    else break;
  }

  return { weeks, currentStreak, bestStreak };
}

// Recent activity feed
export const RECENT_ACTIVITY = [
  { type: "read", title: "Women's Sports Viewership Hits All-Time High in 2026", time: "12m ago" },
  { type: "bookmark", title: "LA28 Olympics: New Venues Revealed for Basketball & Soccer", time: "1h ago" },
  { type: "read", title: "The Rise of Community-Driven Fan Culture in Los Angeles", time: "2h ago" },
  { type: "read", title: "How NIL Deals Are Reshaping College Athletics", time: "3h ago" },
  { type: "bookmark", title: "Top 10 Sports Tech Startups to Watch in 2026", time: "5h ago" },
  { type: "read", title: "WNBA Expansion Draft: What LA Fans Need to Know", time: "8h ago" },
  { type: "read", title: "Soccer's Growing Influence on American Pop Culture", time: "1d ago" },
  { type: "bookmark", title: "Best Sports Bars in Los Angeles: 2026 Guide", time: "1d ago" },
  { type: "read", title: "The Science Behind Athletic Recovery Trends", time: "2d ago" },
  { type: "read", title: "Breaking Down the NBA Trade Deadline Moves", time: "2d ago" },
];
