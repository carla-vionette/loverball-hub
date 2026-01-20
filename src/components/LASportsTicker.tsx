import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import LATickerControls from "./LATickerControls";

interface TickerData {
  items: string[];
  updatedAt: string;
  filters?: {
    category: string;
    gender: string;
  };
}

interface LASportsTickerProps {
  position?: "top" | "bottom";
  refreshInterval?: number; // in seconds
}

// Team logo mapping using ESPN's public logo CDN
const TEAM_LOGOS: Record<string, string> = {
  // NBA
  'lakers': 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png',
  'clippers': 'https://a.espncdn.com/i/teamlogos/nba/500/lac.png',
  // WNBA
  'sparks': 'https://a.espncdn.com/i/teamlogos/wnba/500/la.png',
  // NFL
  'rams': 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png',
  'chargers': 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png',
  // MLB
  'dodgers': 'https://a.espncdn.com/i/teamlogos/mlb/500/lad.png',
  'angels': 'https://a.espncdn.com/i/teamlogos/mlb/500/laa.png',
  // NHL
  'kings': 'https://a.espncdn.com/i/teamlogos/nhl/500/la.png',
  'ducks': 'https://a.espncdn.com/i/teamlogos/nhl/500/ana.png',
  // MLS
  'galaxy': 'https://a.espncdn.com/i/teamlogos/soccer/500/179.png',
  'lafc': 'https://a.espncdn.com/i/teamlogos/soccer/500/5765.png',
  // NWSL
  'angel city': 'https://a.espncdn.com/i/teamlogos/soccer/500/6926.png',
  'wave': 'https://a.espncdn.com/i/teamlogos/soccer/500/6927.png',
  // College - UCLA
  'ucla': 'https://a.espncdn.com/i/teamlogos/ncaa/500/26.png',
  'bruins': 'https://a.espncdn.com/i/teamlogos/ncaa/500/26.png',
  // College - USC
  'usc': 'https://a.espncdn.com/i/teamlogos/ncaa/500/30.png',
  'trojans': 'https://a.espncdn.com/i/teamlogos/ncaa/500/30.png',
  // College - Pepperdine
  'pepperdine': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2492.png',
  'waves': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2492.png',
  // College - LMU
  'lmu': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2350.png',
  'lions': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2350.png',
  // College - Cal State Fullerton
  'fullerton': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2239.png',
  'titans': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2239.png',
  // College - CSUN
  'csun': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2463.png',
  'matadors': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2463.png',
  // College - Long Beach State
  'long beach': 'https://a.espncdn.com/i/teamlogos/ncaa/500/299.png',
  'beach': 'https://a.espncdn.com/i/teamlogos/ncaa/500/299.png',
  // College - UC Irvine
  'uc irvine': 'https://a.espncdn.com/i/teamlogos/ncaa/500/300.png',
  'anteaters': 'https://a.espncdn.com/i/teamlogos/ncaa/500/300.png',
};

// Sport emojis based on content
const SPORT_EMOJIS: Record<string, string> = {
  basketball: '🏀',
  nba: '🏀',
  wnba: '🏀',
  lakers: '🏀',
  clippers: '🏀',
  sparks: '🏀',
  bruins: '🏀',
  football: '🏈',
  nfl: '🏈',
  rams: '🏈',
  chargers: '🏈',
  trojans: '🏈',
  soccer: '⚽',
  mls: '⚽',
  nwsl: '⚽',
  galaxy: '⚽',
  lafc: '⚽',
  'angel city': '⚽',
  wave: '⚽',
  baseball: '⚾',
  mlb: '⚾',
  dodgers: '⚾',
  angels: '⚾',
  hockey: '🏒',
  nhl: '🏒',
  kings: '🏒',
  ducks: '🏒',
  volleyball: '🏐',
  tennis: '🎾',
  golf: '⛳',
  swimming: '🏊',
  track: '🏃',
  gymnastics: '🤸',
  'water polo': '🤽',
  lacrosse: '🥍',
};

function getSportEmoji(text: string): string {
  const textLower = text.toLowerCase();
  
  for (const [keyword, emoji] of Object.entries(SPORT_EMOJIS)) {
    if (textLower.includes(keyword)) {
      return emoji;
    }
  }
  
  // Default sports emoji
  return '🏆';
}

function getTeamLogosFromText(text: string): string[] {
  const textLower = text.toLowerCase();
  const logos: string[] = [];
  
  // Check for team mentions in the text
  for (const [teamKey, logoUrl] of Object.entries(TEAM_LOGOS)) {
    if (textLower.includes(teamKey)) {
      if (!logos.includes(logoUrl)) {
        logos.push(logoUrl);
      }
    }
  }
  
  // Return max 2 logos (home and away team)
  return logos.slice(0, 2);
}

