import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ZODIAC_SYMBOLS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍",
  Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓"
};

const ELEMENT_BG: Record<string, string> = {
  fire: "from-red-500/10 via-orange-400/5 to-transparent",
  earth: "from-emerald-500/10 via-green-400/5 to-transparent",
  air: "from-sky-500/10 via-blue-300/5 to-transparent",
  water: "from-blue-500/10 via-cyan-400/5 to-transparent",
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

const Horoscope = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userSign, setUserSign] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("birthday").eq("id", user.id).single();
        if (profile?.birthday) {
          const sign = getZodiacFromBirthday(profile.birthday);
          if (sign) setUserSign(sign);
        }
      }
    };
    fetchProfile();
  }, []);

  const fetchHoroscope = useCallback(async (sign: string) => {
    setIsLoading(true);
    try {
      const { data: resp } = await supabase.functions.invoke("horoscope", {
        body: { sign: sign.toLowerCase(), day: "today" },
      });
      if (resp) setData(resp);
    } catch (e) {
      console.error("Horoscope fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userSign) fetchHoroscope(userSign);
  }, [userSign, fetchHoroscope]);

  const handleShare = async () => {
    if (!data) return;
    const text = `${data.symbol} ${data.sign} – ${data.reading}\n\nMood: ${data.mood} | Lucky #${data.luckyNumber}`;
    if (navigator.share) {
      await navigator.share({ title: `${data.sign} Horoscope`, text });
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pb-20 md:pb-8 pt-20 md:pt-8 px-4">
        <div className="max-w-2xl mx-auto">
          {isLoading ? (
            <Card><CardContent className="p-6 space-y-3">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-5 w-48" />
            </CardContent></Card>
          ) : data ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Card className={`overflow-hidden bg-gradient-to-br ${ELEMENT_BG[data.element] || ELEMENT_BG.fire}`}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{data.symbol}</span>
                    <div>
                      <h1 className="text-xl font-sans font-bold text-foreground">{data.sign}</h1>
                      <p className="text-xs text-muted-foreground">{data.date}</p>
                    </div>
                    <Badge variant="outline" className="ml-auto text-xs capitalize">{data.element}</Badge>
                  </div>

                  <p className="text-foreground leading-relaxed">{data.reading}</p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>Mood: <strong className="text-foreground">{data.mood}</strong></span>
                    <span>Lucky #: <strong className="text-foreground">{data.luckyNumber}</strong></span>
                    <span>Color: <strong className="text-foreground">{data.luckyColor}</strong></span>
                  </div>

                  <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1.5 text-xs text-muted-foreground px-0">
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">
              Add your birthday in your profile to see your daily horoscope.
            </CardContent></Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Horoscope;
