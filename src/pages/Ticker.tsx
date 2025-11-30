import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import StatsTicker from "@/components/StatsTicker";

const Ticker = () => {
  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />
      
      <main className="md:ml-64 pb-20 pt-20 md:pt-8 px-4">
        <StatsTicker />
        
        <div className="max-w-4xl mx-auto mt-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">Live Sports Stats</h1>
          <p className="text-muted-foreground mb-8">
            Real-time sports news, statistics, and game updates powered by AI
          </p>
          
          <div className="bg-card rounded-lg p-6 border border-border">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">What's Happening Now</h2>
            <p className="text-muted-foreground">
              The ticker above displays live sports updates including game scores, player stats, 
              and breaking sports news. Updates refresh automatically every 5 minutes.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Ticker;
