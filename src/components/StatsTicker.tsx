import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChevronUp, ChevronDown } from "lucide-react";

const StatsTicker = () => {
  const [stats, setStats] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('sports-stats');
      
      if (error) throw error;
      
      if (data?.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching sports stats:', error);
      toast({
        title: "Error loading stats",
        description: "Could not fetch the latest sports information.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-secondary/80 backdrop-blur-sm py-1.5 md:py-2 overflow-hidden">
        <div className="text-foreground/70 text-center text-[10px] md:text-xs">Loading latest sports stats...</div>
      </div>
    );
  }

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="w-full bg-secondary/80 backdrop-blur-sm py-1 flex items-center justify-center gap-1 hover:bg-secondary transition-colors"
      >
        <span className="text-[10px] text-muted-foreground">Show Scores</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="bg-secondary/80 backdrop-blur-sm py-1.5 md:py-2 overflow-hidden relative">
      <div className="ticker-wrapper">
        <div className="ticker-content">
          {[...stats, ...stats].map((stat, index) => (
            <span key={index} className="ticker-item text-foreground/80 font-medium text-[10px] md:text-xs px-4 md:px-6">
              {stat}
            </span>
          ))}
        </div>
      </div>
      
      {/* Collapse toggle button */}
      <button
        onClick={() => setIsCollapsed(true)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted/50 rounded transition-colors"
        aria-label="Collapse ticker"
      >
        <ChevronUp className="w-3 h-3 text-muted-foreground" />
      </button>
      
      <style>{`
        .ticker-wrapper {
          width: 100%;
          overflow: hidden;
          padding-right: 2rem;
        }
        
        .ticker-content {
          display: inline-flex;
          animation: scroll 60s linear infinite;
          white-space: nowrap;
        }
        
        .ticker-item {
          display: inline-block;
        }
        
        @keyframes scroll {
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

export default StatsTicker;