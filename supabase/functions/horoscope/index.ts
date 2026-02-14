import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Deterministic seed from date + sign
function seedRandom(str: string): () => number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  let seed = Math.abs(hash);
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

const ZODIAC_DATA: Record<string, {
  symbol: string; element: string; rulingPlanet: string;
  dateRange: string; symbolMeaning: string;
  compatible: string[]; famous: string[];
  traits: string[];
}> = {
  aries: { symbol: "♈", element: "fire", rulingPlanet: "Mars", dateRange: "Mar 21 – Apr 19", symbolMeaning: "The Ram represents courage, initiative, and pioneering spirit.", compatible: ["Leo", "Sagittarius", "Gemini", "Aquarius"], famous: ["Lady Gaga", "Robert Downey Jr.", "Mariah Carey"], traits: ["bold", "ambitious", "energetic", "competitive"] },
  taurus: { symbol: "♉", element: "earth", rulingPlanet: "Venus", dateRange: "Apr 20 – May 20", symbolMeaning: "The Bull represents determination, stability, and sensuality.", compatible: ["Virgo", "Capricorn", "Cancer", "Pisces"], famous: ["Adele", "Dwayne Johnson", "David Beckham"], traits: ["reliable", "patient", "devoted", "grounded"] },
  gemini: { symbol: "♊", element: "air", rulingPlanet: "Mercury", dateRange: "May 21 – Jun 20", symbolMeaning: "The Twins represent duality, communication, and versatility.", compatible: ["Libra", "Aquarius", "Aries", "Leo"], famous: ["Angelina Jolie", "Kanye West", "Naomi Campbell"], traits: ["curious", "adaptable", "witty", "sociable"] },
  cancer: { symbol: "♋", element: "water", rulingPlanet: "Moon", dateRange: "Jun 21 – Jul 22", symbolMeaning: "The Crab represents intuition, protection, and emotional depth.", compatible: ["Scorpio", "Pisces", "Taurus", "Virgo"], famous: ["Selena Gomez", "Tom Hanks", "Ariana Grande"], traits: ["nurturing", "intuitive", "loyal", "emotional"] },
  leo: { symbol: "♌", element: "fire", rulingPlanet: "Sun", dateRange: "Jul 23 – Aug 22", symbolMeaning: "The Lion represents royalty, leadership, and dramatic self-expression.", compatible: ["Aries", "Sagittarius", "Gemini", "Libra"], famous: ["Barack Obama", "Jennifer Lopez", "Mick Jagger"], traits: ["confident", "charismatic", "generous", "creative"] },
  virgo: { symbol: "♍", element: "earth", rulingPlanet: "Mercury", dateRange: "Aug 23 – Sep 22", symbolMeaning: "The Maiden represents analysis, service, and practical perfection.", compatible: ["Taurus", "Capricorn", "Cancer", "Scorpio"], famous: ["Beyoncé", "Keanu Reeves", "Zendaya"], traits: ["analytical", "kind", "hardworking", "practical"] },
  libra: { symbol: "♎", element: "air", rulingPlanet: "Venus", dateRange: "Sep 23 – Oct 22", symbolMeaning: "The Scales represent balance, justice, and harmonious partnerships.", compatible: ["Gemini", "Aquarius", "Leo", "Sagittarius"], famous: ["Serena Williams", "Kim Kardashian", "Will Smith"], traits: ["diplomatic", "fair", "social", "gracious"] },
  scorpio: { symbol: "♏", element: "water", rulingPlanet: "Pluto", dateRange: "Oct 23 – Nov 21", symbolMeaning: "The Scorpion represents transformation, intensity, and deep power.", compatible: ["Cancer", "Pisces", "Virgo", "Capricorn"], famous: ["Drake", "Leonardo DiCaprio", "Katy Perry"], traits: ["passionate", "resourceful", "brave", "mysterious"] },
  sagittarius: { symbol: "♐", element: "fire", rulingPlanet: "Jupiter", dateRange: "Nov 22 – Dec 21", symbolMeaning: "The Archer represents freedom, adventure, and philosophical wisdom.", compatible: ["Aries", "Leo", "Libra", "Aquarius"], famous: ["Taylor Swift", "Jay-Z", "Nicki Minaj"], traits: ["optimistic", "adventurous", "funny", "generous"] },
  capricorn: { symbol: "♑", element: "earth", rulingPlanet: "Saturn", dateRange: "Dec 22 – Jan 19", symbolMeaning: "The Sea-Goat represents ambition, discipline, and masterful achievement.", compatible: ["Taurus", "Virgo", "Scorpio", "Pisces"], famous: ["LeBron James", "Michelle Obama", "Dolly Parton"], traits: ["responsible", "disciplined", "ambitious", "patient"] },
  aquarius: { symbol: "♒", element: "air", rulingPlanet: "Uranus", dateRange: "Jan 20 – Feb 18", symbolMeaning: "The Water Bearer represents innovation, humanitarianism, and revolution.", compatible: ["Gemini", "Libra", "Aries", "Sagittarius"], famous: ["Oprah Winfrey", "Harry Styles", "Shakira"], traits: ["independent", "progressive", "original", "humanitarian"] },
  pisces: { symbol: "♓", element: "water", rulingPlanet: "Neptune", dateRange: "Feb 19 – Mar 20", symbolMeaning: "The Fish represents intuition, compassion, and artistic imagination.", compatible: ["Cancer", "Scorpio", "Taurus", "Capricorn"], famous: ["Rihanna", "Justin Bieber", "Steve Jobs"], traits: ["compassionate", "artistic", "intuitive", "gentle"] },
};

