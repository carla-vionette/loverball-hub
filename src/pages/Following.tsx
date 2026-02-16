import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Newspaper,
  Clock,
  Trophy,
  Flame,
  Bookmark,
  BookOpen,
  Award,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import {
  generateReadingActivity,
  CONTENT_BREAKDOWN,
  TEAM_PERFORMANCE,
  generateStreakData,
  RECENT_ACTIVITY,
} from "@/lib/mockStatsData";

// --- Zodiac helpers (kept for horoscope) ---
const ZODIAC_SIGNS = [
  { name: "Capricorn", symbol: "♑", element: "earth", dates: [{ m: 12, d: 22 }, { m: 1, d: 19 }] },
  { name: "Aquarius", symbol: "♒", element: "air", dates: [{ m: 1, d: 20 }, { m: 2, d: 18 }] },
  { name: "Pisces", symbol: "♓", element: "water", dates: [{ m: 2, d: 19 }, { m: 3, d: 20 }] },
  { name: "Aries", symbol: "♈", element: "fire", dates: [{ m: 3, d: 21 }, { m: 4, d: 19 }] },
  { name: "Taurus", symbol: "♉", element: "earth", dates: [{ m: 4, d: 20 }, { m: 5, d: 20 }] },
  { name: "Gemini", symbol: "♊", element: "air", dates: [{ m: 5, d: 21 }, { m: 6, d: 20 }] },
  { name: "Cancer", symbol: "♋", element: "water", dates: [{ m: 6, d: 21 }, { m: 7, d: 22 }] },
  { name: "Leo", symbol: "♌", element: "fire", dates: [{ m: 7, d: 23 }, { m: 8, d: 22 }] },
  { name: "Virgo", symbol: "♍", element: "earth", dates: [{ m: 8, d: 23 }, { m: 9, d: 22 }] },
  { name: "Libra", symbol: "♎", element: "air", dates: [{ m: 9, d: 23 }, { m: 10, d: 22 }] },
  { name: "Scorpio", symbol: "♏", element: "water", dates: [{ m: 10, d: 23 }, { m: 11, d: 21 }] },
  { name: "Sagittarius", symbol: "♐", element: "fire", dates: [{ m: 11, d: 22 }, { m: 12, d: 21 }] },
];

const ELEMENT_GRADIENTS: Record<string, string> = {
  fire: "from-red-500/20 via-orange-400/10 to-yellow-500/5",
  earth: "from-emerald-600/20 via-green-500/10 to-lime-400/5",
  air: "from-sky-500/20 via-blue-400/10 to-indigo-300/5",
  water: "from-blue-600/20 via-cyan-500/10 to-teal-400/5",
};

const HOROSCOPE_MESSAGES: Record<string, string> = {
  Aries: "Bold energy fuels your day. A surprise connection through sports could open a new door.",
  Taurus: "Steady wins the race today. Your loyalty to your favorite team mirrors your approach to life.",
  Gemini: "Your social butterfly energy is at a peak. Multiple conversations lead to one meaningful connection.",
  Cancer: "Home court advantage is yours today. Nurture your inner circle and watch your community grow.",
  Leo: "You're the MVP today. Your confidence attracts attention and your leadership shines.",
  Virgo: "Details matter today. Your analytical eye catches something others miss.",
  Libra: "Balance is your superpower. A partnership opportunity arises that aligns with your values.",
  Scorpio: "Intensity drives your focus. Go deep on something you're passionate about.",
  Sagittarius: "Adventure calls! Explore a new sport or attend an event outside your comfort zone.",
  Capricorn: "Discipline meets opportunity. Your hard work in building community connections starts to pay dividends.",
  Aquarius: "Innovation is your theme. A unique idea for bringing fans together sparks excitement.",
  Pisces: "Intuition guides your game today. Creative expression through sports brings unexpected fulfillment.",
};

