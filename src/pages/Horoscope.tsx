import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Heart, Briefcase, Activity, Sparkles, Star, Share2, ChevronRight,
  Clock, Hash, Palette, Users, Globe, Flame, Droplets, Wind, Mountain
} from "lucide-react";

// Types
interface HoroscopeData {
  sign: string;
  symbol: string;
  element: string;
  rulingPlanet: string;
  dateRange: string;
  symbolMeaning: string;
  compatible: string[];
  famous: string[];
  traits: string[];
  date: string;
  reading: string;
  mood: string;
  luckyNumber: number;
  luckyColor: string;
  luckyTime: string;
  insights: {
    love: string;
    career: string;
    health: string;
    growth: string;
  };
  compatibleToday: string[];
  weekly: Array<{ day: string; summary: string; rating: number }>;
}

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const ZODIAC_SYMBOLS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍",
  Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓"
};

const ELEMENT_GRADIENTS: Record<string, string> = {
  fire: "from-red-600 via-orange-500 to-amber-400",
  earth: "from-emerald-700 via-green-600 to-lime-500",
  air: "from-sky-400 via-blue-300 to-yellow-200",
  water: "from-blue-700 via-cyan-500 to-teal-400",
};

const ELEMENT_BG: Record<string, string> = {
  fire: "from-red-500/10 via-orange-400/5 to-transparent",
  earth: "from-emerald-500/10 via-green-400/5 to-transparent",
  air: "from-sky-500/10 via-blue-300/5 to-transparent",
  water: "from-blue-500/10 via-cyan-400/5 to-transparent",
};

const ELEMENT_ICONS: Record<string, React.ElementType> = {
  fire: Flame, earth: Mountain, air: Wind, water: Droplets,
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

// Animations
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };

// Loading skeleton
function HoroscopeLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  );
}

