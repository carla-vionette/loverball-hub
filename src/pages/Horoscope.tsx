import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Share2, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const SIGNS = [
  { name: "Aries", symbol: "♈", element: "fire" },
  { name: "Taurus", symbol: "♉", element: "earth" },
  { name: "Gemini", symbol: "♊", element: "air" },
  { name: "Cancer", symbol: "♋", element: "water" },
  { name: "Leo", symbol: "♌", element: "fire" },
  { name: "Virgo", symbol: "♍", element: "earth" },
  { name: "Libra", symbol: "♎", element: "air" },
  { name: "Scorpio", symbol: "♏", element: "water" },
  { name: "Sagittarius", symbol: "♐", element: "fire" },
  { name: "Capricorn", symbol: "♑", element: "earth" },
  { name: "Aquarius", symbol: "♒", element: "air" },
  { name: "Pisces", symbol: "♓", element: "water" },
];

const ELEMENT_COLORS: Record<string, string> = {
  fire: "border-accent/40 bg-accent/5",
  earth: "border-emerald-500/40 bg-emerald-500/5",
  air: "border-primary/40 bg-primary/5",
  water: "border-blue-500/40 bg-blue-500/5",
};

const ELEMENT_SELECTED: Record<string, string> = {
  fire: "border-accent bg-accent/20 ring-2 ring-accent/30",
  earth: "border-emerald-500 bg-emerald-500/20 ring-2 ring-emerald-500/30",
  air: "border-primary bg-primary/20 ring-2 ring-primary/30",
  water: "border-blue-500 bg-blue-500/20 ring-2 ring-blue-500/30",
};

function getZodiacFromBirthday(birthday: string | null): string | null {
  if (!birthday) return null;
  const date = new Date(birthday);
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const ranges: [string, number, number, number, number][] = [
    ["Capricorn", 12, 22, 1, 19], ["Aquarius", 1, 20, 2, 18], ["Pisces", 2, 19, 3, 20],
    ["Aries", 3, 21, 4, 19], ["Taurus", 4, 20, 5, 20], ["Gemini", 5, 21, 6, 20],
    ["Cancer", 6, 21, 7, 22], ["Leo", 7, 23, 8, 22], ["Virgo", 8, 23, 9, 22],
    ["Libra", 9, 23, 10, 22], ["Scorpio", 10, 23, 11, 21], ["Sagittarius", 11, 22, 12, 21],
  ];
  for (const [name, sm, sd, em, ed] of ranges) {
    if (name === "Capricorn") {
      if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return name;
    } else if ((m === sm && d >= sd) || (m === em && d <= ed)) return name;
  }
  return "Capricorn";
}

// Session cache for API responses
const sessionCache = new Map<string, { data: any; ts: number }>();
const SESSION_TTL = 3_600_000;

type Period = "daily" | "weekly" | "monthly";

const Horoscope = () => {
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("daily");
  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [horoscopeDate, setHoroscopeDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Auto-detect sign from profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("birthday").eq("id", user.id).single();
          if (profile?.birthday) {
            const sign = getZodiacFromBirthday(profile.birthday);
            if (sign) setSelectedSign(sign);
          }
        }
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const fetchHoroscope = useCallback(async (sign: string, p: Period) => {
    const cacheKey = `${sign.toLowerCase()}:${p}`;
    const cached = sessionCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < SESSION_TTL) {
      setHoroscope(cached.data.horoscope);
      setHoroscopeDate(cached.data.date || null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data: resp, error: fnError } = await supabase.functions.invoke("horoscope", {
        body: { sign: sign.toLowerCase(), period: p },
      });
      if (fnError) throw fnError;
      // Handle both new API format { data: { horoscope } } and legacy format { reading }
      const reading = resp?.data?.horoscope || resp?.horoscope || resp?.reading;
      if (!reading) throw new Error("No horoscope data returned");
      setHoroscope(reading);
      setHoroscopeDate(resp?.data?.date || resp?.date || null);
      sessionCache.set(cacheKey, { data: { horoscope: reading, date: resp?.data?.date }, ts: Date.now() });
    } catch (e: any) {
      console.error("Horoscope fetch error:", e);
      setError("Couldn't load your forecast. Tap retry.");
      setHoroscope(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch when sign or period changes
  useEffect(() => {
    if (selectedSign) fetchHoroscope(selectedSign, period);
  }, [selectedSign, period, fetchHoroscope]);

  const handleShare = async () => {
    if (!horoscope || !selectedSign) return;
    const signData = SIGNS.find(s => s.name === selectedSign);
    const text = `${signData?.symbol} ${selectedSign} (${period}) – ${horoscope}`;
    if (navigator.share) {
      await navigator.share({ title: `${selectedSign} Horoscope`, text });
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const handleRetry = () => {
    if (selectedSign) {
      sessionCache.delete(`${selectedSign.toLowerCase()}:${period}`);
      fetchHoroscope(selectedSign, period);
    }
  };

  const selectedSignData = SIGNS.find(s => s.name === selectedSign);

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pb-20 md:pb-8 pt-20 md:pt-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-sans font-bold text-foreground tracking-tight">
              🏀 Your Game Day Forecast
            </h1>
            <p className="text-sm text-muted-foreground">
              Select your sign and check your cosmic playbook
            </p>
          </div>

          {/* Zodiac Grid */}
          <div className="grid grid-cols-4 gap-2">
            {SIGNS.map((sign) => {
              const isSelected = selectedSign === sign.name;
              return (
                <button
                  key={sign.name}
                  onClick={() => setSelectedSign(sign.name)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200 ${
                    isSelected ? ELEMENT_SELECTED[sign.element] : ELEMENT_COLORS[sign.element]
                  } hover:scale-105 active:scale-95`}
                >
                  <span className="text-2xl">{sign.symbol}</span>
                  <span className={`text-[10px] font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                    {sign.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Period Tabs */}
          {selectedSign && (
            <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="w-full">
              <TabsList className="w-full bg-muted">
                <TabsTrigger value="daily" className="flex-1 text-xs font-semibold">Daily</TabsTrigger>
                <TabsTrigger value="weekly" className="flex-1 text-xs font-semibold">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="flex-1 text-xs font-semibold">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Reading Card */}
          {selectedSign && (
            <motion.div key={`${selectedSign}-${period}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="overflow-hidden border-2 border-primary/20">
                <CardContent className="p-5 space-y-4">
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-3 py-8">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">Loading your forecast…</p>
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                      <p className="text-sm text-destructive">{error}</p>
                      <Button variant="outline" size="sm" onClick={handleRetry} className="gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" /> Retry
                      </Button>
                    </div>
                  ) : horoscope ? (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{selectedSignData?.symbol}</span>
                        <div>
                          <h2 className="text-lg font-sans font-bold text-foreground">{selectedSign}</h2>
                          <p className="text-xs text-muted-foreground capitalize">
                            {period} forecast{horoscopeDate ? ` · ${horoscopeDate}` : ""}
                          </p>
                        </div>
                      </div>

                      <p className="text-foreground leading-relaxed text-sm">{horoscope}</p>

                      <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1.5 text-xs text-muted-foreground px-0">
                        <Share2 className="w-3.5 h-3.5" /> Share
                      </Button>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Empty state */}
          {!selectedSign && !profileLoading && (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Tap a zodiac sign above to see your forecast.
              </CardContent>
            </Card>
          )}

          {profileLoading && !selectedSign && (
            <Card><CardContent className="p-6 space-y-3">
              <Skeleton className="h-8 w-32 mx-auto" />
              <Skeleton className="h-20 w-full" />
            </CardContent></Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Horoscope;
