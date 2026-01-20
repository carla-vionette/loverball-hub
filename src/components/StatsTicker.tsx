import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const StatsTicker = () => {
  const [stats, setStats] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      <div className="bg-ticker py-2 md:py-3 overflow-hidden">
        <div className="text-ticker-foreground text-center text-xs md:text-sm">Loading latest sports stats...</div>
      </div>
    );
  }

  return (
    <div className="bg-ticker py-2 md:py-3 overflow-hidden relative">
      <div className="ticker-wrapper">
        <div className="ticker-content">
          {[...stats, ...stats].map((stat, index) => (
            <span key={index} className="ticker-item text-ticker-foreground font-medium text-xs md:text-sm px-6 md:px-8">
              {stat}
            </span>
          ))}
        </div>
      </div>
      <style>{`
        .ticker-wrapper {
          width: 100%;
          overflow: hidden;
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