const Horoscope = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<HoroscopeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSign, setUserSign] = useState<string | null>(null);
  const [selectedSign, setSelectedSign] = useState<string>("Aries");
  const [weeklyDay, setWeeklyDay] = useState("Mon");

  // Fetch user profile to determine sign
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("birthday").eq("id", user.id).single();
        if (profile?.birthday) {
          const sign = getZodiacFromBirthday(profile.birthday);
          if (sign) {
            setUserSign(sign);
            setSelectedSign(sign);
          }
        }
      }
    };
    fetchProfile();
  }, []);

  const fetchHoroscope = useCallback(async (sign: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: resp, error: err } = await supabase.functions.invoke("horoscope", {
        body: { sign: sign.toLowerCase(), day: "today" },
      });
      if (err) throw err;
      setData(resp);
    } catch (e) {
      console.error("Horoscope fetch error:", e);
      setError("Unable to load your horoscope. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHoroscope(selectedSign);
  }, [selectedSign, fetchHoroscope]);

  const ElementIcon = data ? ELEMENT_ICONS[data.element] || Sparkles : Sparkles;

  const handleShare = async () => {
    if (!data) return;
    const text = `${data.symbol} ${data.sign} Horoscope – ${data.date}\n\n${data.reading}\n\nMood: ${data.mood} | Lucky #${data.luckyNumber}`;
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
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Sign Selector */}
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {ZODIAC_SIGNS.map(sign => (
                <Button
                  key={sign}
                  variant={selectedSign === sign ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSign(sign)}
                  className={`shrink-0 gap-1.5 ${selectedSign === sign ? "" : "text-muted-foreground"} ${userSign === sign ? "ring-2 ring-primary/30" : ""}`}
                >
                  <span className="text-base">{ZODIAC_SYMBOLS[sign]}</span>
                  <span className="text-xs">{sign}</span>
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {isLoading ? <HoroscopeLoading /> : error ? (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-foreground mb-2">{error}</p>
                <Button size="sm" onClick={() => fetchHoroscope(selectedSign)}>Try Again</Button>
              </CardContent>
            </Card>
          ) : data && (
            <AnimatePresence mode="wait">
              <motion.div key={data.sign} variants={stagger} initial="hidden" animate="show" className="space-y-6">

                {/* HERO */}
                <motion.div variants={fadeUp}>
                  <Card className="overflow-hidden border-0 shadow-lg">
                    <div className={`bg-gradient-to-br ${ELEMENT_GRADIENTS[data.element]} p-8 sm:p-10 text-white relative overflow-hidden`}>
                      {/* Floating symbol */}
                      <motion.div
                        className="absolute -right-6 -top-6 text-[180px] leading-none opacity-10 font-serif select-none"
                        animate={{ y: [0, -10, 0], rotate: [0, 3, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      >
                        {data.symbol}
                      </motion.div>

                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm gap-1 capitalize">
                            <ElementIcon className="w-3.5 h-3.5" /> {data.element}
                          </Badge>
                          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm gap-1">
                            <Globe className="w-3.5 h-3.5" /> {data.rulingPlanet}
                          </Badge>
                        </div>

                        <motion.div
                          className="text-6xl sm:text-7xl mb-3"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                          {data.symbol}
                        </motion.div>

                        <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-1">{data.sign}</h1>
                        <p className="text-white/80 text-sm">{data.dateRange}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* TODAY'S READING */}
                <motion.div variants={fadeUp}>
                  <Card className={`overflow-hidden bg-gradient-to-br ${ELEMENT_BG[data.element]}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium tracking-wider uppercase text-foreground/60">
                          Today's Reading
                        </CardTitle>
                        <span className="text-xs text-muted-foreground">{data.date}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <motion.p
                        className="text-foreground leading-relaxed text-base"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                      >
                        {data.reading}
                      </motion.p>

                      {/* Lucky Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 rounded-xl bg-card border border-border/50">
                          <Hash className="w-4 h-4 mx-auto text-primary mb-1" />
                          <p className="text-2xl font-serif font-bold text-foreground">{data.luckyNumber}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Lucky Number</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-card border border-border/50 relative overflow-hidden">
                          <Palette className="w-4 h-4 mx-auto text-primary mb-1" />
                          <p className="text-sm font-semibold text-foreground">{data.luckyColor}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Lucky Color</p>
                          {/* Shimmer effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
                          />
                        </div>
                        <div className="text-center p-3 rounded-xl bg-card border border-border/50">
                          <Clock className="w-4 h-4 mx-auto text-primary mb-1" />
                          <p className="text-xs font-semibold text-foreground">{data.luckyTime}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Lucky Time</p>
                        </div>
                      </div>

                      {/* Mood */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Today's Mood:</span>
                        <Badge variant="secondary" className="text-xs">{data.mood}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* DETAILED INSIGHTS */}
                <motion.div variants={fadeUp}>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium tracking-wider uppercase text-foreground/60">
                        Detailed Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Accordion type="multiple" className="w-full">
                        <AccordionItem value="love">
                          <AccordionTrigger className="text-sm hover:no-underline">
                            <span className="flex items-center gap-2"><Heart className="w-4 h-4 text-pink-500" /> Love & Relationships</span>
                          </AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                            {data.insights.love}
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="career">
                          <AccordionTrigger className="text-sm hover:no-underline">
                            <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-amber-500" /> Career & Finance</span>
                          </AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                            {data.insights.career}
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="health">
                          <AccordionTrigger className="text-sm hover:no-underline">
                            <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-500" /> Health & Wellness</span>
                          </AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                            {data.insights.health}
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="growth">
                          <AccordionTrigger className="text-sm hover:no-underline">
                            <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-500" /> Personal Growth</span>
                          </AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                            {data.insights.growth}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* COMPATIBILITY */}
                <motion.div variants={fadeUp}>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium tracking-wider uppercase text-foreground/60">
                        Most Compatible Today
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4 justify-center">
                        {data.compatibleToday.map((sign, i) => (
                          <motion.button
                            key={sign}
                            onClick={() => setSelectedSign(sign)}
                            className="text-center group"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                          >
                            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${ELEMENT_GRADIENTS[data.element]} flex items-center justify-center text-white text-2xl mb-2 group-hover:scale-110 transition-transform shadow-lg`}>
                              {ZODIAC_SYMBOLS[sign]}
                            </div>
                            <p className="text-xs font-medium text-foreground">{sign}</p>
                          </motion.button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* WEEKLY OVERVIEW */}
                <motion.div variants={fadeUp}>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium tracking-wider uppercase text-foreground/60">
                        Weekly Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs value={weeklyDay} onValueChange={setWeeklyDay}>
                        <ScrollArea className="w-full">
                          <TabsList className="inline-flex w-auto">
                            {data.weekly.map(d => (
                              <TabsTrigger key={d.day} value={d.day} className="text-xs px-3">{d.day}</TabsTrigger>
                            ))}
                          </TabsList>
                          <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                        {data.weekly.map(d => (
                          <TabsContent key={d.day} value={d.day}>
                            <div className="pt-3 space-y-2">
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`w-4 h-4 ${i < d.rating ? "text-amber-400 fill-amber-400" : "text-border"}`} />
                                ))}
                              </div>
                              <p className="text-sm text-foreground leading-relaxed">{d.summary}</p>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* ZODIAC INFO */}
                <motion.div variants={fadeUp}>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium tracking-wider uppercase text-foreground/60">
                        About {data.sign}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-foreground leading-relaxed">{data.symbolMeaning}</p>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Ruling Planet</p>
                          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-primary" /> {data.rulingPlanet}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Element</p>
                          <p className="text-sm font-medium text-foreground flex items-center gap-1.5 capitalize">
                            <ElementIcon className="w-3.5 h-3.5 text-primary" /> {data.element}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Key Traits</p>
                        <div className="flex flex-wrap gap-1.5">
                          {data.traits.map(trait => (
                            <Badge key={trait} variant="outline" className="text-xs capitalize">{trait}</Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Compatible Signs</p>
                        <div className="flex flex-wrap gap-1.5">
                          {data.compatible.map(sign => (
                            <Badge
                              key={sign}
                              variant="secondary"
                              className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                              onClick={() => setSelectedSign(sign)}
                            >
                              {ZODIAC_SYMBOLS[sign]} {sign}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Famous {data.sign}s</p>
                        <div className="flex flex-wrap gap-1.5">
                          {data.famous.map(name => (
                            <Badge key={name} variant="outline" className="text-xs">{name}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* SHARE */}
                <motion.div variants={fadeUp} className="flex justify-center pb-4">
                  <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                    <Share2 className="w-4 h-4" /> Share Today's Horoscope
                  </Button>
                </motion.div>

              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
};

export default Horoscope;
