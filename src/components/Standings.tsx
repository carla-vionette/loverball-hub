import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Trophy } from "lucide-react";

/**
 * Standings — Shows league standings.
 *
 * TODO: Real API integration
 * ─────────────────────────
 * When a SportsDataIO API key is available, fetch standings via the
 * sports-data-proxy edge function:
 *   WNBA:  /v3/wnba/scores/json/Standings/{season}
 *   NWSL:  /v3/soccer/scores/json/Standings/nwsl/{season}
 *   NCAAW: /v3/cbb/scores/json/Standings/{season} (filter women's conferences)
 */

const Standings = () => (
  <Card className="border-border/30">
    <EmptyState
      icon={Trophy}
      title="Standings unavailable"
      description="Connect a sports data API to display current league standings. WNBA standings will appear once the 2026 season begins in May."
    />
  </Card>
);

export default Standings;