const MOODS = ["Energetic", "Reflective", "Optimistic", "Creative", "Determined", "Peaceful", "Bold", "Inspired", "Grounded", "Adventurous", "Passionate", "Focused"];
const COLORS = ["Crimson", "Gold", "Emerald", "Royal Blue", "Lavender", "Coral", "Silver", "Amber", "Teal", "Burgundy", "Sage Green", "Rose"];
const TIMES = ["8:00 AM – 10:00 AM", "11:00 AM – 1:00 PM", "2:00 PM – 4:00 PM", "5:00 PM – 7:00 PM", "7:00 PM – 9:00 PM"];

const DAILY_READINGS: Record<string, string[]> = {
  aries: [
    "Your competitive fire is ignited today. Channel that energy into a new challenge rather than old rivalries. A surprising ally appears on the court of life.",
    "Mars pushes you forward with unstoppable momentum. Trust your instincts on a decision you've been mulling over. Victory awaits the bold.",
    "Your leadership qualities shine brightest today. Others look to you for direction—don't shy away from the spotlight. A sports-related opportunity could change your trajectory.",
  ],
  taurus: [
    "Patience is your superpower today. While others rush, your steady approach brings lasting results. A financial insight comes through an unexpected conversation.",
    "Venus blesses your social connections today. Reach out to someone you haven't talked to in a while—their news will surprise you. Comfort food hits different tonight.",
    "Your determination pays dividends today. A project you've been nurturing quietly finally shows signs of growth. Stay the course.",
  ],
  gemini: [
    "Your wit is razor-sharp today. Use it to connect, not to cut. A conversation about sports leads to a deeper understanding of someone you thought you knew.",
    "Mercury speeds up your mental processes. Ideas flow like water—capture them before they slip away. A dual opportunity requires a choice by evening.",
    "Social energy is at a peak. Every conversation today plants a seed for tomorrow. Your curiosity leads you to a fascinating discovery.",
  ],
  cancer: [
    "Home court advantage is truly yours today. Your intuition about a close friend proves spot-on. Nurture that connection—it's more important than you realize.",
    "The Moon amplifies your emotional intelligence. Use it to read the room at a gathering tonight. Someone needs your support more than they're showing.",
    "Your protective instincts serve you well today. A family matter resolves in a way that brings everyone closer. Trust your gut on a tricky decision.",
  ],
  leo: [
    "The spotlight finds you effortlessly today. Your natural charisma draws people in—use this magnetic energy to rally your team or community around a cause.",
    "Creative fire burns bright. Express yourself through sports, art, or bold fashion choices. Someone influential is watching and they're impressed.",
    "Your generosity comes back tenfold today. A spontaneous act of kindness ripples through your network. Own your power—you've earned it.",
  ],
  virgo: [
    "Your analytical eye catches what everyone else misses today. A detail in your routine reveals room for major improvement. Small tweaks, massive results.",
    "Mercury sharpens your problem-solving skills. Apply them to a health or fitness goal you've been working on. The data tells a story others can't see.",
    "Service to others brings unexpected joy today. Your practical help transforms someone's situation. Don't underestimate the power of your reliability.",
  ],
  libra: [
    "Balance is tested but achievable today. A relationship dynamic shifts—embrace the change rather than resist it. Beauty and harmony are your guiding stars.",
    "Venus enhances your diplomatic skills. A conflict between friends needs your fair-minded approach. Your sense of justice prevails in a surprising way.",
    "Partnerships take center stage. Whether in sports, work, or love, your ability to find common ground creates something beautiful. Trust the process.",
  ],
  scorpio: [
    "Intensity is your fuel today. Dive deep into a passion project or meaningful conversation. Transformation comes through vulnerability, not control.",
    "Pluto stirs up buried insights. Something you read or hear today shifts your perspective dramatically. Don't resist the evolution—it's making you stronger.",
    "Your investigative nature uncovers a truth others overlooked. Use this knowledge wisely. Power today comes from understanding, not force.",
  ],
  sagittarius: [
    "Adventure beckons louder than usual today. Say yes to something outside your routine—a new sport, a new route, a new perspective. Jupiter smiles on risk-takers.",
    "Your optimism is contagious. Spread it generously at a social gathering tonight. A philosophical conversation over food leads to a life-changing idea.",
    "Freedom is your theme today. Break free from a limiting habit or belief. The archer hits the target by letting go of the arrow.",
  ],
  capricorn: [
    "Discipline meets destiny today. Your long-term planning pays off in an unexpected way. Saturn rewards those who put in the work—and you have.",
    "A professional connection opens doors you didn't know existed. Your reputation precedes you in the best way. Structure your evening for maximum productivity.",
    "Mountain goats always reach the summit. Today you see the view from a height you've been climbing toward. Celebrate the milestone before setting the next goal.",
  ],
  aquarius: [
    "Innovation strikes like lightning today. An unconventional idea about community building could become something revolutionary. Don't let traditional thinkers dim your spark.",
    "Uranus electrifies your social circle. A chance encounter with a fellow sports fan leads to an unexpected friendship. Embrace the weird—it's your superpower.",
    "Humanitarian impulses are strong today. Channel them into action, not just ideas. Your unique perspective on teamwork could inspire an entire group.",
  ],
  pisces: [
    "Intuition flows like an ocean current today. Trust those gut feelings about a creative project. Neptune whispers secrets about someone's true intentions.",
    "Your artistic sensitivity is heightened. Express it through music, writing, or movement. A dream from last night holds a message worth decoding.",
    "Compassion is your strength today. Someone in your circle needs your gentle wisdom. Your ability to sense emotions before they're spoken is a rare gift.",
  ],
};