function getZodiacSign(birthday: string | null) {
  if (!birthday) return null;
  const date = new Date(birthday);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  for (const sign of ZODIAC_SIGNS) {
    const [start, end] = sign.dates;
    if (sign.name === "Capricorn") {
      if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return sign;
    } else if ((month === start.m && day >= start.d) || (month === end.m && day <= end.d)) {
      return sign;
    }
  }
  return ZODIAC_SIGNS[0];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// --- Stagger animations ---
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

// --- Heatmap level colors ---
const HEATMAP_COLORS = [
  "bg-border",           // 0 - no activity
  "bg-primary/20",       // 1
  "bg-primary/40",       // 2
  "bg-primary/70",       // 3
  "bg-primary",          // 4
];

const DAYS_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

// Custom chart tooltip
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-primary">{payload[0].value} articles</p>
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-foreground">{payload[0].name}</p>
      <p className="text-primary">{payload[0].value}%</p>
    </div>
  );
};

const Following = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dateRange, setDateRange] = useState<"7" | "30" | "all">("30");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (data) setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const readingData = useMemo(() => generateReadingActivity(dateRange === "7" ? 7 : 30), [dateRange]);
  const streakData = useMemo(() => generateStreakData(), []);

  const totalArticles = readingData.reduce((s, d) => s + d.articles, 0);
  const totalMinutes = totalArticles * 4; // ~4 min per article
  const avgPerDay = Math.round(totalMinutes / readingData.length);
  const favTopic = CONTENT_BREAKDOWN[0];
  const combinedWinPct = TEAM_PERFORMANCE.filter((t) => t.winPct > 0).reduce((s, t) => s + t.winPct, 0) / TEAM_PERFORMANCE.filter((t) => t.winPct > 0).length;

  const zodiac = getZodiacSign(profile?.birthday);
  const greeting = getGreeting();
  const userName = profile?.name?.split(" ")[0] || "there";

  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const formattedTime = currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pb-20 md:pb-8 pt-[92px] md:pt-[48px]">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">

            {/* HEADER */}
            <motion.div variants={staggerItem} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-sans text-foreground">{greeting}, {userName}!</h1>
                <p className="text-sm text-muted-foreground">{formattedDate} · {formattedTime}</p>
              </div>
              <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as any)} className="w-fit">
                <TabsList className="h-8">
                  <TabsTrigger value="7" className="text-xs px-3 h-7">7 Days</TabsTrigger>
                  <TabsTrigger value="30" className="text-xs px-3 h-7">30 Days</TabsTrigger>
                  <TabsTrigger value="all" className="text-xs px-3 h-7">All Time</TabsTrigger>
                </TabsList>
              </Tabs>
            </motion.div>

            {/* STATS OVERVIEW CARDS */}
            <motion.div variants={staggerItem} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Total Articles */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <Newspaper className="w-4 h-4 text-primary" />
                    <span className="flex items-center text-xs text-emerald-600 font-medium">
                      <TrendingUp className="w-3 h-3 mr-0.5" /> +12%
                    </span>
                  </div>
                  <p className="text-2xl font-sans font-bold text-foreground">{totalArticles}</p>
                  <p className="text-xs text-muted-foreground">Articles Read</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">vs last week</p>
                </CardContent>
              </Card>

              {/* Favorite Topic */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <BookOpen className="w-4 h-4 text-medium-blue" />
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-sm">{favTopic.value}%</Badge>
                  </div>
                  <p className="text-lg font-sans font-bold text-foreground truncate">{favTopic.name}</p>
                  <p className="text-xs text-muted-foreground">Favorite Topic</p>
                </CardContent>
              </Card>

              {/* Reading Time */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <Clock className="w-4 h-4 text-olive" />
                    <span className="text-xs text-muted-foreground">{avgPerDay}m/day</span>
                  </div>
                  <p className="text-2xl font-sans font-bold text-foreground">{totalMinutes}</p>
                  <p className="text-xs text-muted-foreground">Minutes Read</p>
                </CardContent>
              </Card>

              {/* Team Performance */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <Trophy className="w-4 h-4 text-primary" />
                    {combinedWinPct >= 0.5 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                    )}
                  </div>
                  <p className="text-2xl font-sans font-bold text-foreground">{(combinedWinPct * 100).toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* HOROSCOPE PREVIEW */}
            {zodiac && (
              <motion.div variants={staggerItem}>
                <Card className="overflow-hidden border-border/50">
                  <div className={`bg-gradient-to-br ${ELEMENT_GRADIENTS[zodiac.element]} p-5`}>
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{zodiac.symbol}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-sans text-base text-foreground">{zodiac.name}</h3>
                          <Badge variant="outline" className="text-[10px] rounded-none capitalize">{zodiac.element}</Badge>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2">{HOROSCOPE_MESSAGES[zodiac.name]}</p>
                        <Button variant="link" className="px-0 mt-1 text-primary h-auto text-xs gap-1" onClick={() => navigate("/horoscope")}>
                          Read Full Horoscope <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* READING ACTIVITY CHART */}
            <motion.div variants={staggerItem}>
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium tracking-wider uppercase text-foreground/60">
                    Reading Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="h-48 sm:h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={readingData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          tickLine={false}
                          axisLine={false}
                          interval={dateRange === "7" ? 0 : "preserveStartEnd"}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
                        <Bar dataKey="articles" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* CONTENT BREAKDOWN + ENGAGEMENT STREAK */}
            <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pie Chart */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium tracking-wider uppercase text-foreground/60">
                    Content Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={CONTENT_BREAKDOWN}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {CONTENT_BREAKDOWN.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                        <Legend
                          formatter={(value: string) => <span className="text-xs text-foreground">{value}</span>}
                          iconSize={8}
                          wrapperStyle={{ fontSize: 10 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Engagement Streak Heatmap */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium tracking-wider uppercase text-foreground/60">
                      Engagement Streak
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1 hover:bg-primary/10">
                        <Flame className="w-3 h-3" /> {streakData.currentStreak} day streak
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Award className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs text-muted-foreground">Best: {streakData.bestStreak} days</span>
                  </div>
                  <div className="overflow-x-auto">
                    <div className="flex gap-1">
                      {/* Day labels */}
                      <div className="flex flex-col gap-1 mr-1">
                        {DAYS_LABELS.map((d, i) => (
                          <div key={i} className="h-3.5 w-3 flex items-center justify-center">
                            <span className="text-[8px] text-muted-foreground">{i % 2 === 1 ? d : ""}</span>
                          </div>
                        ))}
                      </div>
                      {/* Heatmap grid */}
                      {streakData.weeks.map((week, wi) => (
                        <div key={wi} className="flex flex-col gap-1">
                          {week.map((day, di) => (
                            <div
                              key={di}
                              className={`h-3.5 w-3.5 rounded-sm transition-colors ${
                                day.level < 0 ? "bg-transparent" : HEATMAP_COLORS[day.level]
                              }`}
                              title={day.level >= 0 ? `${day.date}: ${day.level} activities` : ""}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-3 justify-end">
                    <span className="text-[9px] text-muted-foreground mr-1">Less</span>
                    {HEATMAP_COLORS.map((c, i) => (
                      <div key={i} className={`h-3 w-3 rounded-sm ${c}`} />
                    ))}
                    <span className="text-[9px] text-muted-foreground ml-1">More</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* FAVORITE TEAMS PERFORMANCE */}
            <motion.div variants={staggerItem}>
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium tracking-wider uppercase text-foreground/60">
                    Favorite Teams Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {TEAM_PERFORMANCE.map((team) => (
                      <div key={team.name} className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-muted/30 transition-colors">
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="w-9 h-9 object-contain rounded-sm bg-white p-0.5"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{team.name}</span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-sm">{team.league}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{team.nextGame}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-sans font-bold text-foreground">{team.record}</p>
                          {team.last5.length > 0 && (
                            <div className="flex gap-0.5 mt-1 justify-end">
                              {team.last5.map((win, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full ${win ? "bg-emerald-500" : "bg-destructive/60"}`} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* RECENT ACTIVITY FEED */}
            <motion.div variants={staggerItem}>
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium tracking-wider uppercase text-foreground/60">
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {RECENT_ACTIVITY.map((activity, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 sm:px-6 py-3">
                        <div className={`mt-0.5 p-1.5 rounded-full ${
                          activity.type === "read" ? "bg-primary/10" : "bg-medium-blue/10"
                        }`}>
                          {activity.type === "read" ? (
                            <BookOpen className="w-3 h-3 text-primary" />
                          ) : (
                            <Bookmark className="w-3 h-3 text-medium-blue" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground leading-snug">
                            <span className="text-muted-foreground">{activity.type === "read" ? "Read:" : "Bookmarked:"}</span>{" "}
                            <span className="font-medium">{activity.title}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-foreground/20 mt-1 shrink-0" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Following;