const LASportsTicker = ({ 
  position = "top",
  refreshInterval = 30 
}: LASportsTickerProps) => {
  const [tickerData, setTickerData] = useState<TickerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [category, setCategory] = useState<"college" | "pro" | "both">("both");
  const [gender, setGender] = useState<"men" | "women" | "both">("both");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [isPaused, setIsPaused] = useState(false);

  const fetchTickerData = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase.functions.invoke('la-sports-ticker', {
        body: { category, gender }
      });
      
      if (fetchError) throw fetchError;
      
      if (data) {
        setTickerData(data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching LA sports ticker:', err);
      setError('Unable to load sports data');
      setTickerData({
        items: ['No live games right now. Check back soon for LA sports updates.'],
        updatedAt: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  }, [category, gender]);

  // Initial fetch and refresh interval
  useEffect(() => {
    fetchTickerData();
    
    const interval = setInterval(() => {
      fetchTickerData();
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [fetchTickerData, refreshInterval]);

  // Filter items by selected team
  const getFilteredItems = () => {
    if (!tickerData?.items) return [];
    if (selectedTeam === "all") return tickerData.items;
    
    return tickerData.items.filter(item => 
      item.toLowerCase().includes(selectedTeam.toLowerCase())
    );
  };

  const filteredItems = getFilteredItems();

  // Duplicate items for seamless loop
  const displayItems = filteredItems.length > 0 
    ? [...filteredItems, ...filteredItems] 
    : ['No games matching your filters right now.'];

  const positionClasses = position === "top" 
    ? "fixed top-0 left-0 right-0 z-50" 
    : "fixed bottom-0 left-0 right-0 z-50";

  if (isLoading) {
    return (
      <div className={`${positionClasses} bg-ticker`}>
        <div className="py-3 text-center">
          <span className="text-ticker-foreground animate-pulse">
            Loading LA sports updates...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${positionClasses} shadow-lg`}>
      {/* Controls */}
      <LATickerControls
        category={category}
        gender={gender}
        selectedTeam={selectedTeam}
        isPaused={isPaused}
        onCategoryChange={setCategory}
        onGenderChange={setGender}
        onTeamChange={setSelectedTeam}
        onPauseToggle={() => setIsPaused(!isPaused)}
      />
      
      {/* Ticker Bar */}
      <div className="bg-ticker py-1.5 md:py-2 overflow-hidden">
        <div className="ticker-wrapper">
          <div 
            className="ticker-content"
            style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
          >
            {displayItems.map((item, index) => {
              const logos = getTeamLogosFromText(item);
              const isHeadline = item.startsWith('HEADLINE:');
              const emoji = getSportEmoji(item);
              
              return (
                <span 
                  key={index} 
                  className="ticker-item text-ticker-foreground font-bold text-xs md:text-sm tracking-wide px-4 md:px-6 whitespace-nowrap inline-flex items-center gap-1.5 md:gap-2"
                >
                  {/* Sport emoji */}
                  <span className="text-sm md:text-base">{emoji}</span>
                  
                  {/* Team logos */}
                  {logos.length > 0 && !isHeadline && (
                    <span className="flex items-center gap-1">
                      {logos.map((logo, logoIndex) => (
                        <img
                          key={logoIndex}
                          src={logo}
                          alt=""
                          className="w-5 h-5 md:w-6 md:h-6 object-contain rounded-sm bg-white/10 p-0.5"
                          onError={(e) => {
                            // Hide broken images
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ))}
                    </span>
                  )}
                  
                  {/* Ticker text */}
                  <span className={isHeadline ? 'italic' : ''}>
                    {item}
                  </span>
                  
                  <span className="mx-4 text-ticker-foreground/50">•</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Last Updated */}
      {tickerData?.updatedAt && (
        <div className="bg-muted px-3 py-1 text-xs text-muted-foreground text-right">
          Last updated: {new Date(tickerData.updatedAt).toLocaleTimeString('en-US', { 
            timeZone: 'America/Los_Angeles',
            hour: 'numeric',
            minute: '2-digit'
          })} PT
        </div>
      )}

      <style>{`
        .ticker-wrapper {
          width: 100%;
          overflow: hidden;
          contain: content;
        }
        
        .ticker-content {
          display: inline-flex;
          animation: ticker-scroll 45s linear infinite;
          white-space: nowrap;
          align-items: center;
          will-change: transform;
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        
        @media (max-width: 768px) {
          .ticker-content {
            animation-duration: 75s;
          }
        }
        
        .ticker-item {
          display: inline-flex;
          align-items: center;
        }
        
        @keyframes ticker-scroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        
        .ticker-content:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default LASportsTicker;
