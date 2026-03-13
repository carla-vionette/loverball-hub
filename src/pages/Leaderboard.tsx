import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Trophy, MapPin, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import MobileHeader from "@/components/MobileHeader";
import DesktopNav from "@/components/DesktopNav";
import BottomNav from "@/components/BottomNav";

interface CityEntry {
  city: string;
  count: number;
}

const CITY_EMOJIS: Record<string, string> = {
  "los angeles": "🌴",
  "new york": "🗽",
  "chicago": "🌬️",
  "miami": "🌊",
  "san francisco": "🌉",
  "seattle": "☕",
  "denver": "🏔️",
  "austin": "🤠",
  "boston": "🍀",
  "phoenix": "🌵",
  "portland": "🌲",
  "atlanta": "🍑",
  "dallas": "⭐",
  "houston": "🚀",
  "philadelphia": "🔔",
  "detroit": "🏭",
  "minneapolis": "❄️",
  "nashville": "🎸",
  "las vegas": "🎰",
  "san diego": "🏖️",
};

const Leaderboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cities, setCities] = useState<CityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<"month" | "alltime">("month");

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("city")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.city) setUserCity(data.city.toLowerCase());
        });
    }
    fetchLeaderboard();
  }, [user, timeframe]);

  const fetchLeaderboard = async () => {
    setLoading(true);

    let query = supabase
      .from("check_ins")
      .select("event_id, events!inner(city)");

    if (timeframe === "month") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      query = query.gte("checked_in_at", startOfMonth.toISOString());
    }

    const { data } = await query;

    if (data) {
      const cityCounts: Record<string, number> = {};
      data.forEach((row: any) => {
        const city = row.events?.city;
        if (city) {
          const key = city.toLowerCase();
          cityCounts[key] = (cityCounts[key] || 0) + 1;
        }
      });

      const sorted = Object.entries(cityCounts)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count);

      setCities(sorted);
    }
    setLoading(false);
  };

  const getCityEmoji = (city: string) => CITY_EMOJIS[city.toLowerCase()] || "📍";

  const capitalize = (s: string) => s.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pb-20 md:pb-8 pt-[92px] md:pt-[48px]">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                <Trophy className="w-6 h-6 text-accent" /> City Leaderboard
              </h1>
              <p className="text-sm text-muted-foreground">Top cities by check-ins</p>
            </div>
          </div>

          {/* Timeframe toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              size="sm"
              variant={timeframe === "month" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setTimeframe("month")}
            >
              This Month
            </Button>
            <Button
              size="sm"
              variant={timeframe === "alltime" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setTimeframe("alltime")}
            >
              All Time
            </Button>
          </div>

          {/* Leaderboard */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : cities.length === 0 ? (
            <div className="text-center py-16">
              <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No check-ins yet this {timeframe === "month" ? "month" : "period"}.</p>
              <p className="text-sm text-muted-foreground mt-1">Be the first to check in at an event!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cities.map((entry, index) => {
                const isUserCity = userCity === entry.city.toLowerCase();
                const isTop3 = index < 3;
                return (
                  <motion.div
                    key={entry.city}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${
                      isUserCity
                        ? "bg-primary/10 border-2 border-primary/30"
                        : "glass-card"
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0
                        ? "bg-warning text-warning-foreground"
                        : index === 1
                        ? "bg-muted-foreground/20 text-foreground"
                        : index === 2
                        ? "bg-accent/20 text-accent"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {index + 1}
                    </div>

                    {/* City emoji */}
                    <span className="text-2xl">{getCityEmoji(entry.city)}</span>

                    {/* City name */}
                    <div className="flex-1">
                      <p className={`font-semibold ${isUserCity ? "text-primary" : "text-foreground"}`}>
                        {capitalize(entry.city)}
                        {isUserCity && <span className="text-xs ml-2 text-primary/70">Your City</span>}
                      </p>
                    </div>

                    {/* Count */}
                    <div className="text-right">
                      <p className={`text-lg font-display font-bold ${isTop3 ? "text-foreground" : "text-muted-foreground"}`}>
                        {entry.count}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">check-ins</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
