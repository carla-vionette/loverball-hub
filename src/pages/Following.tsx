import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import LASportsTicker from "@/components/LASportsTicker";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Users,
  Newspaper,
  Flame,
  Sparkles,
  ChevronRight,
  Bookmark,
  Clock,
  Star,
} from "lucide-react";

// Zodiac data
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
  Aries: "Bold energy fuels your day. A surprise connection through sports could open a new door. Trust your instincts on the field and off.",
  Taurus: "Steady wins the race today. Your loyalty to your favorite team mirrors your approach to life. A financial opportunity is on the horizon.",
  Gemini: "Your social butterfly energy is at a peak. Multiple conversations lead to one meaningful connection. Share your sports takes freely.",
  Cancer: "Home court advantage is yours today. Nurture your inner circle and watch your community grow. A nostalgic sports moment brings joy.",
  Leo: "You're the MVP today. Your confidence attracts attention and your leadership shines. A bold move pays off in unexpected ways.",
  Virgo: "Details matter today. Your analytical eye catches something others miss. Perfect time to research stats and make informed picks.",
  Libra: "Balance is your superpower. A partnership opportunity arises that aligns with your values. Harmony in your sports community strengthens bonds.",
  Scorpio: "Intensity drives your focus. Go deep on something you're passionate about. A hidden talent reveals itself through competition.",
  Sagittarius: "Adventure calls! Explore a new sport or attend an event outside your comfort zone. Your optimism is contagious today.",
  Capricorn: "Discipline meets opportunity. Your hard work in building community connections starts to pay dividends. Stay the course.",
  Aquarius: "Innovation is your theme. A unique idea for bringing fans together sparks excitement. Your vision for community is ahead of its time.",
  Pisces: "Intuition guides your game today. Creative expression through sports brings unexpected fulfillment. Trust the flow.",
};

function getZodiacSign(birthday: string | null): typeof ZODIAC_SIGNS[0] | null {
  if (!birthday) return null;
  const date = new Date(birthday);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  for (const sign of ZODIAC_SIGNS) {
    const [start, end] = sign.dates;
    if (sign.name === "Capricorn") {
      if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return sign;
    } else if (
      (month === start.m && day >= start.d) ||
      (month === end.m && day <= end.d)
    ) {
      return sign;
    }
  }
  return ZODIAC_SIGNS[0]; // fallback
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getLuckyNumber(name: string): number {
  let hash = 0;
  const today = new Date().toDateString();
  const seed = name + today;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 99) + 1;
}

// Mock trending articles
const TRENDING_ARTICLES = [
  {
    id: "1",
    title: "Women's Sports Viewership Hits All-Time High in 2026",
    category: "Trending",
    source: "ESPN",
    timeAgo: "2h ago",
    image: "https://images.unsplash.com/photo-1461896836934-bd45ba8c9e3d?w=400&h=225&fit=crop",
  },
  {
    id: "2",
    title: "LA28 Olympics: New Venues Revealed for Basketball & Soccer",
    category: "Olympics",
    source: "NBC Sports",
    timeAgo: "4h ago",
    image: "https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=400&h=225&fit=crop",
  },
  {
    id: "3",
    title: "The Rise of Community-Driven Fan Culture in Los Angeles",
    category: "Culture",
    source: "Loverball",
    timeAgo: "6h ago",
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&h=225&fit=crop",
  },
];

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const Following = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const zodiac = getZodiacSign(profile?.birthday);
  const greeting = getGreeting();
  const userName = profile?.name?.split(" ")[0] || "there";
  const teamsCount = profile?.favorite_teams_players?.length || 0;
  const luckyNumber = getLuckyNumber(profile?.name || "user");

  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const statsCards = [
    { label: "Teams Followed", value: teamsCount, icon: Users, color: "text-primary" },
    { label: "Articles Read", value: 3, icon: Newspaper, color: "text-medium-blue" },
    { label: "Current Streak", value: 7, icon: Flame, color: "text-orange-500" },
    { label: "Lucky Number", value: luckyNumber, icon: Sparkles, color: "text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <div className="fixed top-16 md:top-0 left-0 right-0 md:left-64 z-30">
        <LASportsTicker />
      </div>

      <main className="md:ml-64 pb-20 md:pb-8 pt-[92px] md:pt-[48px]">
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* HEADER */}
            <motion.div variants={staggerItem} className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-serif text-foreground">
                {greeting}, {userName}!
              </h1>
              <p className="text-sm text-muted-foreground">
                {formattedDate} · {formattedTime}
              </p>
            </motion.div>

            {/* QUICK STATS */}
            <motion.div variants={staggerItem} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {statsCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} className="border-border/50">
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                      <span className="text-2xl font-serif font-bold text-foreground">{stat.value}</span>
                      <span className="text-xs text-muted-foreground tracking-wider uppercase">{stat.label}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </motion.div>

            {/* HOROSCOPE */}
            {zodiac && (
              <motion.div variants={staggerItem}>
                <Card className={`overflow-hidden border-border/50`}>
                  <div className={`bg-gradient-to-br ${ELEMENT_GRADIENTS[zodiac.element]} p-6`}>
                    <div className="flex items-start gap-4">
                      <div className="text-5xl">{zodiac.symbol}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-serif text-lg text-foreground">{zodiac.name}</h3>
                          <Badge variant="outline" className="text-xs rounded-none capitalize">
                            {zodiac.element}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2">
                          {HOROSCOPE_MESSAGES[zodiac.name]}
                        </p>
                        <Button
                          variant="link"
                          className="px-0 mt-2 text-primary h-auto text-sm gap-1"
                          onClick={() => navigate("/horoscope")}
                        >
                          Read Full Horoscope
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* LIVE SPORTS SECTION LABEL */}
            <motion.div variants={staggerItem} className="flex items-center justify-between">
              <h2 className="text-xs tracking-widest uppercase text-foreground/60 font-medium">Live Scores</h2>
              <Button variant="link" className="text-primary text-xs h-auto p-0 gap-1" onClick={() => navigate("/ticker")}>
                View All Scores <ChevronRight className="w-3 h-3" />
              </Button>
            </motion.div>

            {/* TRENDING ARTICLES */}
            <motion.div variants={staggerItem} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs tracking-widest uppercase text-foreground/60 font-medium">Trending Articles</h2>
                <Button variant="link" className="text-primary text-xs h-auto p-0 gap-1">
                  See All News <ChevronRight className="w-3 h-3" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {TRENDING_ARTICLES.map((article) => (
                  <Card key={article.id} className="overflow-hidden border-border/50 cursor-pointer hover:shadow-md transition-shadow group">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <CardContent className="p-3 space-y-2">
                      <Badge variant="secondary" className="text-[10px] rounded-none px-2 py-0.5">
                        {article.category}
                      </Badge>
                      <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                        {article.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.source} · {article.timeAgo}
                        </span>
                        <Bookmark className="w-3.5 h-3.5 text-foreground/30 hover:text-primary transition-colors cursor-pointer" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Following;
