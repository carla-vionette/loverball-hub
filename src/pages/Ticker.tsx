import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import LASportsTicker from "@/components/LASportsTicker";

const Ticker = () => {
  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />
      
      {/* LA Sports Ticker - Fixed at top */}
      <LASportsTicker position="top" refreshInterval={30} />
      
      {/* Main content with padding to account for fixed ticker */}
      <main className="md:ml-64 pb-20 pt-44 md:pt-36 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-foreground">LA Sports Ticker</h1>
          <p className="text-muted-foreground mb-8">
            Real-time scores, schedules, and headlines for Greater Los Angeles sports teams
          </p>
          
          <div className="grid gap-6">
            {/* Featured Teams Section */}
            <div className="bg-card rounded-lg p-6 border border-border">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Featured Teams</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">NCAA Division 1</h3>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• UCLA Bruins (Big Ten)</li>
                    <li>• USC Trojans (Big Ten)</li>
                    <li>• Pepperdine Waves (West Coast)</li>
                    <li>• LMU Lions (West Coast)</li>
                    <li>• Cal State Fullerton Titans (Big West)</li>
                    <li>• CSUN Matadors (Big West)</li>
                    <li>• Long Beach State (Big West)</li>
                    <li>• UC Irvine Anteaters (Big West)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Professional Teams</h3>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• Lakers, Clippers, Sparks (Basketball)</li>
                    <li>• Rams, Chargers (Football)</li>
                    <li>• Dodgers, Angels (Baseball)</li>
                    <li>• Kings, Ducks (Hockey)</li>
                    <li>• Galaxy, LAFC, Angel City FC (Soccer)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-card rounded-lg p-6 border border-border">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">How It Works</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Live Games:</strong> Shows real-time scores with period/quarter and game clock
                </p>
                <p>
                  <strong className="text-foreground">Final Scores:</strong> Today's completed game results
                </p>
                <p>
                  <strong className="text-foreground">Upcoming:</strong> Games scheduled within the next 7 days
                </p>
                <p>
                  <strong className="text-foreground">Headlines:</strong> Breaking news about LA teams
                </p>
              </div>
            </div>

            {/* Controls Guide */}
            <div className="bg-card rounded-lg p-6 border border-border">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Ticker Controls</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Type:</strong> Filter between College, Pro, or All teams
                </p>
                <p>
                  <strong className="text-foreground">Gender:</strong> Filter Men's, Women's, or All sports
                </p>
                <p>
                  <strong className="text-foreground">Team:</strong> Focus on a specific school or franchise
                </p>
                <p>
                  <strong className="text-foreground">Pause/Play:</strong> Stop or resume the scrolling ticker
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Ticker;
