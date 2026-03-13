import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Share2, RefreshCw, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const SIGNS: Record<string, { symbol: string; element: string; dates: string }> = {
  Aries: { symbol: "♈", element: "fire", dates: "Mar 21 – Apr 19" },
  Taurus: { symbol: "♉", element: "earth", dates: "Apr 20 – May 20" },
  Gemini: { symbol: "♊", element: "air", dates: "May 21 – Jun 20" },
  Cancer: { symbol: "♋", element: "water", dates: "Jun 21 – Jul 22" },
  Leo: { symbol: "♌", element: "fire", dates: "Jul 23 – Aug 22" },
  Virgo: { symbol: "♍", element: "earth", dates: "Aug 23 – Sep 22" },
  Libra: { symbol: "♎", element: "air", dates: "Sep 23 – Oct 22" },
  Scorpio: { symbol: "♏", element: "water", dates: "Oct 23 – Nov 21" },
  Sagittarius: { symbol: "♐", element: "fire", dates: "Nov 22 – Dec 21" },
  Capricorn: { symbol: "♑", element: "earth", dates: "Dec 22 – Jan 19" },
  Aquarius: { symbol: "♒", element: "air", dates: "Jan 20 – Feb 18" },
  Pisces: { symbol: "♓", element: "water", dates: "Feb 19 – Mar 20" },
};

const ELEMENT_BORDER: Record<string, string> = {
  fire: "border-accent/30",
  earth: "border-emerald-500/30",
  air: "border-primary/30",
  water: "border-blue-500/30",
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

const sessionCache = new Map<string, { data: any; ts: number }>();
const SESSION_TTL = 3_600_000;

type Period = "daily" | "weekly" | "monthly";

const Horoscope = () => {
  const navigate = useNavigate();
  const [userSign, setUserSign] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("daily");
  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [horoscopeDate, setHoroscopeDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("birthday").eq("id", user.id).single();
          if (profile?.birthday) {
            const sign = getZodiacFromBirthday(profile.birthday);
            if (sign) setUserSign(sign);
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
      const reading = resp?.data?.horoscope || resp?.horoscope || resp?.reading;
      if (!reading) throw new Error("No horoscope data returned");
      setHoroscope(reading);
      setHoroscopeDate(resp?.data?.date || resp?.date || null);
      sessionCache.set(cacheKey, { data: { horoscope: reading, date: resp?.data?.date || resp?.date }, ts: Date.now() });
    } catch (e: any) {
      setError("Couldn't load your forecast. Tap retry.");
      setHoroscope(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userSign) fetchHoroscope(userSign, period);
  }, [userSign, period, fetchHoroscope]);

  const handleShare = async () => {
    if (!horoscope || !userSign) return;
    const signData = SIGNS[userSign];
    const text = `${signData?.symbol} ${userSign} (${period}) – ${horoscope}`;
    if (navigator.share) {
      await navigator.share({ title: `${userSign} Horoscope`, text });
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const handleRetry = () => {
    if (userSign) {
      sessionCache.delete(`${userSign.toLowerCase()}:${period}`);
      fetchHoroscope(userSign, period);
    }
  };

  const signData = userSign ? SIGNS[userSign] : null;

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
              Your cosmic playbook, based on your birthdate
            </p>
          </div>

          {/* Loading */}
          {profileLoading && (
            <Card><CardContent className="p-6 space-y-3">
              <Skeleton className="h-10 w-40 mx-auto" />
              <Skeleton className="h-4 w-24 mx-auto" />
              <Skeleton className="h-20 w-full" />
            </CardContent></Card>
          )}

          {/* No birthday set */}
          {!profileLoading && !userSign && (
            <Card className="border-2 border-dashed border-muted-foreground/20">
              <CardContent className="p-8 text-center space-y-4">
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">No birthdate found</p>
                  <p className="text-xs text-muted-foreground">
                    Add your birthday to your profile and we'll automatically determine your zodiac sign.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/edit-profile")}>
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Sign badge (read-only) */}
          {userSign && signData && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 ${ELEMENT_BORDER[signData.element]} bg-card`}>
                <span className="text-5xl">{signData.symbol}</span>
                <div className="text-left">
                  <h2 className="text-xl font-sans font-bold text-foreground">{userSign}</h2>
                  <p className="text-xs text-muted-foreground">{signData.dates}</p>
                  <Badge variant="outline" className="mt-1 text-[10px] capitalize">{signData.element}</Badge>
                </div>
              </div>
            </motion.div>
          )}

          {/* Period Tabs */}
          {userSign && (
            <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="w-full">
              <TabsList className="w-full bg-muted">
                <TabsTrigger value="daily" className="flex-1 text-xs font-semibold">Daily</TabsTrigger>
                <TabsTrigger value="weekly" className="flex-1 text-xs font-semibold">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="flex-1 text-xs font-semibold">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Reading Card */}
          {userSign && (
            <motion.div key={`${userSign}-${period}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
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
                      <p className="text-xs text-muted-foreground capitalize">
                        {period} forecast{horoscopeDate ? ` · ${horoscopeDate}` : ""}
                      </p>
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
        </div>
      </main>
    </div>
  );
};

export default Horoscope;