const LOVE_INSIGHTS: Record<string, string[]> = {
  aries: ["Passion runs high—express your feelings boldly.", "A playful challenge with a partner strengthens your bond.", "Single? Your confidence attracts someone unexpected."],
  taurus: ["Sensuality is your love language today.", "A quiet evening together speaks volumes.", "Loyalty deepens through shared experiences."],
  gemini: ["Communication is the key to connection today.", "Flirtatious energy leads somewhere meaningful.", "Multiple options narrow to one clear choice."],
  cancer: ["Emotional vulnerability opens hearts.", "Home-cooked meals become love potions.", "Protective instincts show someone you truly care."],
  leo: ["Romance demands grand gestures today.", "Your warmth melts even the coldest walls.", "Admiration from an unexpected source."],
  virgo: ["Small acts of service express deep love.", "Pay attention to unspoken needs today.", "Perfectionism in love? Let it go."],
  libra: ["Partnership harmony reaches a new level.", "A beautiful gesture restores balance.", "Aesthetic experiences deepen connection."],
  scorpio: ["Intensity creates magnetic attraction.", "Trust deepens through honest conversation.", "Transformation in a key relationship."],
  sagittarius: ["Adventure together strengthens bonds.", "Freedom within commitment brings joy.", "Humor and honesty win hearts."],
  capricorn: ["Commitment shows through consistent actions.", "A traditional romantic gesture lands perfectly.", "Building together creates lasting love."],
  aquarius: ["Unconventional dates create unique memories.", "Intellectual connection sparks deeper feelings.", "Space and togetherness find perfect balance."],
  pisces: ["Romantic dreams become reality today.", "Intuition guides you to the right words.", "Creative expression of love moves someone deeply."],
};

