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
      <div className={`${positionClasses} bg-primary`}>
        <div className="py-3 text-center">
          <span className="text-primary-foreground animate-pulse">
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
      <div className="bg-primary py-3 overflow-hidden">
        <div className="ticker-wrapper">
          <div 
            className="ticker-content"
            style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
          >
            {displayItems.map((item, index) => (
              <span 
                key={index} 
                className="ticker-item text-primary-foreground font-medium px-8 whitespace-nowrap"
              >
                {item}
                <span className="mx-4 text-primary-foreground/50">•</span>
              </span>
            ))}
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
        }
        
        .ticker-content {
          display: inline-flex;
          animation: ticker-scroll 45s linear infinite;
          white-space: nowrap;
        }
        
        .ticker-item {
          display: inline-block;
        }
        
        @keyframes ticker-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
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
