import { ErrorBoundary } from "@/components/ui/error-boundary";
import AppLayout from "@/components/layout/AppLayout";
import LiveScores from "@/components/LiveScores";
import Standings from "@/components/Standings";
import { Trophy } from "lucide-react";

const ScoresContent = () => (
  <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Trophy className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-foreground">Scores</h1>
        <p className="text-xs text-muted-foreground">Live women's sports scores & standings</p>
      </div>
    </div>

    <section>
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Today's Games</h2>
      <LiveScores />
    </section>

    <section>
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">WNBA Standings</h2>
      <Standings />
    </section>
  </div>
);

const Scores = () => (
  <AppLayout>
    <ErrorBoundary>
      <ScoresContent />
    </ErrorBoundary>
  </AppLayout>
);

export default Scores;