const CAREER_INSIGHTS: Record<string, string[]> = {
  aries: ["Lead a new initiative at work.", "Competition motivates your best performance.", "Take the risk on that pitch."],
  taurus: ["Financial stability comes from patience.", "A slow, steady approach wins the contract.", "Trust your practical instincts on investments."],
  gemini: ["Networking opens unexpected doors.", "Your communication skills seal a deal.", "Multitasking leads to a breakthrough."],
  cancer: ["Nurturing workplace relationships pays off.", "Trust your gut on a business decision.", "Home-based opportunities flourish."],
  leo: ["Leadership opportunities knock loudly.", "Your creativity impresses decision-makers.", "Generous mentoring boosts your reputation."],
  virgo: ["Attention to detail prevents costly errors.", "Organize systems for massive efficiency gains.", "Your expertise is recognized and rewarded."],
  libra: ["Mediate a workplace conflict successfully.", "Partnerships bring profitable results.", "Aesthetic improvements boost productivity."],
  scorpio: ["Research uncovers a hidden opportunity.", "Strategic thinking gives you an edge.", "Transform a failing project into a success."],
  sagittarius: ["International or educational opportunities arise.", "Big-picture thinking impresses leadership.", "Take a calculated gamble on a new venture."],
  capricorn: ["Structural improvements create long-term gains.", "Your discipline inspires your team.", "Authority figures notice your commitment."],
  aquarius: ["Innovative solutions solve persistent problems.", "Technology skills open new revenue streams.", "Team collaboration sparks genius ideas."],
  pisces: ["Creative projects gain momentum.", "Intuitive decisions prove profitable.", "Compassionate leadership builds loyalty."],
};

const HEALTH_INSIGHTS: Record<string, string[]> = {
  aries: ["Channel excess energy into intense workouts.", "Watch for impulsive eating—slow down at meals.", "Competitive sports boost your mood significantly."],
  taurus: ["Gentle, consistent exercise trumps intensity today.", "Indulge mindfully—savor every bite.", "Nature walks restore your energy."],
  gemini: ["Variety in your workout keeps you engaged.", "Mental health benefits from journaling today.", "Social exercise like team sports energizes you."],
  cancer: ["Emotional eating awareness is key today.", "Water-based activities soothe your spirit.", "Home cooking nourishes body and soul."],
  leo: ["Group fitness classes let you shine.", "Heart health deserves extra attention today.", "Performing arts count as wellness too."],
  virgo: ["Track your health metrics—patterns emerge.", "Clean eating feels especially rewarding today.", "Stretching and flexibility work prevents injury."],
  libra: ["Balance cardio with strength training today.", "Partner workouts enhance motivation.", "Beauty routines become self-care rituals."],
  scorpio: ["Intense, transformative workouts satisfy you.", "Deep breathing exercises unlock blocked energy.", "Detox routines yield noticeable results."],
  sagittarius: ["Outdoor adventures serve as the best exercise.", "Hip and thigh stretches prevent soreness.", "Try a sport you've never attempted before."],
  capricorn: ["Structured fitness plans show measurable results.", "Joint care and bone health deserve focus.", "Discipline in rest is as important as effort."],
  aquarius: ["Experimental workout formats spark joy.", "Tech-assisted fitness tracking motivates you.", "Community wellness events lift your spirits."],
  pisces: ["Swimming and water activities are your medicine.", "Meditation reaches deeper levels today.", "Creative movement like dance heals the soul."],
};

function generateLocalHoroscope(sign: string, day: string) {
  const signData = ZODIAC_DATA[sign.toLowerCase()];
  if (!signData) return null;

  const dateStr = day === "today" ? new Date().toISOString().split("T")[0] :
                  day === "yesterday" ? new Date(Date.now() - 86400000).toISOString().split("T")[0] :
                  day === "tomorrow" ? new Date(Date.now() + 86400000).toISOString().split("T")[0] :
                  new Date().toISOString().split("T")[0];

  const rng = seedRandom(`${sign}-${dateStr}`);
  const reading = pick(DAILY_READINGS[sign.toLowerCase()] || DAILY_READINGS.aries, rng);
  const mood = pick(MOODS, rng);
  const luckyNumber = Math.floor(rng() * 99) + 1;
  const luckyColor = pick(COLORS, rng);
  const luckyTime = pick(TIMES, rng);
  const love = pick(LOVE_INSIGHTS[sign.toLowerCase()] || LOVE_INSIGHTS.aries, rng);
  const career = pick(CAREER_INSIGHTS[sign.toLowerCase()] || CAREER_INSIGHTS.aries, rng);
  const health = pick(HEALTH_INSIGHTS[sign.toLowerCase()] || HEALTH_INSIGHTS.aries, rng);

  const compatToday = signData.compatible.slice(0, 3);

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekly = weekDays.map((dayName, i) => {
    const dayRng = seedRandom(`${sign}-${dateStr}-${i}`);
    const dayReadings = DAILY_READINGS[sign.toLowerCase()] || DAILY_READINGS.aries;
    return {
      day: dayName,
      summary: dayReadings[Math.floor(dayRng() * dayReadings.length)].substring(0, 80) + "...",
      rating: Math.floor(dayRng() * 3) + 3,
    };
  });

  return {
    sign: sign.charAt(0).toUpperCase() + sign.slice(1).toLowerCase(),
    ...signData,
    date: new Date(dateStr).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    reading,
    mood,
    luckyNumber,
    luckyColor,
    luckyTime,
    insights: { love, career, health, growth: `Your ${signData.traits[0]} nature guides personal growth today. Lean into being ${signData.traits[1]} and watch barriers dissolve.` },
    compatibleToday: compatToday,
    weekly,
    source: 'local',
  };
}

// Fetch with timeout and retry
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, timeoutMs = 5000): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) return res;
      console.warn(`Attempt ${attempt} failed with status ${res.status}`);
      await res.text(); // consume body
    } catch (err) {
      console.warn(`Attempt ${attempt} error:`, err instanceof Error ? err.message : err);
    }
    if (attempt < retries) await new Promise(r => setTimeout(r, 1000 * attempt));
  }
  throw new Error(`All ${retries} attempts failed`);
}

// In-memory cache for Aztro responses
const aztroCache: Map<string, { data: any; timestamp: number }> = new Map();
const AZTRO_CACHE_TTL = 3600000; // 1 hour

async function fetchAztroHoroscope(sign: string, day: string) {
  const cacheKey = `aztro:${sign}:${day}`;
  const cached = aztroCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < AZTRO_CACHE_TTL) {
    console.log(`Aztro cache hit: ${cacheKey}`);
    return cached.data;
  }

  try {
    const res = await fetchWithRetry(
      `https://aztro.sameerkumar.website/?sign=${sign.toLowerCase()}&day=${day}`,
      { method: 'POST' },
      2,
      5000
    );
    const data = await res.json();
    aztroCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (err) {
    console.warn('Aztro API unavailable, using local fallback:', err instanceof Error ? err.message : err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { sign = "aries", day = "today" } = body;
    const signLower = sign.toLowerCase();

    if (!ZODIAC_DATA[signLower]) {
      return new Response(JSON.stringify({ error: "Invalid zodiac sign" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try Aztro API first, fall back to local generation
    const aztroData = await fetchAztroHoroscope(signLower, day);
    const localData = generateLocalHoroscope(signLower, day);

    if (!localData) {
      return new Response(JSON.stringify({ error: "Failed to generate horoscope" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Merge Aztro data into local data if available
    if (aztroData && aztroData.description) {
      localData.reading = aztroData.description;
      localData.mood = aztroData.mood || localData.mood;
      localData.luckyNumber = parseInt(aztroData.lucky_number) || localData.luckyNumber;
      localData.luckyColor = aztroData.color || localData.luckyColor;
      localData.luckyTime = aztroData.lucky_time || localData.luckyTime;
      localData.source = 'aztro';
    }

    return new Response(JSON.stringify({
      ...localData,
      lastUpdated: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error('Horoscope error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
